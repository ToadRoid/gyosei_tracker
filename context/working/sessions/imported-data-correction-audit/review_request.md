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

## Evidence

### Changed files

- `scripts/build_correction_review_packet.mjs` (new)
- `context/working/sessions/imported-data-correction-audit/correction_review_packet.json` (new)
- `context/working/sessions/imported-data-correction-audit/correction_review_summary.md` (new)
- `context/working/sessions/imported-data-correction-audit/handoff.md` (new)
- `context/working/sessions/imported-data-correction-audit/review_request.md` (new)

### Unchanged files (confirmed)

- `data/reviewed_import.json` — 未変更
- `public/data/reviewed_import.json` — 未変更
- その他すべての tracked files — 未変更
- 既存 untracked: `data/` 配下のJSON群 / `.claude/worktrees/` / `gyosei_tracker-cursor-trial/` / `scripts/audit_reviewed_import.py` — 未変更

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

### git status -sb --untracked-files=no

```
## chore/imported-data-correction-audit...origin/main
(tracked modified: 今回作成の5ファイルのみ / data/reviewed_import.json 未変更)
```

## Do Not Assume

- Tier 1 candidate は修正確定ではない
- OCR破損候補の正しい原文を推定しない
- answerBoolean / polarity はこのタスクで変更しない
- packet 生成は patch approval ではない
