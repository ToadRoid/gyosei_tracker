#!/usr/bin/env node
/**
 * stage_import.js — OCR バッチを IndexedDB 取込用の tmp ファイルにステージングする CLI
 *
 * ※ このスクリプトは import の実行ではなくステージング（staging）を行います。
 *    実際の DB 登録はブラウザ側（/import ページ）が担います。
 *
 * 使い方:
 *   node scripts/stage_import.js <バッチフォルダパス> [bookId]
 *
 * 例:
 *   node scripts/stage_import.js ~/Desktop/batch_20260329_112656
 *   node scripts/stage_import.js ~/Desktop/batch_20260329_112656 KB2025
 *
 * 実行後:
 *   tmp/pending_import.json が生成される。
 *   ブラウザで /import を開くと黄色バナーが表示され「取込開始」で DB に登録される。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ── 引数パース ─────────────────────────────────────────────
const batchDirRaw = process.argv[2];
const bookId = process.argv[3] || process.env.BOOK_ID || 'KB2025';

if (!batchDirRaw) {
  console.error('❌ バッチフォルダを指定してください');
  console.error('   例: node scripts/stage_import.js ~/Desktop/batch_20260329_112656');
  process.exit(1);
}

// ~ を展開
const batchDir = batchDirRaw.replace(/^~/, os.homedir());

// ── manifest.json 読み込み ─────────────────────────────────
const manifestPath = path.join(batchDir, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`❌ manifest.json が見つかりません: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// ── 件数チェック（CLI側でも欠番を警告）─────────────────────
const pages = manifest.items
  .map(item => parseInt(item.baseName, 10))
  .filter(n => !isNaN(n))
  .sort((a, b) => a - b);

const min = pages[0];
const max = pages[pages.length - 1];
const expectedCount = max - min + 1;
const missingPages = [];
const pageSet = new Set(pages);
for (let i = min; i <= max; i++) {
  if (!pageSet.has(i)) missingPages.push(i);
}

console.log('');
console.log('📋 manifest チェック');
console.log(`   バッチID  : ${manifest.batchId}`);
console.log(`   書籍ID    : ${bookId}`);
console.log(`   総件数    : ${manifest.totalItems}件`);
console.log(`   空件数    : ${manifest.emptyItems ?? 0}件`);
console.log(`   ページ範囲: ${String(min).padStart(4, '0')} 〜 ${String(max).padStart(4, '0')}`);

if (missingPages.length > 0) {
  console.warn(`   ⚠️  欠番 ${missingPages.length}件: ${missingPages.slice(0, 10).map(n => String(n).padStart(4, '0')).join(', ')}${missingPages.length > 10 ? '...' : ''}`);
} else {
  console.log(`   ✅ 欠番なし（連番 ${expectedCount}件）`);
}

// ── tmp/pending_import.json に書き出し ──────────────────────
const projectRoot = path.join(__dirname, '..');
const tmpDir = path.join(projectRoot, 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const pendingPath = path.join(tmpDir, 'pending_import.json');
const payload = {
  bookId,
  manifest,
  queuedAt: new Date().toISOString(),
};

fs.writeFileSync(pendingPath, JSON.stringify(payload, null, 2), 'utf8');

console.log('');
console.log(`✅ tmp/pending_import.json に書き出しました（${manifest.totalItems}件）`);
console.log('   ブラウザでアプリを開くと自動検出されてインポートが開始されます。');
console.log('   または /import ページで「保留中を取込」ボタンを押してください。');
console.log('');
