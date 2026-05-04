#!/usr/bin/env node

/**
 * P1 OCR text-quality source-check queue builder
 *
 * Purpose: Detect OCR corruption candidates and output a source-check queue.
 * This script does NOT modify data. All output is report-only.
 *
 * Output: context/working/sessions/ocr-text-quality-source-check/
 *   - ocr_text_quality_source_check_packet.json
 *   - ocr_text_quality_source_check_summary.md
 */

import fs from "node:fs";
import path from "node:path";

const INPUT_PATH = process.argv[2] ?? "data/reviewed_import.json";
const OUTPUT_DIR =
  process.argv[3] ??
  "context/working/sessions/ocr-text-quality-source-check";
const BASE_SHA = "69a5014";

const PACKET_PATH = path.join(
  OUTPUT_DIR,
  "ocr_text_quality_source_check_packet.json"
);
const SUMMARY_PATH = path.join(
  OUTPUT_DIR,
  "ocr_text_quality_source_check_summary.md"
);

// ── Tier caps ──────────────────────────────────────────────
const MAX_TIER_1_5_ITEMS = Number(process.env.MAX_TIER_1_5_ITEMS ?? 80);

// ── Known OCR corruption dictionaries ──────────────────────

const SEVERE_OCR_GARBAGE = [
  { pattern: "主客管", reason: "重度 OCR 破損文字列" },
  { pattern: "筆着の準備", reason: "重度 OCR 破損文字列" },
  { pattern: "札孔ート", reason: "重度 OCR 破損文字列（判例名破損）" },
  { pattern: "反と戻", reason: "重度 OCR 破損文字列" },
  { pattern: "史礎研行", reason: "重度 OCR 破損文字列" },
  { pattern: "指定解隆処当てい", reason: "重度 OCR 破損文字列" },
  { pattern: "制剥外者個別利益", reason: "重度 OCR 破損文字列" },
  { pattern: "特別制行料金", reason: "重度 OCR 破損文字列" },
  { pattern: "容務を決めただり", reason: "重度 OCR 破損文字列" },
  { pattern: "医療施殖", reason: "重度 OCR 破損（施設→施殖）" },
  { pattern: "医療施設を模張", reason: "重度 OCR 破損" },
  { pattern: "申請乗員計画を搭載客室", reason: "重度 OCR 破損（航空機騒音訴訟）" },
  { pattern: "研究を対影", reason: "重度 OCR 破損" },
  { pattern: "学問試しの利益", reason: "重度 OCR 破損" },
];

const KNOWN_SUSPICIOUS_OCR = [
  { pattern: "大火責任法", reason: "法令名 OCR 誤読" },
  { pattern: "余償", reason: "法律文脈上の OCR 誤読候補" },
  { pattern: "フジチヤ", reason: "カタカナ固有名詞の OCR 破損疑い" },
  { pattern: "行政内閣", reason: "「行政庁」の OCR 破損疑い" },
  { pattern: "遅大な損害", reason: "「重大な損害」の OCR 破損" },
  { pattern: "実定の期間", reason: "「法定の期間」の OCR 破損" },
  { pattern: "公法上の当事者訴訟", skip: true },
  { pattern: "法人、公共上の当事者訴訟", reason: "「公法上」の OCR 破損" },
  { pattern: "条件の制定行為", reason: "「条例の制定行為」の OCR 破損" },
  { pattern: "独立原因有の瑕疵", reason: "「独立した固有の瑕疵」の OCR 破損" },
  { pattern: "原処分主主義", reason: "「主」重複の OCR 破損" },
  { pattern: "裁決間の瑕疵", reason: "「裁決固有の瑕疵」の OCR 破損" },
  { pattern: "既設浴場への瑕疵", reason: "「利益」の OCR 破損" },
  { pattern: "破毀に基づいて", reason: "「疎明に基づいて」の OCR 破損" },
  { pattern: "資格審査権限", reason: "「実質審査権限」の OCR 破損疑い" },
  { pattern: "債務をことができない損害", reason: "「償うことのできない損害」の OCR 破損" },
  { pattern: "すなおち", reason: "「すなわち」の OCR 破損" },
  { pattern: "処分ににつき", reason: "「に」重複の OCR 破損" },
  { pattern: "行行政処分", reason: "「行」重複の OCR 破損" },
  { pattern: "労災保険支援費", reason: "「労災保険給付」の OCR 破損" },
  { pattern: "学説の裁判", reason: "「争訟の裁判」の OCR 破損" },
  { pattern: "疑疑があれば", reason: "「疑」重複の OCR 破損" },
  { pattern: "違憲および", reason: "法律文脈上不自然な接続表現の OCR 破損疑い" },
  { pattern: "処分が適法または不当", reason: "「違法または不当」の OCR 破損" },
  { pattern: "著しい損害", reason: "「重大な損害」の OCR 破損疑い（行訴法文脈）" },
  { pattern: "反対処分の義務付け訴訟", reason: "義務付け訴訟の対象処分名の OCR 破損" },
  { pattern: "従業者的行事", reason: "「卒業式的行事」の OCR 破損" },
  { pattern: "直接接触を与える", reason: "「直接制約を与える」の OCR 破損" },
  { pattern: "市立学級転校前", reason: "重度 OCR 破損（教員転任判例）" },
  { pattern: "特任事務次官", reason: "重度 OCR 破損（教員転任判例）" },
  { pattern: "飲水", reason: "「給水」の OCR 破損疑い（文脈要確認）" },
  { pattern: "消火活動のための緊縛", reason: "「緊急」系の OCR 破損" },
  { pattern: "侵害をしうる職員", reason: "OCR 破損疑い" },
  { pattern: "拡張のように", reason: "OCR 破損疑い" },
  { pattern: "平成16年に改正前に改緩和された", reason: "「改正により緩和された」の OCR 破損" },
  { pattern: "特別乗者", reason: "重度 OCR 破損" },
];

const LEGAL_TERM_CORRUPTIONS = [
  { pattern: "東判", reason: "裁判所名 OCR 破損。「最判」「東京高判」等の可能性" },
];

// ── Written-answer format detection ────────────────────────
const WRITTEN_ANSWER_PATTERNS = [
  /空欄に正しい語句/,
  /漢字\d+字/,
  /空欄\s*[A-Z]\s*[/／・と]\s*[A-Z]\s*に入る/,
  /語句を記入/,
  /正しい語句.*記入/,
  /[A-Z]に入る語句/,
];

// ── Duplicate kana/word detection (targeted, not broad) ────
const TARGETED_DUPLICATES = [
  { pattern: /ならならない/, reason: "「なら」重複の OCR 破損" },
  { pattern: /ならならならない/, reason: "「なら」×3 重複の OCR 破損" },
  { pattern: /ことととなった/, reason: "「こと」重複の OCR 破損" },
  { pattern: /取り消すし/, reason: "「し」重複の OCR 破損" },
  { pattern: /必ず.{0,10}必ず/, reason: "「必ず」重複の OCR 破損疑い" },
];

// ── Natural ending detection ───────────────────────────────
const NATURAL_ENDING = /[。．.!?！？）」』】〕］》〉"']$/u;
const INTENTIONAL_OMISSION = /<省略>$/u;

// ── Helpers ────────────────────────────────────────────────

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeValue(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function makeSnippet(value, maxLength = 120) {
  const n = normalizeValue(value);
  if (n.length <= maxLength) return n;
  return `${n.slice(0, maxLength)}…`;
}

function problemIdFromPage(page, branch) {
  const bookId = page.bookId ?? "KB2025";
  const pageNo = String(parseInt(page.sourcePage, 10) || 0).padStart(3, "0");
  const seqNo = String(branch.seqNo ?? 1).padStart(2, "0");
  return `${bookId}-p${pageNo}-q${seqNo}`;
}

function makeBase(page, branch, field, currentValue) {
  return {
    sourcePage: page.sourcePage ?? null,
    originalProblemId: problemIdFromPage(page, branch),
    bookId: page.bookId ?? null,
    batchId: page.batchId ?? null,
    seqNo: branch.seqNo ?? null,
    field,
    currentValueSnippet: makeSnippet(currentValue),
  };
}

// ── Dedup ──────────────────────────────────────────────────

function makeKey(record) {
  return [
    record.tier,
    record.queue,
    record.ruleId,
    record.sourcePage,
    record.seqNo,
    record.field,
    record.matchedPattern ?? "",
  ].join("::");
}

let candidateCounter = 0;
function nextCandidateId() {
  candidateCounter += 1;
  return `P1-${String(candidateCounter).padStart(4, "0")}`;
}

function addCandidate(collector, record) {
  const key = makeKey(record);
  if (collector.seen.has(key)) return;
  collector.seen.add(key);
  collector.values.push({ candidateId: nextCandidateId(), ...record });
}

// ── Inspectors ─────────────────────────────────────────────

function inspectWrittenAnswerFormat(page, branch, collector) {
  const q = normalizeValue(branch.questionText);
  if (!q) return;

  for (const pat of WRITTEN_ANSWER_PATTERNS) {
    if (pat.test(q)) {
      addCandidate(collector, {
        ...makeBase(page, branch, "questionText", q),
        tier: "C_HIGH",
        severity: "critical",
        queue: "ocr_text_quality",
        ruleId: "format_written_answer_converted_to_bool",
        matchedPattern: pat.source,
        reason:
          "記述式問題が○×形式として取り込まれている疑い。source確認対象。",
        sourceHint: "ocr_text_quality_backlog.md C-high",
        suggestedAction: "source_check",
        proposedReplacement: null,
        answerBooleanChange: null,
        polarityChange: null,
        requiresHumanSourceCheck: true,
      });
      return;
    }
  }
}

function inspectExplanationCopied(page, branch, collector) {
  const q = normalizeValue(branch.questionText);
  const e = normalizeValue(branch.explanationText);
  if (!q || !e || q.length < 30 || e.length < 30) return;

  // Strict heuristic: E is Q with no substantive explanation added.
  // In this dataset, E commonly restates Q then adds citation + reasoning.
  // Only flag when E is nearly identical to Q with trivial suffix only —
  // i.e. E starts with Q verbatim and the added portion is very short.
  if (!e.startsWith(q.substring(0, Math.min(q.length, 30)))) return;

  const shorter = Math.min(q.length, e.length);
  let prefixMatch = 0;
  for (let i = 0; i < shorter; i++) {
    if (q[i] === e[i]) prefixMatch++;
    else break;
  }
  // E must match Q's full text, and the extra content must not be a mere citation
  const extraChars = e.length - prefixMatch;
  const extra = e.substring(prefixMatch);
  const isMereCitation = /^[（(].*[）)][。．]?$/.test(extra.trim());
  if (prefixMatch >= q.length * 0.98 && extraChars < 30 && !isMereCitation) {
    addCandidate(collector, {
      ...makeBase(page, branch, "explanationText", e),
      tier: "C_HIGH",
      severity: "critical",
      queue: "ocr_text_quality",
      ruleId: "explanation_copied_from_question_conflict",
      matchedPattern: `Q/E prefix match ${prefixMatch}/${q.length} chars, extra ${extraChars}`,
      reason:
        "E が Q とほぼ同文。Eコピー事故の疑い。source確認対象。",
      sourceHint: "ocr_text_quality_backlog.md C-high",
      suggestedAction: "source_check",
      proposedReplacement: null,
      answerBooleanChange: null,
      polarityChange: null,
      requiresHumanSourceCheck: true,
    });
  }
}

function inspectEmptyExplanation(page, branch, collector) {
  const e = normalizeValue(branch.explanationText);
  if (e.length === 0) {
    addCandidate(collector, {
      ...makeBase(page, branch, "explanationText", ""),
      tier: "C_HIGH",
      severity: "critical",
      queue: "ocr_text_quality",
      ruleId: "empty_explanation",
      matchedPattern: "empty_string",
      reason: "E 空欄。source確認対象。",
      suggestedAction: "source_check",
      proposedReplacement: null,
      answerBooleanChange: null,
      polarityChange: null,
      requiresHumanSourceCheck: true,
    });
  }
}

function inspectSevereOcrGarbage(page, branch, collector) {
  for (const field of ["questionText", "explanationText"]) {
    const value = branch[field];
    if (typeof value !== "string" || value.length === 0) continue;

    for (const rule of SEVERE_OCR_GARBAGE) {
      if (value.includes(rule.pattern)) {
        addCandidate(collector, {
          ...makeBase(page, branch, field, value),
          tier: "TIER1",
          severity: "high",
          queue: "ocr_text_quality",
          ruleId: "severe_ocr_garbage_known_terms",
          matchedPattern: rule.pattern,
          reason: rule.reason,
          suggestedAction: "source_check",
          proposedReplacement: null,
          answerBooleanChange: null,
          polarityChange: null,
          requiresHumanSourceCheck: true,
        });
      }
    }
  }
}

function inspectKnownSuspiciousOcr(page, branch, collector) {
  for (const field of ["questionText", "explanationText", "sectionTitle"]) {
    const value = branch[field];
    if (typeof value !== "string" || value.length === 0) continue;

    for (const rule of KNOWN_SUSPICIOUS_OCR) {
      if (rule.skip) continue;
      if (value.includes(rule.pattern)) {
        addCandidate(collector, {
          ...makeBase(page, branch, field, value),
          tier: "TIER1",
          severity: "high",
          queue: "ocr_text_quality",
          ruleId: "known_suspicious_ocr_string",
          matchedPattern: rule.pattern,
          reason: rule.reason,
          suggestedAction: "source_check",
          proposedReplacement: null,
          answerBooleanChange: null,
          polarityChange: null,
          requiresHumanSourceCheck: true,
        });
      }
    }
  }
}

function inspectLegalTermCorruption(page, branch, collector) {
  for (const field of ["questionText", "explanationText"]) {
    const value = branch[field];
    if (typeof value !== "string" || value.length === 0) continue;

    for (const rule of LEGAL_TERM_CORRUPTIONS) {
      if (value.includes(rule.pattern)) {
        addCandidate(collector, {
          ...makeBase(page, branch, field, value),
          tier: "TIER1",
          severity: "high",
          queue: "ocr_text_quality",
          ruleId: "legal_term_obvious_corruption",
          matchedPattern: rule.pattern,
          reason: rule.reason,
          suggestedAction: "source_check",
          proposedReplacement: null,
          answerBooleanChange: null,
          polarityChange: null,
          requiresHumanSourceCheck: true,
        });
      }
    }
  }
}

function inspectNegativeParticleDrop(page, branch, collector) {
  const e = normalizeValue(branch.explanationText);
  if (!e) return;

  // "対象となる" at end of sentence where "対象とならない" is expected
  if (/対象となる[。、]/.test(e) && branch.answerBoolean === false) {
    addCandidate(collector, {
      ...makeBase(page, branch, "explanationText", e),
      tier: "TIER1",
      severity: "high",
      queue: "ocr_text_quality",
      ruleId: "negative_particle_drop_candidate",
      matchedPattern: "対象となる (ans=false → 「ならない」脱落疑い)",
      reason:
        "E が「対象となる」と述べているが ans=false。「ない」脱落の OCR 破損疑い。",
      suggestedAction: "source_check",
      proposedReplacement: null,
      answerBooleanChange: null,
      polarityChange: null,
      requiresHumanSourceCheck: true,
    });
  }
}

function inspectTargetedDuplicates(page, branch, collector) {
  for (const field of ["questionText", "explanationText"]) {
    const value = branch[field];
    if (typeof value !== "string" || value.length === 0) continue;

    for (const rule of TARGETED_DUPLICATES) {
      if (rule.pattern.test(value)) {
        addCandidate(collector, {
          ...makeBase(page, branch, field, value),
          tier: "TIER1_5",
          severity: "medium",
          queue: "ocr_text_quality",
          ruleId: "unnatural_duplicate_kana_or_word",
          matchedPattern: rule.pattern.source,
          reason: rule.reason,
          suggestedAction: "source_check",
          proposedReplacement: null,
          answerBooleanChange: null,
          polarityChange: null,
          requiresHumanSourceCheck: true,
        });
      }
    }
  }
}

function inspectPossibleTruncation(page, branch, collector) {
  for (const field of ["questionText", "explanationText"]) {
    const value = normalizeValue(branch[field]);
    if (value.length < 20) continue;
    if (NATURAL_ENDING.test(value)) continue;
    if (INTENTIONAL_OMISSION.test(value)) continue;

    addCandidate(collector, {
      ...makeBase(page, branch, field, value),
      tier: "TIER1_5",
      severity: "medium",
      queue: "ocr_text_quality",
      ruleId: "possible_truncated_text",
      matchedPattern: "missing_natural_terminal_punctuation",
      reason:
        "文末が自然な句読点・括弧閉じで終わっていない。source確認候補。",
      suggestedAction: "source_check",
      proposedReplacement: null,
      answerBooleanChange: null,
      polarityChange: null,
      requiresHumanSourceCheck: true,
    });
  }
}

function inspectQeContradiction(page, branch, collector) {
  const q = normalizeValue(branch.questionText);
  const e = normalizeValue(branch.explanationText);
  if (!q || !e || e.length < 15) return;

  const ans = branch.answerBoolean;
  if (ans === null || ans === undefined) return;

  // Very strict: only flag when E's FINAL sentence explicitly concludes with
  // a clear verdict that contradicts answerBoolean.
  // Extract last sentence (after final 。)
  const sentences = e.split(/。/).filter((s) => s.trim().length > 5);
  if (sentences.length === 0) return;
  const lastSentence = sentences[sentences.length - 1].trim();

  const conclusionAffirm = /^(?:よって|したがって|以上より|ゆえに).{0,20}(?:正しい|妥当|適法|有効)/.test(lastSentence);
  const conclusionNegate = /^(?:よって|したがって|以上より|ゆえに).{0,20}(?:誤り|正しくない|妥当でない|不適法|無効)/.test(lastSentence);

  if ((conclusionAffirm && ans === false) || (conclusionNegate && ans === true)) {
    addCandidate(collector, {
      ...makeBase(page, branch, "explanationText", e),
      tier: "TIER1",
      severity: "high",
      queue: "qe_contradiction",
      ruleId: "qe_internal_contradiction",
      matchedPattern: `E_conclusion=${conclusionAffirm ? "affirmative" : "negative"} vs ans=${ans}`,
      reason:
        "Q/E の結論と answerBoolean が矛盾している疑い。polarity は自動変更しない。",
      suggestedAction: "source_check",
      proposedReplacement: null,
      answerBooleanChange: null,
      polarityChange: null,
      requiresHumanSourceCheck: true,
    });
  }
}

// ── Separate queues ────────────────────────────────────────

function inspectPolarityRecheck(page, branch, collector) {
  // Only flag if branch has existing sourceCheckReason mentioning polarity
  const reason = branch.sourceCheckReason ?? "";
  if (/polarity|極性|B-queue|B queue/i.test(reason)) {
    addCandidate(collector, {
      ...makeBase(
        page,
        branch,
        "branch",
        branch.questionText ?? ""
      ),
      tier: "B_RECHECK",
      severity: "separate_high",
      queue: "polarity_recheck",
      ruleId: "polarity_recheck_existing_flag",
      matchedPattern: "sourceCheckReason contains polarity reference",
      reason:
        "既存 sourceCheckReason に polarity 疑義の記載あり。source確認なしに polarity を変更してはならない。",
      suggestedAction: "source_check",
      proposedReplacement: null,
      answerBooleanChange: null,
      polarityChange: null,
      requiresHumanSourceCheck: true,
    });
  }
}

function inspectSectionTitleQuality(page, branch, collector) {
  const st = normalizeValue(branch.sectionTitle);

  if (st === "" || st === "(空)" || st === "不明" || st === "総則") {
    addCandidate(collector, {
      ...makeBase(page, branch, "sectionTitle", st || "(empty)"),
      tier: "SECTION_QUALITY",
      severity: "separate_medium",
      queue: "section_title_quality",
      ruleId: st === "" ? "empty_section_title" : "raw_broad_or_unknown",
      matchedPattern: st || "empty",
      reason:
        "sectionTitle が空・不明・broad値。classification quality queue。OCR text-quality とは別。",
      suggestedAction: "source_check",
      proposedReplacement: null,
      answerBooleanChange: null,
      polarityChange: null,
      requiresHumanSourceCheck: true,
    });
  }
}

// ── Seed-based queues (from backlog / known_issues) ────────

// B recheck queue from ocr_text_quality_backlog.md
// These are polarity recheck candidates that require source image confirmation.
const B_RECHECK_SEED = [
  { page: "060", seq: 2, currentAns: false, hint: "Q「執行罰と行政刑罰の併科できる」+ E「両者目的異なる」→ T 示唆" },
  { page: "063", seq: 5, currentAns: false, hint: "Q「成田新法／警職法武器使用は即時強制の例」→ T 示唆" },
  { page: "077", seq: 5, currentAns: false, hint: "Q「申請者以外の利益を害すべき場合に公聴会努力義務」→ ○示唆" },
  { page: "079", seq: 1, currentAns: false, hint: "Q に「口頭によって」が不自然混入。取り直すと polarity 反転の可能性" },
  { page: "085", seq: 6, currentAns: true, hint: "Q OCR 破損。画像 row 4 は × の可能性高" },
  { page: "088", seq: 1, currentAns: false, hint: "Q「補正を求めるものは含まれない」= 事実正しい → T の可能性" },
  { page: "103", seq: 5, currentAns: true, hint: "Q が OCR 疑義。E は 24条2項「手続を経ることなく」と説明" },
  { page: "107", seq: 7, currentAns: true, hint: "Q 自己矛盾。画像 row 28 × 表示" },
  { page: "119", seq: 1, currentAns: true, hint: "Q 途切れ + 重複。polarity 判断は Q OCR 取り直し後" },
  { page: "122", seq: 1, currentAns: false, hint: "Q 行訴法2条の逐語引用 → T の可能性。E「機能訴訟」で OCR 破損" },
  { page: "128", seq: 1, currentAns: false, hint: "最判昭45.7.15 は民事訴訟で提起可 → T の可能性" },
  { page: "132", seq: 5, currentAns: true, hint: "Q「市街化区域」→「市街化調整区域」の OCR 誤記の可能性" },
];

function injectBRecheckSeed(collector) {
  for (const item of B_RECHECK_SEED) {
    addCandidate(collector, {
      sourcePage: item.page,
      originalProblemId: `KB2025-p${item.page}-q${String(item.seq).padStart(2, "0")}`,
      bookId: "KB2025",
      batchId: null,
      seqNo: item.seq,
      field: "branch",
      currentValueSnippet: item.hint,
      tier: "B_RECHECK",
      severity: "separate_high",
      queue: "polarity_recheck",
      ruleId: "polarity_recheck_backlog_seed",
      matchedPattern: `currentAns=${item.currentAns}`,
      reason: `${item.hint}。source確認なしに polarity を変更してはならない。`,
      sourceHint: "ocr_text_quality_backlog.md B再確認キュー",
      suggestedAction: "source_check",
      proposedReplacement: null,
      answerBooleanChange: null,
      polarityChange: null,
      requiresHumanSourceCheck: true,
    });
  }
}

// Import completeness: p021 missing item (from known_issues.md)
function injectImportCompletenessSeed(collector) {
  addCandidate(collector, {
    sourcePage: "021",
    originalProblemId: "KB2025-p021-q05_or_q06",
    bookId: "KB2025",
    batchId: null,
    seqNo: null,
    field: "page",
    currentValueSnippet: "p021 upper area に未取込の「行政法の一般原則」item が存在する疑い",
    tier: "IMPORT_COMPLETENESS",
    severity: "separate_medium",
    queue: "import_completeness",
    ruleId: "missing_problem_item",
    matchedPattern: "p021 seqNo 5/6 missing, 行政法の一般原則 sectionTitle absent",
    reason:
      "p021 の上部エリアに未 import の問題項目がある疑い。source image 確認が必要。",
    sourceHint: "known_issues.md p021",
    suggestedAction: "source_check",
    proposedReplacement: null,
    answerBooleanChange: null,
    polarityChange: null,
    requiresHumanSourceCheck: true,
  });
}

// p022 sectionTitle policy issue (from known_issues.md)
function injectP022SectionTitleSeed(collector) {
  for (const seq of [2, 3, 4, 5]) {
    const titles = { 2: "公営住宅", 3: "食品衛生法", 4: "通行権", 5: "土地所有権" };
    addCandidate(collector, {
      sourcePage: "022",
      originalProblemId: `KB2025-p022-q${String(seq).padStart(2, "0")}`,
      bookId: "KB2025",
      batchId: null,
      seqNo: seq,
      field: "sectionTitle",
      currentValueSnippet: titles[seq],
      tier: "SECTION_QUALITY",
      severity: "separate_medium",
      queue: "section_title_quality",
      ruleId: "section_title_subtopic_policy",
      matchedPattern: `sectionTitle="${titles[seq]}" is item-level subtopic, not section name`,
      reason:
        "sectionTitle が item-level subtopic であり、broader section name (行政上の法律関係) ではない。sectionTitle normalization policy の対象。ad hoc 修正禁止。",
      sourceHint: "known_issues.md p022",
      suggestedAction: "source_check",
      proposedReplacement: null,
      answerBooleanChange: null,
      polarityChange: null,
      requiresHumanSourceCheck: true,
    });
  }
}

// ── Sort / count helpers ───────────────────────────────────

function sortRecords(records) {
  return [...records].sort((a, b) => {
    const pA = Number(a.sourcePage ?? 0);
    const pB = Number(b.sourcePage ?? 0);
    if (pA !== pB) return pA - pB;
    const sA = Number(a.seqNo ?? 0);
    const sB = Number(b.seqNo ?? 0);
    if (sA !== sB) return sA - sB;
    return String(a.field).localeCompare(String(b.field), "ja");
  });
}

function countBy(records, key) {
  const result = {};
  for (const r of records) {
    const v = r[key] ?? "unknown";
    result[v] = (result[v] ?? 0) + 1;
  }
  return result;
}

// ── Summary MD builder ─────────────────────────────────────

function buildSummary(packet) {
  const lines = [];
  lines.push("# P1 OCR text-quality source-check queue summary");
  lines.push("");
  lines.push("## Scope");
  lines.push("");
  lines.push(`- Source: \`${INPUT_PATH}\``);
  lines.push(`- Base SHA: \`${BASE_SHA}\``);
  lines.push("- Purpose: source-check candidates only (report-only)");
  lines.push("- Data mutation: **none**");
  lines.push("- proposedReplacement: always **null**");
  lines.push("- answerBoolean / polarity: **not changed**");
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push(`- Total pages: ${packet.source.totalPages}`);
  lines.push(`- Total branches: ${packet.source.totalBranches}`);
  lines.push(`- **C-HIGH candidates**: ${packet.summary.byTier.C_HIGH ?? 0}`);
  lines.push(`- **TIER1 candidates**: ${packet.summary.byTier.TIER1 ?? 0}`);
  lines.push(
    `- **TIER1_5 candidates**: ${packet.summary.byTier.TIER1_5 ?? 0} (cap: ${MAX_TIER_1_5_ITEMS}, suppressed: ${packet.summary.suppressedCount})`
  );
  lines.push(
    `- **B_RECHECK (separate)**: ${packet.summary.byTier.B_RECHECK ?? 0}`
  );
  lines.push(
    `- **SECTION_QUALITY (separate)**: ${packet.summary.byTier.SECTION_QUALITY ?? 0}`
  );
  lines.push(`- **Total**: ${packet.summary.candidateCount}`);
  lines.push("");
  lines.push("## By queue");
  lines.push("");
  for (const [q, c] of Object.entries(packet.summary.byQueue)) {
    lines.push(`- ${q}: ${c}`);
  }
  lines.push("");
  lines.push("## By ruleId");
  lines.push("");
  for (const [r, c] of Object.entries(packet.summary.byRuleId)) {
    lines.push(`- ${r}: ${c}`);
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- `...` / `…` broad extraction: intentionally disabled.");
  lines.push("- Duplicate-kana regex: targeted patterns only (not broad).");
  lines.push("- `<省略>` / book-verbatim `…`: excluded from truncation check.");
  lines.push(
    "- `ocr_text_quality_backlog.md` items used as seed/hint only, not as patch authority."
  );
  lines.push("- All candidates: `suggestedAction: source_check`.");
  lines.push("- All candidates: `proposedReplacement: null`.");
  lines.push("- Polarity / answerBoolean: **never changed**.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

// ── Main ───────────────────────────────────────────────────

function main() {
  const root = readJson(INPUT_PATH);

  if (!Array.isArray(root.pages)) {
    throw new Error(
      "Invalid reviewed_import.json: root.pages is not an array"
    );
  }

  const collector = { seen: new Set(), values: [] };
  let totalBranches = 0;

  for (const page of root.pages) {
    if (!Array.isArray(page.branches)) continue;

    for (const branch of page.branches) {
      totalBranches += 1;

      // C-HIGH
      inspectWrittenAnswerFormat(page, branch, collector);
      inspectExplanationCopied(page, branch, collector);
      inspectEmptyExplanation(page, branch, collector);

      // TIER1
      inspectSevereOcrGarbage(page, branch, collector);
      inspectKnownSuspiciousOcr(page, branch, collector);
      inspectLegalTermCorruption(page, branch, collector);
      inspectNegativeParticleDrop(page, branch, collector);

      // TIER1_5
      inspectTargetedDuplicates(page, branch, collector);
      inspectPossibleTruncation(page, branch, collector);

      // Separate queues
      inspectQeContradiction(page, branch, collector);
      inspectPolarityRecheck(page, branch, collector);
      inspectSectionTitleQuality(page, branch, collector);
    }
  }

  // Inject seed data from backlog / known_issues
  injectBRecheckSeed(collector);
  injectImportCompletenessSeed(collector);
  injectP022SectionTitleSeed(collector);

  // Partition by queue
  const ocrTextQuality = [];
  const qeContradiction = [];
  const polarityRecheck = [];
  const sectionQuality = [];
  const importCompleteness = [];

  for (const c of collector.values) {
    switch (c.queue) {
      case "ocr_text_quality":
        ocrTextQuality.push(c);
        break;
      case "qe_contradiction":
        qeContradiction.push(c);
        break;
      case "polarity_recheck":
        polarityRecheck.push(c);
        break;
      case "section_title_quality":
        sectionQuality.push(c);
        break;
      case "import_completeness":
        importCompleteness.push(c);
        break;
    }
  }

  // Apply tier1.5 cap to ocr_text_quality only
  const tier15Items = ocrTextQuality.filter((c) => c.tier === "TIER1_5");
  const nonTier15 = ocrTextQuality.filter((c) => c.tier !== "TIER1_5");
  const tier15Sorted = sortRecords(tier15Items);
  const tier15Capped = tier15Sorted.slice(0, MAX_TIER_1_5_ITEMS);
  const suppressedCount = Math.max(0, tier15Sorted.length - MAX_TIER_1_5_ITEMS);

  const allCandidates = sortRecords([
    ...nonTier15,
    ...tier15Capped,
    ...qeContradiction,
    ...polarityRecheck,
    ...sectionQuality,
    ...importCompleteness,
  ]);

  const packet = {
    schemaVersion: 2,
    task: {
      id: "P1-ocr-text-quality-source-check",
      mode: "read-only-report-only",
      baseRef: "origin/main",
      baseSha: BASE_SHA,
    },
    source: {
      inputPath: INPUT_PATH,
      totalPages: root.pages.length,
      totalBranches,
    },
    policy: {
      dataMutation: false,
      suggestedActionOnly: true,
      allowedSuggestedActions: ["source_check"],
      proposedReplacementAlwaysNull: true,
      sourceCheckRequiredBeforePatch: true,
      doNotChangeAnswerBoolean: true,
      doNotChangePolarity: true,
      separateQueues: [
        "ocr_text_quality",
        "qe_contradiction",
        "polarity_recheck",
        "section_title_quality",
        "import_completeness",
      ],
    },
    summary: {
      candidateCount: allCandidates.length,
      suppressedCount,
      byTier: countBy(allCandidates, "tier"),
      byQueue: countBy(allCandidates, "queue"),
      byRuleId: countBy(allCandidates, "ruleId"),
      byField: countBy(allCandidates, "field"),
    },
    candidates: allCandidates,
    suppressed: [
      {
        ruleId: "ellipsis_all",
        reason:
          "broad `...` / `…` extraction intentionally disabled to avoid noise",
      },
      {
        ruleId: "duplicate_kana_broad_regex",
        reason:
          "broad duplicate-kana regex intentionally disabled; targeted patterns used instead",
      },
      ...(suppressedCount > 0
        ? [
            {
              ruleId: "tier1_5_cap",
              reason: `${suppressedCount} TIER1_5 items suppressed by cap (max ${MAX_TIER_1_5_ITEMS})`,
            },
          ]
        : []),
    ],
  };

  ensureDir(OUTPUT_DIR);

  fs.writeFileSync(
    PACKET_PATH,
    `${JSON.stringify(packet, null, 2)}\n`,
    "utf8"
  );
  fs.writeFileSync(SUMMARY_PATH, buildSummary(packet), "utf8");

  console.log(`Wrote ${PACKET_PATH}`);
  console.log(`Wrote ${SUMMARY_PATH}`);
  console.log("");
  console.log("=== Summary ===");
  console.log(`Total candidates: ${packet.summary.candidateCount}`);
  for (const [tier, count] of Object.entries(packet.summary.byTier)) {
    console.log(`  ${tier}: ${count}`);
  }
  console.log(`Suppressed (tier1.5 cap): ${suppressedCount}`);
  console.log("");
  console.log("By queue:");
  for (const [q, c] of Object.entries(packet.summary.byQueue)) {
    console.log(`  ${q}: ${c}`);
  }
  console.log("");
  console.log("By ruleId:");
  for (const [r, c] of Object.entries(packet.summary.byRuleId)) {
    console.log(`  ${r}: ${c}`);
  }
}

main();
