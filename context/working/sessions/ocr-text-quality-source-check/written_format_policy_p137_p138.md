# 記述式問題 p137/p138 扱い方針 — policy decision

date: 2026-05-06
base: origin/main `ef4b726` (PR #137 merged)

---

## 現行 data 状態

| 問題 | sourcePage | seqNo | answerBoolean | questionType | E 状態 |
|---|---|---|---|---|---|
| p137-q01 | 137 | 1 | false | (未設定) | あり（正しい内容: 「民事訴訟の例による」） |
| p138-q04 | 138 | 4 | false | (未設定) | あり（正しい内容: 「釈明処分」+ 解説） |

両方とも:
- source image で記述式（空欄補充）問題であることを confirmed
- answerBoolean=false は ○× 形式への誤変換
- E には正解テキストと解説が含まれている

---

## 重要な発見: 記述式 UI は既に実装済み

### UI 対応状況

`src/app/exercise/session/page.tsx` に記述式問題の完全なフローが実装されている:

1. **出題**: 問題文を表示（○× ボタンではなく textarea + 「解答を見る」ボタン）
2. **解答表示**: E（模範解答）を表示
3. **自己採点**: 「◯ 書けた」「✗ 書けなかった」ボタンで自己採点
4. **正誤判定**: `questionType === 'descriptive'` のとき `userAnswer` がそのまま `isCorrect` になる

### data model 対応状況

- `src/types/index.ts:68`: `questionType?: 'descriptive'` が型定義済み
- `src/lib/db.ts`: `problemAttrs.questionType` として保存・読み出し済み
- `src/lib/db.ts:255`: 演習用データに `questionType` が渡される

### 未対応の部分

- `data/reviewed_import.json` に `questionType` フィールドが存在しない
- `src/lib/import-parsed.ts` が `questionType` を import しない（import 時に設定されない）
- DB 上の `problemAttrs` に `questionType` を設定する手段が import pipeline にない
- → **data patch で `questionType` を手動設定すれば、既存 UI がそのまま使える**

---

## 方針選択肢（P5 案を更新）

| 方針 | 内容 | メリット | デメリット |
|---|---|---|---|
| **A. isExcluded=true** | 除外フラグで非表示 | 最小・安全 | 学習機会を失う。記述式UIが既にあるのに使わない |
| **B. questionType='descriptive' を設定** | DB の problemAttrs に questionType を追加 | 既存 UI がそのまま使える。学習機会を維持。source-confirmed | reviewed_import.json に questionType がないため、import 時に消える可能性あり（既知バグ §1） |
| **C. reviewed_import.json に questionType フィールド追加** | JSON に questionType を含めてから import | import 再実行後も維持される | JSON スキーマ変更。import pipeline の修正が必要 |
| **D. answerBoolean 維持（非推奨）** | 現状放置 | 変更不要 | ○× として演習すると必ず「正解: ✗」と表示され誤学習 |

---

## 推奨: 方針 B（questionType='descriptive' 設定）

### 理由

1. **記述式 UI が既に完全実装されている** — 新規 UI 開発不要
2. **E に正解テキストが含まれている** — 「模範解答」として表示可能
3. **isExcluded にするより学習効果が高い** — 記述式問題は行政書士試験で出題される
4. **最小 patch で対応可能** — reviewed_import.json の2件に `questionType: "descriptive"` を追加するだけ

### import 再実行時の消失リスク

既知バグ（CLAUDE.md §1）により、DATA_VERSION bump + import 再実行時に problemAttrs が全削除→再作成される。questionType が reviewed_import.json に含まれていない場合、再 import で消失する。

**対策**:
- 短期: reviewed_import.json に questionType を含める（方針 B+C の組み合わせ）
- 中期: import pipeline で questionType を継承するロジック追加（CLAUDE.md TODO に記載済み）
- 回避: DATA_VERSION bump しなければ消失しない（現在の運用方針通り）

---

## 最小 patch plan（方針 B+C の場合）

### patch 対象

| ファイル | 変更 |
|---|---|
| data/reviewed_import.json | p137-q01, p138-q04 に `"questionType": "descriptive"` 追加 |
| public/data/reviewed_import.json | 同上 |

### patch 内容（p137-q01）

```json
// before
"seqNo": 1,
"questionText": "「行政事件訴訟に関し...",
"answerBoolean": false,

// after
"seqNo": 1,
"questionText": "「行政事件訴訟に関し...",
"answerBoolean": false,
"questionType": "descriptive",
```

### patch 内容（p138-q04）

同様に `"questionType": "descriptive"` を追加。

### answerBoolean について

answerBoolean=false を維持する。理由:
- 記述式問題では answerBoolean は使用されない（`questionType === 'descriptive'` 時は自己採点）
- 値を変更する根拠がない（source は ○/× ではなくテキスト回答）
- 将来的に answerBoolean を null にする設計変更が望ましいが、今回のスコープ外

### p138-q04 の OCR 誤字について

questionText に OCR 誤字疑いあり:
- 「これまでい一般」→「これまで一般」
- 「適正の実」→「適正の確実」？
- 「処の理由」→「処分の理由」？

これらは questionType patch とは別タスクで扱うべき。source image の高解像度確認が必要。

---

## patch しない場合の残リスク

- p137-q01 / p138-q04 が ○× 問題として出題され続ける
- answerBoolean=false のため、○ を選ぶと「不正解」、✗ を選ぶと「正解」と判定される
- 記述式問題の正解（「民事訴訟」「釈明処分」）を ○× で判定することに意味がない
- 復習画面でも ✓/✗ として表示され、学習者に誤った印象を与える

---

## 記述式問題の全体規模（参考）

p137/p138 以外にも記述式問題が存在する可能性がある。広域スキャンは別タスクだが、参考として:

questionText に「記入しなさい」「記述しなさい」「漢字○字」等が含まれる問題を検索すれば、全件洗い出せる。

---

## 結論

| 項目 | 判定 |
|---|---|
| 推奨方針 | B+C: reviewed_import.json に questionType を追加 |
| patch 規模 | 2件 × 2ファイル（data + public） |
| UI 変更 | 不要（既存記述式 UI がそのまま使える） |
| answerBoolean 変更 | 不要 |
| import pipeline 変更 | 今回は不要（中期 TODO として記録） |
| data patch 実施 | **未実施（user 承認待ち）** |

---

## 禁止事項確認

- [x] data patch なし
- [x] public data patch なし
- [x] isExcluded 変更なし
- [x] answerBoolean 変更なし
- [x] explanationText 変更なし
- [x] UI 実装なし
- [x] DATA_VERSION bump なし
- [x] import 実行なし
