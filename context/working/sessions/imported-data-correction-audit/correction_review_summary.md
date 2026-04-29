# imported-data-correction-audit summary

## Scope

- Source: `data/reviewed_import.json`
- Purpose: source check candidates only
- Data mutation: none
- Proposed replacement values: none

## Counts

- total pages: 446
- total branches: 2448
- Tier 1 candidates: 8
- Tier 1.5 candidates: 2
- Tier 1.5 suppressed by cap: 0

## Tier 1 by kind

- known_suspicious_ocr_string: 7
- existing_source_check_flag: 1

## Tier 1.5 by kind

- possible_truncated_text: 2

## Notes

- `...` / `…` broad extraction is intentionally excluded.
- Duplicate-character regex extraction is intentionally excluded.
- Polarity and answerBoolean are not automatically changed.
- All candidates use `suggestedAction: source_check`.
- `proposedReplacement` is always `null`.
