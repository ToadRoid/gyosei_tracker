#!/usr/bin/env node
/**
 * vision_verify_round2.js
 * ========================
 * GPT-4o Visionで○×のみを再抽出し、1回目の結果と照合する。
 * 不一致をログに残す。
 * 
 * 出力:
 *   data/vision_round2_YYYYMMDD.csv      — 全問題の1回目/2回目比較
 *   data/vision_round2_diffs_YYYYMMDD.csv — 不一致のみ
 */

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const BATCH_DIR = '/Users/tanakayoshhiro/Desktop/batch_20260329_112656';
const ROOT = path.resolve(__dirname, '..');
const ROUND1_CSV = path.join(ROOT, 'data', 'qa_draft_20260405152019._openai.csv');

const ts = new Date().toISOString().slice(0,10).replace(/-/g,'');
const OUT_ALL = path.join(ROOT, 'data', `vision_round2_${ts}.csv`);
const OUT_DIFFS = path.join(ROOT, 'data', `vision_round2_diffs_${ts}.csv`);
const OUT_LOG = path.join(ROOT, 'data', `vision_round2_log_${ts}.txt`);

const client = new OpenAI();

// Load round1 data
function loadRound1() {
  const lines = fs.readFileSync(ROUND1_CSV, 'utf8').split('\n');
  const header = lines[0].replace(/^\uFEFF/, '');
  const cols = header.split(',');
  const ridIdx = cols.indexOf('record_id');
  const ansIdx = cols.indexOf('answer_boolean');
  const qIdx = cols.indexOf('question_text');
  
  const data = {};
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // Simple CSV parse (handle quoted fields)
    const row = parseCSVLine(lines[i]);
    const rid = row[ridIdx];
    const parts = rid.split('-');
    const page = parts[1];
    const seq = parseInt(parts[2]);
    const key = `${page}-${seq}`;
    data[key] = {
      rid,
      page,
      seq,
      answer: row[ansIdx]?.toLowerCase() === 'true',
      questionStart: (row[qIdx] || '').substring(0, 40),
    };
  }
  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function extractAnswersFromImage(pageNum) {
  const imgPath = path.join(BATCH_DIR, 'images', `${String(pageNum).padStart(4, '0')}.png`);
  if (!fs.existsSync(imgPath)) return null;
  
  const imgData = fs.readFileSync(imgPath);
  const base64 = imgData.toString('base64');
  
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${base64}` },
        },
        {
          type: 'text',
          text: `この画像は行政書士試験の肢別過去問集です。右ページの解説の冒頭に各問題の正解（○または×）が記載されています。
各問題の正解（○/×）だけを順番にJSON配列で返してください。問題文や解説は不要です。
例: [{"q":1,"ans":"○"},{"q":2,"ans":"×"},{"q":3,"ans":"○"}]
JSONのみ出力してください。`,
        },
      ],
    }],
  });
  
  const text = response.content?.[0]?.text || response.choices?.[0]?.message?.content || '';
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function main() {
  const round1 = loadRound1();
  const pages = [...new Set(Object.values(round1).map(r => parseInt(r.page)))].sort((a,b) => a-b);
  
  console.log(`Round 2 verification: ${pages.length} pages`);
  console.log(`Output: ${OUT_ALL}`);
  console.log(`Diffs: ${OUT_DIFFS}`);
  console.log(`Log: ${OUT_LOG}`);
  console.log();
  
  const allRows = [];
  const diffRows = [];
  const logLines = [`Vision Round 2 Verification Log - ${new Date().toISOString()}\n`];
  
  let processed = 0;
  let errors = 0;
  let diffs = 0;
  let matches = 0;
  
  // CSV headers
  const csvHeader = 'page,seq,round1_answer,round2_answer,match,question_start\n';
  fs.writeFileSync(OUT_ALL, csvHeader);
  fs.writeFileSync(OUT_DIFFS, csvHeader);
  
  for (const pageNum of pages) {
    const pageStr = String(pageNum).padStart(3, '0');
    process.stdout.write(`  [${String(processed+1).padStart(3)}/250] p${pageStr} ... `);
    
    try {
      const r2answers = await extractAnswersFromImage(pageNum);
      
      if (!r2answers) {
        console.log('❌ parse error');
        logLines.push(`p${pageStr}: PARSE ERROR`);
        errors++;
        processed++;
        continue;
      }
      
      // Get round1 data for this page
      const r1forPage = Object.values(round1)
        .filter(r => r.page === pageStr)
        .sort((a,b) => a.seq - b.seq);
      
      let pageDiffs = 0;
      for (let i = 0; i < Math.max(r1forPage.length, r2answers.length); i++) {
        const r1 = r1forPage[i];
        const r2 = r2answers[i];
        
        if (!r1 || !r2) continue;
        
        const r1ans = r1.answer;
        const r2ans = r2.ans === '○';
        const isMatch = r1ans === r2ans;
        
        const row = `${pageStr},${i+1},${r1ans ? '○' : '×'},${r2ans ? '○' : '×'},${isMatch ? 'MATCH' : 'DIFF'},${r1.questionStart.replace(/,/g, '，')}\n`;
        fs.appendFileSync(OUT_ALL, row);
        
        if (isMatch) {
          matches++;
        } else {
          diffs++;
          pageDiffs++;
          fs.appendFileSync(OUT_DIFFS, row);
          logLines.push(`  DIFF p${pageStr}-q${i+1}: R1=${r1ans ? '○' : '×'} R2=${r2ans ? '○' : '×'} "${r1.questionStart}..."`);
        }
      }
      
      console.log(`✅ ${r2answers.length}問 ${pageDiffs > 0 ? `⚠ ${pageDiffs}件不一致` : ''}`);
      
    } catch (e) {
      console.log(`❌ ${e.message?.substring(0, 60)}`);
      logLines.push(`p${pageStr}: ERROR ${e.message}`);
      errors++;
    }
    
    processed++;
  }
  
  // Summary
  const summary = `
====================================
Round 2 Verification Summary
====================================
Pages processed: ${processed}
Errors: ${errors}
Total questions compared: ${matches + diffs}
Matches (R1=R2): ${matches}
Diffs (R1≠R2): ${diffs}
Match rate: ${((matches / (matches + diffs)) * 100).toFixed(1)}%
Diff rate: ${((diffs / (matches + diffs)) * 100).toFixed(1)}%
====================================`;
  
  console.log(summary);
  logLines.push(summary);
  fs.writeFileSync(OUT_LOG, logLines.join('\n'));
  
  console.log(`\nFiles written:`);
  console.log(`  ${OUT_ALL}`);
  console.log(`  ${OUT_DIFFS}`);
  console.log(`  ${OUT_LOG}`);
}

main().catch(console.error);
