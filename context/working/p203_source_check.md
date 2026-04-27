# p203 source 照合（read-only / 2026-04-27）

> **scope**: `error_reports_queue.md` §1 で隔離した KB2025-p203-q03 / q04 を、原本画像と照合して OCR 崩れか原文ママかを判定する read-only 作業。
> **lock**: `data/` / `public/data/` / `src/` / DATA_VERSION / `context/stable/` / handoff / current_status / known_issues は触らない。
> **修正方針**: 本作業は **判定のみ**。data 修正・polarity flip・PR 化は **user 判断待ち**。
> **commit / PR**: user 判断待ち。

---

## 0. 結論（先出し）

| problemId | data seq | 判定 | 概要 |
|---|---|---|---|
| **KB2025-p203-q03** | seq3 | **修正不要 or 軽微 stylistic 候補** | Q/E/ans すべて book 原文と substantively 一致。「差別的取扱**い**」vs「差別的取扱」の **送り仮名 1 文字差**のみ |
| **KB2025-p203-q04** | seq4 | **要修正候補（高優先度 / polarity 影響あり）** | Q が book 原文と **完全に不一致**、E の判例 citation 誤り（「最判平8.7.14」→「東判平成9.9.17」に化けている）、E 末尾の結論文も garble、ans=False は book 原文 ans=○(True) と矛盾 |

**重要**: q04 の修正は単なる polarity flip では不十分。**Q + E + ans 三者すべての restore が必要**（book 原文 Q3 = 住民に準ずる地位にある者にも適用される / 判例 = 最判平8.7.14）。v3 §5 polarity gate を通すなら triangulation は本 audit で **既に充足**（image row marker = ○ / E 末尾論理 / 最判平8.7.14 判例特定 = 3 経路一致）。

---

## 1. 用語整理（前提）

- **book Q番号** = 書籍ページ上の問題番号（A/B level + 1〜N）
- **data seqNo** = `data/reviewed_import.json` 内の branch 順序番号
- **本ページの mapping**: data seq には前ページ末の Q が seq1 として carryover している。よって **data seqN = book QN-1**

| data seq | book Q番号 | 内容 |
|---|---|---|
| seq1 | book Q20（前ページ） | 住民訴訟 弁護士報酬請求 |
| seq2 | **book Q1** | 公の施設の定義 |
| seq3 | **book Q2** | 不当な差別的取扱 + 正当な理由 + 拒否 |
| seq4 | **book Q3** | 住民に準ずる地位にある者にも適用 / 判例 |
| seq5 | book Q4 | 法律・政令の特別の定め / 条例 |
| seq6 | book Q5 | 使用申込・使用承認 / 処理規程 vs 条例 |

→ **user 報告「q03 / q04」= data seq3 / seq4 = book Q2 / Q3** に対応。

---

## 2. source 確認 log

| ファイル | 解像度 | 確認結果 |
|---|---|---|
| `images_preprocessed/0203.png` | 6048x3536（2x upscale + grayscale + CLAHE 等） | **読取可（layer 1 verbatim 可能）**。書籍 p.508-509「住民の権利 / 公の施設」の見開きが鮮明に判読できる |
| `~/Desktop/kindle_shots/0203.png` | 3024x1768（Kindle 純正キャプチャ） | 解像度低めだが layout 確認には十分。preprocessed と同一見開き = triangulation 補強 |

両 image とも同一書籍見開きを撮影しており、**source 二重確認済**。preprocessed 側を主参照、raw 側を triangulation に使用。

---

## 3. seq3（= user q03 = book Q2）詳細照合

### 3-1. Q 比較

| 経路 | text |
|---|---|
| **book 原文（image 読取）** | 普通地方公共団体は、住民が公の施設を利用することについて、不当な差別的取扱**い**をしてはならないが、正当な理由があれば、利用を拒むことができる。 |
| **data seq3 Q** | 普通地方公共団体は、住民が公の施設を利用することについて、不当な差別的取扱をしてはならないが、正当な理由があれば、利用を拒むことができる。 |

**差分**: 「差別的取扱**い**」 vs 「差別的取扱」 = **送り仮名 1 文字（い）**の有無。それ以外 verbatim 一致。

### 3-2. E 比較

| 経路 | text |
|---|---|
| **book 原文（image 読取）** | 普通地方公共団体は、正当な理由がない限り、住民が公の施設を利用することを拒んではならない（地方自治法244条2項）。また、普通地方公共団体は、住民が公の施設を利用することについて、不当な差別的取扱**い**をしてはならない（244条3項）。 |
| **data seq3 E** | 普通地方公共団体は、正当な理由がない限り、住民が公の施設を利用することを拒んではならない（地方自治法244条2項）。また、普通地方公共団体は、住民が公の施設を利用することについて、不当な差別的取扱をしてはならない（244条3項）。 |

**差分**: 同じく「取扱**い**」vs「取扱」の送り仮名 1 文字差のみ。条文番号・骨格・結論句すべて一致。

### 3-3. ans 比較

- **book 原文**: row marker ○（image 左列 Q2 横に明確に ○）
- **data seq3**: ans=True
- **一致**

### 3-4. 判定

**修正不要 or 軽微 stylistic 候補**:

- 法律論の論理整合: ✓ 完全
- 骨格 / 条文番号 / 判例引用: ✓ 完全（条文 244 条 2 項・3 項 が一致）
- polarity: ✓ 正しい（True / ○）
- 唯一の差分: 「取扱い」/「取扱」の送り仮名 1 文字（複数箇所、Q + E 両方で同パターン）。これは送り仮名表記の **編集方針** 範疇（書籍版 vs OCR 版で送り仮名が落ちている可能性 / もしくは OCR 由来）

**修正の要否**:
- polarity / 法律論の正誤: **影響なし**
- ユーザー学習体験: 軽微（送り仮名違いで意味は変わらない）
- **緊急修正は不要**。将来 stylistic normalize 候補として記録するが、本 audit では修正候補化しない

---

## 4. seq4（= user q04 = book Q3）詳細照合

### 4-1. Q 比較

| 経路 | text |
|---|---|
| **book 原文（image 読取）** | 普通地方公共団体は、住民が公の施設を利用することについて不当な差別的取扱**い**をしてはならないが、この原則は、住民に準ずる地位にある者にも適用される。 |
| **data seq4 Q** | 普通地方公共団体は、住民が公の施設を利用することについて不当でない合理的な理由があれば拒むことができる。 |

**差分**: **完全に別の Q**。
- book 原文の論点: 「差別禁止原則は住民に準ずる地位にある者にも適用されるか」（判例最判平8.7.14 の射程問題）
- data seq4 の論点: 「不当でない合理的な理由があれば拒否可能か」（拒否要件論）

→ data seq4 Q は **book 原文 Q3 ではなく、別出典の Q が混入** しているか、**OCR / 取込時の corruption** 由来と判定。

### 4-2. E 比較

| 経路 | text |
|---|---|
| **book 原文（image 読取）** | ○ 普通地方公共団体は、住民が公の施設を利用することについて不当な差別的取扱**い**をしてはならない（地方自治法244条3項）。判例（**最判平8.7.14**）は、普通地方公共団体の住民ではないが、その地元に事業所、家屋等を有し、当該普通地方公共団体に対し地方税を納付する義務を負う者を住民に準ずる地位にある者として公の施設の利用について地方自治法244条3項は適用されるとしている。 |
| **data seq4 E** | 普通地方公共団体は、住民が公の施設を利用することについて不当な差別的取扱いをしてはならない（地方自治法244条3項）。判例（**東判平成9.9.17**）では、普通地方団体の住民ではないが、その地元に事業所、家屋等を有し、当該普通地方団体において地方税を納付する義務を有する者を拒むことができないとされる場合がある。 |

**差分（critical）**:

| # | book 原文 | data seq4 | 差分の性質 |
|---|---|---|---|
| 1 | 判例（**最判平8.7.14**） | 判例（**東判平成9.9.17**） | **判例 citation が完全に別物** |
| 2 | 普通地方**公共**団体 | 普通地方団体 | data 側で「公共」が脱落 |
| 3 | 普通地方公共団体に**対し**地方税を納付する義務を**負う**者 | 普通地方団体に**おいて**地方税を納付する義務を**有する**者 | 助詞・動詞の置換 |
| 4 | 住民に準ずる地位にある者**として**公の施設の利用について地方自治法244条3項は**適用されるとしている**。 | **拒むことができないとされる場合がある**。 | E 末尾の結論文が **完全に別物**（book 原文 = 244 条 3 項適用の判示 / data = 拒否制限の判示） |

→ E 冒頭は match するが、判例名・末尾結論で **substantive divergence**。判例 citation の誤りは **法律論として致命的**（「最判平8.7.14」と「東判平成9.9.17」は別物の判例 = 法律論の根拠が崩れる）。

### 4-3. ans 比較

- **book 原文**: row marker ○（image 左列 Q3 横）
- **data seq4**: ans=False
- **不一致**: data seq4 の polarity は book 原文と **逆**

### 4-4. polarity 矛盾の triangulation 評価（v3 §5 gate）

**3 経路すべて book 原文側で一致**:

| 経路 | 経路名 | 判定 |
|---|---|---|
| (i) | 画像 row marker | ○（book 原文） = True 側 |
| (ii) | E 末尾論理 | book 原文 = 「244 条 3 項適用される」= True 側 |
| (iii) | 解説ページの条文 / 判例名特定 | book 原文 = **最判平8.7.14** が特定可能 = True 側 |

→ v3 §5 polarity gate **完全充足**。data 修正候補としての根拠十分。

ただし polarity flip だけでは不十分。**Q 自体が book 原文と別物**のため、Q + E + ans 三者すべての restore が必要。

### 4-5. 判定

**要修正候補（高優先度 / polarity 影響あり / Q + E + ans 三層 restore 必須）**:

- Q: 完全置換（book 原文「住民に準ずる地位にある者にも適用される」へ restore）
- E: 完全置換（判例 = 最判平8.7.14、末尾 = 「244条3項は適用されるとしている」へ restore）
- ans: False → True flip

修正方針（推奨パターン、参考）:
- v3 §5 推奨: polarity flip を伴う Q/E 層 1 restore は **Q + E + ans を 1 PR に束ね**て中間状態を avoid（v82/v86/v100 precedent と同パターン）
- DATA_VERSION bump 必須
- 1 対象 = 1 PR（v3 §6）

ただし：
- 本 audit では **修正しない**（user 指示遵守）
- user 明示 GO 受領後に別 PR で実施

---

## 5. seq3 / seq4 以外の他 seq の付随確認（参考、scope 外）

source 照合中に他 seq の状態も image で観測したため、参考までに記録（修正対象ではない）：

| seq | book Q | image 観測との一致度（spot check） | コメント |
|---|---|---|---|
| seq2 = book Q1 | 公の施設の定義 | substantively 一致 | 修正不要（参考） |
| seq5 = book Q4 | 法律・政令 / 条例 | substantively 一致 | 修正不要（参考） |
| seq6 = book Q5 | 使用申込 / 処理規程 vs 条例 | data Q「処理基準」、book「処理規程」**1 文字差**の可能性 | 軽微 stylistic 候補（本 audit では修正候補化しない） |

→ p203 の他 seq は、**seq4 ほど深刻な corruption は無い**。p203 全体の corruption はない、**seq4 に局所的な data 異常**の可能性が高い。

---

## 6. 5 分類（error_reports_queue 用）への当てはめ

| seq | カテゴリ | 根拠 |
|---|---|---|
| seq3（q03） | **A: 仕様 + 軽微 stylistic** | book 原文と substantively 一致、送り仮名 1 文字の編集差のみ。data bug ではない。修正不要 |
| seq4（q04） | **B: source has 値、import で歪曲** + **E: data corruption** | Q が book 原文と完全に別、E は冒頭一致 + 末尾 garble、ans が逆極性。OCR / 取込経路のいずれかで substantive corruption 発生（front-half L1 OCR = 旧 GPT API 経由、CLAUDE.md 第 3 節の精度問題と整合する可能性） |

**注**: error_reports_queue.md の暫定判定では q04 を「断定不可」としていたが、source 照合により **断定可能**。Q + E + ans の三者 restore が要 = **修正候補化を推奨**。

---

## 7. 次アクション（user 判断ポイント）

### 7-1. seq3（q03）

- **option A**: 修正不要として close（送り仮名差は許容） — **推奨**
- **option B**: 送り仮名統一の stylistic patch（low priority、別 P3 queue）

### 7-2. seq4（q04）

- **option A**: Q + E + ans 三者 restore を 1 PR で実施（v3 §5 推奨パターン） — **推奨（高優先度）**
- **option B**: ans flip だけ先行 hotfix（v98 pattern、Q + E は後続） — book 原文 Q が確定しているため不採用が望ましい
- **option C**: 一旦 needsSourceCheck flag 維持、修正は次の data PR に同梱 — **下位 fallback**

### 7-3. error_reports_queue.md の更新

本 audit の結果を踏まえ、`context/working/error_reports_queue.md` の §1-1 / §1-2 の「暫定判定」「次アクション」を update する候補がある。ただし本 audit の scope は照合判定のみのため、queue 更新は **別タスク**として扱う（user 判断待ち）。

### 7-4. p194-q06 / p197-q01 / p198-q05（既知 P3）の同様 audit

ingestion_flow.md §10 の既知 P3 3 件も同種の source 照合が必要かもしれないが、本 audit の scope は user 直接指示 (p203-q03/q04) のみ。**他 3 件は別タスク化**。

---

## 8. 本 audit が触らないこと

- `data/reviewed_import.json` / `public/data/reviewed_import.json`（write）
- `src/` 配下（write）
- `DATA_VERSION`（read のみ、bump なし）
- `context/stable/` 配下（read のみ）
- `context/working/handoff.md` / `current_status.md` / `known_issues.md`（無改変）
- `context/working/error_reports_queue.md`（無改変、§7-3 で update 候補と記録のみ）
- `docs/ingestion_flow_v4_draft.md` / `docs/override_rule_design.md` / `scripts/check_classification.py`
- `package.json` / `package-lock.json` / `node_modules`

---

## 9. read-only 確認 log

| ファイル | 行為 |
|---|---|
| `images_preprocessed/0203.png` | read（visual OCR / Q1-Q5 全照合） |
| `~/Desktop/kindle_shots/0203.png` | read（解像度低めだが layout triangulation） |
| `data/reviewed_import.json` | read（python抽出 / p203 全 6 seq） |
| `context/working/p203_source_check.md` | **新規作成 = 本ファイル** |

---

## 10. 重要遵守事項（再掲）

- 原文未確認 → **本 audit で確認済**（preprocessed 0203.png は layer 1 verbatim 可）
- source未確認で本文修正しない → 本 audit では **修正しない**（判定のみ）
- source未確認で polarity flip しない → 本 audit では **flip しない**（判定のみ）
- 条文知識や類似問題から逆算補完しない → 本 audit は **image を直接 source とし、知識逆算は未使用**
- handoff / current_status / context/stable は触らない → **触っていない**
- commit / PR は user 判断待ち → **本ファイルは untracked、commit していない**
