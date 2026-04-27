# 復習画面 母集団 / 並び順 / 用途 再定義 audit（read-only / 2026-04-27）

> **scope**: ユーザー指摘（解いた回答結果の一部しか復習画面に出ない / 教材順で探せない）の構造分析。実装はしない。
> **lock**: `data/` / `public/data/` / `src/` / DATA_VERSION / `context/stable/` / handoff / current_status / known_issues / `EXACT_MAPPING` / `sectionNormalization.ts` / `review-pack-builder.ts` の挙動 / B / C 実装 触らない。
> **修正方針**: 候補列挙のみ。**実装は別 PR で user 明示 GO 後**。
> **commit / PR**: user 判断待ち。

---

## 0. 結論（先出し）

| 観測 | 構造的原因 | 影響 |
|---|---|---|
| 解いた問題の一部しか復習画面に出ない | review-pack-builder が **section 内 attempts ≥ 3 の group のみ** を `weakTopics` に乗せる + sectionTitle 空 + 各種除外 flag で 4 段階フィルタ | 1〜2 問しか解いていない section、フラグ付き問題、sectionTitle 空問題が **全て表示母集団から脱落** |
| 章を探せない | weakTopics は **正答率昇順** のみソート、master.ts の subject/chapter order を反映しない | 「さっき解いた物権の章」を探そうとしても accuracy 50% の他 sections と並列に並び見分け不能 |
| C 実装 (5→10) は表面的改善 | 表示母集団そのものが weakTopics 60 件等に絞られた **subset** で、母集団自体が一部のため | 表示件数を増やしても表示母集団外の attempt は出ない |
| B 実装は弱点導線として機能 | 「弱点発見 → 演習」の片方向のみ繋がっている | 「解いた → 教材順で探して復習」経路が **未実装** |

**真の課題**: 復習画面は**「弱点発見ビュー」のみ**で、**「教材順の回答結果確認ビュー」「最近解いた問題ビュー」「間違えた問題ビュー」が不在**。

→ **修正方向**: 既存 review page を壊さず、**教材順タブを新設**するのが最小安全 = 既存 builder 無改変、新 builder 追加、UI にタブ切替を追加。

---

## 1. 現在の review page の実際の役割

### 1-1. ロード経路（[src/app/review/page.tsx](src/app/review/page.tsx)）

```
ReviewPage (use client)
  ↓ buildReviewPackInput() を呼ぶ（[src/lib/review-pack-builder.ts](src/lib/review-pack-builder.ts)）
  ↓ data: { userSummary: {...}, weakTopics: WeakTopicInput[] }
  ↓ INITIAL_SHOW_COUNT = 10（C 実装で 5→10）
  ↓ TopicCard を accuracy 昇順で render
```

### 1-2. weakTopics 生成のフィルタ chain（[review-pack-builder.ts:48-131](src/lib/review-pack-builder.ts#L48)）

| 段階 | フィルタ | 除外される対象 | 行 |
|---|---|---|---|
| 1 | `attr` 不在 | problemAttrs に entry が無い attempt | L49-50 |
| 2 | `isExcluded === true` | isExcludedProblems パッチ済 | L51 |
| 3 | `needsSourceCheck === true` | needsSourceCheckProblems パッチ済 | L51 |
| 4 | `aiTriageStatus === 'discard'` | discardProblems パッチ済 | L51 |
| 5 | `sectionTitle === ''` | raw section title が空 | L58 |
| 6 | `group.totalAttempts < 3` | section 内合計 attempt 3 未満（**最も大きな脱落要因**） | L131 |

→ ユーザーが 1〜2 回しか解いていない section は **L6 で全件除外**。  
→ sectionTitle 空の問題（71 件）は **L5 で除外**（前回 review_count_audit §2-4 参照）。

### 1-3. ソート（[review-pack-builder.ts:233-234](src/lib/review-pack-builder.ts#L233)）

```ts
const sortedWeakTopics = weakTopics.sort((a, b) => a.accuracy - b.accuracy);
```

**accuracy 昇順のみ**。subject / chapter の master.ts order は無視される。

### 1-4. UI 表示（[review/page.tsx:537-571](src/app/review/page.tsx#L537)）

```ts
const visibleTopics = showAllTopics ? data.weakTopics : data.weakTopics.slice(0, INITIAL_SHOW_COUNT);
// 上位10件表示 / 全60件 のラベル
```

INITIAL_SHOW_COUNT = 10（C 実装後）。「すべて表示」で全件展開可能。各 TopicCard に B 実装の「演習で復習」ボタン付き（candidateProblemIds + sessionStorage handoff）。

→ **設計目的は「弱点発見」**。weakTopics は **「accuracy が低く、attempt が 3 以上ある section」だけ** の集合で、これは全 attempt 履歴の **subset**。

---

## 2. 表示されている回答結果 / 表示されていない回答結果

### 2-1. 全 attempts → review page に乗る件数の推定

実 IndexedDB に依存するため正確数値は出せないが、構造から:

| 区分 | 推定 |
|---|---|
| **総 attempts**（IndexedDB `db.attempts.toArray()`） | ユーザー学習履歴総量、変動 |
| **review に乗る attempts** | `(attempts >= 3 の section の attempt 合計 - フラグ除外 attempt)` のみ |
| **review に乗らない attempts** | フラグ除外 + sectionTitle 空 + section attempts < 3 の各 attempt |

### 2-2. ある typical 学習段階の例

仮にユーザーが 100 sections のうち 50 sections に attempt があり、その内訳が:
- **30 sections**: section 内 attempts ≥ 3 → review 表示対象（weakTopics に入る）
- **20 sections**: section 内 attempts < 3 → review 表示**対象外**（attempt があっても見えない）

→ 50 sections 解いたのに **20 sections（40%）が完全に消える**。

### 2-3. ユーザー観察「解いた問題が出てこない」の正体

**section の attempts < 3 で全件脱落**が主原因（フィルタ L6）。

「解いた問題」 = attempt ≥ 1 に対して、review = attempts ≥ 3 の section のみ → **解いた直後の section は基本見えない**。

---

## 3. なぜ章を探しにくいのか

### 3-1. ソート設計のミスマッチ

| ユーザー期待 | 実装 |
|---|---|
| 「さっき解いた物権の section」を見たい | accuracy 昇順 → 物権 section が他 subjects の同 accuracy 帯に紛れる |
| 「民法を順に復習したい」 | accuracy 昇順では民法の章順ではない、subject grouping すら無い |
| 「まだ復習していない section から」 | review_pack-builder には「最終 attempt 日時」「未復習」概念が無い |

### 3-2. exercise page との対比

[exercise/page.tsx:115-149](src/app/exercise/page.tsx#L115) は **subject → chapter → section の階層 + master.ts order ソート** を持つ:

```ts
for (const subject of subjects) {  // master.ts order
  const relevantChapters = chapters
    .filter((c) => c.subjectId === subject.id)
    .sort((a, b) => a.order - b.order);  // master.ts chapter order
  ...
}
```

→ **exercise page には教材順構造があるが、review page には無い**。

### 3-3. 結果

ユーザーが解いた直後に「物権の section に戻りたい」と思っても、review では:
1. 解いた section が weakTopics に乗っている（attempts ≥ 3 達成済）必要あり
2. 乗っていれば accuracy 昇順の長いリストから物権を探す必要あり

これは **「弱点発見」目的なら正しいが、「教材順の回答確認」目的では破綻**。

---

## 4. ユーザー要件の再定義

### 4-1. 復習の用途は 1 つではない

| 用途 | ユーザー文脈 | 必要な ranking |
|---|---|---|
| **弱点発見** | 苦手な分野を炙り出して集中対策 | accuracy 昇順 |
| **教材順の回答確認** | 「さっき解いた section に戻る」「民法を順に復習」 | master.ts subject → chapter → section |
| **最近解いた問題** | 直近のセッションを振り返る | answeredAt desc |
| **未復習 / 間違えた問題** | 個別問題単位で復習対象を絞る | problemId × isCorrect=false |

### 4-2. 現在の review page は (1) のみ

それも対象 section が attempts ≥ 3 等のフィルタで絞られた subset。

→ **ユーザーが「解いた問題が出てこない」と観測したのは、(2)/(3)/(4) が無く、(1) も母集団が狭いため**。

### 4-3. C 実装の限界

C 実装（INITIAL_SHOW_COUNT 5→10）は **(1) の表示数の改善**であり、母集団そのものを増やさない。
ラベル文言改善は誤読防止には有効だが、本質的な「(2)/(3)/(4) が無い」問題には届いていない。

---

## 5. 画面設計案（実装はしない / 候補列挙のみ）

### 5-1. タブ構成案

```
復習（/review）
├─ 弱点順（既存 weakTopics）
│   ├─ 集計: accuracy 昇順、attempts ≥ 3 の section
│   └─ B 実装の「演習で復習」ボタン
│
├─ 教材順（新規）  ← ユーザー要件 (2) を満たす最重要タブ
│   ├─ 集計: master.ts subject → chapter → section、attempt あり section のみ
│   ├─ 表示: 各 section に attempts/correct/最終 attempt 日時
│   └─ 「このセクションを演習で復習」ボタン（B 実装の同 pattern）
│
├─ 最近解いた問題（新規）  ← ユーザー要件 (3)
│   ├─ 集計: attempts.answeredAt desc、unique problemId
│   └─ 各 attempt の (Q snippet, ans, isCorrect, 日時)
│
└─ 間違えた問題（新規）  ← ユーザー要件 (4)
    ├─ 集計: attempts where isCorrect=false（unique problemId、最新の attempt 状態）
    └─ 直接「これだけ復習」ボタン
```

### 5-2. 最優先タブ = 教材順（要件 2 の解消）

「解いたあとに対象章を探せない」問題を直接解消するのは **教材順タブ**。

教材順タブの集計仕様（推奨）:

```ts
// 新 builder（仮称: buildReviewBySyllabus）
- attempts table を全件取得
- 各 attempt の attr が isExcluded/needsSourceCheck/discard でない
- attempt があった (subjectId, chapterId, sectionTitle) を group key
  - sectionTitle は raw / display どちらでも可（既存 review-pack-builder と整合させるなら raw）
- master.ts subjects[].order × chapters[].order で sort
- 各 section に:
  - attempts 件数
  - 正答数 / 正答率
  - 最終 attempt 日時
  - candidateProblemIds（B 実装と同じ stable identifier）
- attempts ≥ 3 制約は **使わない**（教材順は全 attempt section を見せる）
```

### 5-3. 弱点順タブ（既存 review-pack-builder 流用）

無改変のまま「弱点順」タブとして残す。B 実装の演習リンクも維持。

---

## 6. 最小実装案（実装はしない）

### 6-1. ファイル変更候補

| ファイル | 変更内容 | 行数目安 |
|---|---|---|
| `src/lib/review-pack-builder.ts` | **無改変**（弱点順専用、既存挙動維持） | 0 |
| `src/lib/review-syllabus-builder.ts`（新規） | 教材順タブ用 builder。subject → chapter → section 階層 + attempts 集計 | +120 行 |
| `src/types/review-pack.ts` | `SyllabusReviewItem` 型追加（必要なら）。既存 `WeakTopicInput` 等は無改変 | +25 行 |
| `src/app/review/page.tsx` | タブ UI 追加（弱点順 / 教材順）、初期値「弱点順」、各タブで適切な builder を呼ぶ | +60 行 |

合計 **~205 行**。Dexie schema / DATA_VERSION / data / EXACT_MAPPING / sectionNormalization は **すべて無改変**。

### 6-2. 設計上の重要ポイント

1. **既存 review-pack-builder の挙動を一切変えない** → 弱点順タブで既存 weakTopics をそのまま使う、B 実装の「演習で復習」ボタンも無改変
2. **教材順タブの builder は新規ファイル** → 既存と分離、責務単一
3. **section key は raw `sectionTitle` を使うか display を使うか** → 教材順タブ単体では raw でも display でも問題は出にくい（ユーザー視点では同じ section）。ただし B 実装と同じく **URL に section key を渡さない**設計（candidateProblemIds + sessionStorage token を流用）が安全
4. **attempts ≥ 3 制約は教材順タブでは使わない** → 1〜2 attempt の section も表示する
5. **タブ切替は state（useState）のみ** → routing 変更なし、`/review` 単一ルート維持
6. **Dexie schema 無変更** → 既存 attempts / problemAttrs / problems table のみ参照

### 6-3. 実装してはいけない案

| 案 | 理由 |
|---|---|
| `review-pack-builder.ts` の filter を緩める（attempts ≥ 3 → ≥ 1 に変更） | **既存挙動変更 = B 実装が依存している weakTopics の意味が変わる、回帰リスク大** |
| `review-pack-builder.ts` を raw → display 集計に変更 | section 統合に該当（過去の audit で繰り返し採用不可と判定済）|
| weakTopics を accuracy → 教材順の二重ソート | 「弱点発見」の主目的が薄れる、UX 混乱 |
| データを書き換えて教材順 view 用に整形 | data 触らない原則違反 |
| 新タブで `?section=` URL を渡す | section key 不一致リスク（PR #97 設計と矛盾） |
| Dexie schema に新 table 追加 | DATA_VERSION 巻き込み、不要 |

---

## 7. 次 PR に進む場合の安全条件

実装に進むなら、以下を **必ず守る**:

| # | 安全条件 |
|---|---|
| 1 | `review-pack-builder.ts` を **無改変** に保つ（弱点順タブの挙動を一切変更しない） |
| 2 | 新 builder は別ファイル（`src/lib/review-syllabus-builder.ts`）として追加のみ |
| 3 | URL に section key（raw / display）を渡さない（B 実装の sessionStorage pattern を流用） |
| 4 | `data/` / `public/data/` / `src/data/sectionNormalization.ts` / `EXACT_MAPPING` 無改変 |
| 5 | `DATA_VERSION` bump 不要（data 無変更）|
| 6 | Dexie schema 無改変（v6 維持） |
| 7 | B 実装の reviewSession 分岐 / `getReadyProblemsByIds()` を流用、新規 helper は最小限 |
| 8 | C 実装の INITIAL_SHOW_COUNT は弱点順タブのみに適用、教材順タブは別の表示制限ロジックを持つか持たないかを設計時に決める |
| 9 | UI タブ切替は `useState` のみ（react-router 等を入れない、routing 影響ゼロ） |
| 10 | テスト観点: 既存 weakTopics 件数 / B 実装の reviewSession 動線 / C 実装の 10 件初期表示 が **無改変**であることを test plan に明記 |

---

## 8. 触らないこと（再確認 / 本 audit での実施事項）

- `data/reviewed_import.json` / `public/data/reviewed_import.json`（**read なし**）
- `src/lib/review-pack-builder.ts`（**read のみ**、コード理解目的）
- `src/app/review/page.tsx` / `src/app/exercise/page.tsx` / `src/app/exercise/session/page.tsx`（**read のみ**）
- `src/lib/db.ts`（**read のみ**、attempts table schema 確認）
- `DATA_VERSION`（**read のみ**）
- `context/stable/` / `context/working/` 配下（**read なし**、本 audit の出力ファイルのみ追加）
- `EXACT_MAPPING` / `sectionNormalization.ts`（**read なし**）
- B / C 実装関連（**read のみ**、依存関係確認目的）
- patch / script / migration / cleanup（**追加なし**）

---

## 9. read-only 確認 log

| ファイル | 行為 |
|---|---|
| `src/lib/review-pack-builder.ts` | read（filter chain L48-131、sort L233-234） |
| `src/app/review/page.tsx` | read（INITIAL_SHOW_COUNT、TopicCard、ReviewSessionStartButton） |
| `src/app/exercise/page.tsx` | read（loadCurriculumData の subject → chapter → section 階層構造、L75-129） |
| `src/lib/db.ts` | read（attempts table schema、getReadyProblems / getReadyProblemsByIds） |
| `context/working/review_page_purpose_and_coverage_audit.md` | **新規作成 = 本ファイル** |

注: `context/working/text_quality_audit.md`（前 audit の untracked 残置）は本 audit では **触っていない**。別タスクとして保留中。

---

## 10. user 判断ポイント

1. **本 audit の保全方針**: docs-only PR 化するか / untracked 維持
2. **次タスクの優先順**:
   - (a) 教材順タブ実装（最優先、§5-2 / §6 設計に基づく）
   - (b) 最近解いた問題タブ
   - (c) 間違えた問題タブ
   - 全部 1 PR で出すか / タブ単位で別 PR にするか
3. **タブ切替 UI の方針**: 既存 review page にタブを追加するか / 新ルート `/review/syllabus` を切るか
4. **section key 渡し方**: B 実装と同じく candidateProblemIds + sessionStorage を流用するか、別経路を用意するか
5. **attempts ≥ 3 制約の扱い**: 弱点順タブだけ維持し、教材順タブでは 1+ attempts を全部見せるか
6. **既知 audit 群との関連**: 本 audit 結果を ingestion_flow.md に取り込むか / `docs/` に別記録か
7. **前 audit の未保全分**: `context/working/text_quality_audit.md`（untracked）の docs-only PR 化を続けて行うか

---

## 11. 重要遵守事項（再確認）

- read-only audit として開始 → 本ファイル作成のみ、他無改変
- 変更が発生したら即停止して報告 → 変更ゼロで完了
- data / public/data / DATA_VERSION 変更しない → 触っていない
- `sectionTitle` / `displaySectionTitle` 上書きしない → 触っていない
- `sectionNormalization` / `EXACT_MAPPING` 変更しない → 触っていない
- `review-pack-builder` 既存挙動変更しない → 触っていない（read のみ）
- UI 実装に入らない → 入っていない
- B / C 実装変更しない → 触っていない
- 本文 restore に入らない → 入っていない
- Ollama PoC に入らない → 入っていない
- commit / PR は **user 判断待ち**
