# P2 OCR source-check queue triage report

date: 2026-05-04
base: origin/main `1a4bbca` (PR #126 merged)
input: `ocr_text_quality_source_check_packet.json` (schemaVersion 2)

---

## 1. C_HIGH 6件一覧

| # | candidateId | problemId | page | ruleId | field | 概要 |
|---|---|---|---|---|---|---|
| 1 | P1-0019 | KB2025-p068-q06 | 068 | empty_explanation | explanationText | E 空欄 |
| 2 | P1-0038 | KB2025-p124-q01 | 124 | empty_explanation | explanationText | E 空欄 |
| 3 | P1-0068 | KB2025-p137-q01 | 137 | format_written_answer_converted_to_bool | questionText | 記述式（漢字4字）が○×取り込み |
| 4 | P1-0069 | KB2025-p138-q04 | 138 | format_written_answer_converted_to_bool | questionText | 記述式が○×取り込み（OCR破損も併存） |
| 5 | P1-0089 | KB2025-p223-q01 | 223 | empty_explanation | explanationText | E 空欄 |
| 6 | P1-0170 | KB2025-p455-q01 | 455 | explanation_copied_from_question_conflict | explanationText | E が Q と完全一致（Eコピー事故） |

### 分類

- **E 空欄**: 3件（p068-q06, p124-q01, p223-q01）→ source image で E が存在するか確認
- **記述式誤変換**: 2件（p137-q01, p138-q04）→ source image で出題形式確認。○×ではなく記述式なら isExcluded or 別スキーマ対応
- **E コピー事故**: 1件（p455-q01）→ source image で本来の E テキスト確認

### source-check 優先度

全6件が source image 照合の最優先対象。proposedReplacement は source 確認後に別 PR で生成。

---

## 2. TIER1 → C_HIGH 昇格判断

TIER1 64件のうち `empty_explanation` / `format_written_answer_converted_to_bool` に該当するものは **0件**。C_HIGH への昇格対象なし。

ただし **p130 は TIER1 が 9件集中**（severe_ocr_garbage_known_terms 7件 + known_suspicious_ocr_string 2件）。
ページ全体の OCR 品質が極端に低く、source image からの全面取り直しが効率的。
→ **C_HIGH 昇格ではなく「ページ単位 re-OCR」候補として別管理を推奨**。

その他の集中ページ:

| page | TIER1 件数 | 主要 ruleId |
|---|---|---|
| p130 | 9 | severe_ocr_garbage_known_terms (7), known_suspicious_ocr_string (2) |
| p113 | 4 | known_suspicious_ocr_string |
| p127 | 4 | known_suspicious_ocr_string |
| p128 | 4 | known_suspicious_ocr_string |
| p052 | 4 | legal_term_obvious_corruption |
| p124 | 3 | known_suspicious_ocr_string（+ C_HIGH 1件） |
| p143 | 3 | known_suspicious_ocr_string |
| p049 | 3 | legal_term_obvious_corruption |

---

## 3. queue 別の扱い方

### ocr_text_quality (85件)

- C_HIGH 6件: source image 照合 → data patch（別 PR）
- TIER1 64件: source image 照合 → ページ単位 batch patch（別 PR）
- TIER1_5 17件: 低優先。TIER1 完了後に対応

text-quality queue 内に polarity 関連の混入は **0件**。分離は正常。

### polarity_recheck (12件)

backlog seed から注入された B_RECHECK 候補。全件が `polarity_recheck_backlog_seed` ruleId。
**source 確認なしに answerBoolean を変更してはならない**（全件の reason に明記済み）。
text-quality patch とは独立したタスクとして扱う。

### qe_contradiction (2件)

- P1-0085: KB2025-p200-q04
- P1-0096: KB2025-p236-q02

Q/E の結論と answerBoolean の矛盾検出。polarity_recheck と同様、source 確認が先。

### section_title_quality (88件)

| ruleId | 件数 |
|---|---|
| empty_section_title | 71 |
| raw_broad_or_unknown | 13 |
| section_title_subtopic_policy | 4 |

source image 照合ではなく **分類・設計 issue** として分離済み。
sectionTitle の空欄・broad値は OCR 品質ではなく分類パイプラインの問題。
→ **source-check batch には含めない。別タスク（分類改善）で対応**。

### import_completeness (1件)

- P1-0184: KB2025-p021-q05_or_q06（未 import 問題項目の疑い）

source image 確認が必要だが、data patch の性質が異なる（既存修正ではなく新規追加）。
→ **別タスクとして扱う**。

---

## 4. 次 source-check batch 推奨

### 第1 batch: C_HIGH 6件のみ

| 対象 | 件数 | 作業内容 |
|---|---|---|
| E 空欄 | 3 | source image で E 存在確認 → あれば OCR 取り直し |
| 記述式誤変換 | 2 | source image で出題形式確認 → 記述式なら isExcluded |
| E コピー事故 | 1 | source image で本来の E 確認 → OCR 取り直し |

理由: 影響度が最大かつ件数が最小。6件なら 1 PR でまとまる。

### 第2 batch（C_HIGH 完了後）: p130 ページ全面 re-OCR

9件の severe garbage が集中。肢単位 patch より page 単位 re-OCR が効率的。

### 第3 batch 以降: TIER1 残り → TIER1_5 → polarity_recheck

---

## 5. data patch 禁止確認

本レポートは read-only triage のみ。以下を実行していない:

- [x] data patch なし
- [x] public data patch なし
- [x] proposedReplacement 生成なし
- [x] polarity / answerBoolean 変更なし
- [x] import 実行なし
- [x] DATA_VERSION bump なし
- [x] source image 照合なし

---

## 6. 次タスク案

| 優先度 | タスク | 前提 |
|---|---|---|
| **P2.1** | C_HIGH 6件の source image 照合 | user が source image を提供 or screenshot 指示 |
| P2.2 | p130 page re-OCR | C_HIGH 完了後 |
| P2.3 | TIER1 残り source-check | p130 完了後 |
| P3 | section_title_quality 分類改善 | 別設計タスク |
| P3 | polarity_recheck source 確認 | 独立タスク |
| P3 | import_completeness p021 確認 | 独立タスク |
