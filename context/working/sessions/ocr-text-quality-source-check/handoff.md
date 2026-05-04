# P1 OCR text-quality source-check queue — handoff

## Task

Report-only OCR text-quality source-check queue builder.
Detects OCR corruption candidates in `data/reviewed_import.json` and outputs a structured packet for human source-check triage.

## Status

- Script implemented: `scripts/build_ocr_text_quality_source_check_queue.mjs`
- Packet generated: `ocr_text_quality_source_check_packet.json`
- Summary generated: `ocr_text_quality_source_check_summary.md`

## What this does NOT do

- Does NOT modify `data/reviewed_import.json` or `public/data/reviewed_import.json`
- Does NOT generate `proposedReplacement` values
- Does NOT change `answerBoolean` or polarity
- Does NOT run import or bump DATA_VERSION
- Does NOT perform source image verification

## Policy

- `suggestedAction`: `source_check` only
- `proposedReplacement`: always `null`
- `answerBooleanChange` / `polarityChange`: always `null`
- Separate queues: `ocr_text_quality`, `qe_contradiction`, `polarity_recheck`, `section_title_quality`
- `<省略>` / `...` / `…` broad extraction: disabled
- Broad duplicate-kana regex: disabled (targeted patterns only)

## Next steps

1. GPT review of this packet and script
2. Source image verification for C-HIGH and TIER1 candidates (separate task)
3. Data patches only after source confirmation (separate PR per patch batch)
