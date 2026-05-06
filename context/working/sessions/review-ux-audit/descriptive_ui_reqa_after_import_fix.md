# Descriptive UI re-QA after import fix

date: 2026-05-06
base: origin/main `84727b0` (PR #140 merged)

---

## 開始前状態

- origin/main = 84727b0
- local main clean
- OPEN PR = 0

---

## 確認結果

### 1. public/data/reviewed_import.json

**PASS**

| 問題 | questionType | answerBoolean |
|---|---|---|
| p137 seqNo=1 | `"descriptive"` | false |
| p138 seqNo=4 | `"descriptive"` | false |

dev server の `/data/reviewed_import.json` endpoint から取得・確認済み。

### 2. ParsedBranch 型定義

**PASS** — `src/types/index.ts` に `questionType?: 'descriptive'` 追加済み（PR #140）

### 3. importParsedBatch

**PASS（コード確認）** — `src/lib/import-parsed.ts` の `db.problemAttrs.add()` に `questionType: branch.questionType` 追加済み（PR #140）

### 4. DB 読み出し（db.ts）

**PASS** — `src/lib/db.ts:255` で `questionType: attr.questionType ?? undefined` として `ProblemForExercise` に渡す（既存実装）

### 5. 演習 UI（exercise/session/page.tsx）

**PASS（コード確認）** — `questionType === 'descriptive'` の分岐で記述式 UI が表示される（既存実装）

### 6. DATA_VERSION bump

**PASS** — `2026-05-06-question-type-descriptive` に更新済み。
ログイン後に `refreshProblemDataIfNeeded` が走ると全件 re-import される。

### 7. IndexedDB 実データ確認

**BLOCKED — ログイン必須**

現在の DB 状態:
- 357件の problemAttrs（p001〜p064 のみ）
- dataVersion = null（localStorage）
- p137/p138 は DB に存在しない

理由: preview 環境のブラウザが未ログイン状態。AuthProvider がログイン必須で、ログイン後に初めて refreshProblemDataIfNeeded が呼ばれる。

### 8. 記述式 UI 実画面表示

**BLOCKED — ログイン必須 + 問題直接表示ルートなし**

exercise/session は以下のパラメータで問題をフィルタ:
- `subject` / `chapter` / `section` → getReadyProblems
- `reviewSession` → sessionStorage 経由の problemIds

p137/p138 を直接表示するには:
1. ログインして refreshProblemDataIfNeeded を実行
2. subject=gyosei&chapter=gyosei-jiken&section=05_取消訴訟の審理 でセクション絞り込み
3. 該当問題がランダム順で出るまで周回

---

## データフロー全体検証

```
public/data/reviewed_import.json
  └─ questionType: "descriptive" ✅ (confirmed via fetch)
       ↓
importParsedBatch (import-parsed.ts)
  └─ questionType: branch.questionType ✅ (code confirmed, PR #140)
       ↓
problemAttrs (Dexie IndexedDB)
  └─ questionType stored ⬜ (blocked: login required for re-import)
       ↓
getReadyProblems / getReadyProblemsByIds (db.ts)
  └─ questionType: attr.questionType ?? undefined ✅ (code confirmed)
       ↓
ProblemForExercise
  └─ questionType?: 'descriptive' ✅ (type confirmed)
       ↓
exercise/session/page.tsx
  └─ questionType === 'descriptive' → 記述式 UI ✅ (code confirmed)
```

---

## 結果分類

| # | 分類 | 内容 |
|---|---|---|
| 1 | **PASS（コード確認）** | データフロー 6段階中 5段階が確認済み |
| 2 | **stale IndexedDB** | 現在の DB に p137/p138 が存在しない（p001-p064 のみ）。DATA_VERSION bump 済みなのでログイン後に解消予定 |
| 3 | **direct test route missing** | 特定 problemId を直接演習表示するルートがない。セクション絞り込み + 周回が必要 |
| 4 | **ログイン必須** | preview 環境が未ログインのため DB re-import と実画面確認が blocked |

---

## 推奨次ステップ

1. **ユーザーがログインして確認**: ブラウザで実際にログインし、コンソールで `[data-refresh]` ログを確認 → p137/p138 の記述式 UI を確認
2. **または direct test route 追加（将来）**: `/exercise/session?problemId=KB2025-p137-q01-b01` のような直接指定ルート

---

## 禁止事項確認

- [x] data patch なし
- [x] public data patch なし
- [x] src/ 修正なし
- [x] DATA_VERSION bump なし
- [x] import 実行なし
- [x] commit / push / PR なし
