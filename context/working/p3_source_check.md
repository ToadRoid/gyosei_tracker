# 既知 P3 3 件 source 照合 audit（read-only / 2026-04-27）

> **scope**: `context/stable/ingestion_flow.md` §10 既知 P3-1/2/3 の 3 件について原本画像と現 data を照合。
> **lock**: `data/` / `public/data/` / `src/` / `DATA_VERSION` / `context/stable/` / handoff / current_status / known_issues / `EXACT_MAPPING` / `sectionNormalization.ts` 触らない。
> **修正方針**: 本作業は **判定のみ**。data 修正・polarity flip・PR 化は **user 判断待ち**。
> **commit / PR**: user 判断待ち。

---

## 0. 結論（先出し）

| problemId | 判定 | 概要 |
|---|---|---|
| **KB2025-p194-q06** | **修正不要** | Q / E / ans すべて book 原文と完全一致。user 報告「正誤の誤り」は誤認の可能性大（ans=False は正しい、自治法 13 条の 2 は市町村の義務であり都道府県ではない） |
| **KB2025-p197-q01** | **要修正候補（中優先度 / Q + E restore、polarity 維持）** | Q で「**あらゆる**条例」→「**ある**条例」と OCR で短縮、E に substantive corruption（条文 citation 違い、結論文 garble） |
| **KB2025-p198-q05** | **要修正候補（軽微 / Q wording restore のみ、polarity 維持）** | Q の主語が「**長の選挙権を有する者**」→「**その選挙を行う者、原則として**」と置換、E と ans は完全一致 |

**三層 restore（p203-q04 型）案件は 0 件**。p197-q01 が最も substantive な corruption だが、ans 反転を含まない（polarity gate 通過済の状態）。

---

## 1. 用語整理（前提）

- **book Q番号**: 書籍ページ上の問題番号（A/B level + 1〜N）
- **data seqNo**: `data/reviewed_import.json` 内の branch 順序番号
- **三層 restore**: Q + E + ans の三者を同 PR で restore する pattern（p203-q04 / v110 = PR #94）
- 本 audit の判定 confidence: image を visual OCR で読み取った結果に基づく。**断定可能な範囲**で判定し、不明箇所は `判定保留` とする

---

## 2. source 確認 log

| ファイル | 解像度 | 確認結果 |
|---|---|---|
| `images_preprocessed/0194.png` | 6048x3536（2x upscale） | 読取可（layer 1 verbatim 可能）、書籍 p.490-491 「住民の権利 / 1) 住民」見開き |
| `images_preprocessed/0197.png` | 6048x3536 | 読取可、書籍 p.496-497「住民の権利」見開き（rows 4-8 が左列） |
| `images_preprocessed/0198.png` | 6048x3536 | 読取可、書籍 p.498-499「住民の権利」見開き（rows 9-12 + 「2) 解散及び解職の請求」rows 1-2） |
| `~/Desktop/kindle_shots/0194.png` / `0197.png` / `0198.png` | 3024x1768 | layout 補強用に read 確認、preprocessed と同一見開き |

→ **3 件とも source 二重確認可**。

---

## 3. KB2025-p194-q06 詳細照合

### 3-1. Q 比較

| 経路 | text |
|---|---|
| **book 原文（image 読取、p.490 row 6）** | 都道府県は、別に法律の定めるところにより、その住民につき、住民たる地位に関する正確な記録を常に整備しておかなければならない。 |
| **data q06 Q** | 都道府県は、別に法律の定めるところにより、その住民につき、住民たる地位に関する正確な記録を常に整備しておかなければならない。 |

**差分**: なし（**verbatim 完全一致**）

### 3-2. E 比較

| 経路 | text |
|---|---|
| **book 原文（image 読取、p.491 row 6）** | 「市町村」は、別に法律の定めるところにより、その住民につき、住民たる地位に関する正確な記録を常に整備しておかなければならない（地方自治法13条の2）。 |
| **data q06 E** | 「市町村」は、別に法律の定めるところにより、その住民につき、住民たる地位に関する正確な記録を常に整備しておかなければならない（地方自治法13条の2）。 |

**差分**: なし（**verbatim 完全一致**）

### 3-3. ans 比較

- **book 原文**: row marker = ✗（image p.491 row 6）
- **data q06**: ans=False
- **一致**

### 3-4. 判定

**修正不要**。

- 法律論の論理整合: ✓ 完全（自治法 13 条の 2 は市町村のみに義務、都道府県は義務外）
- Q / E: ✓ 完全 verbatim 一致
- polarity: ✓ 正しい（False / ✗、Q 命題が誤りであることを正しく示している）

**user 報告「正誤の誤り」について**: 本 audit の結論は「ans=False は正しい」。user 報告は誤認の可能性が高い（自治法 13 条の 2 の主体が「市町村」であって「都道府県」ではないことの混乱と推察）。data 修正不要、user に判定根拠を提示することで close 可能。

---

## 4. KB2025-p197-q01 詳細照合

### 4-1. Q 比較

| 経路 | text |
|---|---|
| **book 原文（image 読取、p.496 row 4）** | 住民は、その属する普通地方公共団体の**あらゆる**条例について、条例制定改廃請求権を行使することができる。 |
| **data q01 Q** | 住民は、その属する普通地方公共団体の**ある**条例について、条例制定改廃請求権を行使することができる。 |

**差分**: 「**あらゆる**」→「**ある**」（「らゆ」2 文字脱落）

意味的影響:
- 「あらゆる条例」= **all/any ordinances**（広い射程）
- 「ある条例」= **a/some ordinance**（狭い射程）

両者とも ans=False の論理は維持されるが（地方税等の例外があるため「あらゆる条例」では網羅的に行使できない）、語感・意味精度は image 側が原文に近い。

### 4-2. E 比較（substantive corruption）

| 経路 | text |
|---|---|
| **book 原文（image 読取、p.497 row 4）** | × **地方税**の賦課徴収、分担金、使用料、手数料の徴収に関する条例は、条例制定改廃請求の対象ではないから（地方自治法**74条1項かっこ書**）、**あらゆる条例につき条例制定改廃請求権を行使できるとする本肢は誤っている**。地方公共団体の財政的基礎を危うくし、その存立を脅かすおそれがあるためである。 |
| **data q01 E** | 地方の賦課徴収、分担金、使用料、手数料の徴収に関する条例は、条例制定改廃請求の対象ではないからである（地方自治法**74条1項・6号**）。**あるいは多くの条例につき条例制定改廃請求権を行使できるような本質が認められている**。地方公共団体の財政的基礎を危うくし、その存立を脅かすおそれがあるためである。 |

**差分（critical）**:

| # | book 原文 | data q01 | 差分の性質 |
|---|---|---|---|
| 1 | 「地方**税**の賦課徴収」 | 「地方の賦課徴収」 | 「税」1 文字脱落 |
| 2 | 「（地方自治法 74 条 1 項**かっこ書**）」 | 「（地方自治法 74 条 1 項**・6 号**）」 | **条文 citation の根拠が違う** |
| 3 | 「**あらゆる条例につき条例制定改廃請求権を行使できるとする本肢は誤っている**」 | 「**あるいは多くの条例につき条例制定改廃請求権を行使できるような本質が認められている**」 | **完全に別の文** = data の文章が意味不明 |
| 4 | 末尾「地方公共団体の財政的基礎を危うくし...」 | 末尾「地方公共団体の財政的基礎を危うくし...」 | match |

E の中盤以降が **substantive corruption** = 法律論の根拠（条文 citation）が誤り、結論文が意味不明。

### 4-3. ans 比較

- **book 原文**: row marker = ×（image p.497 row 4）
- **data q01**: ans=False
- **一致**

### 4-4. 判定

**要修正候補（中優先度 / Q + E restore、polarity 維持）**:

- Q: 「あらゆる」→「ある」OCR 短縮（軽微、book 原文へ verbatim restore 可）
- E: substantive corruption（条文 citation 誤り + 結論文置換）= **解説として読める状態ではない**
- ans: True/False 反転は **不要**（polarity 維持）

修正方針（推奨、本 audit では実施しない）:
- Q: book 原文へ verbatim restore（「あらゆる」へ）
- E: book 原文へ verbatim restore（条文 = 74 条 1 項かっこ書 + 結論文「あらゆる条例につき条例制定改廃請求権を行使できるとする本肢は誤っている」）
- ans: 無変更（False 維持）
- DATA_VERSION bump 必須

これは **二層 restore**（Q + E）であり、p203-q04 のような三層 restore（polarity flip 含む）ではない。

---

## 5. KB2025-p198-q05 詳細照合

### 5-1. Q 比較

| 経路 | text |
|---|---|
| **book 原文（image 読取、p.498「2) 解散及び解職の請求」row 1）** | 普通地方公共団体の議会の議員および**長の選挙権を有する者**は、その総数の 3 分の 1 以上の者の連署をもって、その代表者から、選挙管理委員会に対し、当該普通地方公共団体の議会の解散の請求をすることができる。 |
| **data q05 Q** | 普通地方公共団体の議会の議員**およびその選挙を行う者は、原則として**、その総数の 3 分の 1 以上の者の連署をもって、その代表者から、選挙管理委員会に対し、当該普通地方公共団体の議会の解散の請求をすることができる。 |

**差分**: 主語句の置換。
- book 原文: 「議員および**長の選挙権を有する者**」（議員と長を選挙する権利を有する者 = 有権者）
- data: 「議員**およびその選挙を行う者**、**原則として**」（曖昧表現 + 「原則として」が解説から混入した可能性）

意味的影響:
- 自治法 76 条 1 項の正確な主体 = 「**選挙権を有する者**」（≒ data 解説 E に書かれている「選挙権を有する者の総数の 3 分の 1 以上の者」）
- data Q の「その選挙を行う者」は曖昧で正確ではない
- 「原則として」は解説に登場する語が Q に紛れ込んだ可能性（OCR / 取込時の混入）

### 5-2. E 比較

| 経路 | text |
|---|---|
| **book 原文（image 読取、p.499 row 1）** | ○ 本肢は、地方自治法 76 条 1 項のとおりであり、原則として、選挙権を有する者の総数の 3 分の 1 以上の者の連署をもって、代表者が、選挙管理委員会に対し、議会の解散を請求することができる。 |
| **data q05 E** | 本肢は、地方自治法 76 条 1 項のとおりであり、原則として、選挙権を有する者の総数の 3 分の 1 以上の者の連署をもって、代表者が、選挙管理委員会に対し、議会の解散を請求することができる。 |

**差分**: なし（image 冒頭の「○」は row marker、data E に含めない設計と整合 = **verbatim 完全一致**）

### 5-3. ans 比較

- **book 原文**: row marker = ○（image p.499「2) 解散及び解職の請求」row 1）
- **data q05**: ans=True
- **一致**

### 5-4. 判定

**要修正候補（軽微 / Q wording restore のみ、polarity 維持）**:

- Q: 主語句の置換（「長の選挙権を有する者」→「その選挙を行う者、原則として」）= 意味的に **不正確**
- E: 完全一致、修正不要
- ans: True 維持、修正不要

修正方針（推奨、本 audit では実施しない）:
- Q のみ book 原文へ verbatim restore（「議員および長の選挙権を有する者は」へ）
- E / ans: 無変更
- DATA_VERSION bump 必須

これは **一層 restore**（Q のみ）。

---

## 6. 三層 restore 案件の有無

p203-q04（PR #94 = v110）のような **Q + E + ans 三層 restore** が必要な案件は **0 件**。

| problemId | Q corruption | E corruption | ans flip 必要 | 三層 restore 必要？ |
|---|---|---|---|---|
| p194-q06 | なし | なし | 不要 | × （修正不要） |
| p197-q01 | 軽微（あらゆる→ある） | substantive | 不要 | **二層 restore**（Q + E） |
| p198-q05 | 軽微（主語句置換） | なし | 不要 | **一層 restore**（Q のみ） |

→ いずれも polarity 維持、ans flip なし。p203-q04 のような serious corruption は本 3 件には不在。

---

## 7. 修正案（実装はしない / 候補列挙のみ）

### 7-1. p194-q06: 修正不要

ingestion_flow.md §10 P3-1 を **close** 可能。data 修正なし。

### 7-2. p197-q01: 二層 restore PR 候補

| 層 | 修正内容 |
|---|---|
| Q | 「**ある**条例」→「**あらゆる**条例」 |
| E | 全文 restore（地方**税** / 74 条 1 項**かっこ書** / 「**あらゆる条例につき...本肢は誤っている**」） |
| ans | 無変更（False 維持） |
| DATA_VERSION | bump 必須 |

合計 diff 想定: data + mirror + DATA_VERSION = 3 ファイル / +6 / -6 程度。

### 7-3. p198-q05: 一層 restore PR 候補

| 層 | 修正内容 |
|---|---|
| Q | 「**およびその選挙を行う者は、原則として**」→「**および長の選挙権を有する者は**」 |
| E | 無変更 |
| ans | 無変更（True 維持） |
| DATA_VERSION | bump 必須 |

合計 diff 想定: data + mirror + DATA_VERSION = 3 ファイル / +3 / -3 程度。

### 7-4. PR 化方針

v3 §6「1 対象 = 1 PR」原則に従うなら:
- p197-q01 単独 PR（v111 候補）
- p198-q05 単独 PR（v112 候補）
- 同梱もあり得るが、**polarity 影響なし** + **scope 明確に分離可能**ゆえ別 PR が安全

または 2 件束ねる場合:
- v111: 既知 P3 修正束ね（p197-q01 + p198-q05、p194-q06 は修正不要として close 記録のみ）
- DATA_VERSION 1 回 bump
- diff 想定: data + mirror + DATA_VERSION = 3 ファイル / +9 / -9

---

## 8. 5 分類への当てはめ（error_reports_queue 用）

| problemId | カテゴリ |
|---|---|
| p194-q06 | **A: source 側も number / 完全一致** = data 修正不要、user 報告は誤認 |
| p197-q01 | **B: source has 値、import で歪曲** + **partial corruption**（Q 軽微 + E substantive） |
| p198-q05 | **B: source has 値、import で歪曲**（Q 軽微、E と ans は無事） |

E (override が番号を落とした) / D (中途半端な修正) は該当なし。

---

## 9. 触らないこと（再確認 / 本 audit での実施事項）

- `data/reviewed_import.json` / `public/data/reviewed_import.json`（**read のみ**）
- `src/` 配下（**read なし**）
- `DATA_VERSION`（**read のみ**）
- `context/stable/ingestion_flow.md`（**read なし**）
- `context/working/handoff.md` / `current_status.md` / `known_issues.md` / 既存 audit 群（**read なし**）
- `EXACT_MAPPING` / `sectionNormalization.ts`（**read なし**）
- patch / script / migration / cleanup（**追加なし**）

---

## 10. read-only 確認 log

| ファイル | 行為 |
|---|---|
| `images_preprocessed/0194.png` | read（visual OCR / Q1-Q6 のうち Q6 を中心に照合） |
| `images_preprocessed/0197.png` | read（visual OCR / 左列 row 4 = data seq1 を照合） |
| `images_preprocessed/0198.png` | read（visual OCR / 「2) 解散及び解職の請求」row 1 = data seq5 を照合） |
| `~/Desktop/kindle_shots/0194.png` / `0197.png` / `0198.png` | 存在確認（layout 補強） |
| `data/reviewed_import.json` | read（python 抽出 / 3 件の Q/E/ans/sectionTitle/page refs） |
| `context/working/p3_source_check.md` | **新規作成 = 本ファイル** |

---

## 11. user 判断ポイント

1. **本 audit の保全方針**: docs-only PR 化するか / untracked 維持
2. **修正 PR の起票方針**:
   - p194-q06: 修正不要、ingestion_flow.md §10 P3-1 を close 記録のみ
   - p197-q01: Q + E 二層 restore PR（v111 候補、要 GO）
   - p198-q05: Q 一層 restore PR（v112 候補、要 GO）
   - 束ねるか分けるか
3. **照合 confidence**: 本 audit は image visual OCR ベース。GPT 側 review で再 verify するか
4. **次の優先順**:
   - 既知 P3 close 更新（修正不要分 + audit 結果反映）→ docs-only PR
   - p197-q01 / p198-q05 の data restore → v111 / v112 PR

---

## 12. 重要遵守事項（再確認）

- read-only audit として開始 → 本ファイル作成のみ、他無改変
- 変更が発生したら即停止して報告 → 変更ゼロで完了
- source未確認で本文補完しない → image を直接 source とし、知識逆算は未使用
- source未確認で polarity flip しない → 本 audit は flip しない（判定のみ）
- 条文知識や類似問題から逆算補完しない → image を最終 source とし判定
- sectionTitle / displaySectionTitle / subjectId / chapterId 変更しない → 本 audit は data 触らず
- handoff / current_status / context/stable / known_issues 触らない → 触っていない
- EXACT_MAPPING / sectionNormalization.ts に入らない → 入っていない
- Ollama PoC に入らない → 入っていない
- commit / PR は **user 判断待ち**
