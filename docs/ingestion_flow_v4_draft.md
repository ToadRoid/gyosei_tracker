# 後半取り込みフロー v4 — 更新ドラフト（v3 → v4 diff）

> 策定: 2026-04-26（user directive 2026-04-26 = v4 bump 本体は実運用 1 回後）
> 位置付け: **本ファイルは draft / proposal**。`context/stable/ingestion_flow.md` 本体は **未更新**。
> 適用条件: 新書投入 batch 10+ で override script を 1 回実運用 → 結果反映 → 本 draft を v4 として正式昇格。
> 関連: `docs/override_rule_design.md`（sectionTitle-first rule v0.1 設計）/ `scripts/check_classification.py`（read-only proposal tool 実装）

---

## 0. 本 draft で書くこと / 書かないこと

| | 内容 |
|---|---|
| **書く** | (1) auto_apply 適用条件の安全境界 / (2) review_queue 落とし基準 / (3) override script の fail-safe / rollback |
| **書かない** | 実運用結果（batch 10+ の actual auto_apply / review_queue 件数、新書での誤判定実績、threshold 妥当性の事後検証） |
| **TODO 明記** | 「実運用 1 回後に確定する箇所」を `TODO[v4-final]` で個別 tag 付け |

---

## 1. v3 → v4 差分要約

| 変更 | 場所 | 種別 |
|---|---|---|
| **§4 拡張**: sectionTitle-first override step を auto scan の後段に追加 | §4 末尾 | 追加 |
| **§4-bis 新設**: override script の安全境界 / review_queue 基準 / fail-safe を独立節化 | §4 と §5 の間 | 新規 |
| **§11 実行順 更新**: OCR → check_classification → final JSON → import の中間 step 挿入 | §11 step 2-3 の間 | 修正 |
| **§12 成功条件 拡張**: override step の success criteria 追加 | §12 短期項目 | 追加 |
| **用語定義 拡張**: `auto_apply` / `review_queue` / `SECTION_TITLE_MAP` の語義固定 | 用語定義表 | 追加 |
| **v3 → v4 差分要約** 末尾節を更新 | 末尾 | 修正 |

§1-§3 / §5-§10 / §12 中期 / §13 は **無改造**（layer 運用 / polarity gate / バッチ判定 4 criteria は v3 のまま据え置き）。

---

## 2. 差分（unified diff 風）

### 2-1. §4 拡張（auto scan + dual-read gate に override step を追記）

```diff
@@ §4 auto scan 自動分類 hook + dual-read gate @@
 - **auto scan**: OCR 出力（`parsed_*.json`）に対し、取り込み前に `scripts/auto_scan.*`（または ocr_batch 内の hook）で以下を自動検知する：
   - `...` / `…` / 文末不自然欠落 / 助詞重複 / broad raw chapter/subject / Q↔E polarity 矛盾
   - 検知されたものは branch に `needsSourceCheck: true` を付与 + C queue へ記録
 - **dual-read gate**: 疑わしい箇所（OCR confidence < 閾値 / 自動検知 hit / polarity 微妙）は **Gemini × 2 読 または Gemini + 別経路（GPT review のみ、復元主担当には使わない）** で照合。一致したら layer 1、不一致なら layer 2 literal + ERROR_UNREADABLE_SOURCE 維持。
+- **sectionTitle-first override**: auto scan の後段に `scripts/check_classification.py` を 1 回挟む。read-only proposal tool（副作用なし）で、subject/chapter の systematic 誤判定（v109 batch 9 で 86 件 / 単一 batch 過去最大）を sectionTitle exact match で auto_apply 候補 / review_queue 候補に分類する。詳細は §4-bis、設計根拠は `docs/override_rule_design.md`。
```

### 2-2. §4-bis 新設（override script の安全境界 / review_queue 基準 / fail-safe）

```diff
@@ insert between §4 and §5 @@
+
+---
+
+## §4-bis sectionTitle-first override（script 運用契約）
+
+`scripts/check_classification.py` v0.1 は **read-only proposal tool**。本節は script の振る舞いを「flow の運用契約」として固定する（script 仕様変更は本節の更新を要する）。
+
+### 4-bis-1 auto_apply 適用条件（安全境界）
+
+条件を **Hard（必須 / source 由来）** と **Soft（補助 / 統計ヒューリスティック）** に分離する。**Hard を 1 つでも欠いた branch は auto_apply 禁止**。Soft は単独では auto_apply を許可しない（= evidence ではなく hint 扱い）。
+
+#### Hard conditions（必須 / source 由来 / 全 AND）
+
+| # | 条件 | 根拠 / 失敗時の挙動 |
+|---|---|---|
+| H1 | 入力 page に `parseError` フィールドが **無い** or **falsy** | OCR 失敗ページは sectionTitle 自体が信頼不能 → skip |
+| H2 | 入力 page に `branches` 配列が存在し、空配列ではない | legit blank（章扉 / 末尾）/ Kindle UI ページは branches=[] → skip |
+| H3 | ページ内 branches の **mode sectionTitle** が `SECTION_TITLE_MAP`（9 entries, batch 1-9 derived）に **完全一致**で存在 | substring / startswith / fuzzy match は v0.1 では不採用（false positive を排除）。SECTION_TITLE_MAP は source 起点（master.ts chapter name 完全一致 + batch 1-9 実績） |
+
+#### Soft conditions（補助 / 統計ヒューリスティック / hint 扱い）
+
+| # | 条件 | 役割 |
+|---|---|---|
+| S1 | ページ内 branches の **≥80%** が同一の mode sectionTitle を持つ（`PAGE_THRESHOLD = 0.8`） | **hint**。80% 未満は subsection 混在ページの signal → auto_apply から外して review_queue 側で扱う。**単独では auto_apply を許可しない**（source 由来ではなく統計的ヒューリスティックのため） |
+| S2 | 当該 branch の `(subjectCandidate, chapterCandidate)` が map target と **異なる** | efficiency filter（既に正しい branch を二重 propose しない） |
+
+※ S1 を「証拠」として扱うと「それっぽく 80% 一致してるから OK」= **source 不在の擬似確証**に陥る。Hard 条件（特に H3 = source 起点 SECTION_TITLE_MAP 完全一致）が成立した上で、ページ全体の subsection 整合性を確認する hint として S1 を用いる。
+
+**境界例（auto_apply に乗らないもの）**:
+
+- sectionTitle が空文字列（Pattern E、過去実績 1 件）→ §4-bis-2 へ
+- ページ内 sectionTitle が混在し mode が 80% を超えない → §4-bis-2 の outlier 判定へ進む（条件次第で review_queue）
+- mode sectionTitle が map に未登録（新書の subsection など）→ §4-bis-2 へ
+- raw が既に target と一致（false positive 候補）→ silent skip（report に出さない）
+- ページが parseError を持つ / branches が空 → silent skip
+
+### 4-bis-2 review_queue 判定基準
+
+auto_apply 条件 H3（SECTION_TITLE_MAP 完全一致）or S1（≥80% threshold）が落ちたページを対象に、以下の **二段ふるい** で review_queue 候補を絞る。条件未達は silent skip（noise 抑制のため）。
+
+| 段階 | 判定 | 失敗時 |
+|---|---|---|
+| 1 | ページ内 branches の **mode (subject, chapter)** が **≥50%** を占める（`OUTLIER_FLOOR = 0.5`） | < 50% は noisy すぎて outlier 識別不能 → ページ全体を skip |
+| 2 | mode と異なる `(subject, chapter)` を持つ branches を outlier として列挙 | mode 一致 branch は skip |
+
+**reason field 仕様**（report の reason 列）:
+
+| reason 値 | 発生条件 | 推定 pattern |
+|---|---|---|
+| `section_title_empty` | branch の sectionTitle が空文字列 | Pattern E（実績 1 件） |
+| `within_page_outlier` | branch の sectionTitle に値があるが mode (subj, chap) と一致しない | Pattern D（実績 4 件、minpo 内 chapter 微修正） |
+
+**運用**: review_queue 候補は Claude or user が **個別判定**。auto は走らない。判定結果は handoff の batch log に 1 行記録（v3 §6 「1 対象 = 1 PR」原則は維持、件数が多い時のみ batch 内で fold）。
+
+TODO[v4-final]: 実運用 1 回後、review_queue 候補の **平均件数 / 1 batch** と **判定所要時間** を計測し、「件数 K を超えたら主レーン停止 / 副レーンへ振り替え」の閾値 K を確定する。
+
+### 4-bis-3 fail-safe / rollback 条件
+
+v0.1 の fail-safe は **「script 自体が副作用を持たない」+「人手 apply step の前後で raw を保存する」** の 2 点で成立する。具体条件は以下：
+
+#### (a) script 内在の fail-safe
+
+| 保証 | 実装根拠 |
+|---|---|
+| 既存 `data/reviewed_import.json` を **読まない / 書かない** | check_classification.py は input が `parsed_gemini_<ts>.json` のみ、output は stdout のみ（`--json` でも stdout） |
+| `DATA_VERSION` を bump しない | script 単体実行は data 無変更 = v3 §6 handoff-only 4 条件を満たす範囲 |
+| 自己 test（`scripts/check_classification_test.py`）が **18/18 PASS** = batch 1-9 raw で 86 auto + 5 review = 91 件完全再現 | self-test 失敗時は script を実行しない（後述 (c)） |
+
+#### (b) human apply step の rollback 契約
+
+`auto_apply` を `parsed_gemini_<ts>_final.json` に手作業で反映する step は、以下の rollback 契約を満たす：
+
+1. **raw input は不変**: `parsed_gemini_<ts>.json` を編集せず、`_final.json` を別 file として作る。raw を上書きしない（ts 命名規約で衝突回避）。
+2. **rollback = `_final.json` を削除して再生成**: import 前なら自由に rollback 可能。`_final.json` は importParsedBatch 直前の transient artifact 扱い。
+3. **import 後の rollback**: importParsedBatch 反映後に override が誤りと判明した場合、修正は **個別 patch PR**（v3 §6 = 1 対象 = 1 PR）で実施。reviewed_import.json の全置換 rollback は **しない**（v3 §0 不変条件 = 「破壊的操作の禁止」維持）。
+
+#### (c) 主レーン停止条件（rollback ではなく停止）
+
+以下のいずれかが起きたら override script の使用を **その batch 内で停止** し、Claude が手作業 override（v109 までの方式）に fallback する：
+
+| 停止トリガー | 検知方法 | 根拠 |
+|---|---|---|
+| **self-test 失敗**（< 18/18） | `python3 scripts/check_classification_test.py` の exit code | sectionTitle map / threshold 改変時の regression を必ず検出 |
+| **auto_apply false positive**（実 import 後に Claude が誤判定と判定）が **1 batch 内 ≥ TODO[v4-final]%** | batch 完走後に手作業 audit | TODO[v4-final]: 閾値（仮 5%）を実運用 1 回後に確定 |
+| **新書 subsection が map に未登録 ≥ TODO[v4-final]%** | report の review_queue 件数 / 全 override 期待件数 | TODO[v4-final]: 「未登録率」算出基準を実運用 1 回後に確定。閾値超で **map 拡張 PR を先行**、override script 適用は次 batch から |
+| **ページ内 sectionTitle 混在（80% 未満）が頻発** | report に auto_apply が極端に少ない / review_queue が過多 | OCR 品質 / 書籍構造の根本問題 signal、§3 欠損率 ≥ 20% と同等の停止条件 |
+
+**停止後の復帰**: map 拡張 / OCR 品質改善 / threshold 再調整のいずれかで原因を解消し、self-test を通してから再開。停止理由は handoff に 1 行記録（C queue 化はしない、stop reason は短命情報のため）。
+
+#### (d) 「rollback しない」境界（明示）
+
+**rollback 非対象**（= 個別 patch PR で対応、全体 rollback はしない）:
+- v3 で human-confirm 済みデータ（v101-v109 で確定した 91 件 override = stable）
+- source image が存在しない箇所（高解像度 recrop 待ちの p006 B1/B4 等、判定根拠が無いため rollback も推測になる）
+- polarity に影響しない分類のみ変更（subjectId / chapterId のみで ans 不変 = 影響範囲は科目フィルタのみ）
+
+**それ以外は rollback 対象**（= 個別 patch PR で修正、`reviewed_import.json` の全体書き換え + DATA_VERSION 巻き戻しは v3 §0 不変条件により禁止）。
+
+---
```

### 2-3. §11 実行順 更新

```diff
@@ §11 実行順 @@
-1. **v3 反映 = 本ファイル作成 + handoff / current_status 更新 + PR**（着手中）
-2. **後半バッチ 1 開始**: screenshot acquisition → OCR → auto scan → reviewed_import.json patch → import PR（1 PR = 1 バッチ）
-3. **follow-up 3 本を並行 open**: P1-1 / P1-2 / P1-3 を 3 worktree で並行（副レーン上限 = 5 の枠内）
-4. **p006 B1/B4 は触らず P2 backlog 維持**: 次バッチ境界で再判定
+1. **v4 反映 = 本ファイル更新 + handoff / current_status 更新 + PR**（実運用 1 回後）
+2. **新書バッチ N 開始**: screenshot acquisition → Gemini OCR → auto scan → **`scripts/check_classification.py <input>` で proposal report 取得（§4-bis）** → auto_apply を `parsed_gemini_<ts>_final.json` に手作業反映 / review_queue は個別判定 → reviewed_import.json patch → import PR（1 PR = 1 バッチ）
+3. **override script 自己 test**: 各 batch の冒頭で `python3 scripts/check_classification_test.py` が 18/18 PASS することを確認（§4-bis-3 (a)）。失敗時は手作業 override に fallback。
+4. **p006 B1/B4 は P2 backlog 維持**: 高解像度 recrop 到着まで触らない（v109 完走後も同方針）
```

### 2-4. §12 成功条件 拡張

```diff
@@ §12 成功条件 @@
 **短期（2026-05 以内）**:
-- 後半 L2 バッチを 少なくとも 3 回完走（欠損率 ≤ 10% + dual-file byte-identical + DATA_VERSION bump + mirror）
-- P1 follow-up 3 本すべて merge
-- p006 B1/B4 は P2 に維持（主レーンを止めていない証左）
+- 新書バッチを **少なくとも 1 回**完走（override script 実運用 = §4-bis 適用 1 回以上）
+- override script self-test が **CI green or 手動 18/18 PASS** で各 batch 開始
+- §4-bis-3 (c) の停止トリガーを発動せずに 1 batch 完走（false positive ≤ TODO[v4-final]%、未登録率 ≤ TODO[v4-final]%）
+- p006 B1/B4 は P2 に維持（高解像度 recrop 到着まで）
```

### 2-5. 用語定義 拡張

```diff
@@ 用語定義 @@
 | **handoff-only PR** | data 無変更で handoff.md だけ更新する PR（§6 の 4 条件 + TTL 14 日） |
+| **auto_apply** | check_classification.py が「sectionTitle exact match + ≥80% page threshold」を満たすと判定した override 候補 branch の集合（§4-bis-1）。script は report 出力のみ、適用は人手 |
+| **review_queue** | check_classification.py が「sectionTitle 不在 or map 未登録 + ページ内 mode ≥50%」と判定した outlier branch の集合（§4-bis-2）。Claude or user が個別判定 |
+| **SECTION_TITLE_MAP** | check_classification.py 内の dictionary literal。batch 1-9 実績ベース 9 entries（v0.1）。新書で subsection が増えたら手動拡張、無限自動学習はしない（§4-bis 設計原則）|
+| **PAGE_THRESHOLD / OUTLIER_FLOOR** | それぞれ 0.8 / 0.5。script 内 constant。改変時は self-test の再 baseline + §4-bis 更新が必須 |
```

### 2-6. v3 → v4 差分要約 末尾節の更新

```diff
@@ v2 → v3 差分要約 @@
-## v2 → v3 差分要約
-（v2 → v3 の 3 点 + v1 → v2 の 7 点）
+## v3 → v4 差分要約
+
+v3 から以下を追加（運用契約の明文化のみ、layer 運用 / polarity gate は無改造）：
+
+1. **§4 末尾**: sectionTitle-first override step を auto scan の後段に追記（read-only proposal tool）
+2. **§4-bis 新設**: auto_apply 適用条件（5 点の安全境界）/ review_queue 判定基準（二段ふるい + reason field 仕様）/ fail-safe / rollback 条件（script 内在 + human apply 契約 + 停止トリガー + rollback 対象外）
+3. **§11 実行順**: check_classification.py step 挿入 + 自己 test の必須化
+4. **§12 成功条件**: override script 実運用 1 回以上を短期目標に追加
+5. **用語定義**: auto_apply / review_queue / SECTION_TITLE_MAP / PAGE_THRESHOLD / OUTLIER_FLOOR を固定
+
+v2 → v3 / v1 → v2 の差分は履歴として `docs/override_rule_design.md` および本ファイル v3 archive を参照。
```

---

## 3. TODO[v4-final] 一覧（実運用 1 回後に確定する箇所）

| tag 位置 | 内容 | 確定方法 |
|---|---|---|
| §4-bis-2 末尾 | review_queue 件数の閾値 K（K 超で主レーン停止 / 副レーン振替） | 実 batch の review_queue 平均件数 + 判定所要時間 を計測 |
| §4-bis-3 (c) 行 2 | false positive 率の停止閾値（仮 5%） | 実 batch 後の audit で false positive 件数 / 全 override 件数 を計測 |
| §4-bis-3 (c) 行 3 | 「未登録率」算出基準 + 停止閾値 | 実 batch で map 未登録の sectionTitle 件数 / 期待 override 件数 を計測 |
| §12 短期 行 3 | false positive ≤ %、未登録率 ≤ % の数値 | §4-bis-3 (c) と同 source で確定 |

**TODO[v4-final] が解消するまで本 draft は v4 として昇格しない**（user directive 2026-04-26 = 実運用 1 回後 bump）。

---

## 4. 本 draft が触らないこと

- `context/stable/ingestion_flow.md` 本体（v3 のまま）
- `scripts/check_classification.py` の実装（v0.1 のまま、§4-bis は v0.1 仕様の文章化のみ）
- `SECTION_TITLE_MAP` の entry 数（9 entries 維持、新書 subsection 追加は **実運用時** に別 PR で）
- DATA_VERSION（draft = data 無変更 = v3 §6 handoff-only 4 条件適合）
- override 設計メモ `docs/override_rule_design.md`（独立した正本）

---

## 5. 昇格手順（実運用 1 回後）

1. 新書 batch 10 を override script で 1 回完走（§4-bis 適用）
2. TODO[v4-final] の 4 数値を実測値で埋める
3. 本 draft を `context/stable/ingestion_flow.md` に **正式 merge**（v3 → v4 bump、本ファイル diff を適用）
4. 本 draft `docs/ingestion_flow_v4_draft.md` を **削除**（昇格後は冗長）
5. handoff / current_status を更新、v4 PR を起票

---

## 6. 確認待ち（user 判断ポイント）

- 本 draft の方向性（§4-bis を独立節で切るか、§4 内に折りたたむか）
- TODO[v4-final] の閾値を実運用 1 回後に user 判断で確定するか、Claude 提案 + user 承認で確定するか
- 昇格時に旧 v3 を archive として残すか（既存 v3 → v4 差分要約節への履歴吸収で十分か）
