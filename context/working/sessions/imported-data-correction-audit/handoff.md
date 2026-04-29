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
