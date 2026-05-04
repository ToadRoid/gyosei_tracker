# P3 C_HIGH 6件 source image 照合 batch 設計

date: 2026-05-04
base: origin/main `d58e3fa` (PR #127 merged)
input: P2 triage report, ocr_text_quality_source_check_packet.json

---

## 1. 対象一覧と source image 状態

| # | problemId | page | ruleId | field | source image Q | source image A | 状態 |
|---|---|---|---|---|---|---|---|
| 1 | KB2025-p068-q06 | 068 | empty_explanation | E | 0238.png **存在** | 0239.png **存在** | 照合可能 |
| 2 | KB2025-p124-q01 | 124 | empty_explanation | E | 0350.png **未取得** | 0351.png **未取得** | 要 capture |
| 3 | KB2025-p137-q01 | 137 | format_written_answer | Q | 0376.png **未取得** | 0377.png **未取得** | 要 capture |
| 4 | KB2025-p138-q04 | 138 | format_written_answer | Q | 0378.png **未取得** | 0379.png **未取得** | 要 capture |
| 5 | KB2025-p223-q01 | 223 | empty_explanation | E | 0548.png **未取得** | 0549.png **未取得** | 要 capture |
| 6 | KB2025-p455-q01 | 455 | explanation_copied | E | 1008.png **未取得** | 1009.png **未取得** | 要 capture |

### image 取得状況

- `images/` directory: 0001.png〜0250.png (250ファイル)
- C_HIGH 6件中 **source image が存在するのは p068 のみ** (0238.png / 0239.png)
- 残り5件 (p124, p137, p138, p223, p455) は sourcePageQuestion / sourcePageAnswer が 250 超のため未取得

---

## 2. 照合順序

### Phase A: p068（即時照合可能）

p068-q06 は source image が既に存在するため、即座に照合に進める。

- **確認内容**: 0239.png (answer page) に q06 の解説文が存在するか
- **判定基準**: E テキストが画像上に存在 → OCR 取り直し / 存在しない → isExcluded or E空欄のまま保持
- **証跡**: 照合結果を `p3_chigh_verification_log.md` に記録

### Phase B: p124, p137, p138, p223, p455（capture 依頼後）

user による kindle_capture.sh 実行 or screenshot 提供が必要。

capture 必要ページ一覧:

| source image | Kindle ページ | 対象 |
|---|---|---|
| 0350.png / 0351.png | p124 Q/A | E空欄確認 |
| 0376.png / 0377.png | p137 Q/A | 記述式形式確認 |
| 0378.png / 0379.png | p138 Q/A | 記述式形式確認 |
| 0548.png / 0549.png | p223 Q/A | E空欄確認 |
| 1008.png / 1009.png | p455 Q/A | Eコピー事故確認 |

必要 capture 枚数: **10枚**（5ページ × Q/A 各1枚）

---

## 3. 各候補の判定基準

### 3-1. E空欄 (p068-q06, p124-q01, p223-q01)

| 画像上の状態 | 判定 | 次アクション |
|---|---|---|
| E テキストが存在する | OCR 欠落 | E テキストを OCR 取り直し → data patch |
| E テキストが存在しない | source に E なし | `isExcluded: true` or E空欄のまま保持（要設計判断） |
| 画像が不鮮明で判読不能 | 判断保留 | 別 capture or 手入力 |

### 3-2. 記述式→○×誤変換 (p137-q01, p138-q04)

| 画像上の状態 | 判定 | 次アクション |
|---|---|---|
| 記述式（空欄補充）形式 | 形式誤変換 | `isExcluded: true`（○×アプリでは扱えない） |
| ○×形式（本文+正誤判断） | OCR テキスト破損のみ | Q テキスト修正 → data patch |
| 混在（記述式+○×） | 部分利用可能 | ○×部分のみ残し、記述式部分は除外 |

補足:
- p137-q01: Q に「漢字4字」「記入しなさい」→ 記述式の可能性が高い
- p138-q04: Q に「漢字」+ E に「釈明処分」回答 → 記述式の可能性が高い
- ただし、同一ページの他 item が○×なら、この item だけ記述式の可能性もある

### 3-3. Eコピー事故 (p455-q01)

| 画像上の状態 | 判定 | 次アクション |
|---|---|---|
| E テキストが Q と異なる | OCR コピー事故 | E テキストを OCR 取り直し → data patch |
| E テキストが Q と同一 | source 自体が同一 | 元データの問題。`needsSourceCheck` 解除、E そのまま |
| E テキストが存在しない | source に E なし | `isExcluded: true` or E空欄化 |

補足:
- 現在 Q=E=「個人情報保護法は、デジタル社会の進展に伴い個人情報の利用が著しく拡大していることに鑑み制定されている。」（完全一致 51文字）
- batchId が `gemini-gemini-2.5-flash` → Gemini OCR の出力事故が最も有力

---

## 4. 証跡ファイル設計

照合結果は以下に記録する:

```
context/working/sessions/ocr-text-quality-source-check/p3_chigh_verification_log.md
```

各候補について記録する項目:

| 項目 | 内容 |
|---|---|
| candidateId | P1-XXXX |
| problemId | KB2025-pXXX-qXX |
| source image | ファイル名 |
| 画像上の状態 | E存在 / E不在 / 記述式 / ○× / Eコピー / 判読不能 |
| 判定 | OCR欠落 / 形式誤変換 / コピー事故 / source通り / 保留 |
| correction needed | yes / no / pending |
| correction type | E取り直し / isExcluded / Q修正 / なし |
| correction value | null（P3 では生成しない） |
| notes | 補足 |

---

## 5. 推奨進行

| Step | 内容 | 前提 |
|---|---|---|
| **P4-A** | p068-q06 照合（即時可能） | source image 0238/0239 が存在 |
| **P4-B** | 残り5件の capture 依頼 | user に kindle_capture.sh or screenshot を依頼 |
| **P4-C** | capture 到着後、5件照合 | images/ に 0350-0379, 0548-0549, 1008-1009 追加後 |
| **P5** | 照合結果に基づく data patch 設計 | 全6件の verification_log 完成後 |
| **P6** | data patch 実行（PR 単位） | P5 設計承認後 |

### p068 単独先行の利点

- 1件だけでも照合→patch のフルフローを回すことで、手順の検証ができる
- capture 待ちの5件と独立して進められる
- E空欄の判定基準が最もシンプル（あるかないか）

---

## 6. 禁止事項確認

本設計書は read-only。以下を実行していない:

- [x] data patch なし
- [x] public data patch なし
- [x] source image 照合なし（0238/0239 の中身は未閲覧）
- [x] correction value 生成なし
- [x] proposedReplacement 生成なし
- [x] polarity / answerBoolean 変更なし
- [x] import 実行なし
- [x] DATA_VERSION bump なし

---

## 7. 次タスク案

| 優先度 | タスク | 承認 |
|---|---|---|
| **P4-A** | p068-q06 source image 照合（0238/0239 閲覧 → verification_log 記録） | user 承認で即時開始可 |
| **P4-B** | 残り5件 capture 依頼リスト提示 | user に kindle_capture.sh 実行依頼 |
