#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const INPUT_PATH = process.argv[2] ?? "data/reviewed_import.json";
const OUTPUT_DIR =
  process.argv[3] ?? "context/working/sessions/imported-data-correction-audit";

const PACKET_PATH = path.join(OUTPUT_DIR, "correction_review_packet.json");
const SUMMARY_PATH = path.join(OUTPUT_DIR, "correction_review_summary.md");

const MAX_TIER_1_5_ITEMS = Number(process.env.MAX_TIER_1_5_ITEMS ?? 50);

const SUSPICIOUS_OCR_PATTERNS = [
  {
    pattern: "札孔ート",
    reason: "OCR破損の疑いが強い固定文字列。判例名・固有名詞等のsource確認対象。",
  },
  {
    pattern: "大火責任法",
    reason: "法令名OCR誤読の疑いが強い固定文字列。source確認対象。",
  },
  {
    pattern: "余償",
    reason: "法律文脈上のOCR誤読候補。source確認対象。",
  },
  {
    pattern: "違憲および",
    reason: "「違憲および」は法律文脈上不自然な接続表現であり、OCR破損の可能性があるため source check 対象。修正値は推定しない。",
  },
  {
    pattern: "フジチヤ",
    reason: "カタカナ固有名詞のOCR破損疑い。source確認対象。修正値は推定しない。",
  },
  {
    pattern: "反と戻",
    reason: "日本語として不自然なOCR破損疑い。source確認対象。修正値は推定しない。",
  },
  {
    pattern: "主客管",
    reason: "日本語として不自然なOCR破損疑い。source確認対象。修正値は推定しない。",
  },
  {
    pattern: "筆着の準備",
    reason: "日本語として不自然なOCR破損疑い。source確認対象。修正値は推定しない。",
  },
];

const TEXT_FIELDS = ["questionText", "explanationText", "sectionTitle"];

const NATURAL_ENDING_PATTERN = /[。．.!?！？）」』】〕］》〉"']$/u;
const INTENTIONAL_OMISSION_PATTERN = /<省略>$/u;

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeValue(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function makeSnippet(value, maxLength = 120) {
  const normalized = normalizeValue(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}…`;
}

function makeBaseRecord({ page, branch, field, currentValue }) {
  return {
    sourcePage: page.sourcePage ?? null,
    originalProblemId: page.originalProblemId ?? null,
    bookId: page.bookId ?? null,
    batchId: page.batchId ?? null,
    seqNo: branch.seqNo ?? null,
    field,
    currentValueSnippet: makeSnippet(currentValue),
  };
}

function addUnique(items, record) {
  const key = [
    record.tier,
    record.kind,
    record.sourcePage,
    record.originalProblemId,
    record.seqNo,
    record.field,
    record.matchedPattern ?? "",
  ].join("::");

  if (!items.seen.has(key)) {
    items.seen.add(key);
    items.values.push(record);
  }
}

function inspectExistingSourceCheck({ page, branch }, collector) {
  if (branch.needsSourceCheck || branch.sourceCheckReason) {
    addUnique(collector, {
      ...makeBaseRecord({
        page,
        branch,
        field: "branch",
        currentValue:
          branch.sourceCheckReason ??
          branch.questionText ??
          branch.explanationText ??
          "",
      }),
      tier: "tier1",
      kind: "existing_source_check_flag",
      matchedPattern: "needsSourceCheck/sourceCheckReason",
      reason:
        branch.sourceCheckReason ??
        "needsSourceCheck が true または sourceCheckReason が存在する。",
      sourceCheckReason: branch.sourceCheckReason ?? null,
      suggestedAction: "source_check",
      proposedReplacement: null,
    });
  }
}

function inspectSuspiciousFixedStrings({ page, branch }, collector) {
  for (const field of TEXT_FIELDS) {
    const value = branch[field];
    if (typeof value !== "string" || value.length === 0) continue;

    for (const rule of SUSPICIOUS_OCR_PATTERNS) {
      if (value.includes(rule.pattern)) {
        addUnique(collector, {
          ...makeBaseRecord({ page, branch, field, currentValue: value }),
          tier: "tier1",
          kind: "known_suspicious_ocr_string",
          matchedPattern: rule.pattern,
          reason: rule.reason,
          sourceCheckReason: branch.sourceCheckReason ?? null,
          suggestedAction: "source_check",
          proposedReplacement: null,
        });
      }
    }
  }
}

function inspectPossibleTruncation({ page, branch }, collector) {
  for (const field of ["questionText", "explanationText"]) {
    const value = normalizeValue(branch[field]);
    if (value.length < 20) continue;
    if (NATURAL_ENDING_PATTERN.test(value)) continue;
    if (INTENTIONAL_OMISSION_PATTERN.test(value)) continue;

    addUnique(collector, {
      ...makeBaseRecord({ page, branch, field, currentValue: value }),
      tier: "tier1_5",
      kind: "possible_truncated_text",
      matchedPattern: "missing_natural_terminal_punctuation",
      reason:
        "文末が自然な句読点・括弧閉じで終わっていない。正常ケースもあり得るため Tier 1.5 としてsource確認候補に留める。",
      sourceCheckReason: branch.sourceCheckReason ?? null,
      suggestedAction: "source_check",
      proposedReplacement: null,
    });
  }
}

function sortRecords(records) {
  return [...records].sort((a, b) => {
    const pageA = Number(a.sourcePage ?? 0);
    const pageB = Number(b.sourcePage ?? 0);
    if (pageA !== pageB) return pageA - pageB;

    const problemA = String(a.originalProblemId ?? "");
    const problemB = String(b.originalProblemId ?? "");
    if (problemA !== problemB) return problemA.localeCompare(problemB, "ja");

    const seqA = Number(a.seqNo ?? 0);
    const seqB = Number(b.seqNo ?? 0);
    if (seqA !== seqB) return seqA - seqB;

    return String(a.field).localeCompare(String(b.field), "ja");
  });
}

function countBy(records, key) {
  const result = {};
  for (const record of records) {
    const value = record[key] ?? "unknown";
    result[value] = (result[value] ?? 0) + 1;
  }
  return result;
}

function buildMarkdownSummary(packet) {
  const lines = [];

  lines.push("# imported-data-correction-audit summary");
  lines.push("");
  lines.push("## Scope");
  lines.push("");
  lines.push("- Source: `data/reviewed_import.json`");
  lines.push("- Purpose: source check candidates only");
  lines.push("- Data mutation: none");
  lines.push("- Proposed replacement values: none");
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push(`- total pages: ${packet.source.totalPages}`);
  lines.push(`- total branches: ${packet.source.totalBranches}`);
  lines.push(`- Tier 1 candidates: ${packet.summary.tier1Count}`);
  lines.push(`- Tier 1.5 candidates: ${packet.summary.tier15Count}`);
  lines.push(`- Tier 1.5 suppressed by cap: ${packet.summary.tier15SuppressedCount}`);
  lines.push("");
  lines.push("## Tier 1 by kind");
  lines.push("");
  for (const [kind, count] of Object.entries(packet.summary.tier1ByKind)) {
    lines.push(`- ${kind}: ${count}`);
  }
  lines.push("");
  lines.push("## Tier 1.5 by kind");
  lines.push("");
  for (const [kind, count] of Object.entries(packet.summary.tier15ByKind)) {
    lines.push(`- ${kind}: ${count}`);
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- `...` / `…` broad extraction is intentionally excluded.");
  lines.push("- Duplicate-character regex extraction is intentionally excluded.");
  lines.push("- Polarity and answerBoolean are not automatically changed.");
  lines.push("- All candidates use `suggestedAction: source_check`.");
  lines.push("- `proposedReplacement` is always `null`.");

  return `${lines.join("\n")}\n`;
}

function main() {
  const root = readJson(INPUT_PATH);

  if (!Array.isArray(root.pages)) {
    throw new Error("Invalid reviewed_import.json: root.pages is not an array");
  }

  const tier1Collector = { seen: new Set(), values: [] };
  const tier15Collector = { seen: new Set(), values: [] };

  let totalBranches = 0;

  for (const page of root.pages) {
    if (!Array.isArray(page.branches)) continue;

    for (const branch of page.branches) {
      totalBranches += 1;

      inspectExistingSourceCheck({ page, branch }, tier1Collector);
      inspectSuspiciousFixedStrings({ page, branch }, tier1Collector);
      inspectPossibleTruncation({ page, branch }, tier15Collector);
    }
  }

  const tier1 = sortRecords(tier1Collector.values);
  const tier15All = sortRecords(tier15Collector.values);
  const tier15 = tier15All.slice(0, MAX_TIER_1_5_ITEMS);

  const packet = {
    schemaVersion: 1,
    source: {
      inputPath: INPUT_PATH,
      totalPages: root.pages.length,
      totalBranches,
    },
    policy: {
      suggestedActionOnly: true,
      sourceCheckRequiredBeforePatch: true,
      proposedReplacementAlwaysNull: true,
      excludedBroadPatterns: ["ellipsis_all", "duplicate_character_regex_all"],
      dataMutation: false,
    },
    summary: {
      tier1Count: tier1.length,
      tier15Count: tier15.length,
      tier15TotalBeforeCap: tier15All.length,
      tier15SuppressedCount: Math.max(0, tier15All.length - tier15.length),
      tier1ByKind: countBy(tier1, "kind"),
      tier15ByKind: countBy(tier15, "kind"),
    },
    tier1,
    tier1_5: tier15,
  };

  ensureDir(OUTPUT_DIR);

  fs.writeFileSync(PACKET_PATH, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  fs.writeFileSync(SUMMARY_PATH, buildMarkdownSummary(packet), "utf8");

  console.log(`Wrote ${PACKET_PATH}`);
  console.log(`Wrote ${SUMMARY_PATH}`);
  console.log(`Tier 1 candidates: ${packet.summary.tier1Count}`);
  console.log(
    `Tier 1.5 candidates: ${packet.summary.tier15Count} / ${packet.summary.tier15TotalBeforeCap}`
  );
}

main();
