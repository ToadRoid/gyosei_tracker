# review → exercise 復習導線 設計 audit（read-only / 2026-04-27）

> **scope**: 弱点ダッシュボードの topic card から「演習で復習」へ安全に遷移する導線を設計する。**実装はしない**。
> **lock 8 必須**: raw `sectionTitle` 正規化禁止 / `displaySectionTitle` と混同しない / section 統合・分割・rename 禁止 / `EXACT_MAPPING` `sectionNormalization.ts` 触らない / builder の raw 集計を display 集計へ変更しない / IndexedDB / localStorage 削除・初期化・書き換え禁止 / data / public/data / src / DATA_VERSION 変更禁止 / 実装・patch・script・migration 作らない
> **本 audit で実施した変更**: なし（新規追加 = 本ファイルのみ）

---

## 0. 結論（先出し）

| 項目 | 判定 |
|---|---|
| section key（raw / display）を URL に渡す案 | **採用不可**（key 不一致 / 分裂表示 / 分類崩壊再発リスク） |
| `candidateProblemIds` ベース設計 | **採用可（最小安全）** |
| 推奨実装方式 | **sessionStorage 経由トークンハンドオフ + 新 helper `getReadyProblemsByIds()`** |
| URL に直接 problemIds を渡す案 | **次善**（URL 長制限と URL pollution の懸念あり、回避可能） |
| IndexedDB に新 table を追加して review pack を永続化する案 | **不採用**（schema 変更 = 8 必須ガード抵触の懸念、本来用途過剰） |

→ 設計のみ確定。実装は **別 PR / 別レーン** で user 明示 GO 後に着手。本 audit は data / IndexedDB / DATA_VERSION / `src/` を一切触らない。

---

## 1. 確認項目への直接回答

### 1-1. review page TopicCard が保持している topic 情報

`WeakTopicInput` interface（[src/types/review-pack.ts:65-79](src/types/review-pack.ts#L65)）:

| field | 内容 | 復習導線設計での利用 |
|---|---|---|
| `subjectName` | 科目名（master.ts 名 lookup 経由） | UI 表示用 / 復習セッション header |
| `chapterName` | 章名（master.ts 名 lookup 経由） | UI 表示用 / 復習セッション header |
| `sectionTitle` | **raw `sectionTitle`**（builder L55, `attr.sectionTitle ?? ''`） | **URL key として使わない**（display と不一致のため） |
| `accuracy` | 正答率 | 表示のみ |
| `totalAttempts` / `correctCount` | 集計 | 表示のみ |
| `lapStats` | 周回別成績 | 表示のみ |
| `improvement` | 1→2 周目改善度 | 表示のみ |
| `pageRefQuestion` / `pageRefAnswer` | ページ参照 | 表示のみ |
| **`candidateProblemIds`** | **section 内 attempt があった全 unique problemId 配列** | **復習セッション渡しの core key** |
| `wrongExamples` | 直近 wrong 3 件 | 表示のみ |
| `questionExamples` | 表示用問題 (max 10) | 表示のみ（復習対象とは独立） |

**重要**: TopicCard は `topic.sectionTitle` を **表示文字列**としては使うが ([src/app/review/page.tsx:320](src/app/review/page.tsx#L320))、URL key としては使わない設計が必要。

### 1-2. candidateProblemIds の中身と信頼性

**生成箇所**: [src/lib/review-pack-builder.ts:47-117](src/lib/review-pack-builder.ts#L47)

```ts
groups.set(key, { ..., problemIds: new Set(), ... });
// ...各 attempt について:
group.problemIds.add(attempt.problemId);
// ...最終的に:
candidateProblemIds: Array.from(group.problemIds),
```

**信頼性**:

| 観点 | 判定 |
|---|---|
| problemId 形式 | `KB2025-pNNN-qMM`（[src/lib/db.ts:250](src/lib/db.ts#L250)）= **stable identifier**、DATA_VERSION refresh をまたいで保持される |
| 含まれる範囲 | **attempt があった problemId のみ**（attempt 集計から逆引きしているため）。section 内に存在するが未 attempt の問題は **含まれない** |
| 信頼性 confidence | **confirmed**: builder 内 attempt loop で構築、weak topic = `attempts ≥ 3` のフィルタを通過している (builder L131) |
| 永続性 | review page reload するたびに再生成（IndexedDB の attempts/problemAttrs から）= **stale risk なし** |
| filter 経過 | builder L51 で `isExcluded === true || needsSourceCheck === true || aiTriageStatus === 'discard'` を既に除外済 = candidateProblemIds は基本的に exercise 可能な ID のみ |

**注意点**: candidateProblemIds = 「この section で attempt されたこと**のみ**」。未 attempt 問題はリストに入らない。「弱点復習 = attempt して間違えた / 遅かった」セット推し向けには適切だが、「section 全問題を復習」用途には不足する可能性あり（user 判断ポイント §9-2）。

### 1-3. exercise/session に problemIds 指定起動の既存仕組みがあるか

**結論: 無い**。

[src/app/exercise/session/page.tsx:172-177](src/app/exercise/session/page.tsx#L172):

```ts
const subjectId = searchParams.get('subject') || undefined;
const chapterId = searchParams.get('chapter') || undefined;
const sectionTitle = searchParams.get('section') || undefined;
const lapNo = Number(searchParams.get('lap') || '1');
let problems = await getReadyProblems(subjectId, chapterId, sectionTitle);
```

→ 現状 `subject` / `chapter` / `section` / `lap` / `random` の query param のみ。problemIds 指定エントリは **未実装**。

ただし db.ts 内で `db.problems.where('problemId').anyOf(ids).toArray()` の Dexie パターンは既に [src/app/review/page.tsx:26-28](src/app/review/page.tsx#L26) で利用済（buildDeepDivePrompt 内）= **技術的には実装可能**。

### 1-4. 最小安全設計の route / query / state 候補

3 案の比較：

#### 案 A. URL 直接渡し `?problemIds=ID1,ID2,...&lap=1`

| 観点 | 判定 |
|---|---|
| 実装複雑度 | 低（既存パターンに 1 param 追加） |
| URL 長 | 50 IDs × 16 chars ≈ 800 chars / 100 IDs ≈ 1600 chars。**多くの section で許容範囲**だが、極端に大きい section（例：minpo-saiken）で 2000 chars 制限に近づく可能性 |
| URL pollution | 大（query string が長くなる） |
| ブックマーク可能性 | ○（メリット） |
| state 管理 | 不要 |
| section key 混入 | **なし**（problemIds のみ渡す = 5 必須ガードに整合） |
| 復元性 | reload で再構築可能 |

#### 案 B. sessionStorage トークン + URL `?reviewSession={token}`（**推奨**）

| 観点 | 判定 |
|---|---|
| 実装複雑度 | 中（token 生成 + storage write/read 1 箇所ずつ） |
| URL 長 | 短い（token 1 文字列のみ） |
| URL pollution | なし |
| ブックマーク可能性 | × （タブ閉じで失効、復習セッションは一時用途のため許容） |
| state 管理 | sessionStorage に JSON 1 件（key = `review-session-{ts}`）|
| section key 混入 | **なし** |
| 復元性 | sessionStorage 経由（タブ閉じで消える、reload は OK） |
| **8 必須ガード照合** | localStorage **書き換え禁止** だが **sessionStorage は別 storage**。新規 key の write のみ・既存 key の改変なし = **ガード抵触しない**（sessionStorage は「IndexedDB / localStorage」リストに含まれないため） |

**注**: ガードが「IndexedDB / localStorage」を明示。sessionStorage は仕様上別物（タブ単位、tab 閉じで自動破棄）。本 audit の lock 範囲を厳格に解釈すれば sessionStorage は対象外。ただし user の意図が「あらゆる永続 storage に書かない」なら案 A に倒すべき。

#### 案 C. IndexedDB 新 table（review_packs）追加 — **不採用**

| 観点 | 判定 |
|---|---|
| schema 変更 | 必要（version bump） |
| **8 必須ガード照合** | 「IndexedDB を書き換えない」に **抵触の可能性大**（既存 table 改変ではないが schema 変更は触れに該当） |
| over-engineering | 一時用途に対して過剰 |

→ **不採用**。

#### 推奨

**案 B（sessionStorage トークン）**。次善が **案 A（URL 直接渡し）**。実装時に user 確認。

### 1-5. sectionTitle ではなく candidateProblemIds を渡す設計の可否

**可能、かつこれが正解**。

理由:
1. candidateProblemIds は stable identifier の集合 → URL/state を介して安全に渡せる
2. raw `sectionTitle` を渡すと exercise/session の `getReadyProblems(subj, chap, section)` が **display label 比較**するため不一致 → 0 問になりうる（review_count_audit §1-9）
3. `displaySectionTitle` への変換を builder で行うのは **section 統合に該当 = 5 必須ガード抵触**（前回 review count audit §4-1 案 A と同根）
4. problemIds 直接渡しは section key 経由を bypass するため、key 不一致問題を **構造的に回避**

### 1-6. attempts / problemAttrs / problems の関係

3 table 分離（[src/lib/db.ts:48-59](src/lib/db.ts#L48), Dexie v5/v6）:

| table | 主キー | 内容 | 復習セッションでの役割 |
|---|---|---|---|
| `problems` | `++id, &problemId` | 問題本文 / 解説の text データ（status='ready'/'draft') | 出題対象抽出（status='ready' のみ） |
| `problemAttrs` | `++id, &problemId` | 分類 / フラグ / displaySectionTitle（[src/lib/db.ts:171-200](src/lib/db.ts#L171)）| 出題判定フィルタ（isExcluded / needsSourceCheck / answerBoolean / aiTriageStatus） |
| `attempts` | `++id, problemId, lapNo, [problemId+lapNo]` | 回答履歴 | 既回答除外 / lap 計算 |

**復習セッション起動時に必要**:
1. `problems.where('problemId').anyOf(candidateProblemIds).toArray()` で問題本文取得
2. `problemAttrs.where('problemId').anyOf(candidateProblemIds).toArray()` で属性取得
3. 既存 `getReadyProblems` 同等のフィルタ適用（excluded / needsSourceCheck / answerBoolean null / status !== 'ready'）
4. 既存 attempts ベースの「同 lap 回答済み除外」ロジックは流用可能（line 181-193）

### 1-7. 「この弱点だけ演習」導線の最小変更ファイル候補

**実装する場合**（現時点では実装しない）の最小変更スコープ：

| ファイル | 変更内容 | 行数目安 |
|---|---|---|
| [src/lib/db.ts](src/lib/db.ts) | 新 helper `getReadyProblemsByIds(problemIds: string[]): Promise<ProblemForExercise[]>` を追加（既存 `getReadyProblems` のロジックを流用） | +30 行 |
| [src/app/exercise/session/page.tsx](src/app/exercise/session/page.tsx) | `useEffect` 内 init で `searchParams.get('reviewSession')` を読む分岐追加。token 経由で sessionStorage から problemIds を取得 → 新 helper 呼び出し | +20 行 |
| [src/app/review/page.tsx](src/app/review/page.tsx) | TopicCard 内に「演習で復習」ボタンを追加。onClick で sessionStorage write → router.push | +15 行 |

**変更しない**:
- `src/types/review-pack.ts`（既存 interface で十分）
- `src/lib/review-pack-builder.ts`（candidateProblemIds は既に出力されている）
- `src/data/sectionNormalization.ts` / `EXACT_MAPPING`
- `src/data/master.ts`
- `data/` / `public/data/` / DATA_VERSION
- Dexie schema（version 6 のまま）
- `src/lib/import-parsed.ts`
- `src/lib/stats.ts`

### 1-8. 既存の演習モードと衝突しないか

**衝突しない**。

理由:
1. URL param は **追加** = 既存 `?subject=&chapter=&section=` フローは無改変
2. session page で `reviewSession` param 検出時のみ新分岐 → 既存パスは fall-through（条件分岐の外側で従来 logic を維持）
3. lap 概念は維持（復習セッションも `lap` param を受け取る or 1 で開始）
4. attempts table への書き込みは既存 `upsertAttempt` 経由 → 履歴の互換性維持
5. random / sorting は既存ロジック流用（unaffected）

**新分岐の擬似コード**（実装は別 PR）:
```ts
const reviewSession = searchParams.get('reviewSession');
if (reviewSession) {
  const raw = sessionStorage.getItem(`review-session-${reviewSession}`);
  if (!raw) { /* error UI: 復習セッションが見つかりません */ return; }
  const { problemIds } = JSON.parse(raw);
  const problems = await getReadyProblemsByIds(problemIds);
  // 既存の lap-based answered filter, random, sort をそのまま適用
} else {
  // 既存パス
  const problems = await getReadyProblems(subjectId, chapterId, sectionTitle);
}
```

### 1-9. 復習対象が 0 件になる条件

| # | 条件 | 対処 |
|---|---|---|
| 1 | `candidateProblemIds` が空（理論上 builder で `attempts ≥ 3` の filter を通っているため空にならないはず） | UI で empty state 表示 |
| 2 | sessionStorage token が存在しない（タブ閉じ後リロード等） | エラー表示 + review page へリダイレクト案内 |
| 3 | 全 problemIds が `isExcluded === true` の状態（複数 patch の累積による） | 「対象問題が全て除外されています」表示 + review topic から AI 深掘りに誘導 |
| 4 | 全 problemIds が `needsSourceCheck === true` | 同上 |
| 5 | 全 problemIds が `answerBoolean === null/undefined`（記述式 / 未入力） | 同上 |
| 6 | 全 problemIds が `status !== 'ready'`（draft 等） | 同上 |
| 7 | 当該 lap で全 problem が回答済み（既存 line 191 の `unanswered.length === 0` 条件） | 既存 fall-through で全件再出題（既存挙動と同じ） |
| 8 | candidateProblemIds 生成時 (review page load) と session 開始時 (exercise/session) の間に DATA_VERSION refresh が走り、attrs が変わった | 新 helper の filter で即除外 → 件数減少 / 0 件 |

→ 全条件を「empty state UI」で吸収。data 修正・schema 変更不要。

### 1-10. 将来の DATA_VERSION 更新 / IndexedDB refresh との矛盾

**矛盾なし**:

1. **problemId は stable identifier**: KB2025-pNNN-qMM 形式は import 時に固定（[src/lib/db.ts:250](src/lib/db.ts#L250) `generateProblemId`）。DATA_VERSION 更新で再 import されても同じ問題には同じ ID。
2. **PreservedAttrs Map**（[src/lib/import-parsed.ts](src/lib/import-parsed.ts) PR #60 修正）: subjectId / chapterId / isExcluded / needsSourceCheck は v109 → v110 のような bump で保全される。candidateProblemIds 経由の filter 結果も維持される。
3. **sessionStorage は IndexedDB と独立**: refreshProblemDataIfNeeded() の挙動とは無関係に存続。
4. **session 開始時に必ず最新 filter を適用**: 起動時に getReadyProblemsByIds で最新 attrs を読むため、refresh 後もデータ整合は確保。
5. **attempts table は無改変**: 復習セッションでの回答も既存 attempts に追加されるだけ。lap 概念維持。

→ 設計は DATA_VERSION refresh / Dexie schema upgrade のいずれにも依存しないため、**将来の v111 / v112 / schema v7 移行があっても本設計は無改変で動作可能**。

---

## 2. 現行導線の整理

### 2-1. 現行ユーザー導線（review → 復習）

```
[/review] 弱点ダッシュボード
  ↓ 各 topic 表示（subjectName > chapterName > raw sectionTitle）
  ↓ TopicCard 展開 → AI 深掘りボタンのみ（GPT/Gemini プロンプト copy）
  ↓
[/exercise] チャプターセレクタ（別途遷移）
  ↓ subject → chapter → section（display label）→ lap 選択
  ↓ startSection() で /exercise/session?subject=&chapter=&section=&lap=
[/exercise/session] セッション
  ↓ getReadyProblems(subject, chapter, section[=display]) でフィルタ
```

**問題点**: review → exercise の **直接遷移リンクが不存在**。user は review で弱点を確認後、別途 /exercise を開いて記憶ベースで該当 section を選び直す必要がある。これが review_count_audit §0「一部しか復習できない」の真の原因。

### 2-2. 提案する新導線（**実装はしない**）

```
[/review] 弱点ダッシュボード
  ↓ TopicCard 展開
  ↓ 新規「演習で復習」ボタン (推奨案 B = sessionStorage)
    onClick:
      const token = `review-${Date.now()}`;
      sessionStorage.setItem(token, JSON.stringify({
        problemIds: topic.candidateProblemIds,
        topicLabel: topic.sectionTitle,  // 表示用のみ、key として使わない
        subjectName: topic.subjectName,
        chapterName: topic.chapterName,
      }));
      router.push(`/exercise/session?reviewSession=${token}&lap=1`);
  ↓
[/exercise/session?reviewSession=token]
  ↓ sessionStorage[token] から problemIds 取得
  ↓ getReadyProblemsByIds(problemIds) でフィルタ
  ↓ 既存 lap-based answered filter / random / sort 適用
  ↓ 既存 UI で出題（変更なし）
```

---

## 3. raw / display section key を使う案のリスク（採用不可の根拠）

| リスク | 詳細 |
|---|---|
| section key 不一致（review = raw / exercise = display） | review_count_audit §1-9 で確認済。raw を URL 渡し → exercise 側 effectiveDisplay 比較で 0 問 |
| EXACT_MAPPING 未整備 chapter で表示揺れ | minpo-bukken / kiso-chishiki-* など unmapped chapter で raw が複数バリアント存在 → URL 一意性が崩れる |
| 過去の分類崩壊事故との類似 | builder で raw → display に変えると section 統合が発生 = CLAUDE.md §1 の悪夢の再演 |
| URL 文字化け | section 名に日本語・記号が混在 → URL encode の取り扱いミスで bug 化しやすい |
| Maintenance burden | section key 設計変更が EXACT_MAPPING / sectionNormalization に波及するリスク |

→ **section key 直接渡しは構造的に避けるべき**。

---

## 4. candidateProblemIds ベース案の可否

**可（推奨）**。

| 観点 | 評価 |
|---|---|
| Stability | problemId は import 全期間 stable |
| Independence from key system | section / chapter / subject の key 表現変更に影響されない |
| Filter 流用性 | 既存 `getReadyProblems` の filter chain を Dexie `where('problemId').anyOf()` で再利用可能 |
| Test 容易性 | 入力 = problemIds の array、出力 = ProblemForExercise の array、純関数的に test 可能 |
| 復元性 | review page reload で candidateProblemIds は再生成、stale risk なし |

**唯一の弱点**: candidateProblemIds = attempted のみ。未 attempt 問題は含まれない。「弱点復習」用途では妥当だが、user の意図次第で「section 全 ready 問題」モードを別途用意する余地あり（§9 user 判断ポイント）。

---

## 5. 採用推奨案（最小設計）

### 5-1. 推奨

**sessionStorage トークン経由ハンドオフ + 新 helper `getReadyProblemsByIds()`**。

### 5-2. 設計仕様（実装は別 PR）

#### 5-2-1. 新 helper（src/lib/db.ts）

```ts
export async function getReadyProblemsByIds(
  problemIds: string[],
): Promise<ProblemForExercise[]> {
  // 最低限 5 件の filter を ID 取得後に **必ず再適用** する
  // （candidateProblemIds は weak topic 生成時点のスナップショットのため、
  //  生成後に isExcluded / needsSourceCheck / discard 化された問題が混入する可能性あり）
  //
  // - status === 'ready'           ← problems table 側
  // - isExcluded !== true          ← problemAttrs 側
  // - needsSourceCheck !== true    ← problemAttrs 側
  // - aiTriageStatus !== 'discard' ← problemAttrs 側（既存 getReadyProblems には無いが、
  //                                   buildReviewPackInput と整合させるため必須）
  // - answerBoolean !== null/undefined ← problemAttrs 側
  //
  // displaySectionTitle は既存ロジック（attr.displaySectionTitle ?? resolveDisplaySectionTitle(...)）で算出
  // section key 比較は **行わない**（problemIds 直接指定が key 不一致を bypass する設計）
}
```

**重要（実装時の必須仕様）**: 上記 5 件は **最低限** であり、ID で問題を取った後に必ず再適用する。candidateProblemIds は **review page load 時点のスナップショット**であり、その後に isExcluded / needsSourceCheck / discard 化された問題が含まれる可能性があるため、session 起動時に再フィルタしないと「除外済み問題が再出題される」事故が起きる（user directive 2026-04-27）。

#### 5-2-2. exercise/session 分岐（src/app/exercise/session/page.tsx）

- `reviewSession` query param 検出
- sessionStorage 読み出し → problemIds 取得
- `getReadyProblemsByIds(problemIds)` 呼び出し
- それ以外（既存 subject/chapter/section/lap）は無改変

#### 5-2-3. review page TopicCard ボタン（src/app/review/page.tsx）

- topic.candidateProblemIds から sessionStorage に書き込み
- token 付き URL へ router.push
- sessionStorage キーは衝突回避のため timestamp ベース

### 5-3. 実装時の禁止事項

実装 PR で **絶対に行ってはいけないこと**:

| # | 禁止事項 | 理由 |
|---|---|---|
| 1 | `review-pack-builder.ts` の集計キーを raw → display に変更する | section 統合に該当（5 必須ガード抵触、過去の分類崩壊再発） |
| 2 | `getReadyProblems` の挙動変更（既存 section key 比較を消すなど） | 既存導線の挙動が変わる、回帰リスク大 |
| 3 | `sectionTitle` を URL に含める | key 不一致 / 0 問発生 / URL pollution |
| 4 | `EXACT_MAPPING` / `sectionNormalization.ts` の編集 | 表示層の正規化は本設計と独立（別タスク） |
| 5 | Dexie schema の version bump | 不要、既存 table のみで成立 |
| 6 | DATA_VERSION の bump | 本機能は data 無変更 |
| 7 | data/ / public/data/ の編集 | 本機能は data 無変更 |
| 8 | localStorage / IndexedDB の write | sessionStorage（タブ単位）のみで成立 |
| 9 | candidateProblemIds の意味変更（attempted のみ → 全 ready 問題） | 別 issue。今回は既存仕様で進める |

### 5-4. テスト観点

実装 PR でカバーすべき test ケース（参考）:

| # | ケース | 期待挙動 |
|---|---|---|
| T1 | 通常の review → exercise 遷移 | candidateProblemIds の問題が出題される |
| T2 | sessionStorage token 不存在 | empty state UI / review page 戻り誘導 |
| T3 | candidateProblemIds 空 | empty state UI |
| T4 | 全 problem が isExcluded | empty state UI（filter 通過後 0 件） |
| T5 | 既存 ?subject=&chapter=&section= フロー | 既存挙動維持（無改変） |
| T6 | DATA_VERSION refresh 直後の遷移 | 新 helper が最新 attrs で filter |
| T7 | lap 違いの再復習（lap=2 等） | 既存の lap-based answered filter で動作 |
| T8 | random フラグ併用 | 既存 random shuffle 動作 |
| T9 | 復習セッション完走後の戻り先 | 既存の完走 UI（特殊な戻り先設定不要） |

---

## 6. 採用しない案と理由

### 6-1. 案 C（IndexedDB 新 table 追加）

- schema 変更は 5 必須ガードの「IndexedDB 書き換え」に近接（厳格解釈で抵触リスク）
- 一時用途のため永続化過剰（review session は次回演習時に regenerate される設計が自然）
- migration 必要 = ガード抵触

### 6-2. builder の集計キーを raw → display に変更（review_count_audit §4-1 案 A の再掲）

- **section 統合に該当**
- raw 違いの section が一つにまとめられ、過去の分類崩壊類似の事故リスク
- 既に user directive で「採用不可」確定済み

### 6-3. URL 直接渡し（案 A）

- 採用可能だが、URL 長制限 / pollution の懸念
- 案 B（sessionStorage）に劣後

→ ただし sessionStorage が技術的に使えない場合（極稀）の **fallback として温存**。

### 6-4. exercise/session の挙動変更（既存 section key 比較を撤廃）

- 既存導線（チャプターセレクタ → 演習）が壊れる
- 回帰リスク大

---

## 7. 触らないこと（再確認）

### 本 audit が触っていないもの

| 領域 | 状態 |
|---|---|
| `data/reviewed_import.json` | 無改変 |
| `public/data/reviewed_import.json` | 無改変 |
| `src/` 配下 | 無改変（read のみ） |
| `DATA_VERSION` | 無改変 |
| `context/stable/ingestion_flow.md` | 無改変 |
| `context/working/handoff.md` / `current_status.md` / `known_issues.md` / `error_reports_queue.md` / `classification_number_audit.md` / `p203_source_check.md` / `review_count_audit.md` | 無改変 |
| `src/data/sectionNormalization.ts` / `EXACT_MAPPING` | 無改変 |
| `src/lib/review-pack-builder.ts` | 無改変 |
| `src/lib/db.ts` | 無改変（read のみ） |
| Dexie schema | 無改変（v6 維持） |
| IndexedDB / localStorage | 触っていない |
| sessionStorage | 触っていない（設計言及のみ） |
| `node_modules` / `package.json` / `package-lock.json` | 無改変 |
| `docs/` / `scripts/` | 無改変 |

### 実装 PR でも触らないもの（5-3 の禁止事項参照）

builder 集計キー / sectionNormalization / EXACT_MAPPING / Dexie schema / DATA_VERSION / data 等。

---

## 8. read-only 確認 log

| ファイル | 行為 |
|---|---|
| `src/types/review-pack.ts` | read（WeakTopicInput interface 確認） |
| `src/lib/review-pack-builder.ts` | read（candidateProblemIds 生成箇所、前回 audit 流用）|
| `src/app/review/page.tsx` | read（TopicCard / buildDeepDivePrompt の Dexie pattern）|
| `src/app/exercise/session/page.tsx` | read（query param 受信箇所）|
| `src/app/exercise/page.tsx` | read（startSection / 既存導線、前回 audit 流用）|
| `src/lib/db.ts` | read（getReadyProblems / Dexie schema / generateProblemId）|
| `context/working/review_to_exercise_design_audit.md` | **新規作成 = 本ファイル** |

---

## 9. user 判断ポイント

1. **本 audit の保全方針**: docs-only PR 化するか / untracked 維持
2. **設計案の確定**: 推奨 = 案 B（sessionStorage）/ 次善 = 案 A（URL 直接渡し）。どちらで進めるか
3. **candidateProblemIds の範囲拡張**: 現状 = attempted のみ。「section 全 ready 問題」を含めるオプションを将来追加するか
4. **実装着手時期**: 本 audit merge 後すぐ着手するか / 他タスク（C: INITIAL_SHOW_COUNT 増加 / D: raw/display 併記）を先に挟むか
5. **テスト方針**: 実装 PR で integration test を必須化するか（既存 vitest 流用 + Dexie の in-memory test）

---

## 10. 重要遵守事項（再確認）

- read-only design audit として開始 → 本ファイル作成のみ、他無改変
- 変更が発生したら即停止して報告 → 変更ゼロで完了
- raw `sectionTitle` 正規化禁止 → 設計でも raw を URL key にしない
- displaySectionTitle と raw の混同禁止 → 設計で両者を区別、URL key には **どちらも使わず** problemIds を使う
- section / chapter / subject 統合・分割・rename 禁止 → builder 集計キー無改変
- EXACT_MAPPING / sectionNormalization.ts 触らない → 本設計と独立
- builder の raw 集計を display 集計へ変更しない → §6-2 で明示拒否
- IndexedDB / localStorage 削除・初期化・書き換え禁止 → 本設計は sessionStorage のみ（タブ単位）
- data / public/data / src / DATA_VERSION 変更禁止 → 本 audit / 推奨実装ともに data 無変更
- 実装・patch・script・migration 作らない → 本 audit は設計のみ、実装 PR は別途 user 明示 GO
- commit / PR は **user 判断待ち**
