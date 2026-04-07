# gyosei_tracker データベースライン v15

> **このファイルが v15 現行基準版です。**
> v16 以降のセッションはこのファイルと `master_correction_ledger.json` を読むだけで
> v3〜v15 のパッチ全履歴を再読みする必要はありません。

---

## 現行状態サマリ（2026-04-07 確定）

| 項目 | 値 |
|------|-----|
| DATA_VERSION | `2026-04-07-audit-v15` |
| 総問題数（reviewed_import.json） | 約 1,278 問 |
| 修正台帳（recalcCorrect 累計） | **54 件**（`master_correction_ledger.json` 参照） |
| needsSourceCheck（未確定問題群） | **22 件** |
| isExcluded（除外済み） | 3 件（幽霊レコード） |
| discard（データ不能） | 3 件 |
| 三者比較不一致 | **0 件**（reviewed_import.json ↔ 全パッチ最終値） |

---

## 未確定問題群 22 件（needsSourceCheck）

出題レーン（getReadyProblems）・統計・復習パック の全てから除外済み。
原本確認後、`reviewed_import.json` を修正 → v16+ パッチで復帰させること。

```
KB2025-p062-q01〜q05  questionText 途中切断疑い
KB2025-p078-q01〜q03  questionText 途中切断疑い
KB2025-p129-q01〜q03  <省略>タグ混入
KB2025-p162-q01〜q03  questionText 切断疑い
KB2025-p142-q02       執行停止の説明破損疑い
KB2025-p101-q03       解説と正解不一致疑い
KB2025-p152-q01,q03,q04,q05  行訴法46条系 OCR切断
KB2025-p225-q05       動機の錯誤 OCR崩壊
KB2025-p241-q01       時効援用 OCR崩壊
```

---

## import_optimizer.py 運用ルール（確定）

| 信頼度 | カテゴリ | 処置 |
|--------|---------|------|
| conf ≥ 0.90 | **C のみ**（本肢は正しい/誤り等の明示宣言） | `--apply` で自動修正 ✓ |
| conf 0.60〜0.89 | A/B/F（末尾パターン・類似度ベース） | **レポートのみ・自動適用禁止** |
| — | D/E（OCR品質・解説不一致） | needsSourceCheck 候補フラグ |

**誤検出率実測: 78%**（2026-04-07、178件全件手動照合）

A/B/F で修正が必要なものは、全文確認後に `db.ts` の v16+ パッチの `recalcCorrect` に個別追記して適用する。

---

## v16+ 増分パッチの書き方

```typescript
// db.ts の PATCHES 配列末尾（「今後の修正はここに追加」の行の上）に追記
{
  key: 'cleanup_YYYY-MM-DD_v16_description',
  deleteAllAttempts: [],
  deleteLap1: [],
  needsSourceCheckProblems: [],   // 未確定に追加する場合
  isExcludedProblems: [],          // 除外する場合
  recalcCorrect: [
    { problemId: 'KB2025-pXXX-qYY', correctAnswer: true/false },
  ],
},
```

`DATA_VERSION` を `'YYYY-MM-DD-audit-v16'` に更新すること。

---

## 台帳への追記ルール

`data/master_correction_ledger.json` の `corrections` 配列に追記：

```json
{
  "problemId": "KB2025-pXXX-qYY",
  "before": false,
  "after": true,
  "source_patch": "cleanup_YYYY-MM-DD_v16_...",
  "reason": "理由を日本語で記述"
}
```

`meta.totalEntries` / `meta.uniqueProblems` を更新すること。
