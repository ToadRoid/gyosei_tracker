# error reports queue（手動エラー報告 / read-only / 2026-04-27）

> **scope**: UI「エラー報告」機能で user が手動報告した未確認案件を queue 化する。
> **位置付け**: classification audit や ingestion_flow とは別軸の、**問題本文・正誤・原文確認系**の追跡 queue。
> **lock**: `data/` / `public/data/` / `src/` / `DATA_VERSION` / `context/stable/` / `handoff.md` / `current_status.md` は本 queue では触らない。
> **修正方針**: 原文未確認のまま data 修正禁止。**source 確認後に別 PR で判断**。

---

## 0. 既知（今回は対象外）

以下 3 件は既に `context/stable/ingestion_flow.md` §10 P3 queue に記録済（2026-04-22 ログ）。本 queue では再記録しない。次の data 変更 PR or source 照合タスクで処理。

| problemId | 報告日 | 種別 | 既登録先 |
|---|---|---|---|
| KB2025-p194-q06 | 2026/4/21 | 正誤の誤り | ingestion_flow.md §10 P3-1 |
| KB2025-p197-q01 | 2026/4/22 | その他 | ingestion_flow.md §10 P3-2 |
| KB2025-p198-q05 | 2026/4/22 | その他 | ingestion_flow.md §10 P3-3 |

---

## 1. 新規 queue（未確認案件）

### 1-1. KB2025-p203-q03

| 項目 | 内容 |
|---|---|
| **problemId** | KB2025-p203-q03 |
| **報告日** | 2026-04-27 |
| **報告種別** | その他 |
| **subject / chapter** | gyosei / gyosei-chiho |
| **sectionTitle (raw)** | 公の施設 |
| **answerBoolean (現 data)** | True |

**現在の data 状態（read-only 抽出 / data/reviewed_import.json）**:

- Q: 「普通地方公共団体は、住民が公の施設を利用することについて、不当な差別的取扱をしてはならないが、正当な理由があれば、利用を拒むことができる。」
- E: 「普通地方公共団体は、正当な理由がない限り、住民が公の施設を利用することを拒んではならない（地方自治法244条2項）。また、普通地方公共団体は、住民が公の施設を利用することについて、不当な差別的取扱をしてはならない（244条3項）。」

**source 確認要否**: **必要**。Q 本文が原文ママか OCR 由来の冗長表現かが未確認（書籍原本未照合）。

**暫定判定（断定回避）**:

- 法律論の論理整合は **問題なさそう**: Q「正当な理由があれば拒める」⇔ E「正当な理由がない限り拒んではならない」(244 条 2 項) は対偶として一致。ans=True と整合する読み方は成立する
- ただし Q の前半「不当な差別的取扱をしてはならないが」は本問の論点（拒否要件）と直接連動しないため、**読者が混乱する可能性**あり。OCR が原文の不要部分を含めた可能性 / 書籍の問題文がそうなっている可能性の両方が残る
- **断定不可**。原本確認まで判定保留

**次アクション**:

1. 書籍原本 p.203（Kindle screenshot 0203 相当 or 既 capture 済 image）で Q 本文を verbatim 照合
2. 一致 → 「OCR 正確 / 書籍書式 / 修正不要」で close
3. 不一致 → 「OCR 由来の冗長表現 / Q 本文修正候補」として個別 patch PR 候補化（v3 §6 = 1 対象 = 1 PR）
4. **source 確認前は data 修正禁止**

---

### 1-2. KB2025-p203-q04

| 項目 | 内容 |
|---|---|
| **problemId** | KB2025-p203-q04 |
| **報告日** | 2026-04-27 |
| **報告種別** | その他 |
| **subject / chapter** | gyosei / gyosei-chiho |
| **sectionTitle (raw)** | 公の施設 |
| **answerBoolean (現 data)** | False |

**現在の data 状態（read-only 抽出）**:

- Q: 「普通地方公共団体は、住民が公の施設を利用することについて不当でない合理的な理由があれば拒むことができる。」
- E: 「普通地方公共団体は、住民が公の施設を利用することについて不当な差別的取扱いをしてはならない（地方自治法244条3項）。判例（東判平成9.9.17）では、普通地方団体の住民ではないが、その地元に事業所、家屋等を有し、当該普通地方団体において地…」（解説は途中で truncate されている可能性、要確認）

**source 確認要否**: **必須（強）**。Q 本文の「不当でない合理的な理由」が原文ママか OCR 問題か **未確認**。日本語として二重否定的で読みづらく、書籍原本がこの表現を使っているか強く疑わしい。

**暫定判定（断定回避）**:

- 「不当でない合理的な理由」= 「合理的かつ不当でない理由」と解せば「正当な理由」とほぼ同義 → 244 条 2 項により拒否可 → ans=True が妥当に見える
- 一方、現 data の ans=False は「不当な差別的取扱の有無」を直接問う読み方（244 条 3 項）に依拠している可能性
- **Q 本文の解釈次第で ans の妥当性が変わる**ため、原本確認なしには polarity 判定不能（v3 §5 polarity gate = triangulation 必須に該当）
- **断定不可**。**原本未確認のまま polarity flip / Q 本文修正は禁止**

**次アクション**:

1. 書籍原本 p.203（Kindle screenshot 0203 相当）で Q 本文を verbatim 照合
2. 「不当でない合理的な理由」が原文ママ → 書籍著者の表現として保持、解説の論理だけ精査
3. OCR 由来 → 正しい原文に restore（個別 patch PR）
4. polarity flip 候補が出た場合は v3 §5 triangulation gate（画像 row marker / E 末尾論理 / 解説条文 3 経路一致）通過を必須化
5. **source 確認前は data 修正禁止 / polarity flip 禁止**

---

## 2. queue 運用

| 項目 | 方針 |
|---|---|
| 追加 trigger | UI「エラー報告」で新規報告が来たら本 queue に追記 |
| close 条件 | 原本確認 → 修正不要 or 個別 patch PR merged のいずれか |
| 既知 P3 (§0) との関係 | 既知 3 件はここでは扱わず ingestion_flow.md §10 を正本とする |
| handoff / current_status との関係 | 触らない（lock 維持）。queue close 時に次 data PR の本文で 1 行触れれば十分 |
| TTL | なし（source 確認待ちは長期化しうるため）。ただし quarterly 棚卸しで stale 判定は user 判断で実施可 |

---

## 3. 本 queue が触らないこと

- `data/reviewed_import.json` / `public/data/reviewed_import.json`（write）
- `src/` 配下（write）
- `DATA_VERSION`（read のみ、bump なし）
- `context/stable/` 配下（read のみ）
- `context/working/handoff.md` / `current_status.md` / `known_issues.md`
- `docs/ingestion_flow_v4_draft.md` / `docs/override_rule_design.md`
- `scripts/check_classification.py`

---

## 4. read-only 確認 log（本 queue で触ったもの）

| ファイル | 行為 |
|---|---|
| `data/reviewed_import.json` | read（python抽出 / p194-q06, p197-q01, p198-q05, p203-q03, p203-q04） |
| `context/working/error_reports_queue.md` | **新規作成 = 本ファイル** |

---

## 5. user 判断ポイント

1. **本 queue の保全方針**: docs-only PR 化するか untracked のまま置くか
2. **source 照合タスクの優先順**: 既知 3 件 (P3-1〜P3-3) と新規 2 件 (p203-q03, p203-q04) を一括で原本照合するか、新規優先か
3. **照合作業のタイミング**: Trigger A / Trigger B 待ちの pause を維持し source 照合は別レーン化するか、queue 化のみで pause 継続か
