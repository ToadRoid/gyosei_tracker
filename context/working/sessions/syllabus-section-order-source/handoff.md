# syllabus-section-order-source handoff

## Task

PR #104 で追加した `/review` の「教材順」タブについて、repo 内に厳密な section-level 掲載順ソースがあるかを調査した。

## 確認したファイル

- `src/lib/review-syllabus-builder.ts`
- `src/lib/review-pack-builder.ts`
- `src/app/review/page.tsx`
- `src/data/master.ts`
- `src/data/sectionNormalization.ts`
- `src/app/exercise/page.tsx`
- `src/types/index.ts`
- `src/types/review-pack.ts`
- `context/working/sessions/review-syllabus-tab/handoff.md`
- `context/working/review_page_purpose_and_coverage_audit.md`
- `context/working/classification_number_audit.md`
- `docs/section-title-policy.md`
- `docs/override_rule_design.md`
- tracked な `json` / `csv` / `md` / `ts` / `tsx`（`git ls-files` 経由で検索）

注: 指示にあった `src/lib/master.ts` は存在しなかった。現在の master は `src/data/master.ts`。

## 実行した主な確認

- `git status -sb`
- `git rev-parse --short origin/main`
- `git switch -c docs/syllabus-section-order-source origin/main`
- `git ls-files > /tmp/gyosei_tracked_files.txt`
- `xargs rg -n "sectionTitle|displaySectionTitle|sectionId|chapterId|subjectId|subjectOrder|chapterOrder|order|sort|syllabus|教材|掲載順|章順|科目順" < /tmp/gyosei_tracked_files.txt`
- `rg -n "master|subjects|chapters|sections|review|weak|attempts|candidateProblemIds" src`
- `xargs rg -n "sectionId|sectionOrder|sortOrder|sectionIndex|displayOrder" < /tmp/gyosei_tracked_files.txt`
- `jq` で `data/reviewed_import.json` の top-level / page / branch keys を確認

## section order source の有無

confirmed: runtime が参照する厳密な section-level order source は見つからなかった。

- `src/data/master.ts` は `subjects[].order` と `chapters[].order` だけを持つ。section 配列、`sectionId`、`sectionOrder` はない。
- `src/types/index.ts` の `Subject` / `Chapter` は `order` を持つが、`ProblemAttr` の section は `sectionTitle?: string` / `displaySectionTitle?: string` のみ。
- `data/reviewed_import.json` の branch keys は `sectionTitle`, `sourcePageQuestion`, `sourcePageAnswer`, `seqNo` 等で、`sectionId` / `sectionOrder` / `sortOrder` / `sectionIndex` / `displayOrder` は 0 件。
- `src/data/sectionNormalization.ts` は raw `sectionTitle` から UI 用 `displaySectionTitle` への正規化表。順序表ではない。
- `docs/section-title-policy.md` も `sectionTitle` は原本見出し、`displaySectionTitle` は UI 表示用と定義しており、掲載順 source とはしていない。

inferred: `sourcePageQuestion` / `sourcePageAnswer` / `sourcePage` / `problemId` から section の初出ページ順を推定することはできる。ただしこれは「明示的な section-level 掲載順ソース」ではなく、同一 section の揺れ、空 sectionTitle、display 正規化、ページまたぎを含むため厳密ソースとは扱えない。

unverified candidate: `data/classification_dict.json` には subject_middle 配下の section 名配列がある。ただし現在の runtime では参照されておらず、`src/data/master.ts` の `subjectId/chapterId` と 1:1 対応する ID / order 定義でもない。PR #104 の教材順タブの正本として使えることは確認できない。

## 現行実装の妥当性

confirmed: 現行 `/review` 教材順タブは `src/lib/review-syllabus-builder.ts` で以下の順に sort している。

1. `subjectOrderMap`（`src/data/master.ts` の `subjects[].order`）
2. `chapterOrderMap`（`src/data/master.ts` の `chapters[].order`）
3. `sectionTitle.localeCompare(..., 'ja')`

confirmed: `src/app/exercise/page.tsx` も subject / chapter は master order、section は `localeCompare('ja-JP')` で安定ソートしている。

判定: subject-level / chapter-level では妥当。section-level は repo 内に厳密順序ソースがないため、`localeCompare` は「安定した暫定順」として妥当。ただし「教材の掲載順そのもの」とは断定できない。

## 変更が必要か

confirmed: 今回の調査範囲では実装変更は不要。

inferred: ユーザー体験として「教材順 = 科目順・章順で探せる」ことが主目的なら、現行実装は十分に機能する。厳密に「章内 section の掲載順」まで一致させたい場合は、別タスクで order source を新設する必要がある。

## 次アクション

1. strict section order が必要かを user 判断する。
2. 必要な場合は、`sectionOrder` の source of truth を設計する。候補は以下。
   - `src/data/master.ts` に chapter 配下の section 定義を追加
   - `src/data/sectionNormalization.ts` の display label 体系から order を派生できる chapter だけ段階対応
   - `data/reviewed_import.json` の初出ページ順から生成する read-only audit を作り、人手確認後に static mapping 化
3. strict source を作る場合も、raw `sectionTitle` は変更しない。`displaySectionTitle` / section mapping 層で扱う。

## 触っていないファイル

- `data/reviewed_import.json`（read only）
- `public/data/reviewed_import.json`
- `DATA_VERSION`
- 未追跡 `data/...`
- 未追跡 `scripts/audit_reviewed_import.py`
- `src/**`（read only）
- `src/data/master.ts`（read only）
- `src/data/sectionNormalization.ts`（read only）
- OCR 補正 / polarity 判断関連

## git status

作業ブランチ:

```text
docs/syllabus-section-order-source...origin/main
```

作成ファイル:

```text
?? context/working/sessions/syllabus-section-order-source/
```

既存の local residuals:

```text
?? .claude/worktrees/
?? data/import_optimizer_20260406_234717.json
?? data/import_optimizer_20260406_234814.json
?? data/import_optimizer_20260406_234843.json
?? data/import_optimizer_20260406_235006.json
?? data/import_optimizer_20260406_235010.json
?? data/import_optimizer_20260407_000200.json
?? data/ocr_scan_20260408.json
?? data/parsed_gemini_20260414142712..json
?? data/parsed_gemini_20260414144240..json
?? data/parsed_gemini_20260414144255..json
?? data/parsed_gemini_20260414_235106.json
?? data/parsed_gemini_20260414_235811.json
?? data/parsed_gemini_20260415_001341.json
?? data/parsed_gemini_20260415_001404.json
?? data/parsed_gemini_20260415_001432.json
?? data/parsed_gemini_20260415_001452.json
?? data/parsed_gemini_20260415_001635.json
?? data/parsed_gemini_20260415_001817.json
?? data/parsed_gemini_20260415_004711.json
?? data/parsed_gemini_20260415_004748.json
?? data/parsed_gemini_20260415_004837.json
?? data/parsed_gemini_20260415_005024.json
?? data/parsed_gemini_20260415_005206.json
?? data/parsed_gemini_20260415_005307.json
?? data/parsed_gemini_20260418_115903.json
?? data/parsed_gemini_20260418_115920.json
?? data/parsed_gemini_20260418_115939.json
?? data/parsed_gemini_20260418_115951.json
?? data/parsed_gemini_20260418_115958.json
?? data/parsed_gemini_20260418_120003.json
?? data/parsed_gemini_20260418_120009.json
?? data/parsed_gemini_20260418_120027.json
?? data/parsed_gemini_20260418_120037.json
?? data/parsed_gemini_20260418_120046.json
?? data/parsed_gemini_20260418_120051.json
?? data/parsed_gemini_20260418_120107.json
?? data/parsed_gemini_20260418_120119.json
?? data/parsed_gemini_20260418_120135.json
?? data/parsed_gemini_20260418_120144.json
?? data/parsed_gemini_20260423_231448.json
?? data/parsed_gemini_20260423_231557.json
?? data/parsed_gemini_20260423_231632.json
?? data/parsed_gemini_20260423_231649.json
?? data/parsed_gemini_20260423_231706.json
?? data/parsed_gemini_20260423_231721.json
?? data/parsed_gemini_20260423_234531.json
?? data/parsed_gemini_20260423_234746.json
?? data/parsed_gemini_20260423_234811.json
?? data/parsed_gemini_20260423_234820.json
?? data/parsed_gemini_20260423_234828.json
?? data/qa_draft_20260405141252._openai.csv
?? data/qa_draft_20260405141252._openai.json
?? data/qa_draft_20260405141548._openai.csv
?? data/qa_draft_20260405141548._openai.json
?? data/qa_draft_20260405152019._openai.csv
?? data/qa_draft_20260405152019._openai.json
?? data/section_collapse_analysis.json
?? scripts/audit_reviewed_import.py
```
