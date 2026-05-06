# P4-B C_HIGH 残4件 source image 照合ログ

date: 2026-05-06
base: origin/main `10c0762` (PR #135 merged)

---

## 対象

| # | problemId | sourcePage | seqNo | issue | image |
|---|---|---|---|---|---|
| 1 | KB2025-p124-q01 | 124 | 1 | E空欄 | images/0124.png |
| 2 | KB2025-p137-q01 | 137 | 1 | 記述式→○×誤変換疑義 | images/0137.png |
| 3 | KB2025-p138-q04 | 138 | 4 | 記述式→○×誤変換疑義 | images/0138.png |
| 4 | KB2025-p223-q01 | 223 | 1 | E空欄 | images/0223.png |

対象外: p455-q01（images/0455.png 未取得、capture-needed）

---

## 1. p124-q01

### data

- answerBoolean: false
- Q: 処分の取消しの訴えとその処分についての審査請求を棄却した裁決の取消しの訴えとを提起することができる場合には、裁決の取消しの訴えにおいては、処分の違法を理由として取消しを求めることができない。
- E: (empty)
- subject: gyosei / gyosei-jiken
- section: 01_行政事件訴訟の種類

### source image 確認 (images/0124.png)

- タイトル: 取消訴訟の種類
- 左ページ: 問題1〜4
- 右ページ: 回答1〜4
- 回答1 の領域: テキストと青字ハイライト（解説文）が見える
- 回答マーク: ○ に見える（確信度 medium — 画像解像度の制約あり）

### 判定

**ocr_or_import_missing** — source 画像上に E（解説文）が存在する（青字テキスト確認）。OCR/import 時に欠落した可能性が高い。

追加懸念: 回答マークが ○ に見える場合、answerBoolean=false も誤りの可能性がある。ただし画像解像度の制約があり、○/× の判定は user visual check が必要。

| 項目 | 値 |
|---|---|
| 判定 | **ocr_or_import_missing** |
| correction needed | **yes** — E 補完が必要 |
| answerBoolean check | **user visual check required** — ○ に見えるが確信度不十分 |
| P5 patch candidate | **yes** |
| notes | E と answerBoolean の両方を原本から正確に転記する必要あり |

---

## 2. p137-q01

### data

- answerBoolean: false
- Q: 「行政事件訴訟に関し、この法律に定めがない事項については、□□□□の例による。」（行政事件訴訟法7条）空欄に入る正しい語句（漢字4字）を記入しなさい。
- E: 行政事件訴訟法7条には、「行政事件訴訟に関し、この法律に定めがない事項については、民事訴訟の例による」と規定されている。
- subject: gyosei / gyosei-jiken
- section: 05_取消訴訟の審理

### source image 確認 (images/0137.png)

- タイトル: 取消訴訟の審理
- 左ページ: 問題1〜7
- 右ページ: 回答1〜7
- Q1 は「□□□□」の空欄補充形式 — 記述式問題
- 回答1: 「民事訴訟」（テキスト回答）

### 判定

**source_confirms_written_format** — source 画像上で記述式（空欄補充）問題であることを確認。answerBoolean=false は ○× 形式への誤変換。正解は「民事訴訟」（漢字4字）。

| 項目 | 値 |
|---|---|
| 判定 | **source_confirms_written_format** |
| correction needed | **design decision required** — 記述式問題の扱い方針を決める必要あり |
| answerBoolean | 無効（○× 形式ではない） |
| P5 patch candidate | **conditional** — 記述式対応方針次第 |
| notes | E は正しい内容を含む（「民事訴訟の例による」）。問題形式の不整合のみ。isExcluded=true にして記述式対応待ちとするか、correctAnswer フィールドを追加するか。 |

---

## 3. p138-q04

### data

- answerBoolean: false
- Q: 行政事件訴訟法は、これまでい一般の民事訴訟と同様に当事者主義的な審理手続がとられてきたが、平成16年改正行政事件訴訟法により、行政訴訟の適正の実、促進の観点から、裁判所が必要あると認めるときは、処の理由を明らかにする資料を提出させる制度が、新たに採り入れた。これを（      ）の特則という。（漢字4字）に当てはまる語句を記入しなさい。
- E: 釈明処分\n行政事件訴訟では...（以下解説）
- subject: gyosei / gyosei-jiken
- section: 取消訴訟の審理

### source image 確認 (images/0138.png)

- 0138.png は p137 の続きページ（問題8〜12 / 回答8〜12）
- seqNo 4 = ページ内4番目 = 問題11
- 左ページ Q11: 記述式「[ 　 ] の特則」空欄補充形式
- 右ページ回答11: 「釈明処分」のテキスト回答 + 解説

### 判定

**source_confirms_written_format** — source 画像上で記述式（空欄補充）問題であることを確認。p137-q01 と同じパターン。

追加観察: questionText に OCR 誤字あり（「これまでい一般」→「これまで一般」、「適正の実」→「適正の確実」？、「処の理由」→「処分の理由」？）。ただし OCR 品質は本タスクの scope 外。

| 項目 | 値 |
|---|---|
| 判定 | **source_confirms_written_format** |
| correction needed | **design decision required** — p137-q01 と同じ |
| answerBoolean | 無効（○× 形式ではない） |
| P5 patch candidate | **conditional** — 記述式対応方針次第 |
| notes | E の冒頭に正解「釈明処分」を含み、以下に解説。Q には OCR 誤字疑いあり。 |

---

## 4. p223-q01

### data

- answerBoolean: false
- Q: 土地の仮装譲渡人がその土地に建物を建設して他人に賃貸した場合、当該建物賃借人は民法94条２項の「第三者」にはあたらない（東判昭57.6.8）。したがって、土地の仮装譲渡人はその建物賃借人に対して、土地譲渡の無効を理由として建物からの退去および地上の明渡しを求めることができる。
- E: (empty)
- subject: minpo / minpo-sosoku
- section: 02_意思表示と瑕疵

### source image 確認 (images/0223.png)

- 0223.png は民法総則ページ（ページ下部に「総則」表示）
- seqNo 1 = ページ内1番目 = 問題8（ページ開始が8番から）
- 左ページ Q8: 土地の仮装譲渡人...の問題
- 右ページ回答8: × マーク + 青字解説テキストが見える
- × マーク → answerBoolean=false と一致

### 判定

**ocr_or_import_missing** — source 画像上に E（解説文）が存在する（× マーク後の青字テキスト確認）。OCR/import 時に欠落した可能性が高い。answerBoolean=false は × マークと一致し正しい。

| 項目 | 値 |
|---|---|
| 判定 | **ocr_or_import_missing** |
| correction needed | **yes** — E 補完が必要 |
| answerBoolean | false — source × マークと一致、変更不要 |
| P5 patch candidate | **yes** |
| notes | 民法94条2項の第三者に関する解説。source から E を正確に転記する必要あり。 |

---

## 総合分類

| 分類 | 件数 | 対象 |
|---|---|---|
| **P5 patch candidate** | 2 | p124-q01, p223-q01（E 補完） |
| **design decision required** | 2 | p137-q01, p138-q04（記述式対応方針） |
| **no-change** | 0 | — |
| **capture-needed** | 1 | p455-q01（別枠、images/0455.png 未取得） |

## P5 に向けた次ステップ

### 即時 patch 可能（E 補完）

1. **p124-q01**: source image から E を転記。answerBoolean の ○/× も user visual check で確定。
2. **p223-q01**: source image から E を転記。answerBoolean=false は確認済み。

### 方針決定待ち（記述式）

3. **p137-q01**: 記述式問題の扱い方針を決める。選択肢:
   - isExcluded=true にして記述式対応待ち
   - 現状維持（E に正解含む、学習には使える）
   - correctAnswer テキストフィールド追加（スキーマ変更）
4. **p138-q04**: p137-q01 と同方針。追加で OCR 誤字の補正も候補。

### 別枠

5. **p455-q01**: images/0455.png が存在しない（sourcePage > 250）。Kindle capture が必要。

---

## 禁止事項確認

- [x] data patch なし
- [x] public data patch なし
- [x] correction value 生成なし
- [x] proposedReplacement なし
- [x] answerBoolean 変更なし
- [x] explanationText 変更なし
- [x] import 実行なし
- [x] DATA_VERSION bump なし
