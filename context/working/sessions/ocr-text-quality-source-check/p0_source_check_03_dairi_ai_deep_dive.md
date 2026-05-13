# P0 source-check log: 03_代理 AI Deep Dive #15 / #30 原本照合

date: 2026-05-13
base: origin/main `80b21da`

source image basis:
- `images/0230.png` / `images_preprocessed/0230.png` (book pages 562-563)
- `images/0233.png` / `images_preprocessed/0233.png` (book pages 568-569)

両 source image とも高解像度・読解可能。OCR照合に十分。

---

## 結論サマリー

| # | problemId / seqNo | answerBoolean | Q patch | E patch |
|---|---|---|---|---|
| **#15** | KB2025-p230-q01 seq=6 | **不変（false で正しい）** | **必須** | **必須** |
| **#30** | KB2025-p233-q01 seq=3 | **不変（true で正しい）** | **必須** | 不要 |

**重要な訂正**: audit 段階で「#15 の answerBoolean が逆転している可能性」と推定したが、**source 照合の結果 answerBoolean は正しい**。Q の OCR崩れによって肢の意味そのものが反転していたため、外形的に answerBoolean が逆に見えていただけだった。

---

## #15: KB2025-p230-q01 seq=6

### 原本（書籍）

source image: `images_preprocessed/0230.png` 左ページ問題21（書籍ページ 562）

- 書籍上の問題番号: 21
- 書籍上の正答記号（右ページ 563）: **×（false）**

**書籍 Q**:
> 21 使者が本人の意思を第三者に表示する場合、その意思表示に錯誤があったか否かは、**使者を基準に判断する**。

**書籍 E**:
> 21 × 使者が本人の意思を第三者に表示する場合、その意思表示に錯誤があったかどうかは、**本人を基準に判断する**。意思決定は本人のもとで完了しており、使者はこれを相手方に表示するだけである。

### 現在 data（要修正）

- sourcePage: 230（page-level）, sourcePageQuestion=562, sourcePageAnswer=563
- ab: **false**（書籍と一致 ✓）

**現在 data Q**:
> 債務者が本人の意思を第三者に表示する場合、その意思表示に錯誤があったか否かは、本人を基準に判断する。

**現在 data E**:
> 誤意思表示は本人のもとで完結しているから、債権者は単に相手方に表示するだけだからである。

### OCR/parser 崩れの正体

Q に **2 箇所の致命的崩れ** が複合発生:

| 種類 | 現在 | 書籍原本 |
|---|---|---|
| 主語 | **債務者**が本人の意思を第三者に表示する | **使者**が本人の意思を第三者に表示する |
| 判断基準（**肢の主張**） | **本人**を基準に判断する | **使者**を基準に判断する |

→ **OCR が肢の主張を逆転させていた**。これが audit 段階で「ab 逆転疑い」と見えた原因。

実態:
- 書籍肢: 「使者を基準に判断する」（誤った主張）→ ×
- 書籍 ab: × （false）
- 現在 data ab: false ← 書籍と一致して正しい
- 現在 data Q: 「本人を基準に判断する」（正しい主張に見える）→ 肢の主張と ab=false が論理矛盾するように見える

E にも崩れ:

| 種類 | 現在 | 書籍原本 |
|---|---|---|
| 主語 | **誤意思表示**は本人のもとで完結している | **意思決定**は本人のもとで完了している |
| 主語2 | **債権者**は単に相手方に表示するだけ | **使者**はこれを相手方に表示するだけ |

### Source-confirmed replacement 候補

**Q (replacement)**:
> 使者が本人の意思を第三者に表示する場合、その意思表示に錯誤があったか否かは、使者を基準に判断する。

**E (replacement)**:
> 使者が本人の意思を第三者に表示する場合、その意思表示に錯誤があったかどうかは、本人を基準に判断する。意思決定は本人のもとで完了しており、使者はこれを相手方に表示するだけである。

**answerBoolean**: 変更なし（false のまま）

### 判定

- **source confirmed**
- **answerBoolean は正しい（変更不要）**
- **Q は致命的崩れ、patch 必須**
- **E は OCR崩れ、patch 必須（学習論理の整合のためにも必須）**

---

## #30: KB2025-p233-q01 seq=3

### 原本（書籍）

source image: `images_preprocessed/0233.png` 左ページ問題15（書籍ページ 568）

- 書籍上の問題番号: 15
- 書籍上の正答記号（右ページ 569）: **○（true）**

**書籍 Q**:
> 15 Bが何の代理権もないのにAの代理人だと偽ってAから預かった絵画をCに売却し、その後に**AがBを相続した**ときは、AはBの行為につき追認を拒むことができる。

**書籍 E**:
> 15 ○ 無権代理行為が行われた場合において、その後、無権代理人Bが死亡して本人AがBを相続したときは、追認拒絶権を本人の地位で行使しても信義則に反することはなく、追認を拒絶することができる（最判昭37.4.20）。

### 現在 data

- sourcePage: 233（page-level）, sourcePageQuestion=568, sourcePageAnswer=569
- ab: **true**（書籍と一致 ✓）

**現在 data Q**:
> Bが何の代理権もないのにAの代理人だと偽ってAから預かった絵画をCに売却し、その後に**AがBを ratify した**ときは、AはBの行為につき追認を拒むことができる。

**現在 data E**:
> 無権代理行為が行われた場合において、その後、無権代理人Bが死亡して本人AがBを相続したとき、追認拒絶権を本人の地位で行使しても信義則に反することはなく、追認を拒絶することができる（最判昭37.4.20）。

### OCR/parser 崩れの正体

Q に 1 箇所の崩れ:

| 種類 | 現在 | 書籍原本 |
|---|---|---|
| 法律用語 | AがBを **ratify** した | AがBを **相続** した |

→ 漢字「相続」が英単語「ratify」（=追認）に化けるという奇妙な parser bug。OCR ではなく後段の parser（GPT/Gemini系の前処理）由来の可能性が高い。

E は書籍 E とほぼ一致（軽微な助詞・読点差のみ）。**実質的な崩れなし**。

### Source-confirmed replacement 候補

**Q (replacement)**:
> Bが何の代理権もないのにAの代理人だと偽ってAから預かった絵画をCに売却し、その後にAがBを相続したときは、AはBの行為につき追認を拒むことができる。

**E**: 変更不要（書籍とほぼ一致）

**answerBoolean**: 変更なし（true のまま）

### 判定

- **source confirmed**
- **answerBoolean は正しい（変更不要）**
- **Q patch 必須（「ratify」→「相続」、1単語差し替え）**
- **E patch 不要**

---

## data / public sync 確認

両 P0 とも data/reviewed_import.json と public/data/reviewed_import.json は完全 sync（前 audit で確認済み）。patch は両ファイルに同期して適用する必要がある。

---

## 重要な観察

### 1. audit 段階の推定が一部誤っていた

audit 段階で「#15 は answerBoolean 逆転の可能性」と書いたが、source 確認の結果 **answerBoolean は変更不要**。
本来の肢「使者を基準に判断する」が OCR崩れで「本人を基準に判断する」に化けたため、外形的に「正しいことを言っている肢なのに false 扱い」に見えていた。

→ **OCR が肢の論旨を反転させる崩れは、外見からは answerBoolean エラーと区別できない**。source 照合の重要性を改めて示す典型例。

### 2. parser/OCR 崩れの種類が 2 系統ある

- **#15 タイプ**: 通常の OCR 誤読（使者→債務者、意思決定→誤意思表示、使者→債権者）— 視覚的に似た字への誤読
- **#30 タイプ**: 意味類似の英単語への置換（相続→ratify）— OCR ではなく後段 parser（AI/LLM）由来の hallucination 系崩れの可能性

後者は OCR pipeline の検証では発見しにくい。「漢字が英単語に化ける」現象を別途検知する仕組みが必要。

### 3. answerBoolean は両方とも正しい

P0 2件とも source 照合の結果 **answerBoolean は不変**。data patch は Q（と #15 の E）の textual replacement のみで、データの正誤構造は維持される。

---

## 次の進め方（提案、要承認）

### Phase A 完了: source 確認

- [x] #15: source confirmed, Q+E patch 候補確定
- [x] #30: source confirmed, Q patch 候補確定

### Phase B 提案: P0 data patch design

**対象**:
- #15 KB2025-p230-q01 seq=6: Q 全文置換 + E 全文置換
- #30 KB2025-p233-q01 seq=3: Q 単語置換（「ratify」→「相続」）

**実施手順案**:
1. data/reviewed_import.json と public/data/reviewed_import.json の両方で、該当 branch の questionText / explanationText のみを置換
2. answerBoolean は両方とも変更しない
3. DATA_VERSION は bump しない（textual fix のみ、schema 変更なし）
4. 1 PR で両ファイル同期 patch（page 単位の最小 patch）
5. tsc / build / git diff --check で安全確認
6. user の最終承認後に merge

ただし stop 条件「data patch が必要そうなものが出る」に該当しているため、ここでは patch せず**設計提案にとどめ、別承認待ち**。

### Phase C 提案: parser/OCR 改善（恒久）

- 「漢字が英単語に化ける」hallucination 検知ルール追加（#30 タイプ）
- 「肢の主張と explanationText の論理が逆転する」整合性チェック追加（#15 タイプ）
- needsSourceCheck 自動検知に上記 2 種を含める

---

## 停止判定

| 停止条件 | 該当 |
|---|---|
| source image が存在しない | 該当せず |
| source image が読めない | 該当せず（高解像度で完全に読めた） |
| #15 / #30 の同定にズレ | 該当せず |
| answerBoolean 変更が必要そう | **該当せず**（両方とも変更不要と確定） |
| Q/E の大幅 patch が必要そう | **該当**（#15 Q+E, #30 Q） |

→ **source-check はここで停止**。次は data patch design を別承認で進めるか、Phase C の parser 改善検討に進むかをユーザー判断。

---

## 禁止事項確認

- [x] data/reviewed_import.json 修正なし
- [x] public/data/reviewed_import.json 修正なし
- [x] answerBoolean 変更なし
- [x] questionText 変更なし
- [x] explanationText 変更なし
- [x] src 修正なし
- [x] import 実行なし
- [x] DATA_VERSION bump なし
- [x] stash apply/drop なし
- [x] padding 調整なし
- [x] 推定による replacement 作成: **書籍原本に基づく確定**であり推定ではない
- [x] commit / push / PR なし
