# UI QA: Fix-2 / Fix-3 / descriptive patch

date: 2026-05-06
base: origin/main `313db39` (PR #139 merged)

---

## 確認A: /review（Fix-2 / Fix-3）

### Fix-2: QuestionRow 展開

**コード確認: OK**

`src/app/review/page.tsx` の QuestionRow コンポーネント:
- useState で open/close toggle 実装済み
- 展開時に表示される情報:
  - 問題文全文（whitespace-pre-wrap）
  - 正解（○/✗）
  - あなたの回答（○/✗、正誤で色分け）
  - 解説（explanationText、bg-slate-50 背景）
  - pageRef（Q: p.XXX / A: p.XXX）

### Fix-3: 表示件数

**コード確認: OK**

| 設定 | 変更前 | 変更後 | ファイル |
|---|---|---|---|
| INITIAL_SHOW_COUNT | 10 | 50 | src/app/review/page.tsx |
| totalAttempts threshold | 3 | 1 | src/lib/review-pack-builder.ts |
| questionExamples cap | 10 | 30 | src/lib/review-pack-builder.ts, src/lib/review-syllabus-builder.ts |

### 画面目視確認

**status: 未実施 — ログイン必須**

/review ページはログイン + 演習データ（attempts）が必要。
コード上は正しく実装されているが、実画面での目視確認は本 QA では未実施。

---

## 確認B: exercise / descriptive

### B-1: reviewed_import.json

**OK** — p137 seqNo=1 / p138 seqNo=4 に `questionType: "descriptive"` 追加済み。

### B-2: import pipeline（importParsedBatch）

**問題発見: questionType が DB に保存されない**

`src/lib/import-parsed.ts` の `db.problemAttrs.add()` 呼び出し（行172-200）に `questionType` フィールドが含まれていない。

```typescript
// src/lib/import-parsed.ts:172-200
await db.problemAttrs.add({
  problemId,
  subjectId,
  chapterId,
  answerBoolean: branch.answerBoolean,
  // ... 他のフィールド
  needsSourceCheck: preserved?.needsSourceCheck,
  sourceCheckNote: preserved?.sourceCheckNote,
  // ← questionType がない
});
```

結果:
- reviewed_import.json に questionType: "descriptive" があっても
- importParsedBatch が DB の problemAttrs にそれを保存しない
- DB の problemAttrs.questionType は undefined のまま
- 演習画面は ○× UI を表示する（記述式 UI にならない）

### B-3: DB 読み出し側

**OK** — `src/lib/db.ts:255` で `questionType: attr.questionType ?? undefined` として読み出し済み。
DB に値が入っていれば正しく渡される。

### B-4: 演習 UI 側

**OK** — `src/app/exercise/session/page.tsx` に記述式 UI が完全実装済み。
`questionType === 'descriptive'` の分岐で textarea / 自己採点 UI が表示される。

### B-5: 型定義

**OK** — `src/types/index.ts:68` に `questionType?: 'descriptive'` 定義済み。

---

## 問題分類

| # | 分類 | 内容 | 影響 | 対応 |
|---|---|---|---|---|
| 1 | **import pipeline gap** | importParsedBatch が questionType を DB に保存しない | p137/p138 が記述式 UI にならない | **修正済み** — import-parsed.ts に1行追加 |
| 2 | stale IndexedDB | DATA_VERSION bump していないため、既存ユーザーの DB は古いまま | questionType 以前に、今回の patch 自体が反映されない | **修正済み** — DATA_VERSION bump |
| 3 | review 目視未確認 | ログイン + 演習データが必要 | Fix-2/Fix-3 の実画面確認が未完了 | 別途確認 |

---

## 問題1の修正方針

### 最小修正

`src/lib/import-parsed.ts` の `db.problemAttrs.add()` に `questionType` を追加:

```typescript
await db.problemAttrs.add({
  // ... 既存フィールド
  questionType: branch.questionType,  // ← 追加
});
```

### 影響範囲

- import-parsed.ts のみ（1行追加）
- branch オブジェクトは reviewed_import.json の branches[n] そのもの
- branch.questionType は JSON に存在すれば string、なければ undefined
- undefined の場合 Dexie は属性を保存しない（既存動作に影響なし）

### 注意

- この修正だけでは既存ユーザーの DB は更新されない
- DATA_VERSION bump + re-import が必要
- または upsertProblemAttr で手動 patch するワンタイム処理

---

## 問題2: DATA_VERSION について

現在の DATA_VERSION と import trigger を確認:

- `src/lib/db.ts` の `refreshProblemDataIfNeeded()` が DATA_VERSION を比較
- DATA_VERSION が上がると全ページ re-import が走る
- CLAUDE.md §1 の既知バグ: re-import 時に分類・フラグが消失するリスクあり

### 選択肢

| 方針 | 内容 | リスク |
|---|---|---|
| A. DATA_VERSION bump | 全 re-import で questionType が反映される | 既知バグ §1 により分類・フラグ消失リスク |
| B. ワンタイム patch | 対象2件の problemAttrs.questionType を直接更新 | 安全だが手動。新規ユーザーは import pipeline 修正が必要 |
| C. A+B 併用 | pipeline 修正 + ワンタイム patch | 最も確実 |

---

## 結論

### 記述式 UI が動作するために必要な修正

1. **import pipeline 修正**: `import-parsed.ts` に `questionType: branch.questionType` を追加（1行）
2. **既存ユーザー対応**: DATA_VERSION bump またはワンタイム patch

### /review の Fix-2/Fix-3

コード上は正しく実装済み。実画面目視はログインが必要なため未確認。

---

## 禁止事項確認

- [x] data patch なし
- [x] public data patch なし
- [x] src/ 修正なし
- [x] DATA_VERSION bump なし
- [x] import 実行なし
- [x] commit / push / PR なし
