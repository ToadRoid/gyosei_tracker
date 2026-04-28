# review-syllabus-coarse-filter handoff

## Task

/review syllabus-order coarse category filter.

## Completed

- PR: #110
- Merge commit: 8a219ef18a300a6bc7fb503a709a4f6e6d7de11f
- origin/main: 8a219ef

## Final Scope

Added coarse filters to /review syllabus-order tab only.

Changed files:

- src/app/review/page.tsx
- src/lib/review-syllabus-builder.ts
- src/types/review-pack.ts

## Filter Options

- すべて
- 憲法
- 憲法・人権
- 憲法・統治
- 行政法
- 民法・総則
- 民法・物権
- 民法・債権
- 民法・親族・相続

## Confirmed Not Changed

- /exercise
- weak-order behavior
- src/lib/review-pack-builder.ts
- DATA_VERSION
- OCR / polarity files
- candidateProblemIds
- URL params
- sessionStorage payload

## Verification

- git diff --check passed
- npm run build passed
- PR reviewed safe to merge

## Local Residuals

Left untouched:

- .claude/worktrees/
- data/...
- scripts/audit_reviewed_import.py

## Close Status

- implementation complete
- PR merged
- remote branch deleted
- no further action required unless user wants filters expanded to weak-order or /exercise
