# imported-data-correction-audit handoff

## Task

投入済み `data/reviewed_import.json` の文章・正誤修正候補を、直接修正せずに source check 候補として抽出する。

## Branch

`chore/imported-data-correction-audit`

## Source of truth

- `data/reviewed_import.json`
- `scripts/build_correction_review_packet.mjs`
- `context/working/sessions/imported-data-correction-audit/correction_review_packet.json`
- `context/working/sessions/imported-data-correction-audit/correction_review_summary.md`

## Policy

- Claude は大量本文を自由校正しない
- 修正値を推定しない
- `data/reviewed_import.json` は変更しない
- `suggestedAction` は `source_check` のみ
- `proposedReplacement` は `null`
- 実修正は GPT / ユーザー確認後の別タスク

## Implemented

- Tier 1 correction candidate extraction script を追加
- 既存 `needsSourceCheck/sourceCheckReason` を抽出
- 既知OCR破損疑い固定文字列を抽出（`主客管` / `筆着の準備` を追加、p085 Tier 1 昇格）
- `違憲および` の reason を推定表現を排除した文言に修正
- `<省略>` で終わる意図的省略表記を Tier 1.5 から除外
- Tier 1.5 として文末切れ疑いを最大50件まで抽出（`<省略>` 除外後 2件）
- `...` / `…` 全件抽出は除外
- 重複文字 regex 全件抽出は除外
- polarity / answerBoolean の自動変更は未実施

## Commit

- SHA: 98892ae
- message: chore: add imported data correction audit packet
- branch: chore/imported-data-correction-audit
- base: origin/main 3bc517f
- state: branch is ahead 1 of origin/main
- push: not executed
- PR: not created
- merge: not executed

## Committed files

- `scripts/build_correction_review_packet.mjs`
- `context/working/sessions/imported-data-correction-audit/correction_review_packet.json`
- `context/working/sessions/imported-data-correction-audit/correction_review_summary.md`
- `context/working/sessions/imported-data-correction-audit/handoff.md`
- `context/working/sessions/imported-data-correction-audit/review_request.md`

## Verification (実行結果)

```
node scripts/build_correction_review_packet.mjs  (commit 前・最終実行)
→ Tier 1 candidates: 8
→ Tier 1.5 candidates: 2 / 2 (cap 未達)

git diff --cached --check  (commit 前)
→ passed (空 = 問題なし)

git diff -- data/reviewed_import.json  (commit 前)
→ 空 = 変更なし

JSON.parse check  (commit 前)
→ packet json ok

git status -sb --untracked-files=no  (commit 後)
→ ## chore/imported-data-correction-audit...origin/main [ahead 1]
→ tracked dirty: 0 / staged: 0
→ ※ untracked files は既存の無関係ファイル群が引き続き存在するが、今回のタスクでは一切触っていない
```

## ファイル変更範囲

- **新規作成（今回のタスクのみ）**:
  - `scripts/build_correction_review_packet.mjs`
  - `context/working/sessions/imported-data-correction-audit/correction_review_packet.json`
  - `context/working/sessions/imported-data-correction-audit/correction_review_summary.md`
  - `context/working/sessions/imported-data-correction-audit/handoff.md`
  - `context/working/sessions/imported-data-correction-audit/review_request.md`
- **未変更（tracked）**: `data/reviewed_import.json` およびその他全 tracked files
- **未変更（untracked）**: `data/` 配下の既存 untracked JSON群 / `.claude/worktrees/` / `gyosei_tracker-cursor-trial/` / `scripts/audit_reviewed_import.py`

## Non-actions

- `data/reviewed_import.json`: unchanged
- DATA_VERSION: unchanged
- OCR / polarity / candidateProblemIds: unchanged
- existing untracked `data/`: untouched
- `.claude/worktrees/`: untouched
- `gyosei_tracker-cursor-trial/`: untouched
- `scripts/audit_reviewed_import.py`: untouched
- push: not executed
- PR: not created
- merge: not executed

## Packet summary

| 項目 | 値 |
|---|---|
| 総ページ | 446 |
| 総肢数 | 2448 |
| Tier 1 candidates | 8 |
| Tier 1.5 candidates | 2 |
| Tier 1.5 cap suppressed | 0 |

### Tier 1 内訳

| kind | 件数 |
|---|---|
| known_suspicious_ocr_string | 7 |
| existing_source_check_flag | 1 |

### Tier 1 代表例（修正値は推定しない）

- p001 seq4 explanationText: `違憲および` — 法律文脈上不自然な接続表現、OCR破損の可能性
- p002 seq4 explanationText: `反と戻` — 自然な日本語でない OCR 破損候補
- p003 seq7 explanationText: `フジチヤ事件札孔ート` — 判例名が2パターン（フジチヤ / 札孔ート）でヒット
- p085 seq5 questionText/explanationText: `主客管` / `筆着の準備` — 文中の重度OCR破損疑い（Tier 1 昇格）
- p318 seq1: 既存 `needsSourceCheck` フラグ（民法523条2項 `...` 省略問題）

### Tier 1.5 内訳

- p043 seq6 explanationText: 文末が句点なしで終わる（文が途中で切れている疑い）
- p085 seq5 questionText: 同上（Tier 1 でも検出済み = 重複確認）

### 除外済みパターン

- p129 seq1-5: `<省略>` 終わり → 書籍の意図的省略表記のため Tier 1.5 から除外

## Next step

1. GPT が `correction_review_packet.json` + `correction_review_summary.md` をレビュー
2. 各 Tier 1 候補について原本画像（`images_preprocessed/<page>.png`）で verbatim 照合
3. 照合後、修正が必要な場合のみ別 PR（1 problemId / 1 PR 原則）で patch を起票
4. p043 seq6 の文末切れは source 照合で確認

---

## Tier 1 source-check follow-up status（2026-04-29追記）

- PR #112 audit basis task は merge 済み・closed。本セクションはその後続 source-check 結果の記録。
- 対象 records: p001 / p002 / p003 / p085 / p318
- p001 / p002 / p003 / p085 は source image / crop review により本文修正候補 HIGH confirmed。
- p318 は本文修正不要 confirmed（書籍 verbatim `…` = 著者省略、E 本文は書籍と一致）。needsSourceCheck flag clear は次 data patch で別途検討。
- p001 seqNo 3 incidental finding は今回 patch scope 外。別候補・別判断として記録のみ維持する。
- data patch は未適用。
- `data/reviewed_import.json` 未編集。
- `public/data/` 未編集。
- stage / commit / push / PR / merge は本 follow-up step では未実行。
- next step は patch 実行ではなく、p085 questionText patch boundary 確認 → patch plan 作成。

---

## p085 boundary recheck および patch plan 作成（2026-04-29追記）

- p085 questionText の boundary を画像 crop 再確認済み。
- `弁明または聴聞の` は書籍に明記されており、source confirmed。修正後テキストに含めなければならない。
- 初回 source_check_tier1_log.md での p085 confirmed text からの `弁明または聴聞の` 欠落は修正済み（同 log 2026-04-29 修正）。
- `patch_plan_tier1_source_confirmed.md` を plan only として作成済み（patch 未実行）。
- `data/reviewed_import.json` 未変更。
- `public/data/` 未変更。
- patch / stage / commit / push / PR / merge は未実行。
- next step: GPT による patch plan レビュー。

---

## p085 explanationText full source confirmation（2026-04-29追記）

- p085 seqNo5 explanationText の full-field source-confirmed text を `images_preprocessed/0085.png` 右ページ thumbnail + crop (y:2350-2950, 3x) により確認済み。
- source-confirmed full explanationText: `弁明手続の場合には、行政手続法24条1項は準用されていないから（行政手続法31条）、主宰者に聴聞調書の作成を義務づけた聴聞手続の場合とは異なり（24条1項）、調書の作成義務はない。`
- 全差分 source_confirmed。partial correction (`主客管`→`主宰者` のみ) では不十分であることを確認。patch_plan の explanationText セクションを full-field replacement に更新済み。
- p001 source evidence の book item 番号表記を一貫修正済み（`book item 4 左列` → `book item 5 左列`）。
- source_check_tier1_log.md p085 explanationText セクションを full confirmed text で更新済み。
- `data/reviewed_import.json` 未変更。
- `public/data/` 未変更。
- patch / stage / commit / push / PR / merge は未実行。
- next step: GPT による updated patch plan レビュー。

---

## Tier 1 source-confirmed data patch applied（2026-04-30追記）

- `data/reviewed_import.json` に Tier 1 source-confirmed corrections を適用済み。
- 更新対象は以下の5フィールドのみ。
  1. p001 seqNo 4 explanationText
  2. p002 seqNo 4 explanationText
  3. p003 seqNo 7 explanationText
  4. p085 seqNo 5 questionText
  5. p085 seqNo 5 explanationText
- Patch method:
  - JSON round-trip ではなく、exact-match 文字列置換で適用。
  - 一度 JSON round-trip による `confidence: 1.0 -> 1` 副作用を検知したため restore 後に文字列置換で再適用。
- Verification:
  - JSON parse OK。
  - 5 target fields equal proposed values。
  - diff is 10 lines, 5 before/after pairs only。
  - p318 unchanged。
  - p001 seqNo 3 incidental finding unchanged。
  - `public/data/reviewed_import.json` unchanged。
  - correction packet JSON unchanged。
- Non-actions:
  - stage not executed。
  - commit not executed。
  - push not executed。
  - PR not created。
  - merge not executed。
- Next step:
  - GPT final review of the five-file commit set.
  - If approved by user, stage exactly the following 5 files and commit:
    - `data/reviewed_import.json`
    - `context/working/sessions/imported-data-correction-audit/source_check_tier1_log.md`
    - `context/working/sessions/imported-data-correction-audit/patch_plan_tier1_source_confirmed.md`
    - `context/working/sessions/imported-data-correction-audit/handoff.md`
    - `context/working/sessions/imported-data-correction-audit/review_request.md`

---

## PR #113 post-merge closeout（2026-04-30追記）

### Final status

- PR #113 was squash-merged to `main`.
- Merge commit: `f3d88eac8a5401cf1c0072f5f656a9a05bdfa6d3`
- `origin/main`: `f3d88ea`
- Remote branch `claude/lucid-swirles-dd70d3` was deleted.
- Local branch may remain as `[gone]`; this is local cleanup residue only.

### Completed scope

The Tier 1 source-confirmed data patch is closed.

Merged changes:

1. `data/reviewed_import.json`
   - p001 seqNo 4 explanationText
   - p002 seqNo 4 explanationText
   - p003 seqNo 7 explanationText
   - p085 seqNo 5 questionText
   - p085 seqNo 5 explanationText

2. Source-check / review docs
   - `source_check_tier1_log.md`
   - `patch_plan_tier1_source_confirmed.md`
   - `handoff.md`
   - `review_request.md`

### Explicit non-actions / remaining scope

- `public/data/reviewed_import.json` was not updated.
- p318 was not changed.
- p318 `needsSourceCheck` flag clear was not performed.
- p001 seqNo 3 incidental finding was not changed.
- No broad OCR cleanup was performed.
- No non-Tier-1 records were changed.

### Remaining separate tasks

If needed, handle these as separate tasks:

1. Decide whether and how to propagate `data/reviewed_import.json` to `public/data/reviewed_import.json`.
2. Decide whether to clear p318 `needsSourceCheck`.
3. Decide whether to promote p001 seqNo 3 incidental finding into a separate correction task.
4. Local stale branch/worktree cleanup.
