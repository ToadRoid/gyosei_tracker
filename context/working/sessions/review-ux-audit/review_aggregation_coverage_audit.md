# /review aggregation coverage audit

date: 2026-05-11
base: origin/main `44c14d9` (PR #145 merged)

---

## 結論（先出し）

**仕様どおりであり、集計漏れではない。**ただしユーザーから見ると「1問回答」表示は誤解を招く。

- `totalAttempts` は「**回答試行回数（attempts レコード数）**」を数えている
- 「n問回答」は問題数ではなく、attempt の発生回数を表す
- /review は **回答済み履歴のみ** を集計対象とする設計（未回答問題はカード化しない）
- 「1周目で1問だけ回答した section」は実際に「1問回答」として正しく表示される

ただし、以下の改善余地がある:
1. 「n問回答」ラベルが attempts なのか unique problems なのか曖昧
2. weak タブ description が「正答率が低いセクション」のみで、「回答済み」と明示していない
3. 1周目だけ回答した section と、複数周回した section が同じ表示になり区別不可

---

## 各質問への回答

### Q1. 「n問回答」は何を数えているか

**`attempts` テーブルのレコード数（attempt count）**。1 問を 2 回回答すれば「2問回答」になる。

[review-pack-builder.ts:78-80](src/lib/review-pack-builder.ts:78):
```typescript
group.problemIds.add(attempt.problemId);
group.totalAttempts += 1;
if (attempt.isCorrect) group.correctCount += 1;
```

- ループは `for (const attempt of allAttempts)` で attempts を順にカウント
- `problemIds` は Set で unique 化しているが、表示には使われていない
- `totalAttempts` がそのまま `{topic.totalAttempts}問回答` として表示される

[page.tsx:401](src/app/review/page.tsx:401):
```tsx
<span>{topic.totalAttempts}問回答</span>
```

**→ 正確には「n回回答」または「のべn問」**。

### Q2. sectionTitle ごとの全問題数と回答済み問題数の差

`reviewed_import.json` には **2,448 branches** が存在するが、/review には以下の二段階で絞られる:

**段階1: ソースデータ filter（builder 内）**
- `sectionTitle === ''` の 71 branches は除外（[review-pack-builder.ts:57](src/lib/review-pack-builder.ts:57)）
- 利用可能母数: 2,448 → 2,377 (97%)

**段階2: attempts filter**
- 回答済みでない section はそもそも group に登場しない
- ループは attempts 起点なので、未回答 problem は集計対象外

**結果**: section ごとに「全問題数」は表示されておらず、ユーザーが何問残しているかは /review から読めない。

### Q3. chapterId ごとの全問題数と回答済み問題数の差

chapter filter は表示のみに作用し、集計対象は変えない。chapter 内のどの section が回答済みかは見えるが、未回答 section は出ない。

例: `minpo-saiken` は全 30 sections・376 branches 存在（reviewed_import.json 直接集計）するが、/review には**回答済みの section のみ**表示される。

### Q4. 「全93件」「教材順115」などのカウントの意味

- **「全n件」**: `activeTopics.length`（[page.tsx:624](src/app/review/page.tsx:624)）
  - = filtered topics の総数（section card 数）
  - **回答済み section の数**であって、全 section 数ではない

- **タブ右の数字（弱点順 / 教材順）**: `data.weakTopics.length` / `syllabusTopics.length`
  - 同じく回答済み section 数（filter 前）

教材順タブの description は **`教材順の回答済みセクション`** と明示しているのに対し、弱点順タブは **`正答率が低いセクション`** のみで「回答済み」の qualifier が欠落。これは表記ミスレベル。

### Q5. 「行政事件訴訟の種類 1問回答」は仕様か集計漏れか

**仕様どおり**。

考えられる発生パターン:
- その section に branches は複数あるが、ユーザーが 1 問だけ回答した
- その section に branches が 1 問しかない（reviewed_import.json 集計で 65 sections が 1 branch のみ）
- 2 周目に入っておらず、1 周目で 1 attempt 記録のみ

正しい意味は「**この section について 1 回 attempt がある**」。

「集計漏れ」ではないが、ユーザーが「1問しかない section」と「未回答の問題が大量にある section」を区別できない問題はある。

### Q6. 未回答問題を /review に出すべきか

**現状の設計意図**: /review は「弱点を特定して復習する」場であり、attempt 履歴ベースで accuracy を算出する以上、未回答 section を出しても accuracy が定義できない。

**改善余地**:
- section 単位で「回答済み n / 全 m 問」と表示すれば未回答カバレッジが見える
- ただし「未回答カード」を独立に出すかは UX 方針による（演習タブの役割と重複）

**判定: 現状仕様維持が妥当**。未回答は演習タブで扱う。

### Q7. 正答率の母数を全問題にするべきか、回答済みにするべきか

**回答済み（attempts）にすべき**。理由:
- 全問題を母数にすると、未回答が多い section の accuracy が常に低くなり「弱点」として誤認される
- 「accuracy」の本来の意味は「回答した中で何問正解したか」
- 復習対象を accuracy 昇順で並べる weak タブの設計と整合

ただし、表示上は「回答済み n問 / 全 m 問」のような補助情報があると親切。

---

## 追加で見つかった微小な問題

### sectionTitle 空文字の 71 branches が silent drop

[review-pack-builder.ts:57](src/lib/review-pack-builder.ts:57) で `if (!sectionTitle) continue;` により section title 空の attempts が無条件 skip される。これらは /review からは消える。

ユーザーがこれらを回答していた場合、その attempts は overall stats には反映されるが weak topic には現れない。

reviewed_import.json 集計では 71 branches がこの状態（全体の 3%）。

**判定**: 影響は限定的だが、本来は「未分類」カードで救うべき。

### 重複 attempts のカウント

同じ問題を複数回回答した場合（2周目以降）、`totalAttempts` は累積で増える。
- 例: 全 10 問の section を 2 周すると「20問回答」と表示される
- これも「のべ attempts 数」としては正しい

「unique problem 数」と「のべ attempt 数」は別物で、UI ではこの区別ができない。

---

## 推奨修正方針

### 案A: ラベルの精度を上げる（最小修正）

| 現在表示 | 推奨表示 |
|---|---|
| `n問回答` | `n回回答（m問）` または `m問 / n回回答` |
| `正答率が低いセクション` | `正答率が低い回答済みセクション` |

実装規模: 小。page.tsx のみ。

### 案B: section 単位で「回答済み / 全問題数」を表示

builder で `allProblems` から sectionTitle ベースの分母を取り、表示。

実装規模: 中。builder で sectionTitle → 全問題数の map を作る。

### 案C: 未分類セクション（sectionTitle 空）を「未分類」グループで救う

71 branches を救出するため、sectionTitle 空でも UNCLASSIFIED_SECTION などの sentinel で group 化。

実装規模: 中。データ整備（chapterCandidate 修正）の方が本筋。

---

## 推奨

**案A（ラベル精度向上）が最優先**。集計ロジック自体は仕様どおりで bug ではないため、UI 表記の曖昧さを解消するだけで誤解は減る。

案B / C は別フェーズで検討。

---

## 禁止事項確認

- [x] src 修正なし
- [x] data 修正なし
- [x] public data 修正なし
- [x] answerBoolean 変更なし
- [x] stash apply/drop なし
- [x] commit / push / PR なし
