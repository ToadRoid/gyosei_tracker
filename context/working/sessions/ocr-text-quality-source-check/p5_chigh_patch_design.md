# P5 C_HIGH source-confirmed patch design

date: 2026-05-06
base: origin/main `730d9d0` (PR #136 merged)

---

## 系統分類

| 系統 | 対象 | 状態 | 次ステップ |
|---|---|---|---|
| E補完 | p124-q01, p223-q01 | source に E 存在確認済み、テキスト判読不能 | user visual check required |
| answerBoolean再確認 | p124-q01 | ○ に見えるが確信度不十分 | user visual check required |
| 記述式対応 | p137-q01, p138-q04 | source_confirms_written_format | policy decision required |
| capture-needed | p455-q01 | images/0455.png 未取得 | 別枠継続 |

---

## 1. E補完候補: p124-q01

### 現行 record

| 項目 | 値 |
|---|---|
| sourcePage | 124 |
| seqNo | 1 |
| answerBoolean | false |
| questionText | 処分の取消しの訴えとその処分についての審査請求を棄却した裁決の取消しの訴えとを提起することができる場合には、裁決の取消しの訴えにおいては、処分の違法を理由として取消しを求めることができない。 |
| explanationText | (empty) |
| subject | gyosei / gyosei-jiken |
| section | 01_行政事件訴訟の種類 |

### source image 確認 (images/0124.png)

- 右ページ回答1: テキストと青字ハイライト（解説文）が存在する
- E が source に存在することは confirmed
- E のテキスト内容: **判読不能**（画像解像度の制約）

### answerBoolean 確認

- 回答マーク: ○ に見える（確信度 medium）
- data の answerBoolean=false との不整合の可能性あり
- **判読不能** — 画像解像度で ○/× を確定できない

### patch design

**status: user visual check required**

E補完と answerBoolean 再確認の両方が user visual check に依存する。
source text の転記精度が patch の品質を決めるため、推定補完は行わない。

user visual check で確認すべき項目:
1. 回答マークが ○ か × か
2. E（解説文）の全文テキスト
3. Q の内容と E の結論に整合性があるか

確認方法の候補:
- Kindle アプリで sourcePage 124 を開いて直接確認
- images/0124.png を高解像度モニタで拡大確認
- 新規高解像度キャプチャを取得

---

## 2. E補完候補: p223-q01

### 現行 record

| 項目 | 値 |
|---|---|
| sourcePage | 223 |
| seqNo | 1 |
| answerBoolean | false |
| questionText | 土地の仮装譲渡人がその土地に建物を建設して他人に賃貸した場合、当該建物賃借人は民法94条２項の「第三者」にはあたらない（東判昭57.6.8）。したがって、土地の仮装譲渡人はその建物賃借人に対して、土地譲渡の無効を理由として建物からの退去および地上の明渡しを求めることができる。 |
| explanationText | (empty) |
| subject | minpo / minpo-sosoku |
| section | 02_意思表示と瑕疵 |

### source image 確認 (images/0223.png)

- seqNo 1 = ページ内問題8（ページが8番から開始）
- 右ページ回答8: × マーク + 青字解説テキストが存在する
- × マーク → answerBoolean=false と一致（confirmed）
- E が source に存在することは confirmed
- E のテキスト内容: **判読不能**（画像解像度の制約）

### patch design

**status: user visual check required**

answerBoolean=false は × マークと一致するため変更不要。
E補完のみ必要だが、source text の判読が user visual check に依存する。

user visual check で確認すべき項目:
1. E（解説文）の全文テキスト
2. 民法94条2項の「第三者」に関する解説内容

---

## 3. 記述式対応: p137-q01 / p138-q04

### 現状

| 問題 | 形式 | 正解 | E 状態 |
|---|---|---|---|
| p137-q01 | 空欄補充（漢字4字） | 民事訴訟 | あり（正しい内容） |
| p138-q04 | 空欄補充（漢字4字） | 釈明処分 | あり（正しい内容） |

両方とも:
- answerBoolean=false は ○× 形式への誤変換（記述式に true/false は不適切）
- E は正しい内容を含む
- source image で記述式形式を確認済み

### 対応方針案

| 方針 | 内容 | メリット | デメリット |
|---|---|---|---|
| A. isExcluded=true | 除外フラグで非表示 | 即時対応可、スキーマ変更不要 | 学習機会を失う |
| B. 現状維持 | answerBoolean=false のまま放置 | 変更不要 | ○× として演習すると誤学習 |
| C. answerBoolean=true に変更 | 「正解がある」= true と解釈 | 簡易 | 意味的に不正確 |
| D. 記述式データ型追加 | correctAnswerText フィールド追加 | 正確 | スキーマ変更 + UI対応必要 |

### 推奨

**方針 A（isExcluded=true）** が現時点で最も安全。理由:
- 記述式問題を ○× として演習すると、結果が常に「不正解」となり誤学習になる
- スキーマ変更なしで即時対応可能
- 将来的に方針 D に移行する場合も、除外解除するだけで復帰可能
- 対象は2件のみで影響範囲が小さい

ただし方針採用は user decision。本ドキュメントでは方針案に留める。

---

## 4. capture-needed: p455-q01

**status: 継続 capture-needed**

- images/0455.png が存在しない（images/ は 0001-0250 の範囲）
- sourcePage=455 は問題集後半で、Kindle キャプチャの対象外
- 新規キャプチャが必要
- 本タスクの scope 外

---

## 総合 patch readiness

| 問題 | patch 可否 | blocker |
|---|---|---|
| p124-q01 | **blocked** | E text 判読不能 + answerBoolean ○/× 未確定 |
| p223-q01 | **blocked** | E text 判読不能 |
| p137-q01 | **blocked** | 記述式対応方針未決定 |
| p138-q04 | **blocked** | 記述式対応方針未決定 |
| p455-q01 | **blocked** | source image 未取得 |

### 次ステップ優先順位

1. **p124 / p223**: Kindle アプリまたは高解像度画像で E text を確認 → source-confirmed text を記録 → patch 実行
2. **p137 / p138**: 記述式対応方針を決定 → isExcluded=true が採用されれば即時 patch 可能
3. **p455**: Kindle キャプチャを取得 → P4 照合フローに戻る

---

## 禁止事項確認

- [x] data patch なし
- [x] public data patch なし
- [x] correction value を data に適用していない
- [x] 判読不能なテキストを推定補完していない
- [x] answerBoolean 変更なし
- [x] explanationText 変更なし
- [x] DATA_VERSION bump なし
- [x] import 実行なし
