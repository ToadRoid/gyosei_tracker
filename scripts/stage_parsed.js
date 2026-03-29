#!/usr/bin/env node
/**
 * stage_parsed.js — llm_parse.js の出力を IndexedDB 取込用にステージングする
 *
 * 使い方:
 *   node scripts/stage_parsed.js                        # 最新の parsed_*.json を使用
 *   node scripts/stage_parsed.js data/parsed_20260329_123456.json
 *
 * 実行後:
 *   tmp/pending_parsed.json が生成される。
 *   ブラウザで /triage を開き「取込」タブから DB に登録する。
 *
 * 注意:
 *   既存の KB2025-p{N}-q01 レコード（ページ単位）を置き換えるため、
 *   /triage の取込処理は DELETE → INSERT を行う。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const projectRoot = path.join(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');
const tmpDir = path.join(projectRoot, 'tmp');

// ── 入力ファイル特定 ─────────────────────────────────────────────────
const fileArg = process.argv[2];
let inputFile;

if (fileArg) {
  inputFile = fileArg.replace(/^~/, os.homedir());
  if (!path.isAbsolute(inputFile)) {
    inputFile = path.resolve(projectRoot, inputFile);
  }
} else {
  // 最新の parsed_*.json を自動選択
  if (!fs.existsSync(dataDir)) {
    console.error('❌ data/ ディレクトリが見つかりません');
    process.exit(1);
  }
  const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith('parsed_') && f.endsWith('.json'))
    .sort()
    .reverse();
  if (files.length === 0) {
    console.error('❌ data/parsed_*.json が見つかりません。先に llm_parse.js を実行してください。');
    process.exit(1);
  }
  inputFile = path.join(dataDir, files[0]);
}

if (!fs.existsSync(inputFile)) {
  console.error(`❌ ファイルが見つかりません: ${inputFile}`);
  process.exit(1);
}

const parsed = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// ── 統計表示 ─────────────────────────────────────────────────────────
const totalBranches = parsed.pages.reduce((s, p) => s + p.branches.length, 0);
const pagesWithBranches = parsed.pages.filter(p => p.branches.length > 0).length;
const emptyPages = parsed.pages.filter(p => p.branches.length === 0 && !p.parseError).length;
const errorPages = parsed.pages.filter(p => p.parseError).length;

console.log('');
console.log('📋 stage_parsed.js — パース結果をステージング');
console.log(`   入力: ${path.relative(projectRoot, inputFile)}`);
console.log(`   パース日時: ${parsed.parsedAt}`);
console.log(`   モデル: ${parsed.model}`);
console.log(`   ページ数: ${parsed.pageCount}件`);
console.log(`   肢あり: ${pagesWithBranches}件`);
console.log(`   肢なし（空ページ）: ${emptyPages}件`);
console.log(`   エラー: ${errorPages}件`);
console.log(`   合計肢数: ${totalBranches}件`);
console.log('');

// ── pending_parsed.json 書き込み ─────────────────────────────────────
fs.mkdirSync(tmpDir, { recursive: true });
const pendingPath = path.join(tmpDir, 'pending_parsed.json');

const payload = {
  type: 'parsed',         // pending_import.json (type: 'manifest') と区別
  bookId: parsed.bookId,
  batchId: parsed.batchId,
  parsedAt: parsed.parsedAt,
  model: parsed.model,
  sourceFile: path.relative(projectRoot, inputFile),
  totalBranches,
  pages: parsed.pages,
  queuedAt: new Date().toISOString(),
};

fs.writeFileSync(pendingPath, JSON.stringify(payload, null, 2), 'utf8');

console.log(`✅ tmp/pending_parsed.json に書き出しました（${totalBranches}肢）`);
console.log('   ブラウザで /triage を開き「取込」タブから DB に登録してください。');
console.log('');
