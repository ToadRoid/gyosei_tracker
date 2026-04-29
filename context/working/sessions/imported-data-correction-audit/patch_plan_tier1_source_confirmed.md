# patch_plan_tier1_source_confirmed

> **作成日**: 2026-04-29
> **関連**: PR #112 後続 — Tier 1 source-check confirmed records の patch plan
> **status**: plan only — patch 未実行
> **lock**: `data/reviewed_import.json` / `public/data/` / correction packet — 一切触らない

---

## Scope

### Patch candidates（本文修正候補）

- p001 (seqNo 4 / explanationText)
- p002 (seqNo 4 / explanationText)
- p003 (seqNo 7 / explanationText)
- p085 (seqNo 5 / questionText + explanationText)

### Out of scope

| 対象 | 理由 |
|---|---|
| p318 | 本文修正不要 confirmed（書籍 verbatim `…` = 著者省略）。text correction patch に含めない。needsSourceCheck flag clear は次 data patch の別途候補。 |
| p001 seqNo 3 incidental finding | 今回 patch 対象外。別候補・別判断として記録のみ維持。 |
| non-Tier-1 records | scope 外 |
| broad OCR cleanup | scope 外 |

---

## Patch candidate table

### p001

| 項目 | 値 |
|---|---|
| page | p001 |
| seqNo | 4 |
| problemId | KB2025-p001-q01 |
| field | explanationText |
| source image | `~/Desktop/kindle_shots/0001.png` |
| source evidence | seqNo 4 = book item 5（seqNo 3 = book item 4 対応から導出）。book item 5 **右列**「憲法**および**法律の規定を実施するために、政令を制定する（憲法73条6号本文）」を視認確認。「違憲」は「憲法」の OCR 破損。表記はひらがな「および」（書籍右列の表記に準拠）。参考: 書籍 item 4 左列（seqNo 3 questionText source）は漢字「憲法及び法律」だが、explanationText の source は右列。 |
| confidence | HIGH |
| patch status | planned only |

**current full explanationText:**
```
内閣は、違憲および法律の規定を実施するために、政令を制定する（73条6号）。したがって、内閣は、実質的にみて、立法権を行使することがあるといえる。
```

**proposed full explanationText:**
```
内閣は、憲法および法律の規定を実施するために、政令を制定する（73条6号）。したがって、内閣は、実質的にみて、立法権を行使することがあるといえる。
```

**変更箇所:** `違憲および` → `憲法および`

---

### p002

| 項目 | 値 |
|---|---|
| page | p002 |
| seqNo | 4 |
| problemId | KB2025-p002-q01 |
| field | explanationText |
| source image | `images_preprocessed/0002.png` |
| source evidence | book p110-111 section 3 item 1 右列「前段・後段ともに誤っている」を直接視認確認。seqNo 4 = section 3 book item 1（seqNo 1-3 = section 2 items 11-13）。 |
| confidence | HIGH |
| patch status | planned only |

**current full explanationText:**
```
内閣総理大臣は、「内閣の首長」たる地位を有し（憲法66条1項）、他の国務大臣と平等の関係にはない。また、内閣総理大臣は、慣習ではなく、法定職務として内閣を代表する（72条）。よって本肢は、前後を反と戻として誤っている。
```

**proposed full explanationText:**
```
内閣総理大臣は、「内閣の首長」たる地位を有し（憲法66条1項）、他の国務大臣と平等の関係にはない。また、内閣総理大臣は、慣習ではなく、法定職務として内閣を代表する（72条）。よって本肢は、前段・後段ともに誤っている。
```

**変更箇所:** `前後を反と戻として誤っている` → `前段・後段ともに誤っている`

---

### p003

| 項目 | 値 |
|---|---|
| page | p003 |
| seqNo | 7 |
| problemId | KB2025-p003-q01 |
| field | explanationText |
| source image | `images_preprocessed/0003.png` |
| source evidence | book p110-111 item 11 右列「ロッキード事件丸紅ルート」を直接視認確認。seqNo 7 = book item 11（seqNo 1 = book item 5 より対応）。 |
| confidence | HIGH |
| patch status | planned only |

**current full explanationText:**
```
判例（最大判平7.2.22：フジチヤ事件札孔ート）は、内閣総理大臣の強力な監督権から、本肢のように判断する。内閣総理大臣は、国務大臣の任免権を有し、内閣を代表して行政各部を指揮監督する広範な権能（憲法72条）を有するなど、内閣の権威を剥奪する法的障害はない。
```

**proposed full explanationText:**
```
判例（最大判平7.2.22：ロッキード事件丸紅ルート）は、内閣総理大臣の強力な監督権から、本肢のように判断する。内閣総理大臣は、国務大臣の任免権を有し、内閣を代表して行政各部を指揮監督する広範な権能（憲法72条）を有するなど、内閣の権威を剥奪する法的障害はない。
```

**変更箇所:** `フジチヤ事件札孔ート` → `ロッキード事件丸紅ルート`

---

### p085 — questionText（full-field replacement）

| 項目 | 値 |
|---|---|
| page | p085 |
| seqNo | 5 |
| problemId | KB2025-p085-q01 |
| field | questionText |
| source image | `images_preprocessed/0085.png`（left_page_thumb crop 再確認済み） |
| source evidence | book p272-273 section 3（弁明の機会の付与）item 3 左列を直接視認確認。「弁明または聴聞の」が書籍に明記。seqNo 5 = section 3 book item 3（seqNo 1-2 = section 2 items 25-26）。 |
| confidence | HIGH |
| patch status | planned only |

**current full questionText:**
```
聴聞の主客管は、弁明または聴聞の筆着の準備を調査した場合を作成しなければならない
```

**proposed full questionText（candidate）:**
```
聴聞の主宰者は、弁明または聴聞の審理の経過を記載した調書を作成し、当該調書において、不利益処分の原因となる事実に対する当事者および参考人の陳述の要旨を明らかにしなければならない。
```

**変更箇所:**
1. `主客管` → `主宰者`（`弁明または聴聞の` は破損なし、保持）
2. `筆着の準備を調査した場合を作成し` → `審理の経過を記載した調書を作成し、当該調書において、不利益処分の原因となる事実に対する当事者および参考人の陳述の要旨を明らかにし`
3. 末尾に `。` を追加（current text は `なければならない` で終わり句点なし / 書籍は `なければならない。` / questionText の 99.8% が `。` で終わる convention）

**注意:**
- `なければならない` は current text 末尾に存在するため substring replacement では含めない
- full-field after value は書籍どおり `。` まで含める candidate とする
- 実 patch 前に GPT review で `。` の扱いを確認すること

---

### p085 — explanationText（full-field replacement）

| 項目 | 値 |
|---|---|
| page | p085 |
| seqNo | 5 |
| problemId | KB2025-p085-q01 |
| field | explanationText |
| source image | `images_preprocessed/0085.png`（右ページ thumbnail + crop y:2350-2950, 3x） |
| source evidence | book p272-273 section 3 item 3 右列 full text を視認確認（2026-04-29）。full-field source confirmed。 |
| confidence | HIGH — full-field source_confirmed |
| patch status | planned only — full-field replacement |

**current full explanationText:**
```
弁明事例の場合には、行手続法24条1項に基づいて特に該当していないから（行手続法第24条）、主客管に準備書面の作成を義務づけた聴聞手続の事情を記録する義務がある。調書の作成義務はない。
```

**proposed full explanationText（source-confirmed）:**
```
弁明手続の場合には、行政手続法24条1項は準用されていないから（行政手続法31条）、主宰者に聴聞調書の作成を義務づけた聴聞手続の場合とは異なり（24条1項）、調書の作成義務はない。
```

**変更箇所:**
1. `弁明事例の場合` → `弁明手続の場合`
2. `行手続法24条1項に基づいて特に該当していないから（行手続法第24条）` → `行政手続法24条1項は準用されていないから（行政手続法31条）`
3. `主客管` → `主宰者`
4. `準備書面の作成を義務づけた聴聞手続の事情を記録する義務がある。` → `聴聞調書の作成を義務づけた聴聞手続の場合とは異なり（24条1項）、`
5. `調書の作成義務はない。` = 変更なし（末尾は一致）

全差分 source_confirmed。partial correction では条番号・文意・文構造の誤りが残存するため full-field replacement とする。

---

## questionText 末尾句点 convention（read-only 確認済み）

| 項目 | 値 |
|---|---|
| total questionText records | 2448 |
| 句点 `。` あり | 2443（99.8%） |
| 句点なし | 5（0.2%） |
| p085 seqNo 5 | 句点なし（anomaly） |

→ `。` を加えることは convention に沿う。実 patch で含めることを GPT review で確認すること。

---

## Non-actions

- `data/reviewed_import.json`: 未変更
- `public/data/reviewed_import.json`: 未変更
- correction packet: 未変更
- patch: 未適用
- stage / commit / push / PR / merge: 未実行
