# GPT review request — imported-data-correction-audit

## Task

`data/reviewed_import.json` の投入済みデータ修正候補を source check 用 packet として抽出した。
実データ修正は行っていない。

## Required GPT Review

確認してほしい点:

1. `data/reviewed_import.json` が変更されていないか
2. script が修正値を推定していないか
3. `suggestedAction` が `source_check` のみに限定されているか
4. `proposedReplacement` が常に `null` か
5. Tier 1 の抽出条件が高精度候補に限定されているか
6. Tier 1.5 が Tier 1 と混ざっていないか
7. `...` / `…` 全件抽出、重複文字 regex 全件抽出、polarity 自動変更が入っていないか
8. 次工程が source確認であり、patch ではないことが明確か
9. `<省略>` 終わりの意図的省略表記が Tier 1.5 から除外されているか
10. `違憲および` の reason が推定修正表現を含まない文言になっているか

## Commit

- SHA: 98892ae
- message: chore: add imported data correction audit packet
- branch: chore/imported-data-correction-audit
- base: origin/main 3bc517f
- state: branch is ahead 1 of origin/main
- push: not executed
- PR: not created
- merge: not executed

## Evidence

### Committed files (5 files only)

- `scripts/build_correction_review_packet.mjs` (new)
- `context/working/sessions/imported-data-correction-audit/correction_review_packet.json` (new)
- `context/working/sessions/imported-data-correction-audit/correction_review_summary.md` (new)
- `context/working/sessions/imported-data-correction-audit/handoff.md` (new)
- `context/working/sessions/imported-data-correction-audit/review_request.md` (new)

### Unchanged files (confirmed)

- `data/reviewed_import.json` — unchanged
- `public/data/reviewed_import.json` — unchanged
- all other tracked files — unchanged
- existing untracked `data/` JSON group — untouched
- `.claude/worktrees/` — untouched
- `gyosei_tracker-cursor-trial/` — untouched
- `scripts/audit_reviewed_import.py` — untouched

### Script run result

```
node scripts/build_correction_review_packet.mjs
Wrote context/working/sessions/imported-data-correction-audit/correction_review_packet.json
Wrote context/working/sessions/imported-data-correction-audit/correction_review_summary.md
Tier 1 candidates: 8
Tier 1.5 candidates: 2 / 2
```

### Packet summary

```
total pages: 446
total branches: 2448
Tier 1 candidates: 8
  - known_suspicious_ocr_string: 7
  - existing_source_check_flag: 1
Tier 1.5 candidates: 2
  - possible_truncated_text: 2
Tier 1.5 suppressed by cap: 0
```

### git diff -- data/reviewed_import.json result

```
(空 = 変更なし)
```

### git diff --check result

```
(空 = 問題なし)
```

### JSON parse result

```
packet json ok
```

### git status -sb --untracked-files=no (commit 後)

```
## chore/imported-data-correction-audit...origin/main [ahead 1]
tracked dirty: 0 / staged: 0
untracked files: existing unrelated untracked files remain, but were not touched
```

## Do Not Assume

- Tier 1 candidate は修正確定ではない
- OCR破損候補の正しい原文を推定しない
- answerBoolean / polarity はこのタスクで変更しない
- packet 生成は patch approval ではない

---

## GPT review request: Tier 1 source-check / patch boundary（2026-04-29追記）

### Task

Tier 1 source-check 結果が patch planning に進める状態かどうかをレビューする。patch 実行の review ではない。

### Confirmed by Claude

- p001 / p002 / p003 / p085 は HIGH-confidence text correction candidates。
- p318 は本文修正不要 confirmed。text correction と混在させないこと。
- p001 seqNo 3 incidental finding は記録済みだが current patch scope 外。
- `source_check_tier1_log.md` に Tier 1 source-check 結果を記録済み。

### Required GPT review

1. p318 が text correction として誤って扱われていないか確認。
2. p001 seqNo 3 incidental finding が scope 外のままであることを確認。
3. next task が p085 questionText patch boundary 確認であることを確認。
4. patch 実行はまだ承認されていないことを確認。
5. 将来の patch target は actual JSON record の identifiers（sourcePage / seqNo / field）で特定されるべきことを確認。

### Do Not Assume

- `reviewed_import.json` が編集されたと仮定しない。
- `public/data/` が編集されたと仮定しない。
- p085 boundary 確認前に correction values を apply 可能と仮定しない。
- commit / push / PR 承認が出ていると仮定しない。

---

## GPT review request: patch_plan_tier1_source_confirmed.md（2026-04-29追記）

### Task

`patch_plan_tier1_source_confirmed.md` の内容が patch 実行に進んで良い状態かをレビューする。patch 実行の承認ではない。

### Confirmed by Claude

- p001 / p002 / p003 / p085 を patch candidate として plan に記載（plan only、patch 未実行）。
- p085 questionText: full-field before/after candidate を記載。`弁明または聴聞の` は書籍 confirmed、proposed after に含めている。
- p085 explanationText: `主客管` → `主宰者` のみ partial correction candidate として記載（broader restoration は未確認）。
- p318 は text correction から除外（本文修正不要 confirmed）。
- p001 seqNo 3 incidental finding は scope 外として除外。
- questionText 末尾句点 convention: 2448 件中 99.8% が `。` あり、p085 の `。` 追加は convention に沿う。

### Required GPT review

1. p085 questionText の proposed full-field after value は正しいか。
2. p085 questionText patch で末尾句点 `。` を含めるべきか。
3. p001 / p002 / p003 / p085 が text correction patch candidates として適切か（他に漏れ・過剰はないか）。
4. p318 が text correction から正しく除外されているか。
5. p001 seqNo 3 incidental finding が scope 外として正しく除外されているか。
6. patch 実行はまだ承認されていないことを確認。

### Do Not Assume

- `reviewed_import.json` が編集されたと仮定しない。
- `public/data/` が編集されたと仮定しない。
- patch 実行の承認が出ていると仮定しない。
- commit / push / PR 承認が出ていると仮定しない。

---

## GPT review request: patch_plan_tier1_source_confirmed.md 更新版（2026-04-29追記）

### Task

`patch_plan_tier1_source_confirmed.md` の p085 explanationText セクションが full-field replacement に更新された。更新後の plan 全体が patch 実行に進んで良い状態かをレビューする。patch 実行の承認ではない。

### Changes since previous GPT review request

- p085 explanationText: partial correction (`主客管`→`主宰者` のみ) から **full-field replacement** に変更。
  - source-confirmed full text: `弁明手続の場合には、行政手続法24条1項は準用されていないから（行政手続法31条）、主宰者に聴聞調書の作成を義務づけた聴聞手続の場合とは異なり（24条1項）、調書の作成義務はない。`
  - 全差分 source_confirmed（images_preprocessed/0085.png 右ページ thumbnail + crop 視認済み）
- p001 source evidence: `book item 4 左列` → `book item 5 左列` に訂正（seqNo 4 = book item 5 と一致）。

### Confirmed by Claude

- p085 explanationText の全差分は source_confirmed（推測なし）。
- p085 explanationText full-field replacement は書籍 verbatim に基づく。
- 他の candidates (p001 / p002 / p003 / p085 questionText) に変更なし。
- p318 は text correction から除外のまま。
- p001 seqNo 3 incidental finding は scope 外のまま。
- `data/reviewed_import.json` 未変更。
- `public/data/` 未変更。
- patch / stage / commit / push / PR / merge は未実行。

### Required GPT review

1. p085 explanationText の proposed full-field after value は書籍原文と一致しているか。
2. p085 explanationText を full-field replacement とすることは適切か。
3. p001 / p002 / p003 / p085 全 candidates を含めて patch 実行に進んで良い状態か（他に漏れ・過剰はないか）。
4. patch 実行はまだ承認されていないことを確認。

### Do Not Assume

- `reviewed_import.json` が編集されたと仮定しない。
- `public/data/` が編集されたと仮定しない。
- patch 実行の承認が出ていると仮定しない。
- commit / push / PR 承認が出ていると仮定しない。

---

## GPT review request: Tier 1 source-confirmed data patch final commit set（2026-04-30追記）

### Task

Review whether the Tier 1 source-confirmed data patch is ready to commit.

### Changed files expected

Exactly these 5 files should be included in the next commit:

1. `data/reviewed_import.json`
2. `context/working/sessions/imported-data-correction-audit/source_check_tier1_log.md`
3. `context/working/sessions/imported-data-correction-audit/patch_plan_tier1_source_confirmed.md`
4. `context/working/sessions/imported-data-correction-audit/handoff.md`
5. `context/working/sessions/imported-data-correction-audit/review_request.md`

### Data patch expected

`data/reviewed_import.json` should contain exactly 5 field corrections:

1. p001 seqNo 4 explanationText
2. p002 seqNo 4 explanationText
3. p003 seqNo 7 explanationText
4. p085 seqNo 5 questionText
5. p085 seqNo 5 explanationText

### Required GPT review

1. Confirm the data diff is limited to the 5 intended field changes.
2. Confirm p318 remains unchanged.
3. Confirm p001 seqNo 3 incidental finding remains unchanged.
4. Confirm `public/data/reviewed_import.json` remains unchanged.
5. Confirm source_check and patch_plan docs support the applied data patch.
6. Confirm commit can include exactly the 5 expected files.
7. Confirm stage / commit / push / PR / merge are still not executed before user approval.

### Do not assume

- Do not assume public/data was updated.
- Do not assume p318 flag clear was performed.
- Do not assume p001 seqNo 3 incidental finding was fixed.
- Do not assume commit/push/PR authorization.
