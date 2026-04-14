#!/usr/bin/env node
/**
 * gemini_parse.js — 画像から直接 Gemini API で肢分割・構造化する CLI
 *
 * llm_parse.js との違い:
 *   - 入力: OCR済みテキストではなく画像ファイル（PNG/JPG）を直接読む
 *   - 前段: ocr_batch.sh (Tesseract) は不要
 *   - API: Gemini API (@google/genai SDK)
 *   - JSON制御: responseMimeType + responseSchema で構造指定
 *   - seqNo: LLM出力に依存せず、後処理で 1..N に強制再採番
 *
 * 前提: GEMINI_API_KEY 環境変数にセットされていること
 *
 * 使い方:
 *   node scripts/gemini_parse.js --dir ~/Desktop/kindle_shots --pages 165
 *   node scripts/gemini_parse.js --dir ~/Desktop/kindle_shots --pages 165-168
 *   node scripts/gemini_parse.js --dir ~/Desktop/kindle_shots --pages all
 *   node scripts/gemini_parse.js --file ~/Desktop/kindle_shots/0165.png
 *   node scripts/gemini_parse.js --image ~/Desktop/kindle_shots/0165.png
 *   node scripts/gemini_parse.js --dry-run --file ~/Desktop/kindle_shots/0165.png
 *
 * 出力:
 *   data/parsed_gemini_YYYYMMDD_HHMMSS.json（llm_parse.js と同形式）
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// ── 引数パース ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};
const has = (flag) => args.includes(flag);

const MODEL = get('--model') ?? 'gemini-2.5-flash';
const DIR_ARG = get('--dir') ?? null;
const IMAGE_ARG = get('--image') ?? get('--file') ?? null;
const PAGES_ARG = get('--pages') ?? null;
const DRY_RUN = has('--dry-run');
const BOOK_ID = get('--book-id') ?? 'KB2025';

// ── 入力画像の特定 ─────────────────────────────────────────────────────
const projectRoot = path.join(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');

function findImages() {
  if (IMAGE_ARG) {
    const p = path.resolve(IMAGE_ARG);
    if (!fs.existsSync(p)) {
      console.error(`❌ 画像が見つかりません: ${p}`);
      process.exit(1);
    }
    return [p];
  }

  if (!DIR_ARG) {
    console.error('❌ --dir または --file / --image を指定してください');
    process.exit(1);
  }

  const dir = path.resolve(DIR_ARG);
  if (!fs.existsSync(dir)) {
    console.error(`❌ ディレクトリが見つかりません: ${dir}`);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(dir)
    .filter(f => /^\d{4}\.(png|jpg|jpeg)$/i.test(f))
    .sort();

  if (allFiles.length === 0) {
    console.error(`❌ 画像が見つかりません: ${dir}`);
    process.exit(1);
  }

  if (!PAGES_ARG || PAGES_ARG === 'all') {
    return allFiles.map(f => path.join(dir, f));
  }

  let startPage, endPage;
  if (/^\d+$/.test(PAGES_ARG)) {
    startPage = endPage = parseInt(PAGES_ARG, 10);
  } else {
    const m = PAGES_ARG.match(/^(\d+)-(\d+)$/);
    if (!m) {
      console.error(`❌ --pages の形式が不正: "${PAGES_ARG}". 例: "165", "165-168", "all"`);
      process.exit(1);
    }
    startPage = parseInt(m[1], 10);
    endPage = parseInt(m[2], 10);
  }

  return allFiles
    .filter(f => {
      const num = parseInt(f.replace(/\.\w+$/, ''), 10);
      return num >= startPage && num <= endPage;
    })
    .map(f => path.join(dir, f));
}

// ── API キー確認 ─────────────────────────────────────────────────────
if (!DRY_RUN && !process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY が設定されていません');
  console.error('   export GEMINI_API_KEY=AIza...');
  process.exit(1);
}

const ai = DRY_RUN ? null : new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── システムプロンプト ────────────────────────────────────────────────
const SYSTEM_PROMPT = `あなたは行政書士試験の問題整理アシスタントです。

入力は「合格革命 行政書士 肢別過去問集」の見開き1ページ分の画像です。
左ページに問題文、右ページに解答・解説が記載されています。

## ページの構造

1. **頻度コード（無視）**: ページ上部に "B HH", "A HL", "(H6-22-1)", "(R4-6-3)" のような
   難易度コードと出題年度参照が並ぶ。これらはメタデータであり、問題文ではない。

2. **問題文**: 番号付き "[1] [問題文]" の形式。各肢は独立した○×判定の対象。

3. **解答・解説**: "[1] ○ [解説]" または "[1] X [解説]" の形式。
   問題番号順に解答が並ぶため、シーケンシャルに対応付けられる。

4. **ページヘッダー**: ページ上部に科目名・章名・節名が表示されている場合がある。
   これを sectionTitle として抽出する。

5. **ページ番号**: 左ページ左下、右ページ右下にページ番号がある。
   左ページ番号を sourcePageQuestion、右ページ番号を sourcePageAnswer とする。

## 肢の正誤ルール
- ○（まる）= answerBoolean: true
- X または × または ✗（ばつ）= answerBoolean: false

## 科目・章の候補（subjectCandidate / chapterCandidate）

科目ID:
- kenpo（憲法）: kenpo-soron, kenpo-jinken, kenpo-tochi
- gyosei（行政法）: gyosei-ippan, gyosei-tetsuzuki, gyosei-fufuku, gyosei-jiken, gyosei-kokubai, gyosei-chiho
- minpo（民法）: minpo-sosoku, minpo-bukken, minpo-saiken, minpo-shinzoku, minpo-sozoku
- shoho（商法）: shoho-shoho, shoho-kaisha
- kiso-hogaku（基礎法学）: kiso-hogaku-gairon, kiso-hogaku-funso
- kiso-chishiki（基礎知識）: kiso-chishiki-ippan, kiso-chishiki-gyomu, kiso-chishiki-joho, kiso-chishiki-bunsho

## 注意点
- questionText は問題文のみ（番号・難易度コードを除く）
- explanationText は解説のみ（○×記号を除く）
- 画像内の文字を正確に読み取り、OCRノイズのない自然な日本語で出力する
- ページに問題文が含まれない場合: 空の配列を返す
- confidenceは0.0〜1.0（問題文と解説の対応が明確なら0.9以上）
- sectionTitle はページヘッダーから読み取れる場合のみ設定。読み取れない場合は空文字`;

// ── JSON Schema（structured output 用）────────────────────────────────
const BRANCH_SCHEMA = {
  type: 'object',
  properties: {
    branches: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          seqNo:              { type: 'integer',  description: '肢番号（1始まり）' },
          questionText:       { type: 'string',   description: '問題文（正確に読み取った日本語）' },
          answerBoolean:      { type: 'boolean',  description: '○=true, ×=false' },
          explanationText:    { type: 'string',   description: '解説文（正確に読み取った日本語）' },
          subjectCandidate:   { type: 'string',   description: '科目ID（例: gyosei）' },
          chapterCandidate:   { type: 'string',   description: '章ID（例: gyosei-kokubai）' },
          confidence:         { type: 'number',   description: '信頼度（0.0〜1.0）' },
          sectionTitle:       { type: 'string',   description: '節タイトル（ヘッダーから読取）' },
          sourcePageQuestion: { type: 'string',   description: '問題ページ番号' },
          sourcePageAnswer:   { type: 'string',   description: '解説ページ番号' },
        },
        required: [
          'seqNo', 'questionText', 'answerBoolean',
          'explanationText', 'subjectCandidate',
          'chapterCandidate', 'confidence',
        ],
      },
    },
  },
  required: ['branches'],
};

// ── seqNo 後処理: LLM出力に依存せず 1..N に強制再採番 ──────────────────
function renumberBranches(branches) {
  return branches
    .filter(b => b.questionText && b.questionText.trim() !== '')
    .map((b, i) => ({ ...b, seqNo: i + 1 }));
}

// ── 1ページを解析する ──────────────────────────────────────────────
async function parsePage(imagePath) {
  if (DRY_RUN) {
    console.log(`\n[DRY RUN] ${path.basename(imagePath)}`);
    console.log(`  画像: ${imagePath}`);
    console.log(`  モデル: ${MODEL}`);
    console.log(`  プロンプト冒頭: ${SYSTEM_PROMPT.slice(0, 200)}...`);
    console.log(`  出力予定: data/parsed_gemini_*.json`);
    return {
      branches: [{
        seqNo: 1, questionText: '[DRY RUN]', answerBoolean: null,
        explanationText: '', subjectCandidate: '', chapterCandidate: '', confidence: 0,
        sectionTitle: '', sourcePageQuestion: '', sourcePageAnswer: '',
      }],
    };
  }

  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: '上の画像の問題と解説を読み取り、JSON形式で出力してください。' },
      ],
    }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseJsonSchema: BRANCH_SCHEMA,
      temperature: 0,
    },
  });

  const text = response.text ?? '';
  const parsed = JSON.parse(text);

  // seqNo を後処理で強制再採番
  parsed.branches = renumberBranches(parsed.branches ?? []);

  return parsed;
}

// ── メイン処理 ────────────────────────────────────────────────────────
async function main() {
  const images = findImages();

  console.log('');
  console.log('📖 gemini_parse.js — 画像直読み肢分割・構造化');
  console.log(`   画像数: ${images.length}件`);
  console.log(`   モデル: ${MODEL}`);
  if (DRY_RUN) console.log('   ⚠️  DRY RUN — API は呼びません');
  console.log('');

  const results = [];
  let totalBranches = 0;
  let failedPages = 0;

  for (let i = 0; i < images.length; i++) {
    const imagePath = images[i];
    const baseName = path.basename(imagePath, path.extname(imagePath));
    const pageNo = baseName.replace(/^0+/, '') || '0';
    const paddedPage = pageNo.padStart(3, '0');
    const problemId = `${BOOK_ID}-p${paddedPage}-q01`;

    process.stdout.write(`  [${i + 1}/${images.length}] p${paddedPage} ... `);

    try {
      const parsed = await parsePage(imagePath);
      const branchCount = parsed.branches?.length ?? 0;
      totalBranches += branchCount;

      results.push({
        sourcePage: paddedPage,
        originalProblemId: problemId,
        bookId: BOOK_ID,
        batchId: `gemini-${MODEL}`,
        branches: parsed.branches ?? [],
        parseError: null,
      });

      console.log(`✅ ${branchCount}肢`);
    } catch (err) {
      failedPages++;
      results.push({
        sourcePage: paddedPage,
        originalProblemId: problemId,
        bookId: BOOK_ID,
        batchId: `gemini-${MODEL}`,
        branches: [],
        parseError: err.message,
      });
      console.log(`❌ ${err.message.slice(0, 80)}`);
    }

    // レートリミット対策: 1秒待つ
    if (!DRY_RUN && i < images.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // ── 出力ファイル書き込み ────────────────────────────────────────────
  const now = new Date();
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const outFile = path.join(dataDir, `parsed_gemini_${ts}.json`);

  const output = {
    parsedAt: now.toISOString(),
    model: MODEL,
    sourceDir: DIR_ARG || IMAGE_ARG,
    pageRange: PAGES_ARG ?? 'single',
    pageCount: images.length,
    failedPages,
    totalBranches,
    bookId: BOOK_ID,
    batchId: `gemini-${MODEL}`,
    pages: results,
  };

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');

  // ── サマリー表示 ───────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log(`✅ 完了`);
  console.log(`   処理ページ数: ${images.length}件`);
  console.log(`   失敗: ${failedPages}件`);
  console.log(`   抽出肢数: ${totalBranches}件`);
  if (images.length - failedPages > 0) {
    console.log(`   平均肢数/ページ: ${(totalBranches / (images.length - failedPages)).toFixed(1)}`);
  }
  console.log(`   出力: ${path.relative(projectRoot, outFile)}`);
  console.log('');

  // ── プレビュー（最初の2ページ） ───────────────────────────────────
  console.log('📋 抽出結果プレビュー:');
  for (const page of results.slice(0, 2)) {
    console.log(`\n  【p${page.sourcePage}】 ${page.branches.length}肢`);
    for (const b of page.branches.slice(0, 4)) {
      const mark = b.answerBoolean === true ? '○' : b.answerBoolean === false ? '×' : '?';
      const q = (b.questionText ?? '').slice(0, 60);
      console.log(`    肢${b.seqNo} [${mark}] ${q}...`);
      console.log(`         科目:${b.subjectCandidate ?? '?'} / 章:${b.chapterCandidate ?? '?'} / 信頼度:${b.confidence}`);
      if (b.sectionTitle) console.log(`         節: ${b.sectionTitle}`);
      if (b.sourcePageQuestion) console.log(`         ページ: ${b.sourcePageQuestion}/${b.sourcePageAnswer ?? ''}`);
    }
    if (page.branches.length > 4) {
      console.log(`    ... 他 ${page.branches.length - 4}肢`);
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
