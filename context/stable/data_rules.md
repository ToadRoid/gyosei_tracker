# データルール

## Source of truth (confirmed)

- 問題データの正本: `data/reviewed_import.json`
- UI 配信用コピー: `public/data/reviewed_import.json`
- 原本画像: `images_preprocessed/`（Kindle スクショから前処理済み）

## 問題データの要素 (inferred, 要コード確認)

各問題（肢）について少なくとも以下を持つ：

- `problemId`（安定した一意キー）
- `sourceBook` / `sourcePage` / `q_num`（出題元の識別）
- Q（問題文）
- E（解説文）
- `answerBoolean`（正誤、True/False）
- `subjectId`（科目分類）
- `chapterId`（章分類）
- `subjectCandidate` / `chapterCandidate`（OCR 時の候補、未確定の可能性あり）
- `isExcluded`（出題停止フラグ）
- `needsSourceCheck`（原本確認要フラグ）

※ Dexie スキーマの index 状態は未検証。CLAUDE.md に「`needsSourceCheck` は index 登録なし」とある（confirmed, from CLAUDE.md 第6節）。

## 分類運用ルール (confirmed, from CLAUDE.md 第1-2節)

- `subjectId === ''`（空文字）で保存しない。null か sentinel 値を使う
- `subjectCandidate` 未解決時、`importParsedBatch` が `branch.subjectCandidate ?? ''` をそのまま入れて subjectId が `''` になる既知バグあり → **未修正**
- 再 import 時、既存 DB の `subjectId` / `chapterId` / `isExcluded` / `needsSourceCheck` を必ず引き継ぐ（現状は全消し → 再作成で消える）→ **未修正**

## 取り込み運用 (confirmed, from CLAUDE.md 第1節)

- `importParsedBatch` は `(sourceBook, sourcePage)` 単位で problems / problemAttrs を **全削除 → 再作成**
- DATA_VERSION が上がると分類崩壊のリスクあり
- `runOneTimeCleanup` の PATCH は localStorage フラグで管理 → 再作成後に復元されない既知バグあり

## needsSourceCheck 判定 (confirmed, from CLAUDE.md 第5節)

以下を自動検知する価値が高い（未実装）：
- `...` / `…` を含む文
- 助詞・かなの重複（例: 「にに」）
- 文末の不自然な欠落（例: 「生命、」）
- 既知の OCR 誤字（例: 「余償」「大火責任法」）
- Q と E の極性矛盾（E に「時効にかかる」と ans=True）
- broad raw / 空 raw（例: `総則`、空、`不明`、`行政法`）

## OCR / LLM (confirmed, from CLAUDE.md 第4節)

- 過去の試行: GPT API（精度不足）/ Claude Code（API 使用量超過）
- 現行方針: **実装時点で有効な Flash 系 / 低遅延モデルを採用**。CLAUDE.md にモデル名を固定しない
- 変更対象: `scripts/ocr_batch.*` のみ。`kindle_capture.sh` と下流 JSON 形式は維持
