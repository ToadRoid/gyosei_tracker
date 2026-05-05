# /review ページ UX 監査レポート

## 1. 現在の /review 仕様

### 構造

| 要素 | 内容 |
|---|---|
| タブ | 「弱点順」「教材順」の2タブ |
| グルーピング単位 | (subjectId, chapterId, sectionTitle) — **セクション単位** |
| 初期表示件数 | 上位10件（`INITIAL_SHOW_COUNT = 10`）、「すべて表示」ボタンで展開 |
| カード表示 | 正答率バッジ、セクション名、科目>章、演習回数、正誤数、改善率 |
| カード展開時 | ラップ別統計、問題例（最大10件）、ページ参照、「演習で復習」ボタン、AI deep dive |

### 弱点順タブ (`buildReviewPackInput`)

- 演習回数 >= 3 のセクションのみ表示
- 正答率昇順ソート（最も弱いセクションが上位）
- isExcluded / needsSourceCheck / aiTriageStatus='discard' を除外

### 教材順タブ (`buildSyllabusReviewTopics`)

- 演習回数 >= 1 のセクションのみ表示
- ソート: subjectOrder → chapterOrder → sourcePageQuestion → sourcePage → seqNo → sectionTitle

### 問題例 (`questionExamples`)

- セクション内で problemId で重複排除（最新 attempt のみ）
- ソート: 誤答 → 遅い正答 → その他
- 最大10件
- 表示: ✓/✗アイコン、問題文60文字切り捨て、回答時間

---

## 2. ユーザー不満との対応表

| ユーザー不満 | 現状の原因 | 重症度 |
|---|---|---|
| **解答が間違っている** | answerBoolean の誤り（データ品質）。✓/✗ 表示・AI prompt に波及 | 高 |
| **解答済みなのに一部しか表示されない** | 弱点順: >= 3回演習が閾値。教材順: >= 1回だが sectionTitle 空欄で落ちるケースあり | 高 |
| **並び順が使いにくい** | 弱点順 or 教材順の2択のみ。「最近間違えた」「未復習」等のフィルタなし | 中 |
| **セクション単位でなく問題単位で見たい** | グルーピングが sectionTitle 固定。問題レベルのフラットビューなし | 中 |
| **正解・解説が見えない** | QuestionRow は ✓/✗ + 60字 + 回答時間のみ。correctAnswer / explanationText 非表示 | 中 |

---

## 3. 最小修正案

### Fix-1: 問題レベルフラットビュー追加（UI）

**目的**: セクション単位ではなく、個別問題を一覧表示する第3のビュー

- 新タブ「問題一覧」を追加
- フィルタ: 全て / 誤答のみ / 未演習
- ソート: 最終演習日降順 / 正答率昇順 / 教材順
- 各行: 問題文（全文 or 長め表示）、正答率、最終結果、セクション名

### Fix-2: QuestionRow に正解・解説を展開表示（UI）

**目的**: 復習時に正解と解説をその場で確認可能にする

- QuestionRow クリックで展開: correctAnswer（○/✗）、explanationText 全文
- 現状の `QuestionExample` 型は既に correctAnswer / explanationText を保持 → UI 表示を追加するだけ

### Fix-3: 弱点順の閾値を下げる（UI/ロジック）

**目的**: 演習回数が少ない段階でも弱点が見えるようにする

- `totalAttempts < 3` → `totalAttempts < 1` に変更（1回でも演習すれば表示）
- または閾値をユーザー設定可能にする

### Fix-4: answerBoolean データ品質の継続修正（データ）

**目的**: 誤答判定の根本原因を潰す

- needsSourceCheck + C_HIGH 残件の原本照合を継続
- Q-E 極性矛盾の自動検知ルール追加（CLAUDE.md §5 に記載済み）

---

## 4. 実装優先順位

| 優先度 | 修正 | 理由 | 工数目安 |
|---|---|---|---|
| P1 | Fix-4: answerBoolean 修正継続 | 表示が正しくても判定が間違えば意味がない | データ作業（ongoing） |
| P2 | Fix-2: 正解・解説展開表示 | 既存データで対応可。復習UX即改善 | 小（UI追加のみ） |
| P3 | Fix-3: 閾値引き下げ | 1行変更で「見えない」問題を軽減 | 極小 |
| P4 | Fix-1: 問題レベルフラットビュー | 最も要望に合致するが新コンポーネント必要 | 中 |

---

## 5. data quality と UI quality の分離

### data quality（データ層の正しさ）

- answerBoolean の正誤 → ✓/✗ 判定の根拠
- explanationText の欠落・truncation → 解説表示の品質
- sectionTitle 空欄 → グルーピングから脱落
- subjectId/chapterId 空欄 → 科目フィルタの死角（既知バグ）

**対処**: 原本照合、Q-E矛盾検知、OCR品質向上。UI変更とは独立して進行可能。

### UI quality（表示・操作の設計）

- グルーピング粒度（セクション vs 問題）
- フィルタ・ソートの選択肢
- 展開時の情報量（正解・解説の表示）
- 閾値による表示制限

**対処**: コンポーネント修正。データ修正とは独立して進行可能。

### 相互作用

- answerBoolean が間違っていると、UI がどれだけ良くても復習が逆効果
- UI が問題レベル表示になると、データ誤りが個別に目立ちやすくなり発見しやすい
- → P1 (data) と P2-P4 (UI) は並行可能だが、P1 を先行させる方が安全

---

## 6. 次の実装タスク案

### 即時着手可能（データ変更不要）

1. **Fix-2**: `TopicCard` 内の `QuestionRow` にクリック展開を追加
   - `questionExamples` は既に `correctAnswer` / `explanationText` を含む
   - 表示トグルの state 追加 + 展開部分のレンダリング追加
   - ファイル: `src/app/review/page.tsx` (QuestionRow コンポーネント付近)

2. **Fix-3**: `src/lib/review-pack-builder.ts` L行の `totalAttempts < 3` を `< 1` に変更
   - 1行変更、副作用なし

### 次フェーズ

3. **Fix-1**: 問題レベルフラットビュー
   - 新ビルダー関数 `buildProblemFlatList()` を `src/lib/` に追加
   - 新タブ or 切り替えUIを `page.tsx` に追加
   - フィルタ・ソートのstate管理

### 継続作業（データ品質）

4. **Fix-4**: P4-A〜P4-E の C_HIGH 原本照合残件
5. Q-E 極性矛盾の自動検知スクリプト追加

---

## 補足: 確認事項への回答

| 確認項目 | 回答 |
|---|---|
| /review の2タブ構成 | 弱点順 + 教材順（confirmed, コード照合済み） |
| グルーピング単位 | (subjectId, chapterId, sectionTitle) セクション単位（confirmed） |
| 閾値 | 弱点順 >= 3回、教材順 >= 1回（confirmed） |
| 表示上限 | 初期10件、展開で全件（confirmed） |
| questionExamples 上限 | 10件/セクション（confirmed） |
| 正解・解説の非表示 | QuestionRow は ✓/✗ + 60字 + 時間のみ（confirmed） |
| answerBoolean 影響範囲 | ✓/✗ 表示 + accuracy 計算 + AI prompt の wrongExamples（confirmed） |
