# Imported Data Correction Known Issues

<!-- Source: docs/review-notes branch findings, confirmed 2026-04-30 against origin/main data -->

## p021: missing upper-section item for 行政法の一般原則

- Status: unresolved
- Confirmed: 2026-04-30 (original note: 2026-04-18, `docs/review-notes`)
- Page/problem: `KB2025-p021-q01`

### Current data state

- seqNo 1–4 exist, all with `sectionTitle: '行政上の法律関係'`
- seqNo 5 / 6 do not exist
- `行政法の一般原則` does not appear as any `sectionTitle` in p021
- All current `raw` values are `?`

### Finding

p021 upper area appears to contain an unimported `行政法の一般原則` item (seq 6 or similar).
Text restoration has not been performed.

### Required future action

- Confirm against source image / original material.
- Decide whether to add the missing item.
- If adding, handle in a separate data-correction PR.

---

## p022: sectionTitle values are subtopic labels, not original section name

- Status: unresolved
- Confirmed: 2026-04-30 (original note: 2026-04-18, `docs/review-notes`)
- Page/problem: `KB2025-p022-q01`

### Current data state

| seqNo | sectionTitle (current) |
|---|---|
| 1 | `行政法の一般的な法律論` |
| 2 | `公営住宅` |
| 3 | `食品衛生法` |
| 4 | `通行権` |
| 5 | `土地所有権` |

### Finding

`sectionTitle` for seq 2–5 are item-level subtopic labels, not the broader section name.
The original section for p022 appears to be `行政上の法律関係`, which diverges from the current values.
No direct exercise impact confirmed.

### Required future action

- Treat as a policy / data-design issue.
- Do not change item titles ad hoc.
- Decide `sectionTitle` normalization policy separately before applying any fix.
