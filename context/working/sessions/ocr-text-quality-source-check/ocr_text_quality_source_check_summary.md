# P1 OCR text-quality source-check queue summary

## Scope

- Source: `data/reviewed_import.json`
- Base SHA: `69a5014`
- Purpose: source-check candidates only (report-only)
- Data mutation: **none**
- proposedReplacement: always **null**
- answerBoolean / polarity: **not changed**

## Counts

- Total pages: 446
- Total branches: 2448
- **C-HIGH candidates**: 6
- **TIER1 candidates**: 64
- **TIER1_5 candidates**: 17 (cap: 80, suppressed: 0)
- **B_RECHECK (separate)**: 12
- **SECTION_QUALITY (separate)**: 88
- **Total**: 188

## By queue

- section_title_quality: 88
- ocr_text_quality: 85
- import_completeness: 1
- polarity_recheck: 12
- qe_contradiction: 2

## By ruleId

- empty_section_title: 71
- legal_term_obvious_corruption: 12
- unnatural_duplicate_kana_or_word: 16
- missing_problem_item: 1
- section_title_subtopic_policy: 4
- possible_truncated_text: 1
- raw_broad_or_unknown: 13
- polarity_recheck_backlog_seed: 12
- known_suspicious_ocr_string: 39
- empty_explanation: 3
- severe_ocr_garbage_known_terms: 9
- negative_particle_drop_candidate: 2
- format_written_answer_converted_to_bool: 2
- qe_internal_contradiction: 2
- explanation_copied_from_question_conflict: 1

## Notes

- `...` / `…` broad extraction: intentionally disabled.
- Duplicate-kana regex: targeted patterns only (not broad).
- `<省略>` / book-verbatim `…`: excluded from truncation check.
- `ocr_text_quality_backlog.md` items used as seed/hint only, not as patch authority.
- All candidates: `suggestedAction: source_check`.
- All candidates: `proposedReplacement: null`.
- Polarity / answerBoolean: **never changed**.

