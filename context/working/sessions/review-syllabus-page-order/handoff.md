# review-syllabus-page-order handoff

## Task

/review 教材順タブの section 並びを、参考書掲載順に近づけるため page reference ベースに改善した。

## Completed

- PR #107 merged
  - merge commit: 62702b92024c642cff0da33a6313761d057b87ec
  - 内容: section-level order source 調査記録
- PR #108 merged
  - merge commit: 514f8bf15f6cdfd55fdfc0dcd98ae6581b9faaef
  - 内容: /review 教材順タブの section sort を page metadata ベースに改善

## Final Implementation

対象ファイル:

- src/lib/review-syllabus-builder.ts

並び順:

1. subject order
2. chapter order
3. min(sourcePageQuestion)
4. min(sourcePage)
5. problemId q-number fallback
6. sectionTitle.localeCompare('ja')

## Verified

- npm run build passed
- git diff --check passed
- Claude Sonnet lightweight review approved PR #108 with no blockers
- PR #108 merged to main
- origin/main latest confirmed: 514f8bf

## Not Touched

- src/app/exercise/page.tsx
- src/lib/review-pack-builder.ts
- DATA_VERSION
- OCR/polarity files
- .claude/worktrees/
- data/... residual
- scripts/audit_reviewed_import.py

## Important Clarification

今回の変更対象は /review の教材順タブのみ。
通常の教材一覧 / 演習画面側は対象外であり、表示変化がないのは正常。

## Future Candidate

将来改善候補として、大分類 / 中分類フィルターを追加したい。

例:

- 憲法
  - 人権
  - 統治
- 行政法
- 民法
  - 総則
  - 物権
  - 債権
  - 親族・相続

目的:
section 単位の細かい一覧だけでなく、学習上の大きなまとまりで絞り込めるようにする。

対象候補:

- /review 教材順タブ
- /review 弱点順タブ
- /exercise 通常教材一覧

推奨:
最初は /review 教材順タブだけで検証する。
既存 master.ts の subject/chapter で足りるか確認し、不足する場合は UI 用分類マスタを新設する。

## Stop Point

このタスクは完了。
次に gyosei_tracker を触る場合は、origin/main = 514f8bf 起点で新規ブランチを切る。
