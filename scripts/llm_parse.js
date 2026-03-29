#!/usr/bin/env node
/**
 * llm_parse.js — OCR済みページを複数肢へ分割・構造化する CLI
 *
 * 前提: Claude API キーが ANTHROPIC_API_KEY 環境変数にセットされていること
 *
 * 使い方:
 *   node scripts/llm_parse.js                      # 最新の triage_export を 1-10ページ処理
 *   node scripts/llm_parse.js --pages 1-10         # 精度検証: 最初の10ページ
 *   node scripts/llm_parse.js --pages all          # 全件
 *   node scripts/llm_parse.js --pages 5            # 1ページのみ
 *   node scripts/llm_parse.js --file data/triage_export_2026-03-29.json --pages 1-10
 *   node scripts/llm_parse.js --dry-run --pages 1  # APIを呼ばずプロンプトを表示
 *
 * 出力:
 *   data/parsed_YYYYMMDD_HHMMSS.json
 */

const fs = require('fs');
const path = require('path');

// ── 引数パース ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};
const has = (flag) => args.includes(flag);

const MODEL = get('--model') ?? 'claude-3-5-haiku-20241022';
const PAGES_ARG = get('--pages') ?? '1-10';
const DRY_RUN = has('--dry-run');
const FILE_ARG = get('--file') ?? null;

// ── 入力ファイル特定 ─────────────────────────────────────────────────
const projectRoot = path.join(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');

function findLatestExport() {
  if (!fs.existsSync(dataDir)) {
    console.error('❌ data/ ディレクトリが見つかりません');
    process.exit(1);
  }
  const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith('triage_export') && f.endsWith('.json'))
    .sort()
    .reverse();
  if (files.length === 0) {
    console.error('❌ data/triage_export_*.json が見つかりません');
    process.exit(1);
  }
  return path.join(dataDir, files[0]);
}

const inputFile = FILE_ARG
  ? path.resolve(projectRoot, FILE_ARG)
  : findLatestExport();

if (!fs.existsSync(inputFile)) {
  console.error(`❌ ファイルが見つかりません: ${inputFile}`);
  process.exit(1);
}

// ── ページ範囲パース ─────────────────────────────────────────────────
function parsePageRange(spec, total) {
  if (spec === 'all') return { start: 0, end: total - 1 };
  if (/^\d+$/.test(spec)) {
    const n = parseInt(spec, 10) - 1;
    return { start: n, end: n };
  }
  const m = spec.match(/^(\d+)-(\d+)$/);
  if (m) {
    return { start: parseInt(m[1], 10) - 1, end: parseInt(m[2], 10) - 1 };
  }
  console.error(`❌ --pages の形式が不正: "${spec}". 例: "1-10", "all", "5"`);
  process.exit(1);
}

// ── API キー確認 ─────────────────────────────────────────────────────
if (!DRY_RUN && !process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY が設定されていません');
  console.error('   export ANTHROPIC_API_KEY=sk-ant-...');
  process.exit(1);
}

// ── triage_export 読み込み ──────────────────────────────────────────
const exportData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const problems = exportData.problems ?? [];
if (problems.length === 0) {
  console.error('❌ problems が空です');
  process.exit(1);
}

const { start, end } = parsePageRange(PAGES_ARG, problems.length);
const targets = problems.slice(start, end + 1);

console.log('');
console.log('📖 llm_parse.js — 肢分割・構造化');
console.log(`   入力: ${path.relative(projectRoot, inputFile)}`);
console.log(`   ページ: ${start + 1}〜${end + 1} (${targets.length}件)`);
console.log(`   モデル: ${MODEL}`);
if (DRY_RUN) console.log('   ⚠️  DRY RUN — API は呼びません');
console.log('');

// ── システムプロンプト ────────────────────────────────────────────────
const SYSTEM_PROMPT = `あなたは行政書士試験の問題整理アシスタントです。

入力は「合格革命 行政書士 肢別過去問集」の1ページ分のOCRテキストです。
このページには複数の「肢」（問題の選択肢）が含まれています。

## ページの構造（OCRの特性）

1. **頻度コードセクション（無視）**: ページ上部に "B HH", "A HL", "(H6-22-1)", "(R4-6-3)" のような
   難易度コードと出題年度参照が並ぶ。これらは各肢のメタデータであり、問題文ではない。

2. **問題文セクション**: 以下のいずれかの形式で現れる:
   - 形式A: "[番号] [問題文]"（番号付き）
   - 形式B: 番号なしの連続する日本語段落（OCRが番号を別行に出力した場合）

3. **解答・解説セクション**: "[番号] ○ [解説]" または "[番号] X/× [解説]" の形式。
   "〇"や"×"で始まる行が解説の場合もある（番号なし）。
   問題番号順に解答が並ぶため、シーケンシャルに対応付けられる。

## 肢の正誤ルール
- ○（まる）= answerBoolean: true
- X または × または ✗（ばつ）= answerBoolean: false

## 科目・章の候補（subjectCandidate / chapterCandidate）

科目ID:
- kenpo（憲法）: 総論/人権/統治
- gyosei（行政法）: 行政法の一般的な法理論/行政手続法/行政不服審査法/行政事件訴訟法/国家賠償法・損失補償/地方自治法
- minpo（民法）: 総則/物権/債権/親族/相続
- shoho（商法）: 商法/会社法
- kiso-hogaku（基礎法学）
- kiso-chishiki（基礎知識）

章IDの例: kenpo-jinken, kenpo-tochi, gyosei-ippan, gyosei-tetsuzuki, gyosei-fufuku,
gyosei-jiken, gyosei-kokubai, gyosei-chiho, minpo-sosoku, minpo-bukken, minpo-saiken,
minpo-shinzoku, minpo-sozoku, shoho-shoho, shoho-kaisha

## 出力形式（JSONのみ、説明文は不要）

\`\`\`json
{
  "branches": [
    {
      "seqNo": 1,
      "questionText": "問題文（OCRノイズを修正し、自然な日本語に整形）",
      "answerBoolean": true,
      "explanationText": "解説文（OCRノイズを修正）",
      "subjectCandidate": "kenpo",
      "chapterCandidate": "kenpo-tochi",
      "confidence": 0.95
    }
  ]
}
\`\`\`

## 注意点
- questionText は問題文のみ（番号・難易度コードを除く）
- explanationText は解説のみ（○×記号を除く）
- OCRノイズ（文字化け・誤認識）は文脈から補正する
- ページに問題文が含まれない（頻度コードのみ）場合: \`{"branches": []}\`
- confidenceは0.0〜1.0（問題文と解説の対応が明確なら0.9以上）`;

// ── 1ページを解析する ──────────────────────────────────────────────
async function parsePage(problem) {
  const userMessage = `以下は「合格革命 行政書士 肢別過去問集」のページ "${problem.problemId}" のOCRテキストです。
肢ごとに分割・構造化してください。

=== OCRテキスト開始 ===
${problem.rawText}
=== OCRテキスト終了 ===`;

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] ${problem.problemId}`);
    console.log('--- PROMPT ---');
    console.log(userMessage.slice(0, 400) + '...');
    return {
      branches: [{ seqNo: 1, questionText: '[DRY RUN]', answerBoolean: null, explanationText: '', subjectCandidate: '', chapterCandidate: '', confidence: 0 }]
    };
  }

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`API error ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text = data.content?.[0]?.text ?? '';

  // JSON抽出（コードブロックがある場合も対応）
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    throw new Error(`JSON未検出: ${text.slice(0, 200)}`);
  }
  return JSON.parse(jsonMatch[1]);
}

// ── メイン処理 ────────────────────────────────────────────────────────
async function main() {
  const results = [];
  let totalBranches = 0;
  let failedPages = 0;

  for (let i = 0; i < targets.length; i++) {
    const problem = targets[i];
    const pageNum = start + i + 1;
    process.stdout.write(`  [${String(pageNum).padStart(3, '0')}/${String(end + 1).padStart(3, '0')}] ${problem.problemId} ... `);

    try {
      const parsed = await parsePage(problem);
      const branchCount = parsed.branches?.length ?? 0;
      totalBranches += branchCount;

      results.push({
        sourcePage: problem.problemId.replace(/^[^-]+-p(\d+)-q\d+$/, '$1'),
        originalProblemId: problem.problemId,
        bookId: exportData.bookId ?? 'KB2025',
        batchId: exportData.batchId ?? '',
        branches: parsed.branches ?? [],
        parseError: null,
      });

      console.log(`✅ ${branchCount}肢`);
    } catch (err) {
      failedPages++;
      results.push({
        sourcePage: problem.problemId.replace(/^[^-]+-p(\d+)-q\d+$/, '$1'),
        originalProblemId: problem.problemId,
        bookId: exportData.bookId ?? 'KB2025',
        batchId: exportData.batchId ?? '',
        branches: [],
        parseError: err.message,
      });
      console.log(`❌ ${err.message.slice(0, 60)}`);
    }

    // レートリミット対策: 0.5秒待つ
    if (!DRY_RUN && i < targets.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // ── 出力ファイル書き込み ────────────────────────────────────────────
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 15);
  const outFile = path.join(dataDir, `parsed_${ts}.json`);

  const output = {
    parsedAt: now.toISOString(),
    model: MODEL,
    sourceFile: path.relative(projectRoot, inputFile),
    pageRange: `${start + 1}-${end + 1}`,
    pageCount: targets.length,
    failedPages,
    totalBranches,
    bookId: exportData.bookId ?? 'KB2025',
    batchId: exportData.batchId ?? '',
    pages: results,
  };

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');

  // ── サマリー表示 ───────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log(`✅ 完了`);
  console.log(`   処理ページ数: ${targets.length}件`);
  console.log(`   失敗: ${failedPages}件`);
  console.log(`   抽出肢数: ${totalBranches}件`);
  if (targets.length > 0) {
    console.log(`   平均肢数/ページ: ${(totalBranches / (targets.length - failedPages)).toFixed(1)}`);
  }
  console.log(`   出力: ${path.relative(projectRoot, outFile)}`);
  console.log('');

  // ── プレビュー（最初の2ページ） ───────────────────────────────────
  console.log('📋 抽出結果プレビュー（最初の2ページ）:');
  for (const page of results.slice(0, 2)) {
    console.log(`\n  【${page.originalProblemId}】 ${page.branches.length}肢`);
    for (const b of page.branches.slice(0, 3)) {
      const mark = b.answerBoolean === true ? '○' : b.answerBoolean === false ? '×' : '?';
      const q = (b.questionText ?? '').slice(0, 60);
      console.log(`    肢${b.seqNo} [${mark}] ${q}...`);
      console.log(`         科目:${b.subjectCandidate ?? '?'} / 章:${b.chapterCandidate ?? '?'} / 信頼度:${b.confidence}`);
    }
    if (page.branches.length > 3) {
      console.log(`    ... 他 ${page.branches.length - 3}肢`);
    }
    if (page.parseError) {
      console.log(`    ❌ エラー: ${page.parseError}`);
    }
  }
  console.log('');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
