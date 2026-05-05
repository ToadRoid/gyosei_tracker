# P4-A p068-q06 source image 照合ログ

date: 2026-05-04
base: origin/main `ea53dc5` (PR #128 merged)

---

## 対象

| 項目 | 値 |
|---|---|
| candidateId | P1-0019 |
| problemId | KB2025-p068-q06 |
| field | explanationText |
| issue | E 空欄 |
| ruleId | empty_explanation |
| tier | C_HIGH |
| questionText | 行政手続法１条１項は一般法性格を定め、同条２項は特別法優位の原則を規定している。 |
| answerBoolean | true |

---

## source image mapping 調査

### 初期の誤った参照

- reviewed_import.json の sourcePageQuestion: `238`, sourcePageAnswer: `239`
- images/0238.png → **民法総則「条件」（テキスト p.578-579）** → p068 の内容ではない

### mapping mismatch の原因

- images/ 内のファイル名 = **sourcePage 番号**（問題集のページ番号: 001-250）
- sourcePageQuestion の値 = **Kindle キャプチャの連番**（110-1026）
- これらは別の番号体系であり、`images/0238.png` ≠ `sourcePageQuestion=238` のキャプチャ

### 正しい source image

- **images/0068.png** = sourcePage `068` の Kindle 見開きキャプチャ
- 内容: **行政手続法総則**（テキスト p.178〜182）
- 左ページ: question（問題1〜6）
- 右ページ: answer（解答1〜6）
- ページ番号: 239（右下に表示）

---

## 照合結果

### q06 の source 画像上の表示（右ページ最下部、拡大確認済み）

> 6 ○ 行政手続法１条１項は一般法的性格を定め、**同条２項は特別法優位の原則**を規定している。

- 正誤記号: ○（正しい）
- 解説文: **なし**（正誤記号＋問題文リピート＋キーワード強調のみ）
- 比較: q01〜q05 は全て ×（誤り）で青字の解説文付き。q06 は ○（正しい）のため解説省略の構成

### 判定

**source_confirmed_empty** — source 画像上に E（解説文）は存在しない。answerBoolean=true（○）の問題は、この問題集の構成として解説文を省略する場合がある。E 空欄は OCR/import の欠落ではなく、source の構成通り。

| 項目 | 値 |
|---|---|
| 判定 | **source_confirmed_empty** |
| correction needed | **no** |
| correction type | なし（source 通り） |
| correction value | null |
| notes | ○問題は解説省略の構成。E 空欄は正常。needsSourceCheck 解除候補。 |

---

## 副次的発見: source image mapping の不整合

### 問題

`sourcePageQuestion` / `sourcePageAnswer` フィールドの値（Kindle キャプチャ連番）と `images/` ディレクトリのファイル名（sourcePage 番号）が**異なる番号体系**を使用している。

| 概念 | 例 (p068) | 用途 |
|---|---|---|
| sourcePage | `068` | 問題集のページ番号。images/0068.png のファイル名 |
| sourcePageQuestion | `238` | Kindle キャプチャの連番。images/ のファイル名とは無関係 |

### 影響

- images/ からの source image 照合時、`sourcePageQuestion` をファイル名として使うと**誤ったページを参照する**
- P3 設計書で「images/0238.png が p068 の source」と記載したのは誤り
- C_HIGH 残り5件の source image availability も再評価が必要

### 正しい参照方法

```
images/{sourcePage.padStart(4,'0')}.png
```

### C_HIGH 6件の source image 再評価

| problemId | sourcePage | 正しい image | 存在 |
|---|---|---|---|
| KB2025-p068-q06 | 068 | images/0068.png | **存在** ← 照合完了 |
| KB2025-p124-q01 | 124 | images/0124.png | **存在** ← 即時照合可能 |
| KB2025-p137-q01 | 137 | images/0137.png | **存在** ← 即時照合可能 |
| KB2025-p138-q04 | 138 | images/0138.png | **存在** ← 即時照合可能 |
| KB2025-p223-q01 | 223 | images/0223.png | **存在** ← 即時照合可能 |
| KB2025-p455-q01 | 455 | images/0455.png | **未存在**（0001-0250 範囲外。要 capture） |

---

## 禁止事項確認

- [x] data patch なし
- [x] correction value 生成なし
- [x] proposedReplacement なし
- [x] polarity / answerBoolean 変更なし
- [x] import 実行なし
- [x] DATA_VERSION bump なし
