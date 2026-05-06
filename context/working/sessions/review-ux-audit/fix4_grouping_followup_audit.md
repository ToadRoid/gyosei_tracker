# Fix-4 follow-up: grouping correction audit

date: 2026-05-07
base: origin/main `cc062ac` (PR #143 merged)

---

## 問題の再整理

Fix-4 で section-level (354 cards) → chapter-level (19 cards) に変更した。
しかし実画面で確認すると、chapter-level は 1 カードが大きすぎる可能性がある。

そもそも Fix-4 以前の「354 カードが多すぎる」問題は、Fix-3 で INITIAL_SHOW_COUNT を 50 に拡大する前の状態で評価されていた。Fix-3 後なら section-level cards でも表示件数は十分だった可能性がある。

---

## データ分布（confirmed: reviewed_import.json から直接集計）

### chapter-level: 19 groups

| chapter | branches | sections | 最大 section |
|---|---|---|---|
| minpo-saiken | 376 | 28 | 債権総論(113) |
| gyosei-ippan | 271 | 54 | 行政法の一般的な法理論(42) |
| gyosei-chiho | 250 | 54 | 地方公共団体の機関(20) |
| minpo-bukken | 205 | 24 | 担保物権(64) |
| minpo-sosoku | 181 | 30 | 03_代理(32) |
| shoho-kaisha | 172 | 16 | 株式会社(101) |
| gyosei-jiken | 156 | 30 | 03_原告適格(14) |
| gyosei-tetsuzuki | 144 | 18 | 不利益処分(24) |
| gyosei-fufuku | 129 | 21 | 03_審理手続・裁決(17) |
| kenpo-tochi | 100 | 23 | 05_地方自治(13) |
| kiso-chishiki-gyomu | 100 | 10 | 業務関連諸法令(37) |
| minpo-shinzoku | 74 | 7 | 親族(50) |
| shoho-shoho | 67 | 3 | 商行為(43) |
| gyosei-kokubai | 61 | 10 | 損失補償(20) |
| kiso-chishiki-joho | 61 | 5 | 情報通信(41) |
| minpo-sozoku | 58 | 12 | 相続(24) |
| kiso-hogaku-gairon | 32 | 6 | 法の効力(7) |
| kiso-hogaku-funso | 10 | 2 | 5 |
| kenpo-jinken | 1 | 1 | 1 |

chapter-level の問題:
- 1 カードに 54 sections、376 branches が入る（例: minpo-saiken）
- セクション内訳を展開すると 28〜54 行の内訳が並ぶ → 展開部分が画面をはみ出す
- 弱点特定の粒度としては粗すぎる（「民法・債権が弱い」は対策に使えない）

### section-level: 354 groups

| section size | count | 割合 |
|---|---|---|
| 1 branch | 65 | 18% |
| 2 branches | 51 | 14% |
| 3-5 | 118 | 33% |
| 6-10 | 74 | 21% |
| 11+ | 46 | 13% |

section-level の問題:
- 65 sections が 1 branch のみ → 1 問しかないカードが並ぶ
- 354 cards は多いが、Fix-3 の INITIAL_SHOW_COUNT=50 で緩和される
- 弱点特定には最適な粒度

---

## 案の再評価

### 案C: chapter filter + section cards（推奨）

**方針**: section-level cards に戻す + 弱点順タブにも chapter filter を追加

- grouping は `subjectId||chapterId||sectionTitle`（Fix-4 前に戻す）
- 弱点順タブにも教材順タブと同じ filter chips を表示
- filter で chapter を絞ると、そのchapter内のsection cardsのみ表示
- INITIAL_SHOW_COUNT=50 は維持

**メリット**:
- section 粒度で弱点特定が可能（「代理が弱い」「担保物権が弱い」）
- chapter filter で一覧性を確保（354 → filter後 3〜54 cards）
- 既存 SYLLABUS_FILTERS インフラをそのまま弱点順タブにも流用
- 1 branch section も filter 後なら気にならない

**デメリット**:
- Fix-4 の revert が必要（ただし型は SectionSummary を残してもよい）
- filter 未選択時は 354 cards だが、INITIAL_SHOW_COUNT=50 で緩和される

**実装規模**: 中
- review-pack-builder.ts: revert to section-level grouping（sections 配列は残す）
- review-syllabus-builder.ts: revert to section-level grouping
- page.tsx: SYLLABUS_FILTERS を弱点順タブにも適用、filter chips 表示
- types: 変更なし（SectionSummary は残してよい）

### 案A: Fix-4 revert only

- section-level cards に戻すだけ
- filter は教材順タブのみ（既存のまま）
- 弱点順タブは 354 cards のまま、INITIAL_SHOW_COUNT=50 で制限

**メリット**: 最小変更
**デメリット**: 弱点順タブの一覧性は改善しない

### 案B: grouping toggle（章 / セクション切替）

**メリット**: ユーザーが選べる
**デメリット**: 実装量が多い、UI が複雑になる

### 案D: 現状維持（chapter cards）

**メリット**: 変更なし
**デメリット**: 1 カードが大きすぎる、弱点特定に使えない

---

## 推奨: 案C（chapter filter + section cards）

### 理由

1. **弱点特定の粒度**: section-level が最適。「代理」「担保物権」「債権総論」は対策可能な単位
2. **一覧性**: chapter filter で 354 → 3〜54 に絞れる。INITIAL_SHOW_COUNT=50 内に収まる
3. **既存インフラ**: SYLLABUS_FILTERS がすでに教材順タブで動作。弱点順タブへの適用は matchesSyllabusFilter の使用箇所を増やすだけ
4. **情報密度**: 1 カード = 1 section = 3〜10問が多数派。画面に 5〜8 カード表示可能

### Fix-4 との差分

| 項目 | Fix-4 (current) | 案C |
|---|---|---|
| grouping | chapter (19) | section (354) |
| filter | 教材順のみ | 両タブ |
| 弱点特定 | chapter 粒度（粗い） | section 粒度（適切） |
| 1カードの大きさ | 大（最大376問） | 適切（中央値4問） |
| sections 配列 | 使用中 | 不要（削除可能） |

---

## 最小実装 patch plan

### Step 1: revert builders to section-level grouping

review-pack-builder.ts:
- grouping key を `subjectId||chapterId||sectionTitle` に戻す
- GroupData に sectionTitle を復帰
- sections 配列生成を削除
- sectionStats 追跡を削除

review-syllabus-builder.ts:
- 同上

### Step 2: page.tsx に filter chips を弱点順タブにも表示

- `reviewTab === 'syllabus'` 条件で囲まれている filter chips を両タブで表示
- `activeTopics` の算出で弱点順タブにも filter を適用
- matchesSyllabusFilter はそのまま使用（subjectId/chapterId ベース）

### Step 3: page.tsx TopicCard のヘッダーを section 表示に戻す

- title: `topic.sectionTitle`
- subtitle: `topic.subjectName > topic.chapterName`
- section 内訳表示を削除

### Step 4: types cleanup（optional）

- SectionSummary は残しても害はないが、使われなくなるなら削除
- WeakTopicInput.sections? は削除可能

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| src/lib/review-pack-builder.ts | section-level grouping に revert |
| src/lib/review-syllabus-builder.ts | section-level grouping に revert |
| src/app/review/page.tsx | filter chips を両タブ表示、TopicCard section 表示に戻す |
| src/types/review-pack.ts | SectionSummary / sections? 削除（optional） |

### 変更しない

- data/reviewed_import.json
- public/data/reviewed_import.json
- src/lib/db.ts
- DATA_VERSION
- stash@{0}

---

## 禁止事項確認

- [x] src 修正なし（設計のみ）
- [x] data patch なし
- [x] public data patch なし
- [x] stash apply/drop なし
- [x] DATA_VERSION bump なし
- [x] commit / push / PR なし
