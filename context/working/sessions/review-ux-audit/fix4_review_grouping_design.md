# Fix-4: 復習カード集計単位見直し — 設計レポート

date: 2026-05-06
base: origin/main `9c3793d` (PR #141 merged)

---

## 現在の grouping key

両タブとも同一の grouping:

```
key = `${subjectId}||${chapterId}||${sectionTitle}`
```

- **弱点順** (review-pack-builder.ts:60): accuracy 昇順でソート
- **教材順** (review-syllabus-builder.ts:64): subject order → chapter order → pageRef → sourcePage → seqNo でソート

カード title = `sectionTitle`、サブタイトル = `subjectName > chapterName`

---

## なぜ粒度が細かすぎるか

### データ分布

| section 内問題数 | section 数 | 割合 |
|---|---|---|
| 1〜2問 | 116 | 33% |
| 3〜5問 | 118 | 33% |
| 6〜10問 | 74 | 21% |
| 11問以上 | 46 | 13% |

- **354 の section group** が存在する
- 1/3 が 1〜2問しかない → 1 カードに 1〜2問だけの表示が大量に並ぶ
- スクリーンショットの通り、2カードで画面が埋まり、一覧性がない

### chapter-level で集約した場合

| chapter | 問題数 | section 数 |
|---|---|---|
| minpo-saiken（民法・債権） | 376 | 28 |
| gyosei-ippan（行政法・一般） | 271 | 54 |
| gyosei-chiho（地方自治法） | 250 | 54 |
| minpo-bukken（民法・物権） | 205 | 24 |
| minpo-sosoku（民法・総則） | 181 | 30 |
| shoho-kaisha（商法・会社法） | 172 | 16 |

chapter-level なら **19 グループ** に集約される（回答済み chapter のみ）。

---

## 実装案

### 案A: chapter-level cards（推奨）

builder の grouping key を `subjectId||chapterId` に変更。

**カード構成**:
- title: `chapterName`（例: 「民法・総則」）
- サブタイトル: `subjectName`
- 統計: chapter 全体の accuracy / totalAttempts / correctCount
- 展開時: section ごとに内訳を表示（accordion 内 accordion）

**メリット**:
- 354 → 19 カードに圧縮
- 一覧性が大幅に改善
- 弱い chapter が一目でわかる
- section 情報は展開内で維持

**デメリット**:
- 弱点順タブで「特定の section だけ弱い」が見えにくくなる
- AI Deep Dive のプロンプト粒度が大きくなりすぎる可能性
- builder の型変更が必要（sectionTitle → sections: SectionSummary[]）

**実装規模**: 中（builder 2ファイル + page.tsx + 型定義）

### 案B: subject-level cards + chapter accordion

grouping を `subjectId` に。

**メリット**:
- 最大 7 カード程度
- 最もコンパクト

**デメリット**:
- 粒度が粗すぎて弱点特定に使えない
- 「行政法」の中に 600問以上が入る → 展開しても情報過多
- 復習ダッシュボードの意味が薄れる

**判定: 不採用** — 粗すぎる

### 案C: section card 維持 + chapter heading で視覚的グループ化

grouping key は変えず、UI 側で chapter ごとの heading を挿入して視覚的に整理。

**カード構成**:
- chapter heading: `民法 > 総則`（sticky or 区切り線）
- その下に section cards を並べる
- section card 自体はコンパクト化（padding 削減、1行表示）

**メリット**:
- builder の変更なし
- section 粒度を維持（弱点特定に有利）
- UI のみの変更で済む

**デメリット**:
- カード数 354 は変わらない（表示件数で制限するが）
- 1〜2問 section は依然として目立つ
- heading 分のスペースが追加される

**実装規模**: 小（page.tsx のみ）

### 案D: chapter-level cards + section 内訳（案A の改良版、最推奨）

builder の grouping を `subjectId||chapterId` に変更しつつ、各 chapter card 内で section 別の正答率を表示。

**カード構成**（閉じた状態）:
```
[65%] 民法・総則
      民法  30問回答  ✗12  ✓18
```

**展開時**:
```
[65%] 民法・総則
      民法  30問回答  ✗12  ✓18
      ─── section 内訳 ───
      [100%] 民法の基本原則    2問
      [ 50%] 権利の主体・客体  2問
      [ 60%] 意思表示と瑕疵    5問
      ...
      ─── 問題一覧 ───
      ✗ 処分の取消しの訴えと...  12秒
      ✗ 土地の仮装譲渡人が...    8秒
      ✓ 取消訴訟の審理は...     15秒
```

**メリット**:
- 19 カードに集約（一覧性）
- section 粒度は内訳で維持（弱点特定）
- 問題一覧は chapter 全体でソート（wrong first）
- AI Deep Dive は chapter 単位（十分な情報量）

**デメリット**:
- builder の型に sections 配列を追加する必要がある
- 内訳表示の UI 実装が案A より少し多い

**実装規模**: 中（builder 2ファイル + page.tsx + 型定義）

---

## 推奨: 案D（chapter-level + section 内訳）

### 理由

1. **一覧性**: 354 → 19 カードで劇的に改善
2. **弱点特定**: section 内訳で細かい弱点も見える
3. **問題一覧**: chapter 全体で wrong-first ソートするため、最も弱い問題が先頭に来る
4. **AI Deep Dive**: chapter 単位のプロンプトは情報量が適切
5. **スクロール量**: 画面に 5〜6 カード表示可能（現在の 2 から大幅改善）

---

## 最小実装 patch plan

### 型変更

```typescript
// src/types/review-pack.ts
export interface SectionSummary {
  sectionTitle: string;
  accuracy: number;
  totalAttempts: number;
  correctCount: number;
}

export interface WeakTopicInput {
  // 既存フィールド維持
  subjectName: string;
  chapterName: string;
  sectionTitle: string;        // chapter 名を入れる（後方互換）
  accuracy: number;
  totalAttempts: number;
  correctCount: number;
  // ...
  sections?: SectionSummary[]; // 追加: section 内訳
}
```

### builder 変更

1. grouping key を `subjectId||chapterId` に変更
2. section ごとの stats を sections 配列に集約
3. questionExamples は chapter 全体で wrong-first ソート
4. sectionTitle フィールドには chapter 名（後方互換）or 代表 section 名

### page.tsx 変更

1. TopicCard の展開部分に section 内訳表示を追加
2. カード header のレイアウトをコンパクト化
3. section 内訳は小さいテキストで accuracy + 問題数の一行表示

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| src/types/review-pack.ts | SectionSummary 追加、WeakTopicInput に sections? 追加 |
| src/lib/review-pack-builder.ts | grouping key 変更、sections 配列生成 |
| src/lib/review-syllabus-builder.ts | 同上 |
| src/app/review/page.tsx | TopicCard に section 内訳表示、padding 調整 |

### 変更しない

- data/reviewed_import.json
- public/data/reviewed_import.json
- src/lib/db.ts
- DATA_VERSION
- answerBoolean
- exercise UI

---

## 間隔の問題について

ユーザーの「間かくなりすぎ」の指摘には2つの原因がある:

1. **カード数が多すぎる**（354 section → 本案で 19 chapter に解決）
2. **各カードの padding が大きい**（space-y-6, p-4 等）

案D で (1) を解決し、併せて (2) のパディング削減も行う:
- ページ全体: space-y-6 → space-y-3
- stats カード: p-3 → px-2 py-1.5
- TopicCard header: p-4 → px-3 py-2.5
- 更新ボタン: py-3 → py-2

---

## 禁止事項確認

- [x] data patch なし
- [x] public data patch なし
- [x] src 実装修正なし（設計のみ）
- [x] answerBoolean 変更なし
- [x] DATA_VERSION bump なし
- [x] commit / push / PR なし
