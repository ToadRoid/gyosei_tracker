# P1 OCR text-quality source-check queue — review request

## For GPT reviewer

### What to review

1. `scripts/build_ocr_text_quality_source_check_queue.mjs` — the queue builder script
2. `ocr_text_quality_source_check_packet.json` — generated output
3. `ocr_text_quality_source_check_summary.md` — generated summary

### Key questions

- Are the detection heuristics reasonable and not over-/under-triggering?
- Is the queue separation (ocr_text_quality / qe_contradiction / polarity_recheck / section_title_quality) correct?
- Are any `proposedReplacement` values non-null? (Should be 0)
- Are any `answerBooleanChange` / `polarityChange` values non-null? (Should be 0)
- Does the script read `data/reviewed_import.json` without modification?
- Is the packet JSON valid?

### Expected counts (from latest run)

| Queue | Count |
|---|---|
| ocr_text_quality | 85 |
| section_title_quality | 84 |
| qe_contradiction | 2 |
| **Total** | **171** |

| Tier | Count |
|---|---|
| C_HIGH | 6 |
| TIER1 | 64 |
| TIER1_5 | 17 |
| SECTION_QUALITY | 84 |

### Safety checks

- `data/reviewed_import.json`: NOT modified
- `public/data/reviewed_import.json`: NOT modified
- No import execution
- No DATA_VERSION bump
- No polarity / answerBoolean changes
