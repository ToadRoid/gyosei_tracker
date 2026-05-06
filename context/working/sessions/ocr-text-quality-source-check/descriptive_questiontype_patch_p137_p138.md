# p137/p138 questionType: "descriptive" data patch log

date: 2026-05-06
base: origin/main `bb6023a` (PR #138 merged)

---

## 対象

| 問題 | sourcePage | seqNo | originalProblemId | 正解 |
|---|---|---|---|---|
| p137-q01 | 137 | 1 | KB2025-p137-q01 | 民事訴訟（漢字4字） |
| p138-q04 | 138 | 4 | KB2025-p138-q01 | 釈明処分（漢字4字） |

## 根拠

- source image で記述式（空欄補充）問題であることを confirmed（P4-B source check log）
- written-format handling policy（PR #138）で方針 B+C を採用
- 既存 exercise UI が `questionType: 'descriptive'` に完全対応済み

## patch 内容

| ファイル | 変更 |
|---|---|
| data/reviewed_import.json | 2件に `"questionType": "descriptive"` 追加 |
| public/data/reviewed_import.json | 同上 |

### p137 seqNo=1

```json
"answerBoolean": false,
"questionType": "descriptive",   // ← 追加
"explanationText": "行政事件訴訟法7条には..."
```

### p138 seqNo=4

```json
"answerBoolean": false,
"questionType": "descriptive",   // ← 追加
"explanationText": "釈明処分\n行政事件訴訟では..."
```

## 変更しないもの

- answerBoolean: 維持（記述式では使用されない）
- questionText: 維持
- explanationText: 維持
- isExcluded: 変更なし
- needsSourceCheck: 変更なし
- DATA_VERSION: bump なし
- src/: 変更なし

## 検証

- JSON parse: OK（data + public/data）
- git diff --check: OK
- git diff --stat: 2 files changed, 4 insertions(+)
- src/ diff: empty

## 期待される動作変更

import 後、p137-q01 / p138-q04 が演習画面で記述式として出題される:
- ○× ボタンの代わりに textarea + 「解答を見る」ボタン
- E（模範解答）表示後、自己採点（「◯ 書けた」「✗ 書けなかった」）

## 注意

p138-q04 の questionText には OCR 誤字疑いあり（「これまでい一般」等）。
OCR 誤字修正は別タスクで扱う。
