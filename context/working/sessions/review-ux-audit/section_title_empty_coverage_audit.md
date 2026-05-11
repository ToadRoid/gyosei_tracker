# sectionTitle empty coverage audit

date: 2026-05-11
base: origin/main `f16d684` (PR #147 merged)

---

## 結論（先出し）

**「データ欠損」と「集計漏れ」の複合 issue**。仕様除外ではない。

| 観点 | 判定 |
|---|---|
| データ欠損 | YES — 71 branches の sectionTitle が抜けている（OCR/parser/手入力の不備） |
| 集計漏れ | YES — 演習で回答できるのに /review からは消える（user 視点で issue） |
| 仕様除外 | NO — 設計意図として除外したのではなく、null guard が silent drop になっている |

優先度: **中〜高**。43 branches は siblings から自動補完できる。28 branches（5 problems 分）は source 照合が必要。

---

## 1. 件数（data / public 一致）

| ファイル | total branches | empty sectionTitle |
|---|---|---|
| data/reviewed_import.json | 2,448 | 71 |
| public/data/reviewed_import.json | 2,448 | 71 |
| 差分 | 0 | 0 |

**両ファイルは完全に同期**。data 側の問題は public 側にもそのまま伝播している。

---

## 2. 71 branches の内訳

### subject 別

| subject | empty 数 |
|---|---|
| minpo | 52 |
| shoho | 13 |
| kenpo | 3 |
| gyosei | 3 |

### chapter 別

| chapter | empty 数 |
|---|---|
| minpo/minpo-saiken | 36 |
| shoho/shoho-kaisha | 13 |
| minpo/minpo-shinzoku | 10 |
| minpo/minpo-bukken | 4 |
| kenpo/kenpo-tochi | 2 |
| minpo/minpo-sozoku | 2 |
| kenpo/kenpo-jinken | 1 |
| gyosei/gyosei-ippan | 1 |
| gyosei/gyosei-fufuku | 1 |
| gyosei/gyosei-chiho | 1 |

すべて chapterCandidate は埋まっている（chapter 単位の分類は成立）。subjectId/chapterId は欠損していない。

### questionType 別

全 71 branches とも `questionType: undefined`（descriptive ではない通常問題）。

### sourcePage 別（top 10）

| sourcePage | empty 数 |
|---|---|
| p.368 | 7 |
| p.348 | 6 |
| p.359 | 6 |
| p.401 | 6 |
| p.345 | 5 |
| p.262 | 4 |
| p.310 | 4 |
| p.319 | 4 |
| p.333 | 4 |
| p.334 | 4 |

ページ単位で集中しており、特定ページの OCR/parser 段階で section 見出し抽出が失敗した可能性が強い。

---

## 3. 復元可能性の判定

`originalProblemId` 内の sibling branches（同じページの他の seqNo）の sectionTitle を参照して復元できるかを判定:

| 分類 | 件数 |
|---|---|
| **recoverable**（siblings から推定可能） | 43 branches |
| **all-empty**（全 siblings も空） | 28 branches |
| → all-empty problems 数 | 5 problems |

### Recoverable 例

```
KB2025-p003-q01: seq1-6=[01_内閣], seq7=EMPTY  ← seq7 は 01_内閣 と推定可
KB2025-p016-q01: seq1-5=[05_地方自治・憲法改正], seq6-7=EMPTY  ← 同上
KB2025-p051-q01: seq1-4=[行政契約], seq5=EMPTY  ← 同上
KB2025-p262-q01: seq1-4=EMPTY, seq5=[4 用益物権]  ← seq1-4 が 用益物権 とは限らない（前 section の可能性）
```

「最後の seq が EMPTY」のパターンは siblings からの推定が安全だが、「最初の seq が EMPTY」のパターンは前 section に属している可能性があり、source 確認が望ましい。

### All-empty problems（5件、source 確認必須）

| originalProblemId | sourcePage | chapter | branch数 |
|---|---|---|---|
| KB2025-p319-q01 | p.319 | minpo-saiken | 4 |
| KB2025-p345-q01 | p.345 | minpo-saiken | 5 |
| KB2025-p359-q01 | p.359 | minpo-saiken | 6 |
| KB2025-p368-q01 | p.368 | minpo-shinzoku | 7 |
| KB2025-p401-q01 | p.401 | shoho-kaisha | 6 |

これら 5 problems は **同じページの全 branches が EMPTY** で、内部参照では復元不可。原本（Kindle）の見出し照合が必要。

問題文の内容から推定:
- p.319 → 「契約の成立 / 同時履行の抗弁権」あたり
- p.345 → 「委任契約 / 事務管理」
- p.359 → 「不法行為」
- p.368 → 「親子関係（嫡出推定・認知）」
- p.401 → 「会社の設立」

これらは現行マスタの sectionTitle に対応するものがあるはずだが、断定には原本確認が必要。

---

## 4. review builder での扱い

[review-pack-builder.ts:57](src/lib/review-pack-builder.ts:57):
```typescript
if (!sectionTitle) continue;
```

[review-syllabus-builder.ts:102](src/lib/review-syllabus-builder.ts:102):
```typescript
if (!sectionTitle) continue;
```

- **両 builder とも sectionTitle 空を silent skip**
- weak-order / syllabus-order の両タブから消える
- candidateProblemIds にも含まれないので AI Deep Dive 対象にもならない

---

## 5. UI上の影響（重要）

### 演習画面: **回答可能**

[db.ts:264 `getReadyProblems`](src/lib/db.ts:264) は subjectId/chapterId のみで filter する。sectionTitle 空でも problem.status === 'ready' なら出題される。

つまり:
- ユーザーは subject/chapter ベースで演習を選んだ場合、これら 71 branches を**問題として目にする**
- 回答すれば attempts レコードは作成される
- DB に attempts が積まれる

### /review 画面: **消える**

- builder が skip するため、回答済みでもカードに出てこない
- 「あの p.401 の会社設立の問題、答えたのに復習一覧にいない」となる
- 弱点特定の対象から漏れる

### overall stats: **反映される**

[review-pack-builder.ts:131](src/lib/review-pack-builder.ts:131):
```typescript
const totalAttempts = allAttempts.length;
```

これは builder 内 group filter とは別に、`allAttempts` を直接カウント。**回答数や全体正答率には含まれる**。

→ 「全体 92% / でも該当 section card が見当たらない」という不整合が UI 上に発生し得る。

---

## 6. 「集計漏れ」か「データ欠損」か「仕様除外」か

| 観点 | 判定 | 説明 |
|---|---|---|
| 仕様除外 | **NO** | コード上は単なる `if (!sectionTitle) continue;` の null guard。設計意図的な除外ではない |
| データ欠損 | **YES** | 元データの sectionTitle が空。OCR / parser / 手入力のいずれかで脱落 |
| 集計漏れ | **YES（user 視点）** | 演習で回答できる問題が /review に出ないのは coverage gap |

---

## 7. 修正候補の比較

### 案A: data patch（sectionTitle を補完）

**実装**:
- 43 branches: siblings から推定して data/reviewed_import.json と public/data/reviewed_import.json に patch
- 28 branches (5 problems): 原本 (Kindle) で section 見出しを照合してから patch

**メリット**:
- データ正常化が本筋。今後の builder 変更に依存しない
- /review、AI Deep Dive、教材順タブ全部で自然に復活する

**デメリット**:
- 28 branches は source 確認待ちでブロックされる
- data patch なので reviewed_import 規約に従う（page 単位の最小 patch）

**実装規模**:
- 43 branches: 中（patch 自動化可能、ただし siblings 推定の妥当性レビュー必要）
- 28 branches: source 照合 + manual patch

### 案B: builder fallback（chapterName を section として使う）

**実装**:
- `sectionTitle || chapterName || '未分類'` で fallback
- 71 branches は「（chapter 名と同じ）」section card にまとめられる

**メリット**:
- data 修正不要、即時実装可
- 演習で回答した問題が /review から消える issue を解消

**デメリット**:
- 「chapter と同名 section」が混入し、UI が紛らわしい
- 本当の section 分類は失われたまま
- 既存 section card と区別がつきにくい

**実装規模**: 小（builder のみ、UI 影響少）

### 案C: 「未分類」セクション card で救出

**実装**:
- sectionTitle 空のものを `chapterName + ' / 未分類'` のような sentinel で group 化
- 既存 section card と並ぶ別 card として表示

**メリット**:
- ユーザーに「分類漏れがある」ことが視覚的に伝わる
- 復習導線は確保しつつ、データ問題の存在も明示

**デメリット**:
- 一時的措置に見える card が残る
- 案A の data 修正が進めば不要になる

**実装規模**: 小〜中（builder のみ）

### 案D: 現状維持（仕様除外として明示）

**判定: 不採用**。
演習で回答できるのに /review から消えるのは UX 一貫性の問題。

---

## 8. 推奨方針

### Phase 1（即時、最小安全策）: **案C（「未分類」section card）**

- builder で sectionTitle 空 → `'(未分類)'` sentinel に置換
- /review で「未分類」card として救出
- ユーザー視点の coverage gap を即解消
- 「未分類」card に何問あるかが見えるので、データ修正の優先度判断にも使える

実装規模: 小（builder 2ファイル）

### Phase 2（中期、恒久策）: **案A の 43 branches を data patch**

- siblings から推定 → patch
- reviewed_import 規約に従って page 単位
- 一括 review でも安全に進められる

### Phase 3（要 source 確認）: **案A の 28 branches を data patch**

- 5 problems を Kindle 原本で section 見出し照合
- 原本確認後に patch

### Phase 4（恒久）: import/parser 改善

- 次回 OCR バッチで section 見出しが落ちないよう parser 改善
- needsSourceCheck 自動検知に「sectionTitle 空」を追加

---

## 9. 推奨次アクション（小さく）

1. **Phase 1（案C）の実装プラン作成** — 別 audit doc または直接 patch plan
2. **5 problems の source 確認手順整理** — Kindle 確認の手順を doc 化
3. **43 branches の sibling 推定リスト作成** — レビュー可能な形で

ただし、source 確認・data patch 系は `ocr-text-quality-source-check` セッションの本筋なので、Phase 1 だけ review-ux-audit セッションで進めるのが境界として自然。

---

## 禁止事項確認

- [x] src 修正なし
- [x] data 修正なし
- [x] public data 修正なし
- [x] answerBoolean 変更なし
- [x] questionText / explanationText 変更なし
- [x] import 実行なし
- [x] DATA_VERSION bump なし
- [x] stash apply/drop なし
- [x] commit / push / PR なし
