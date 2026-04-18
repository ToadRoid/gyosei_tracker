#!/usr/bin/env node
/**
 * One-off: insert p047 (as-is) and p146 (chapter=gyosei-jiken + Q空白修正2件)
 * into data/reviewed_import.json.
 *
 * - String-level splice を使い、既存ページの `"confidence": 1.0` 等の数値書式を温存する
 *   （JSON.stringify で全体を再シリアライズすると 1.0 → 1 になり巨大な擬似 diff になる）
 * - sectionTitle は raw のまま維持
 * - sourcePage 昇順で最小差分挿入
 * - DATA_VERSION は触らない / commit しない
 */

const fs = require('fs');
const path = require('path');

const IMPORT_PATH = path.resolve(__dirname, '../data/reviewed_import.json');
const P047_SRC = path.resolve(__dirname, '../data/parsed_gemini_20260418_115951.json');
const P146_SRC = path.resolve(__dirname, '../data/parsed_gemini_20260418_120027.json');

const raw = fs.readFileSync(IMPORT_PATH, 'utf8');
const g047 = JSON.parse(fs.readFileSync(P047_SRC, 'utf8')).pages[0];
const g146 = JSON.parse(fs.readFileSync(P146_SRC, 'utf8')).pages[0];

// --- helpers -----------------------------------------------------------

function escape(s) {
  // JSON string escaping (assumes no control chars beyond \n \t already handled)
  return JSON.stringify(s);
}

/**
 * Manually serialize a page block in the exact textual style used by the
 * existing file (2-space indent, confidence as 1.0, 8-space for branch content,
 * 10-space for branch fields, trailing comma after the block).
 */
function serializePageBlock(page, { trailingComma }) {
  const lines = [];
  lines.push('    {');
  lines.push(`      "sourcePage": ${escape(page.sourcePage)},`);
  lines.push(`      "originalProblemId": ${escape(page.originalProblemId)},`);
  lines.push(`      "bookId": ${escape(page.bookId)},`);
  lines.push(`      "batchId": ${escape(page.batchId)},`);
  lines.push('      "branches": [');
  page.branches.forEach((b, i) => {
    lines.push('        {');
    lines.push(`          "seqNo": ${b.seqNo},`);
    lines.push(`          "questionText": ${escape(b.questionText)},`);
    lines.push(`          "answerBoolean": ${b.answerBoolean ? 'true' : 'false'},`);
    lines.push(`          "explanationText": ${escape(b.explanationText)},`);
    lines.push(`          "subjectCandidate": ${escape(b.subjectCandidate)},`);
    lines.push(`          "chapterCandidate": ${escape(b.chapterCandidate)},`);
    lines.push(`          "confidence": 1.0,`);
    lines.push(`          "sectionTitle": ${escape(b.sectionTitle)},`);
    lines.push(`          "sourcePageQuestion": ${escape(b.sourcePageQuestion)},`);
    lines.push(`          "sourcePageAnswer": ${escape(b.sourcePageAnswer)}`);
    lines.push('        }' + (i === page.branches.length - 1 ? '' : ','));
  });
  lines.push('      ]');
  lines.push('    }' + (trailingComma ? ',' : ''));
  return lines.join('\n');
}

/**
 * Find the byte offset of the opening `    {` that begins the page block
 * with the given sourcePage.
 */
function findPageBlockStart(text, sourcePage) {
  const marker = `"sourcePage": "${sourcePage}"`;
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error(`sourcePage ${sourcePage} not found`);
  // back up to the preceding `    {` (at column 4, indent 4)
  const openIdx = text.lastIndexOf('\n    {\n', idx);
  if (openIdx === -1) throw new Error(`opening brace for p${sourcePage} not found`);
  return openIdx + 1; // after the preceding \n
}

// --- build new blocks --------------------------------------------------

function toNewPage(geminiPage, sourcePage, originalProblemId, overrides = {}) {
  return {
    sourcePage,
    originalProblemId,
    bookId: 'KB2025',
    batchId: 'reviewed-import',
    branches: geminiPage.branches.map(b => ({
      seqNo: b.seqNo,
      questionText: b.questionText,
      answerBoolean: b.answerBoolean,
      explanationText: b.explanationText,
      subjectCandidate: b.subjectCandidate,
      chapterCandidate: overrides.chapterCandidate ?? b.chapterCandidate,
      sectionTitle: b.sectionTitle,
      sourcePageQuestion: b.sourcePageQuestion,
      sourcePageAnswer: b.sourcePageAnswer,
    })),
  };
}

// --- p047 (そのまま) ---
const p047 = toNewPage(g047, '047', 'KB2025-p047-q01');

// --- p146 (chapter → gyosei-jiken, q02/q06 Q空白修正) ---
const p146 = toNewPage(g146, '146', 'KB2025-p146-q01', {
  chapterCandidate: 'gyosei-jiken',
});
// q02 (Q): 全角/半角スペース多発 → 全除去（Gemini 出力ベース）
const q02 = p146.branches.find(b => b.seqNo === 2);
q02.questionText =
  'Xの家の隣地にある建築物が建築基準法に違反した危険なものであるにもかかわらず、建築基準法上の規制権限の発動がなされない場合、Xは、当該規制権限の不行使につき、不作為違法確認訴訟を提起することができる。';
// q06 (Q): 「対象となる処分 の義務付け訴訟」→「対象となる処分の義務付け訴訟」
const q06 = p146.branches.find(b => b.seqNo === 6);
const q06Before = q06.questionText;
q06.questionText = q06.questionText.replace('対象となる処分 の義務付け訴訟', '対象となる処分の義務付け訴訟');
if (q06Before === q06.questionText) throw new Error('p146-q06 Q replacement miss');

// --- splice ------------------------------------------------------------

// 冪等防御
if (raw.includes('"sourcePage": "047"')) throw new Error('p047 already present');
if (raw.includes('"sourcePage": "146"')) throw new Error('p146 already present');

const out1Block = serializePageBlock(p047, { trailingComma: true });
// insert before the block whose sourcePage is 048
let text = raw;
const insert047At = findPageBlockStart(text, '048');
text = text.slice(0, insert047At) + out1Block + '\n' + text.slice(insert047At);

const out2Block = serializePageBlock(p146, { trailingComma: true });
// insert before the block whose sourcePage is 147
const insert146At = findPageBlockStart(text, '147');
text = text.slice(0, insert146At) + out2Block + '\n' + text.slice(insert146At);

// Sanity: JSON must still parse
const reparsed = JSON.parse(text);
if (reparsed.pages.length !== 238) {
  throw new Error(`page count wrong: ${reparsed.pages.length} (expected 238)`);
}
if (!reparsed.pages.find(p => p.sourcePage === '047')) throw new Error('p047 insert failed');
if (!reparsed.pages.find(p => p.sourcePage === '146')) throw new Error('p146 insert failed');
// Order check
const seq = reparsed.pages.map(p => p.sourcePage);
for (let i = 1; i < seq.length; i++) {
  if (seq[i] <= seq[i - 1]) throw new Error(`not sorted: ${seq[i - 1]} → ${seq[i]}`);
}

fs.writeFileSync(IMPORT_PATH, text, 'utf8');
console.log('OK: p047 (6 branches), p146 (6 branches, chapter=gyosei-jiken, q02/q06 Q空白修正). total=238');
