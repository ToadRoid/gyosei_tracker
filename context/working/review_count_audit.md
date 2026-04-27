# 復習カウント / 弱点ダッシュボード集計 audit（read-only / 2026-04-27）

> **scope**: ユーザー観測「問題が一部しかカウントされていない / 一部しか復習できない / 分類分けされておらず探しにくい」の read-only 診断。
> **lock 5 必須**: raw `sectionTitle` 触らない / `displaySectionTitle` と混同しない / 一括 rename 禁止 / section 統合・分割禁止 / IndexedDB 削除禁止
> **lock 追加**: `data/` / `public/data/` / `src/` / DATA_VERSION / `context/stable/` / handoff / current_status / known_issues / `sectionNormalization.ts` / `reviewed_import.json` / `EXACT_MAPPING` / patch / script / migration いずれも無改変
> **本 audit で実施した変更**: なし（新規追加 = 本ファイルのみ）

---

## 0. 結論（先出し）

ユーザー観測「一部しかカウントされない / 一部しか復習できない / 探しにくい」は **3 つの独立した要因の重ね合わせ** で、いずれも data 修正は不要。

| 観測 | 主原因 | data 修正 |
|---|---|---|
| 「5/60 件」と表示される | UI 初期表示制限（top 5）+ 集計後 weak topic 数 60。"5" と "60" は同じ母集団ではなく、**表示数 / 母数** の関係（UI 仕様） | **不要** |
| 一部しか復習できない | review page には個別 topic から exercise への直接遷移リンクが **存在しない**。topic card 展開時に `questionExamples`（max 10）が見られるのみ。section 内全問題を演習する経路は別途 `/exercise` セレクタ経由 | **不要**（UX/UI 改善候補） |
| 分類分けされておらず探しにくい | 集計分裂: review page = **raw sectionTitle** / exercise page = **displaySectionTitle**。EXACT_MAPPING 未整備の 15 chapter で raw 違いが weak topic を不必要に分裂させている | **不要**（前回 classification audit §5-2 の coverage 改善候補と同根） |

→ **修正候補は UI / sectionNormalization 層**。data / DATA_VERSION / IndexedDB は触らない。

---

## 1. 確認項目への直接回答

### 1-1. 「5/60 件」の 5 と 60 の意味

| 値 | 意味 | 出典 |
|---|---|---|
| **5** | UI の **初期表示制限** = `INITIAL_SHOW_COUNT = 5` | [src/app/review/page.tsx:395](src/app/review/page.tsx#L395) |
| **60** | `data.weakTopics.length` = `buildReviewPackInput()` が返す weak topic 数（attempts ≥ 3 を満たす section の合計） | [src/app/review/page.tsx:482](src/app/review/page.tsx#L482) → [src/lib/review-pack-builder.ts:131](src/lib/review-pack-builder.ts#L131) |

UI で `▼ すべて表示（残り 55 件）` ボタンを押せば全 60 件閲覧可能。**「5 件しか復習対象がない」ではなく「初期表示が 5 件」が真の意味**。

### 1-2. 全問題数 / ready / 復習対象 / attempt済 の差分

`data/reviewed_import.json` 由来（read-only python 集計）:

| 区分 | 件数 |
|---|---|
| 全 branches | **2448** |
| empty `subjectCandidate` | 0 |
| empty `chapterCandidate` | 0 |
| null `answerBoolean`（JSON 段階） | 0 |
| empty `sectionTitle` | **71** |

DB 上の数（IndexedDB は実測していないが、設計に基づく予測）:

- `getOverallStats.totalReady` = `problems.status === 'ready'` AND NOT (`isExcluded` OR `needsSourceCheck`)
- `getReadyProblems` 出題対象 = 上記 + `answerBoolean !== null`
- `buildReviewPackInput` weak topic 集計対象 = 上記 + `sectionTitle 非空` + `aiTriageStatus !== 'discard'` + `attempts ≥ 3`

→ JSON 段階の 2448 から、複数フィルタを通って weak topic = 60（推定）まで絞り込まれる。

### 1-3. needsSourceCheck / isExcluded / answerBoolean null 除外件数

`src/lib/db.ts` 内 `PATCHES` の static 累計（コメント精査ベース、複数 patch にまたがり重複あり、実 DB の最終 unique 数とは異なる可能性あり）:

| flag | 累計目安（patch 全合計） |
|---|---|
| `needsSourceCheckProblems` | 約 60+ entries（重複含む / `confirmed`） |
| `isExcludedProblems` | 約 50+ entries（重複含む / `confirmed`） |

詳細な unique 件数は IndexedDB 実測が必要 = 本 audit の read-only scope 外。

`answerBoolean` null は JSON 段階では 0 だが、運用上 `null` を許容するスキーマで（`getReadyProblems:209` で `null/undefined` 除外）、新規取込 frontier で発生しうる。

### 1-4. sectionTitle vs displaySectionTitle 集計分裂

**集計分裂は発生している**:

| 経路 | 使用フィールド | 出典 |
|---|---|---|
| 弱点ダッシュボード（review page） | **raw `sectionTitle`** | [src/lib/review-pack-builder.ts:55](src/lib/review-pack-builder.ts#L55) `attr.sectionTitle ?? ''` |
| 演習モード セクション一覧（exercise page） | **`displaySectionTitle ?? sectionTitle`** | [src/app/exercise/page.tsx:120](src/app/exercise/page.tsx#L120) |
| 演習モード セッション フィルタ（getReadyProblems） | **`displaySectionTitle ?? resolveDisplaySectionTitle(...)`** | [src/lib/db.ts:217-225](src/lib/db.ts#L217) |
| 演習画面 タイトル表示 | `displaySectionTitle ?? sectionTitle` | [src/app/exercise/session/page.tsx:362](src/app/exercise/session/page.tsx#L362) |

→ **review page だけが raw を使う**。これにより EXACT_MAPPING 未整備 chapter で同 display が複数 raw に分裂、または mapped chapter で同 display label でも raw 違いの section が weak topic として **個別カウント**される。

### 1-5. UI 5 件制限 vs 実際の復習対象件数

UI 制限のみ。INITIAL_SHOW_COUNT = 5 で初期 5 件、「▼ すべて表示」で全件展開。`data.weakTopics` 自体は section 数 = 60 件（推定）すべて含む。**復習対象が 5 件しかないわけではない**。

### 1-6. IndexedDB 古いデータ残留チェック（read-only / 設計確認）

read-only audit では実 IndexedDB 内容は確認しない（user directive: IndexedDB 削除禁止 / 書き換えない）。設計上の挙動：

- `db.ts:1025-1046` の `refreshProblemDataIfNeeded()` が DATA_VERSION 不一致で自動再 import
- 起動時 `prepareLocalDataOnce()` が `autoImportIfEmpty → refreshProblemDataIfNeeded → runOneTimeCleanup` を直列実行（[AuthProvider.tsx:62-66](src/components/AuthProvider.tsx#L62)）
- `importParsedBatch` は PreservedAttrs Map で `subjectId / chapterId / isExcluded / needsSourceCheck` を保全（PR #60 修正、[src/lib/import-parsed.ts:160-199](src/lib/import-parsed.ts#L160)）

→ **新訪問 / リロード時に v110 へ自動更新される設計**。古いデータが残るのは 設計上は visit までの一時的状態のみ。

ただし known_issues.md §1 の **未解決原因 2**（`runOneTimeCleanup` の localStorage フラグが problemAttrs 再作成後も残るため再実行されない）は依然存在。これにより past patch の `isExcluded / needsSourceCheck` フラグが消失したまま放置される可能性あり。本 audit の scope 外（既知 known_issues、本 audit では新規発見ではない）。

### 1-7. DATA_VERSION v110 反映後の local refresh 設計

- DATA_VERSION = `2026-04-27-audit-v110-p203-q04-restore`（[src/lib/db.ts:1022](src/lib/db.ts#L1022)）
- `refreshProblemDataIfNeeded()`:
  - `localStorage[DATA_VERSION_KEY] !== DATA_VERSION` で再 import 発火
  - `fetch('/data/reviewed_import.json')` → `importParsedBatch()` で再構築
  - 完了後 `localStorage` に新 DATA_VERSION を保存

→ **設計上は v110 反映が起動時に自動実行**。p203-q04 の Q + E + ans 三層 restore（PR #94）はユーザーが次回 visit/reload した時点で適用される（preview 検証でも実証済）。

### 1-8. section grouping = raw or display?

| コンポーネント | grouping 基準 |
|---|---|
| review-pack-builder.ts (weak topic) | **raw `sectionTitle`** |
| exercise/page.tsx (chapter selector) | `displaySectionTitle ?? sectionTitle ?? '' \|\| 'その他'` |
| getReadyProblems (出題 filter) | `effectiveDisplay = displaySectionTitle ?? resolveDisplaySectionTitle(...)` |

### 1-9. 弱点ダッシュボード vs 演習モードの section key 一致

**不一致**:
- review page TopicCard が表示する `topic.sectionTitle` = **raw**（[src/app/review/page.tsx:320](src/app/review/page.tsx#L320)）
- exercise page chapter selector の section key = **display**

ただし、**review → exercise への直接ナビゲーションリンクは現状存在しない**ため、key 不一致による **直接的な機能不全（クリック → 0 問）は発生しない**。
- review page の topic card は「AI で深掘り」プロンプト copy ボタンのみ
- 「復習開始」ボタンや exercise への遷移リンクは存在しない（[src/app/review/page.tsx:295-390](src/app/review/page.tsx#L295) で grep 確認）

つまり「ダッシュボードで弱点を見て、そこから直接演習する」フロー自体が **未実装**。ユーザーは review で確認 → 別途 `/exercise` セレクタで chapter / section を選び直す必要がある。

### 1-10. 復習開始 query parameter は display or raw?

review page には復習開始 link が存在しない（§1-9 参照）。

`/exercise/session` への遷移は `/exercise` のチャプターセレクタ `startSection(...)` のみ：
- [src/app/exercise/page.tsx:316-330](src/app/exercise/page.tsx#L316)
- 渡すのは `secMap` のキー = `displaySectionTitle ?? sectionTitle ?? ''` ベース
- session 側 `getReadyProblems(subjectId, chapterId, sectionTitle)` の第 3 引数は **display label** として比較される

→ **exercise 内では display で一貫**。review からの遷移経路がそもそも無いため、「review の raw → exercise の display」変換問題は表面化しない。

---

## 2. 切り分け

| 観測 | data 問題 | IndexedDB 問題 | UI 集計問題 | section 分裂問題 |
|---|---|---|---|---|
| 一部しかカウントされない | × | △（known_issues §1 残課題） | ○（UI 5 件制限） | ○（raw vs display 分裂） |
| 一部しか復習できない | × | × | ○（review→exercise リンク不存在） | ○（同上） |
| 分類分けされておらず探しにくい | × | × | △（display 不在で raw のまま表示） | ○（EXACT_MAPPING 未整備の 15 chapter） |

凡例: ○ = 主原因、△ = 副次的、× = 該当なし

---

## 3. raw `sectionTitle` と displaySectionTitle の使い分け確認結果

| 場所 | 使用 |
|---|---|
| `attr.sectionTitle` (raw / 原本見出し) | DB 保存値、変更禁止（[src/lib/import-parsed.ts:182](src/lib/import-parsed.ts#L182) コメント `raw: 原本見出し（変更禁止）`）|
| `attr.displaySectionTitle` (UI 用) | import 時に `resolveDisplaySectionTitle()` で計算保存（[src/lib/import-parsed.ts:183](src/lib/import-parsed.ts#L183)）|
| `getReadyProblems` の effectiveDisplay | DB 値が無い旧レコードは on-the-fly で `resolveDisplaySectionTitle()` 解決（[src/lib/db.ts:217](src/lib/db.ts#L217)）|

→ **設計原則は「raw 不変 / display 派生」**。`sectionNormalization.ts` の冒頭 docstring と整合。

raw → display 変換は `resolveDisplaySectionTitle(chapterId, raw, sourcePageQuestion, problemId)` 1 関数経由で集約されているが、**review-pack-builder.ts はこの関数を呼ばずに raw を直接使っている**ため weak topic 集計のみ raw ベースに分裂している。

---

## 4. 修正候補（実装はしない / 候補列挙のみ）

### 4-1. UX 修正候補（最小、user 学習体験 直接改善）

| # | 候補 | 影響範囲 | リスク |
|---|---|---|---|
| A | review-pack-builder.ts §55 を `attr.displaySectionTitle ?? attr.sectionTitle` に変更 | weak topic の section 集計が EXACT_MAPPING に従う = 同 display label で merge される | mapped chapter で raw 異なる section が一つにまとめられる。GPT prompt の section 名表示も統一される。**section 統合**に該当するため user 5 必須ガード「section 統合禁止」抵触 → **採用不可** |
| B | review page の TopicCard に「演習で復習」ボタンを追加し、`/exercise/session?subject=X&chapter=Y&section={display}` へ遷移 | 機能追加、display label に変換が必要 | display label 解決を builder 側で持つ必要あり。raw → display 解決ロジックの追加（`resolveDisplaySectionTitle` を builder 内で呼ぶ） |
| C | UI 初期表示 5 件 → ユーザー設定可能 / もしくは増加（例 10 件 / 全件） | UI 表示量のみ、ロジック無変更 | 最低リスク。INITIAL_SHOW_COUNT 定数 1 行変更 |
| D | review page で section 名横に display label を併記 | 表示のみ | 最低リスク。section 分裂が見えるが「同じ display なのに別 topic」を user が把握できる |

**user 5 必須ガードに照らした採用可否**:
- A: section 統合に該当 → **採用不可**
- B: section 統合・分割なし、rename なし、IndexedDB 触らず、raw 触らず → **採用可（最小修正候補）**
- C: 同上 → **採用可（即実装可）**
- D: 同上 → **採用可（即実装可）**

### 4-2. data / IndexedDB / DATA_VERSION 修正候補

**なし**。本 audit の結論は data 不変。

### 4-3. sectionNormalization 修正候補

前回 classification audit §5-2 / §9 の **EXACT_MAPPING chapter-by-chapter 拡張** を進めれば、raw vs display の分裂が縮小し review page の section 数も合理化される。ただし本 audit の scope 外（user 明示 GO 必須）。

---

## 5. 修正不要と判断する箇所の理由

| 領域 | 理由 |
|---|---|
| `data/reviewed_import.json` | 集計分裂は data ではなく集計コードの分岐。data は raw として原本忠実 |
| `public/data/reviewed_import.json` | 同上、mirror byte-identical 維持 |
| `DATA_VERSION` | v110 で正常運用。refresh 設計適切 |
| `IndexedDB` | refresh 設計が機能している前提。known_issues §1 残課題は本 audit の新発見ではない |
| `sectionNormalization.ts` | 設計原則は正しい（raw 不変 / display 派生 + chapter ごと EXACT_MAPPING）。coverage 改善は別タスク |
| `EXACT_MAPPING` | 拡張候補は前回 audit と同。本 audit で新規拡張提案はしない |

---

## 6. 追加調査が必要な未確認事項

| # | 項目 | 必要な作業 |
|---|---|---|
| U1 | 実 IndexedDB の isExcluded / needsSourceCheck unique 件数 | ブラウザでの read-only `db.problemAttrs.where('isExcluded').equals(true).count()` 等。本 audit では未実施 |
| U2 | weak topic 60 件の正確な内訳（chapter 別） | 実 attempts データに依存。ユーザー学習履歴次第で変動 |
| U3 | aiTriageStatus = 'discard' の件数 | 実 IndexedDB 実測必要 |
| U4 | known_issues §1 原因 2 の cleanup 再実行不能による flag 消失件数 | 実 DB 実測必要 / 別 audit 案件 |

これらは IndexedDB 実測 = preview server で `preview_eval` を使えば read-only で取得可能だが、本 audit の指示には含まれていないため未実施。user 明示 GO で実施可。

---

## 7. 本 audit が触らないこと（再確認）

- raw `sectionTitle` 触らない / `displaySectionTitle` と混同しない
- 一括 rename / section 統合・分割 禁止
- IndexedDB 削除・初期化・書き換え 禁止
- `data/` / `public/data/` / `src/` / DATA_VERSION 変更なし
- `context/stable/` / handoff / current_status / known_issues 変更なし
- `sectionNormalization.ts` / `EXACT_MAPPING` 変更なし
- `reviewed_import.json` 再生成なし
- patch / script / migration / cleanup 追加なし
- UI 修正なし

---

## 8. read-only 確認 log

| ファイル | 行為 |
|---|---|
| `src/app/review/page.tsx` | read |
| `src/app/page.tsx` | read |
| `src/app/exercise/page.tsx` | read |
| `src/app/exercise/session/page.tsx` | read（grep のみ）|
| `src/lib/stats.ts` | read |
| `src/lib/review-pack-builder.ts` | read |
| `src/lib/db.ts` | read |
| `src/components/AuthProvider.tsx` | read |
| `src/lib/import-parsed.ts` | read（部分）|
| `src/data/sectionNormalization.ts` | grep のみ（前回 audit で full read 済）|
| `data/reviewed_import.json` | read（python 集計のみ）|
| `context/working/review_count_audit.md` | **新規作成 = 本ファイル** |

---

## 9. user 判断ポイント

1. **本 audit の保全方針**: docs-only PR 化するか untracked のまま置くか
2. **修正候補の優先順**:
   - C: INITIAL_SHOW_COUNT 増加 → 最低リスク、即効性あり
   - D: section 名横に display 併記 → user が分裂を視認可能、診断補助
   - B: review page → exercise へ「演習で復習」リンク追加 → display 変換必要、UX 大改善
   - 4-1 の A は **section 統合に該当するため採用不可**（user 5 必須ガード抵触）
3. **追加調査の要否**: §6 の U1-U4（IndexedDB 実測）を別レーンで実施するか
4. **EXACT_MAPPING 拡張**: 前回 classification audit の coverage 改善候補を本 audit と並列で進めるか / 保留

---

## 10. 重要遵守事項（再確認）

- **read-only audit** として開始 → 本ファイル作成のみ、他無改変
- **変更が発生したら即停止して報告** → 変更ゼロで完了
- raw / display 混同なし
- 一括 rename / section 統合・分割 / IndexedDB 削除 すべて未実施
- commit / PR は **user 判断待ち**
