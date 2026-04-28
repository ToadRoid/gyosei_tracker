# review-syllabus-tab handoff

## Task

gyosei_tracker の `/review` 画面に「弱点順 / 教材順」タブを追加した。

目的は、従来の弱点順ビューだけでは確認できなかった「教材順・章順での回答済み section 確認」を可能にすること。

## Background

従来の `/review` は弱点順ビューのみで、以下の問題があった。

- `attempts >= 3` の section しか表示されない
- 1〜2問だけ解いた section が落ちる
- 正答率昇順のため、問題を解いた後に対象章・sectionを探しにくい
- 教材順 / 章順で回答結果を確認するビューがない

## Implemented

PR #104 で以下を実装した。

- `/review` に「弱点順 / 教材順」タブを追加
- 既存の弱点順ロジック `review-pack-builder.ts` は未変更
- 新規 `src/lib/review-syllabus-builder.ts` を追加
- 教材順タブでは attempts が1件以上ある section を表示
- `candidateProblemIds` は `Set` で重複排除
- 復習開始は既存B実装の `candidateProblemIds + sessionStorage token` 方式を流用
- `sectionTitle` / `displaySectionTitle` は URL に渡していない

## Files changed

- `src/app/review/page.tsx`
- `src/lib/review-syllabus-builder.ts`

## Not changed / Out of scope

以下は変更していない。

- `review-pack-builder.ts`
- `data`
- `public/data`
- `DATA_VERSION`
- `sectionNormalization`
- `EXACT_MAPPING`
- OCR / text anomaly lane

## Verification

- `npm run build` passed
- `git diff --check` passed
- Claude Sonnet lightweight review: no blockers
- commit対象は `page.tsx` と `review-syllabus-builder.ts` の2ファイルのみ

## PR / merge

- PR #103: MERGED
  - 復習画面 母集団 / 並び順 / 用途 再定義 audit
- PR #104: MERGED
  - `feat: add syllabus-order review tab`
- PR #104 merge commit:
  - `e8a7a97`
- `origin/main`:
  - `e8a7a97`

## Known note

`master.ts` に section-level order が確認できなかったため、教材順タブの section 内順序は以下で安定ソートしている。

1. subject order
2. chapter order
3. `sectionTitle.localeCompare('ja')`

厳密な教材掲載順が必要な場合は、別タスクとして section order の source を確認する。

## Local residuals

ローカルには未追跡の `data/...` や `scripts/audit_reviewed_import.py` が残っているが、PR #104 には含まれていない。

今回のタスクでは触らない。

## Current status

このタスクは main 反映まで完了。

次にやるなら、実機で `/review` を開き、以下を確認する。

- 弱点順タブが従来通り表示される
- 教材順タブが表示される
- attempts 1件以上の section が教材順タブに出る
- 教材順タブから「このセクションを演習で復習」が動く
- sessionStorage token 経由で `/exercise/session` に遷移する
