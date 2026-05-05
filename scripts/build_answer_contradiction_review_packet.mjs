#!/usr/bin/env node
/**
 * Detect answerBoolean / explanationText contradictions in reviewed_import.json.
 * Read-only: produces a review packet, never mutates data.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const INPUT = resolve(ROOT, 'data/reviewed_import.json');
const OUTPUT_DIR = resolve(ROOT, 'context/working/sessions/answer-contradiction-audit');
const OUTPUT_PACKET = resolve(OUTPUT_DIR, 'answer_contradiction_review_packet.json');

// ─── High-precision phrase patterns ───────────────────────────────────────────

// Explicit verdict phrases (highest confidence)
const EXPLICIT_TRUE_PHRASES = [
  '本肢は正しい',
  '本肢は妥当である',
  'よって本肢は正しい',
  'よって正しい',
  '本肢は正当である',
  '本問は正しい',
];

const EXPLICIT_FALSE_PHRASES = [
  '本肢は誤り',
  '本肢は誤っている',
  'よって本肢は誤り',
  'よって誤り',
  'よって本肢は誤っている',
  '本肢は妥当でない',
  '本肢は妥当ではない',
  '本問は誤り',
  '本問は誤っている',
];

// Affirmative conclusion patterns (medium confidence)
// Require sentence-ending (。or end) to confirm this is a conclusion, not mid-sentence.
const AFFIRM_PATTERNS = [
  /(?:したがって|よって、|ゆえに|以上より).{0,30}(?:正しい|妥当である|適法である|有効である|認められる|保護される)(?:。|$)/,
  /本肢(?:は|の記述は).{0,10}(?:正しい|妥当|適法|正当)(?:。|$)/,
];

// Denial conclusion patterns (medium confidence)
const DENY_PATTERNS = [
  /(?:したがって|よって、|ゆえに|以上より).{0,30}(?:誤り|誤っている|できない|あたらない|認められない|許されない)(?:。|$)/,
  /本肢(?:は|の記述は).{0,10}(?:誤り|誤っている|不当|妥当でない|妥当ではない)(?:。|$)/,
];

// Negation context — if these appear near the match, skip (reduces false positives)
const NEGATION_GUARDS = [
  'ではない', 'とはいえない', 'わけではない', 'ことはない',
  'とは限らない', 'に反する', 'という見解もある', 'でない',
];

function hasNegationNearby(text, matchIndex, phrase) {
  const start = Math.max(0, matchIndex - 15);
  const end = Math.min(text.length, matchIndex + phrase.length + 15);
  const context = text.slice(start, end);
  return NEGATION_GUARDS.some(neg => context.includes(neg));
}

function getContextSnippet(text, matchIndex, phraseLen) {
  const start = Math.max(0, matchIndex - 30);
  const end = Math.min(text.length, matchIndex + phraseLen + 30);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

function detectContradictions(pages) {
  const candidates = [];
  let candidateSeq = 0;

  for (const page of pages) {
    for (const branch of page.branches) {
      const exp = branch.explanationText || '';
      if (!exp || exp.length < 10) continue;

      const ans = branch.answerBoolean;

      // Category 3: explicit_phrase_conflict (highest precision)
      if (ans === false) {
        for (const phrase of EXPLICIT_TRUE_PHRASES) {
          const idx = exp.indexOf(phrase);
          if (idx !== -1 && !hasNegationNearby(exp, idx, phrase)) {
            candidateSeq++;
            candidates.push({
              candidateId: `AC-${String(candidateSeq).padStart(4, '0')}`,
              kind: 'explicit_phrase_conflict',
              severity: 'high',
              sourcePage: page.sourcePage,
              originalProblemId: page.originalProblemId,
              seqNo: branch.seqNo,
              answerBoolean: ans,
              field: 'explanationText',
              matchedPhrase: phrase,
              contextSnippet: getContextSnippet(exp, idx, phrase.length),
              reason: `explanationText explicitly states "${phrase}" while answerBoolean is false.`,
              suggestedAction: 'human_review',
              proposedAnswerBoolean: null,
              proposedReplacement: null,
            });
            break;
          }
        }
      }

      if (ans === true) {
        for (const phrase of EXPLICIT_FALSE_PHRASES) {
          const idx = exp.indexOf(phrase);
          if (idx !== -1 && !hasNegationNearby(exp, idx, phrase)) {
            candidateSeq++;
            candidates.push({
              candidateId: `AC-${String(candidateSeq).padStart(4, '0')}`,
              kind: 'explicit_phrase_conflict',
              severity: 'high',
              sourcePage: page.sourcePage,
              originalProblemId: page.originalProblemId,
              seqNo: branch.seqNo,
              answerBoolean: ans,
              field: 'explanationText',
              matchedPhrase: phrase,
              contextSnippet: getContextSnippet(exp, idx, phrase.length),
              reason: `explanationText explicitly states "${phrase}" while answerBoolean is true.`,
              suggestedAction: 'human_review',
              proposedAnswerBoolean: null,
              proposedReplacement: null,
            });
            break;
          }
        }
      }

      // Skip if already caught by explicit check
      if (candidates.length > 0 && candidates[candidates.length - 1].sourcePage === page.sourcePage && candidates[candidates.length - 1].seqNo === branch.seqNo) {
        continue;
      }

      // Category 1: explanation_affirms_but_answer_false
      if (ans === false) {
        for (const pattern of AFFIRM_PATTERNS) {
          const match = exp.match(pattern);
          if (match && !hasNegationNearby(exp, match.index, match[0])) {
            candidateSeq++;
            candidates.push({
              candidateId: `AC-${String(candidateSeq).padStart(4, '0')}`,
              kind: 'explanation_affirms_but_answer_false',
              severity: 'medium',
              sourcePage: page.sourcePage,
              originalProblemId: page.originalProblemId,
              seqNo: branch.seqNo,
              answerBoolean: ans,
              field: 'explanationText',
              matchedPhrase: match[0],
              contextSnippet: getContextSnippet(exp, match.index, match[0].length),
              reason: `explanationText concludes affirmatively ("${match[0]}") while answerBoolean is false.`,
              suggestedAction: 'source_check',
              proposedAnswerBoolean: null,
              proposedReplacement: null,
            });
            break;
          }
        }
      }

      // Category 2: explanation_denies_but_answer_true
      if (ans === true) {
        for (const pattern of DENY_PATTERNS) {
          const match = exp.match(pattern);
          if (match && !hasNegationNearby(exp, match.index, match[0])) {
            candidateSeq++;
            candidates.push({
              candidateId: `AC-${String(candidateSeq).padStart(4, '0')}`,
              kind: 'explanation_denies_but_answer_true',
              severity: 'medium',
              sourcePage: page.sourcePage,
              originalProblemId: page.originalProblemId,
              seqNo: branch.seqNo,
              answerBoolean: ans,
              field: 'explanationText',
              matchedPhrase: match[0],
              contextSnippet: getContextSnippet(exp, match.index, match[0].length),
              reason: `explanationText concludes negatively ("${match[0]}") while answerBoolean is true.`,
              suggestedAction: 'source_check',
              proposedAnswerBoolean: null,
              proposedReplacement: null,
            });
            break;
          }
        }
      }
    }
  }

  return candidates;
}

function buildRegressionGuards(pages) {
  const guards = [
    { sourcePage: '222', seqNo: 1 },
    { sourcePage: '224', seqNo: 1 },
  ];

  return guards.map(g => {
    const page = pages.find(p => p.sourcePage === g.sourcePage);
    if (!page) return { ...g, originalProblemId: null, answerBoolean: null, status: 'page_not_found' };
    const branch = page.branches.find(b => b.seqNo === g.seqNo);
    if (!branch) return { ...g, originalProblemId: page.originalProblemId, answerBoolean: null, status: 'branch_not_found' };
    return {
      sourcePage: g.sourcePage,
      originalProblemId: page.originalProblemId,
      seqNo: g.seqNo,
      answerBoolean: branch.answerBoolean,
      status: branch.answerBoolean === true ? 'ok' : 'regression',
    };
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const data = JSON.parse(readFileSync(INPUT, 'utf8'));
const pages = data.pages;

const candidates = detectContradictions(pages);
const regressionGuards = buildRegressionGuards(pages);

const byKind = {};
const bySeverity = {};
for (const c of candidates) {
  byKind[c.kind] = (byKind[c.kind] || 0) + 1;
  bySeverity[c.severity] = (bySeverity[c.severity] || 0) + 1;
}

let totalBranches = 0;
for (const p of pages) totalBranches += p.branches.length;

const packet = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: {
    inputPath: 'data/reviewed_import.json',
    totalPages: pages.length,
    totalBranches,
  },
  policy: {
    dataMutation: false,
    autoAnswerChange: false,
    proposedAnswerBooleanAlwaysNull: true,
    proposedReplacementAlwaysNull: true,
  },
  summary: {
    candidateCount: candidates.length,
    byKind,
    bySeverity,
  },
  regressionGuards,
  candidates,
};

writeFileSync(OUTPUT_PACKET, JSON.stringify(packet, null, 2) + '\n', 'utf8');

console.log(`Contradiction review packet generated: ${OUTPUT_PACKET}`);
console.log(`  Total pages: ${pages.length}`);
console.log(`  Total branches: ${totalBranches}`);
console.log(`  Candidates: ${candidates.length}`);
console.log(`  By kind:`, byKind);
console.log(`  By severity:`, bySeverity);
console.log(`  Regression guards:`, regressionGuards.map(g => `p${g.sourcePage}-q${String(g.seqNo).padStart(2,'0')}: ${g.status}`).join(', '));
