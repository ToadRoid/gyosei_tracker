# Tier 1 原本照合ログ（source_check_tier1_log）

> **作成日**: 2026-04-29
> **関連 PR**: PR #112（chore: add imported data correction audit packet）後続タスク — Tier 1 source-check 記録
> **scope**: sourcePage 全体のデータ構造を完全把握したわけではなく、今回の Tier 1 対象 5 records について、seqNo と book item 番号の対応関係を確認した。原本画像照合結果を記録する。
> **lock**: `data/` / `public/data/` / `src/` / `correction_review_packet.json` / `correction_review_summary.md` — 一切触らない。
> **修正方針**: 本作業は **判定・記録のみ**。patch / commit / PR は user 明示指示待ち。

---

## 0. 先出し結論

### 本文修正候補（HIGH confirmed）

| page | seqNo | field | 判定 | confirmed text |
|---|---|---|---|---|
| **p001** | 4 | explanationText | **HIGH** | `憲法および法律` |
| **p002** | 4 | explanationText | **HIGH** | `前段・後段ともに誤っている` |
| **p003** | 7 | explanationText (×2 pattern) | **HIGH** | `ロッキード事件丸紅ルート` |
| **p085** | 5 | questionText / explanationText | **HIGH** | `主宰者` / 長文 restore |

### p318（本文修正不要 / flag clear 候補）

| page | seqNo | 判定 | 根拠 |
|---|---|---|---|
| **p318** | 1 | **本文修正不要**（PR #85 で confirmed closed） | 書籍 verbatim `…` = 著者による意図的省略。E 本文は書籍と一致。`needsSourceCheck` flag は次 data 変更 PR で clear 候補。 |

---

## 1. p318 確認状態

**ステータス: CONFIRMED closed（PR #85 merged）**

- PR #85 `claude/p2-p3-close-handoff` → squash merge SHA `5c29bf80d7ce6ad93002a0ce77ebe5be7f467687`
- 照合日: 2026-04-25（別セッション）
- source image: `~/Desktop/kindle_shots/0318.png` 右列 row 6
- 確認方法: Python PIL crop + 2x LANCZOS resize で高解像度確認
- 結論:
  - 書籍そのものが「申込者が**…**期間内に承諾の通知を受けなかったときは、その申込みは、その効力を失う」（民法523条2項）と印字
  - `…` は OCR 破損ではなく **書籍著者による意図的省略**（民法523条2項の「前項の」4文字を `…` に圧縮、肢別過去問集の標準書式）
  - E 本文修正不要
  - 旧 sourceCheckReason「OCR abbreviation」は誤り → 訂正済み（handoff.md 記録）
- 現在の flag 状態: `needsSourceCheck: true` のまま informational 維持（次 data 変更 PR で clear 候補）

---

## 2. seqNo ↔ book item 対応関係

### 2-1. sourcePage "001"（4 branches）

**source image**: `~/Desktop/kindle_shots/0001.png`
（`images_preprocessed/` に 0001.png なし。kindle_shots 原本のみ）

**ページ構造**: book p108-109「内閣の機能」section 2、左列 items 2–5 が visible
（item 1 は prior Kindle page に存在 = 0001.png には含まれない）

| seqNo | book item | 根拠 |
|---|---|---|
| 1 | 2 | seqNo1 Q =「内閣は条約を締結する場合には…」= image item 2 左列 content と一致 |
| 2 | 3 | 順次対応 |
| 3 | 4 | seqNo3 Q =「内閣は、違憲及び法律の規定を実施するために、政令及び省令を制定する。」= image item 4 左列「内閣は、憲法及び法律の規定を実施するために、政令を制定する。」と topic 一致（OCR corruption を除けば同一） |
| **4** | **5** | seqNo4 Q =「内閣は、実質的にみて、立法権を行使することがある。」= image item 5 内容と対応 |

**seqNo ≠ book item number**: seqNo 4 = book item 5（item 1 が prior page のため 1 ずれ）

#### seqNo 4 照合詳細

- record: `sourcePage "001"`, `seqNo 4`, `field "explanationText"`
- source image: `~/Desktop/kindle_shots/0001.png`
- crop: 別ファイルなし（直接 image 読取）
- book item: **5**（左列 5 番目の問題）
- current text (snippet): `内閣は、違憲および法律の規定を実施するために、政令を制定する（73条6号）。したがって、内閣は、実質的にみて、立法権を行使することがあるといえる。`
- 照合根拠:
  1. image item 5 **右列**（= seqNo 4 explanationText の直接 source）が「内閣は、**憲法および法律**の規定を実施するために、政令を制定する（憲法73条6号本文）。」と明記 → OCR は「憲法」→「違憲」と破損。表記はひらがな「および」
  2. 参考: image item 4 左列（= seqNo 3 questionText の source）は「憲法**及び**法律」（漢字）だが、explanationText の source は右列であり左列とは表記が異なる
  3. 「違憲」が「憲法」の OCR 破損であることは image item 5 右列から **confirmed**
- **confirmed text**: `憲法および法律`（ひらがな — 書籍 item 5 右列の表記に準拠）
- confidence: **HIGH** (confirmed from item 5 right column, 2026-04-30 再確認)

#### 附記（incidental finding）

seqNo 3 の questionText にも同系統の OCR 破損あり:
- current: `内閣は、違憲及び法律の規定を実施するために、政令及び省令を制定する。`
- image item 4 左列: `内閣は、憲法及び法律の規定を実施するために、政令を制定する。`
- confirmed: `憲法及び法律` / `政令を制定する`（`省令` の挿入も OCR 破損）
- **Tier 1 packet 未登録**（pattern `違憲および` で検出せず = `違憲及び` は別形式）
- 本 log に incidental として記録のみ。**今回 patch 対象外 — 別候補・別判断とする。**

---

### 2-2. sourcePage "002"（7 branches）

**source image**: `images_preprocessed/0002.png`（book p110-111「内閣総理大臣の権能」）

**ページ構造**: book section 2 end (items 11–13) + section 3「内閣総理大臣の権能」items 1–4 = 7 items

| seqNo | book item | 根拠 |
|---|---|---|
| 1 | 11 (section 2) | seqNo1 Q =「参議院の緊急集会を求めることは…」= image item 11 左列 content |
| 2 | 12 (section 2) | 順次対応 |
| 3 | 13 (section 2) | 順次対応 |
| **4** | **1 (section 3)** | seqNo4 Q =「内閣総理大臣は、その他の国務大臣と平等な関係にあり…」= section 3 item 1 左列 |
| 5 | 2 (section 3) | 順次 |
| 6 | 3 (section 3) | 順次 |
| 7 | 4 (section 3) | 順次 |

**seqNo ≠ book item number**: seqNo 4 = section 3 book item 1

#### seqNo 4 照合詳細

- record: `sourcePage "002"`, `seqNo 4`, `field "explanationText"`
- source image: `images_preprocessed/0002.png`
- crop: 別ファイルなし（直接 image 読取）
- book item: section 3「内閣総理大臣の権能」**item 1**（右列 section 3 最初の解説）
- current text (snippet): `よって本肢は、前後を反と戻として誤っている。`
- 照合根拠: image 右列 section 3 item 1 に「よって本肢は、**前段・後段ともに誤っている**。」と明記（視認 confirmed）
- **confirmed text**: `前段・後段ともに誤っている`
- confidence: **HIGH** (confirmed)

---

### 2-3. sourcePage "003"（7 branches）

**source image**: `images_preprocessed/0003.png`（book p110-111「内閣総理大臣の権能」続き）

**ページ構造**: section 2（内閣総理大臣の権能）items 5–11 = 7 items

| seqNo | book item | 根拠 |
|---|---|---|
| 1 | 5 | seqNo1 Q =「内閣総理大臣は、閣議の決定を経て国務大臣を罷免…」= image item 5 content |
| 2 | 6 | 順次 |
| 3 | 7 | 順次 |
| 4 | 8 | 順次 |
| 5 | 9 | 順次 |
| 6 | 10 | 順次 |
| **7** | **11** | seqNo7 Q =「内閣総理大臣が行政各部に対し指揮監督権を行使するためには…」= image item 11 content |

**seqNo ≠ book item number**: seqNo 7 = book item 11（items 5 始まりのため 4 ずれ）

#### seqNo 7 照合詳細（2 pattern hit = 同一 record）

- record: `sourcePage "003"`, `seqNo 7`, `field "explanationText"`
- source image: `images_preprocessed/0003.png`
- crop: 別ファイルなし（直接 image 読取）
- book item: **11**（右列最後の解説）
- current text (snippet): `判例（最大判平7.2.22：フジチヤ事件札孔ート）は、内閣総理大臣の強力な監督権から…`
- 照合根拠: image 右列 item 11 に「判例（最大判平7.2.22：**ロッキード事件丸紅ルート**）は、内閣総理大臣の強力な監督権から…」と明記（視認 confirmed）
- **confirmed text**: `ロッキード事件丸紅ルート`（`フジチヤ事件札孔ート` の全置換）
- confidence: **HIGH** (confirmed)
- 備考: packet では `フジチヤ` / `札孔ート` で 2 件 hit（同一 record）。修正は 1 箇所で完結。

---

### 2-4. sourcePage "085"（6 branches）

**source image**: `images_preprocessed/0085.png`（book p272-273「不利益処分」）

**ページ構造**: section 2 end (items 25–26) + section 3「弁明の機会の付与」items 1–4 = 6 items

| seqNo | book item | 根拠 |
|---|---|---|
| 1 | 25 (section 2) | seqNo1 Q =「聴聞を経てなされた不利益処分については…」= image item 25 左列 |
| 2 | 26 (section 2) | seqNo2 Q =「法が定める「聴聞」の節の規定に基づく処分…」= image item 26 左列 |
| 3 | 1 (section 3) | seqNo3 Q =「弁明の機会の付与は、処分を行うため意見陳述を要する場合で…」= section 3 item 1 |
| 4 | 2 (section 3) | seqNo4 Q =「弁明は、口頭ですることはできず…」= section 3 item 2 |
| **5** | **3 (section 3)** | seqNo5 Q =「聴聞の主客管は、弁明または聴聞の筆着の準備を…」= section 3 item 3（OCR 破損版） |
| 6 | 4 (section 3) | seqNo6 = section 3 item 4 |

**seqNo ≠ book item number**: seqNo 5 = section 3「弁明の機会の付与」book item 3

#### seqNo 5 照合詳細（questionText + explanationText 計 3 hit）

- record: `sourcePage "085"`, `seqNo 5`, `field "questionText"` (2 hit) + `"explanationText"` (1 hit)
- source image: `images_preprocessed/0085.png`
- crop: 別ファイルなし（直接 image 読取）
- book item: section 3（弁明の機会の付与）**item 3**（section 3 の 3 番目）

**questionText 照合:**
- current full questionText: `聴聞の主客管は、弁明または聴聞の筆着の準備を調査した場合を作成しなければならない`
- image 左列 section 3 item 3（confirmed）: `聴聞の主宰者は、弁明または聴聞の審理の経過を記載した調書を作成し、当該調書において、不利益処分の原因となる事実に対する当事者および参考人の陳述の要旨を明らかにしなければならない。`
- **[2026-04-29 修正]** 初回記録では `弁明または聴聞の` を落として記録していたが誤りであった。画像（left_page_thumb crop）の再確認により `弁明または聴聞の` が書籍に明記されていることを確認済み。`弁明または聴聞の` は OCR でも正しく保持されており、破損していない。
- confirmed corrupted parts:
  1. `主客管` → `主宰者`
  2. `筆着の準備を調査した場合を作成し` → `審理の経過を記載した調書を作成し、当該調書において、不利益処分の原因となる事実に対する当事者および参考人の陳述の要旨を明らかにし`
- `弁明または聴聞の` は破損なし（current text に正しく保持）
- confidence: **HIGH** (confirmed from left column image, re-verified 2026-04-29)

**explanationText 照合:**
- current full explanationText: `弁明事例の場合には、行手続法24条1項に基づいて特に該当していないから（行手続法第24条）、主客管に準備書面の作成を義務づけた聴聞手続の事情を記録する義務がある。調書の作成義務はない。`
- source image: `images_preprocessed/0085.png` 右ページ thumbnail + crop (y:2350-2950, 3x)
- image 右列 section 3 item 3 full text（confirmed）: `弁明手続の場合には、行政手続法24条1項は準用されていないから（行政手続法31条）、主宰者に聴聞調書の作成を義務づけた聴聞手続の場合とは異なり（24条1項）、調書の作成義務はない。`
- **[2026-04-29 追記]** 初回記録では `主客管`→`主宰者` のみ記録していたが不十分。右ページ thumb + crop 再確認により full-field source-confirmed text を取得。
- confirmed diff:
  1. `弁明事例の場合` → `弁明手続の場合`（source_confirmed）
  2. `行手続法24条1項に基づいて特に該当していないから（行手続法第24条）` → `行政手続法24条1項は準用されていないから（行政手続法31条）`（source_confirmed）
  3. `主客管` → `主宰者`（source_confirmed）
  4. `準備書面の作成を義務づけた聴聞手続の事情を記録する義務がある。` → `聴聞調書の作成を義務づけた聴聞手続の場合とは異なり（24条1項）、`（source_confirmed）
  5. `調書の作成義務はない。` = 変更なし
- judgment: full-field replacement — partial correction では条番号・文意・文構造の誤りが残存するため
- confidence: **HIGH** (confirmed from right column image, all diff source_confirmed)

---

## 3. 最終照合テーブル（修正版）

| page | seqNo | field | current (OCR) | confirmed (book) | source image | book item | confidence |
|---|---|---|---|---|---|---|---|
| p001 | 4 | explanationText | `違憲および法律` | `憲法および法律` | kindle_shots/0001.png | item 5 | HIGH |
| p002 | 4 | explanationText | `前後を反と戻として誤っている` | `前段・後段ともに誤っている` | images_preprocessed/0002.png | section 3 item 1 | HIGH |
| p003 | 7 | explanationText | `フジチヤ事件札孔ート` | `ロッキード事件丸紅ルート` | images_preprocessed/0003.png | item 11 | HIGH |
| p085 | 5 | questionText | `主客管` | `主宰者` | images_preprocessed/0085.png | section 3 item 3 | HIGH |
| p085 | 5 | questionText | `筆着の準備を調査した場合を作成し` | `審理の経過を記載した調書を作成し、当該調書において、不利益処分の原因となる事実に対する当事者および参考人の陳述の要旨を明らかにし` | images_preprocessed/0085.png | section 3 item 3 | HIGH |
| p085 | 5 | explanationText | full-field corruption | `弁明手続の場合には、行政手続法24条1項は準用されていないから（行政手続法31条）、主宰者に聴聞調書の作成を義務づけた聴聞手続の場合とは異なり（24条1項）、調書の作成義務はない。` | images_preprocessed/0085.png | section 3 item 3 | HIGH |
| p318 | 1 | — | (needsSourceCheck flag) | 修正不要（書籍 verbatim）| kindle_shots/0318.png | — | CONFIRMED (PR #85) |

### incidental finding（Tier 1 packet 未登録）

| page | seqNo | field | current (OCR) | confirmed (book) | source image | confidence |
|---|---|---|---|---|---|---|
| p001 | 3 | questionText | `違憲及び法律` / `政令及び省令` | `憲法及び法律` / `政令` | kindle_shots/0001.png | HIGH |

---

## 4. 非実行確認

- `data/reviewed_import.json`: 未変更
- `public/data/reviewed_import.json`: 未変更
- `correction_review_packet.json`: 未変更
- `correction_review_summary.md`: 未変更
- patch: 未作成
- stage / commit / push / PR / merge: 未実行

---

## 5. reviewed_import.json patch に進める状態かの判定

**判定: 進められる状態 — ただし patch 実行は user 明示指示待ち**

### 結論

実質確認対象 5 records の確認状態は閉じた。p001 / p002 / p003 / p085 は本文修正候補 HIGH。p318 は本文修正不要 confirmed であり、needsSourceCheck flag clear は次 data patch の候補。

p001 seqNo 3 incidental finding は今回 patch 対象外。別候補・別判断として記録のみ維持する。

### 根拠

| 条件 | 状態 |
|---|---|
| Tier 1 対象 5 records の seqNo ↔ book item 対応関係を確認・記録済み | ✅ |
| p318 は PR #85 で confirmed closed（本文修正不要）| ✅ |
| p001 / p002 / p003 / p085 の 4 records を image 視認で HIGH 確定 | ✅ |
| 推測・法知識のみによる確定なし（全件 image 視認） | ✅ |
| correction packet / reviewed_import.json 未変更 | ✅ |

### next step

p085 seqNo 5 questionText の patch boundary 確認 → patch plan 作成（patch 実行ではない）。
