#!/usr/bin/env node
/**
 * vision_extract.js — 参考書スクショ画像から 1肢1レコードの qa_draft.csv を作成する
 *
 * 方針:
 *   - 元画像を一次資料として扱う（OCRテキストではなく画像を直接LLMに渡す）
 *   - 全件 review_status=draft。自動確定なし
 *   - 見えていない情報は補完しない。不確実性はフラグと remarks に残す
 *
 * 対応プロバイダ:
 *   --provider anthropic  ANTHROPIC_API_KEY が必要（デフォルト）
 *   --provider openai     OPENAI_API_KEY が必要
 *
 * 使い方:
 *   node scripts/vision_extract.js                               # Claude, 1-10ページ
 *   node scripts/vision_extract.js --provider openai --pages 1-10
 *   node scripts/vision_extract.js --pages all
 *   node scripts/vision_extract.js --pages 1                    # 1ページのみ（動作確認）
 *   node scripts/vision_extract.js --batch ~/Desktop/batch_20260329_112656
 *   node scripts/vision_extract.js --dry-run --pages 1          # API呼ばずプロンプト確認
 *
 * 出力:
 *   data/qa_draft_YYYYMMDD_HHMMSS_{provider}.csv
 *   data/qa_draft_YYYYMMDD_HHMMSS_{provider}.json  （デバッグ用）
 *
 * 比較評価:
 *   同じページ範囲を両プロバイダで実行し、CSVを照合して精度を比較できる
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ── 引数パース ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const has = (flag) => args.includes(flag);

const PROVIDER  = get('--provider') ?? 'anthropic';   // 'anthropic' | 'openai'
const DEFAULT_MODEL = PROVIDER === 'openai' ? 'gpt-4o' : 'claude-opus-4-5';
const MODEL     = get('--model')  ?? DEFAULT_MODEL;
const PAGES_ARG = get('--pages') ?? '1-10';
const DRY_RUN   = has('--dry-run');
const BATCH_ARG = get('--batch') ?? null;

if (!['anthropic', 'openai'].includes(PROVIDER)) {
  console.error(`❌ --provider は "anthropic" または "openai" を指定してください`);
  process.exit(1);
}

// ── パス解決 ────────────────────────────────────────────────────────
const projectRoot = path.join(__dirname, '..');
const dataDir     = path.join(projectRoot, 'data');

function findLatestBatch() {
  const desktop = path.join(os.homedir(), 'Desktop');
  const dirs = fs.readdirSync(desktop)
    .filter(d => d.startsWith('batch_'))
    .sort()
    .reverse();
  if (dirs.length === 0) {
    console.error('❌ ~/Desktop/batch_* が見つかりません');
    process.exit(1);
  }
  return path.join(desktop, dirs[0]);
}

const batchDir  = BATCH_ARG ? BATCH_ARG.replace(/^~/, os.homedir()) : findLatestBatch();
const imagesDir = path.join(batchDir, 'images');

if (!fs.existsSync(imagesDir)) {
  console.error(`❌ images ディレクトリが見つかりません: ${imagesDir}`);
  process.exit(1);
}

// ── ページ一覧取得 ─────────────────────────────────────────────────
const allImages = fs.readdirSync(imagesDir)
  .filter(f => f.endsWith('.png'))
  .sort();

function parsePageRange(spec, total) {
  if (spec === 'all') return { start: 0, end: total - 1 };
  if (/^\d+$/.test(spec)) { const n = parseInt(spec, 10) - 1; return { start: n, end: n }; }
  const m = spec.match(/^(\d+)-(\d+)$/);
  if (m) return { start: parseInt(m[1], 10) - 1, end: parseInt(m[2], 10) - 1 };
  console.error(`❌ --pages の形式が不正: "${spec}"`);
  process.exit(1);
}

const { start, end } = parsePageRange(PAGES_ARG, allImages.length);
const targets = allImages.slice(start, end + 1);

// ── API キー確認 ─────────────────────────────────────────────────
if (!DRY_RUN) {
  if (PROVIDER === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY が設定されていません');
    process.exit(1);
  }
  if (PROVIDER === 'openai' && !process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY が設定されていません');
    process.exit(1);
  }
}

console.log('');
console.log('🔍 vision_extract.js — 画像から肢データ抽出');
console.log(`   バッチ: ${batchDir}`);
console.log(`   ページ: ${start + 1}〜${end + 1} (${targets.length}件)`);
console.log(`   プロバイダ: ${PROVIDER}`);
console.log(`   モデル: ${MODEL}`);
if (DRY_RUN) console.log('   ⚠️  DRY RUN');
console.log('');

// ── システムプロンプト ───────────────────────────────────────────
const SYSTEM_PROMPT = `あなたは行政書士試験問題集の画像から問題データを抽出するアシスタントです。

## 対象書籍の構造
「合格革命 行政書士 肢別過去問集」の見開き構成:
- 左列: 難易度記号（A/B/C） | 問題番号 | 問題文（肢）
- 右列: ○または× | 解説文
- ページ上部に出題年度参照（例: H6-22-1、R4-6-3）が記載されることがある

## 抽出方針（必ず守ること）
1. **画像に見えている情報だけを抽出する**。見えていない内容を推測・補完しない
2. **問題文と解説文を混ぜない**。問題文欄には問題文のみ、解説欄には解説のみ
3. **正誤が不明確なら空欄**。○と0、×とXが混同しうる場合は issue_type に「正誤不明」を記録
4. **文が途中で切れていれば、見える範囲だけ記録し issue_flag=1**
5. **前後ページの文脈から内容を創作しない**
6. **全件 review_status=draft** として返す
7. 不確実な箇所は remarks に具体的に記述する

## 返答フォーマット（JSONのみ、説明文なし）

\`\`\`json
{
  "page_notes": "このページ全体への注記（問題なければ空文字）",
  "records": [
    {
      "question_no": "1",
      "rank_label": "B",
      "past_exam_refs": "H6-22-1,S62-30-4",
      "subject": "憲法",
      "section_title": "内閣",
      "question_text": "問題文テキスト（解説を含めない）",
      "answer_symbol": "×",
      "answer_boolean": false,
      "explanation_text": "解説テキスト（問題文を含めない）",
      "source_page_question": "左ページの印刷ページ番号（画像から読める場合のみ）",
      "source_page_answer": "右ページの印刷ページ番号（画像から読める場合のみ）",
      "tags": "内閣,条約締結権",
      "issue_flag": 0,
      "issue_type": "",
      "issue_detail": "",
      "remarks": ""
    }
  ]
}
\`\`\`

## issue_type の定型値（複数可、カンマ区切り）
正誤不明 / 問題文欠損 / 解説欠損 / 問題と解説の対応ズレ / 分類不明 / 出典不明 / 読取揺れ / 画像確認要 / 重複疑い / ページまたぎ / その他

## 注意
- subject は画像に示された科目名を使う（推測しない）
- rank_label は A/B/C が明確に読める場合のみ。不明は空文字
- past_exam_refs は複数ある場合カンマ区切り
- 問題が見当たらないページ（目次・表紙・本書の特長など）は records=[] で返す
- 1ページに複数問ある場合はすべて抽出する`;

// ── 1画像を処理 ─────────────────────────────────────────────────
async function extractFromImage(imageFile, pageIndex) {
  const imagePath = path.join(imagesDir, imageFile);
  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');

  const userMessage = `このページから問題データを抽出してください。
画像ファイル名: ${imageFile}（${pageIndex + 1}ページ目）`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] ${imageFile} — APIを呼ばず処理をスキップ`);
    return { page_notes: 'DRY RUN', records: [] };
  }

  let text;

  if (PROVIDER === 'anthropic') {
    // ── Anthropic API ──────────────────────────────────────
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } },
            { type: 'text', text: userMessage },
          ],
        }],
      }),
    });
    if (!resp.ok) throw new Error(`Anthropic API error ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
    const data = await resp.json();
    text = data.content?.[0]?.text ?? '';

  } else {
    // ── OpenAI API ────────────────────────────────────────
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}`, detail: 'high' } },
              { type: 'text', text: userMessage },
            ],
          },
        ],
      }),
    });
    if (!resp.ok) throw new Error(`OpenAI API error ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
    const data = await resp.json();
    text = data.choices?.[0]?.message?.content ?? '';
  }

  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    throw new Error(`JSON未検出。レスポンス: ${text.slice(0, 200)}`);
  }
  return JSON.parse(jsonMatch[1]);
}

// ── CSV エスケープ ──────────────────────────────────────────────
function csvCell(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  // カンマ、改行、ダブルクォートを含む場合はクォートで囲む
  if (s.includes(',') || s.includes('\n') || s.includes('"') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const CSV_COLUMNS = [
  'record_id', 'subject', 'section_title', 'question_no', 'rank_label',
  'past_exam_refs', 'question_text', 'answer_symbol', 'answer_boolean',
  'explanation_text', 'source_page_question', 'source_page_answer',
  'source_image', 'tags', 'review_status', 'issue_flag', 'issue_type',
  'issue_detail', 'remarks',
];

// ── メイン ──────────────────────────────────────────────────────
async function main() {
  const allRecords = [];   // CSV用
  const debugPages = [];   // JSON用

  let totalRecords = 0;
  let totalIssues = 0;
  let errorPages = 0;

  for (let i = 0; i < targets.length; i++) {
    const imageFile = targets[i];
    const pageNum = start + i + 1;
    const pageNoStr = String(pageNum).padStart(3, '0');

    process.stdout.write(`  [${pageNoStr}/${String(end + 1).padStart(3, '0')}] ${imageFile} ... `);

    let extracted;
    try {
      extracted = await extractFromImage(imageFile, start + i);
    } catch (err) {
      errorPages++;
      console.log(`❌ ${err.message.slice(0, 70)}`);
      debugPages.push({ pageNo: pageNum, imageFile, error: err.message, records: [] });
      if (!DRY_RUN && i < targets.length - 1) await new Promise(r => setTimeout(r, 1000));
      continue;
    }

    const records = extracted.records ?? [];
    let pageIssues = 0;

    for (let j = 0; j < records.length; j++) {
      const r = records[j];
      const qNo = r.question_no ?? String(j + 1);
      const recordId = `KB2025-${pageNoStr}-${String(qNo).padStart(2, '0')}`;

      const issueFlag = r.issue_flag === 1 || r.issue_flag === '1' ? 1 : 0;
      if (issueFlag) pageIssues++;

      const row = {
        record_id:            recordId,
        subject:              r.subject ?? '',
        section_title:        r.section_title ?? '',
        question_no:          qNo,
        rank_label:           r.rank_label ?? '',
        past_exam_refs:       r.past_exam_refs ?? '',
        question_text:        r.question_text ?? '',
        answer_symbol:        r.answer_symbol ?? '',
        answer_boolean:       r.answer_boolean === true ? 'true' : r.answer_boolean === false ? 'false' : '',
        explanation_text:     r.explanation_text ?? '',
        source_page_question: r.source_page_question ?? '',
        source_page_answer:   r.source_page_answer ?? '',
        source_image:         imageFile,
        tags:                 r.tags ?? '',
        review_status:        'draft',
        issue_flag:           issueFlag,
        issue_type:           r.issue_type ?? '',
        issue_detail:         r.issue_detail ?? '',
        remarks:              r.remarks ?? '',
      };
      allRecords.push(row);
      totalRecords++;
    }

    totalIssues += pageIssues;

    const status = records.length === 0
      ? '⚪ 問題なし'
      : `✅ ${records.length}肢${pageIssues > 0 ? ` (⚠️${pageIssues}件フラグ)` : ''}`;
    console.log(status);

    if (extracted.page_notes) {
      console.log(`       注: ${extracted.page_notes}`);
    }

    debugPages.push({ pageNo: pageNum, imageFile, page_notes: extracted.page_notes, records });

    // レートリミット対策
    if (!DRY_RUN && i < targets.length - 1) {
      await new Promise(r => setTimeout(r, 600));
    }
  }

  // ── CSV出力 ─────────────────────────────────────────────────
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 15);
  fs.mkdirSync(dataDir, { recursive: true });

  const csvPath  = path.join(dataDir, `qa_draft_${ts}_${PROVIDER}.csv`);
  const jsonPath = path.join(dataDir, `qa_draft_${ts}_${PROVIDER}.json`);

  // CSV: ヘッダ + データ行
  const csvLines = [
    CSV_COLUMNS.map(csvCell).join(','),
    ...allRecords.map(row => CSV_COLUMNS.map(col => csvCell(row[col])).join(',')),
  ];
  fs.writeFileSync(csvPath, '\uFEFF' + csvLines.join('\n'), 'utf8');  // BOM付きUTF-8

  // JSON: デバッグ用
  const jsonOutput = {
    extractedAt: now.toISOString(),
    model: MODEL,
    batchDir,
    pageRange: `${start + 1}-${end + 1}`,
    pageCount: targets.length,
    errorPages,
    totalRecords,
    totalIssueFlags: totalIssues,
    pages: debugPages,
  };
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), 'utf8');

  // ── サマリー ────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('✅ 完了');
  console.log(`   処理ページ: ${targets.length}件 (エラー: ${errorPages}件)`);
  console.log(`   抽出レコード: ${totalRecords}件`);
  console.log(`   issue_flag=1: ${totalIssues}件 (${totalRecords > 0 ? Math.round(totalIssues / totalRecords * 100) : 0}%)`);
  console.log(`   CSV:  ${path.relative(projectRoot, csvPath)}`);
  console.log(`   JSON: ${path.relative(projectRoot, jsonPath)}`);
  console.log('');

  // ── プレビュー ─────────────────────────────────────────────
  if (allRecords.length > 0) {
    console.log('📋 先頭5件プレビュー:');
    for (const r of allRecords.slice(0, 5)) {
      const mark = r.answer_symbol || '?';
      const q = (r.question_text || '').slice(0, 55);
      const flag = r.issue_flag ? ' ⚠️' : '';
      console.log(`  ${r.record_id} [${mark}] ${q}...${flag}`);
      if (r.remarks) console.log(`    └ remarks: ${r.remarks.slice(0, 60)}`);
    }
    console.log('');
    console.log('精度評価観点:');
    console.log(`  正誤抽出ミス率: 手動確認必要（answer_symbol/answer_booleanを原本と照合）`);
    console.log(`  誤分割率: 手動確認必要（question_textの文頭・文末が自然か確認）`);
    console.log(`  issue_flag率: ${totalRecords > 0 ? Math.round(totalIssues / totalRecords * 100) : 0}%`);
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
