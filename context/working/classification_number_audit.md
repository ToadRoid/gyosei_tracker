# classification 番号欠落 audit（read-only / 2026-04-26）

> **scope**: read-only diagnostic。修正・data 変更は一切しない。
> **trigger**: user スクショで「分類名に番号があるものとないものが混在している」観測（2026-04-26）。
> **lock**: `data/` / `public/data/` / `src/` / `DATA_VERSION` / `context/stable/` / handoff / current_status は本 audit では触らない。

---

## 0. 結論（先出し）

**観測された「番号欠落」は v109 由来の bug ではなく、構造的な仕様**。具体的には 2 つの独立した layer の重ね合わせ：

| layer | 内容 | 帰結 |
|---|---|---|
| **L1: raw sectionTitle の取得元差** | 前半 (p001-p249) は L1 import で `NN_` 形式の整形済 raw を含む。後半 (p250-p470 = v101-v109) は Gemini OCR raw のため **NN_ prefix なし**（OCR が原本の subsection を字義通り抽出する） | 同一 chapter 内に raw が「NN_xxx」と「xxx」の両方が混在する |
| **L2: UI 正規化（`resolveDisplaySectionTitle`）の partial coverage** | `src/data/sectionNormalization.ts` の `EXACT_MAPPING` は **22 chapter 中 7 chapter のみ** カバー。残り 15 chapter は raw を素通り | mapped chapter（例: minpo-sosoku）は raw "行為能力" → display "02_権利能力・行為能力" と正規化される。unmapped chapter（例: minpo-bukken）は raw "共有" がそのまま UI 表示される |

→ **データ修正は不要**。修正候補があるとすれば「`EXACT_MAPPING` 拡張による UI 正規化の段階的進行」（既存の進行中プロジェクト）であり、v109 とは独立。

→ ユーザー 5 分類のうち本観測は **A（仕様）+ D（番号体系混在 source 通り）** に該当。**B / C / E のいずれにも該当しない**。

---

## 1. 用語整理（前提固定）

- **raw sectionTitle** = `data/reviewed_import.json` の各 branch に保存されている `sectionTitle` field。原本見出し直接（変更禁止）
- **displaySectionTitle** = UI 用正規化ラベル。`src/lib/import-parsed.ts:183` で import 時に `resolveDisplaySectionTitle()` を呼んで保存
- **UI 表示文字列** = `src/app/exercise/page.tsx:120` で `displaySectionTitle ?? sectionTitle ?? ''` の優先順、空白なら "その他" にフォールバック
- **EXACT_MAPPING** = `src/data/sectionNormalization.ts` の chapter 別変換テーブル。`{ chapterId: { rawTitle: displayTitle } }`

---

## 2. 観測事実（read-only）

### 2-1. raw sectionTitle の style 分布（全 2448 branches）

| style | regex | count | 比率 |
|---|---|---:|---:|
| `NN_` prefix（"01_..."） | `^\d{2}_` | 489 | 19.9% |
| 他の数字 prefix（"3) ..."、"3 ..." 等） | `^\d+[_\s\)]` | 48 | 2.0% |
| 番号なし（"共有"、"公序良俗" 等） | — | 1840 | 75.2% |
| 空文字列 | `^$` | 71 | 2.9% |

### 2-2. sourcePage 帯 × style cross-tab

| sourcePage 帯 | pages | NN_ | other_num | no_num | empty | 主な import 由来 |
|---|---:|---:|---:|---:|---:|---|
| 001-100 | 95 | 165 | 0 | 378 | 4 | 前半 L1（オリジナル） |
| 101-200 | 97 | 165 | 5 | 339 | 1 | 前半 L1（オリジナル） |
| 201-249 | 48 | 159 | 0 | 100 | 1 | 前半 L1（オリジナル） |
| 250-320 | 69 | **0** | 6 | 336 | 12 | v101-v104（Gemini OCR） |
| 321-380 | 59 | **0** | 21 | 244 | 39 | v105-v106（Gemini OCR） |
| 381-440 | 55 | **0** | 9 | 314 | 14 | v107-v108（Gemini OCR） |
| 441-470 | 23 | **0** | 7 | 129 | 0 | v109 batch 9（Gemini OCR） |

**核心**: **sourcePage ≥ 250（= 後半 v101-v109 全体）の NN_ raw 件数 = 0**。後半 OCR は構造上 NN_ を含まない。これは「v109 で番号が落ちた」ではなく「後半 import 全体で初めから NN_ を持っていない」。

### 2-3. chapter × EXACT_MAPPING 被覆

| chapter | NN_ raw | other_num | no_num | empty | total | EXACT_MAPPING |
|---|---:|---:|---:|---:|---:|---|
| kenpo-jinken | 0 | 0 | 0 | 1 | 1 | ✗ unmapped |
| kenpo-tochi | 27 | 0 | 71 | 2 | 100 | ✓ mapped |
| gyosei-ippan | 48 | 0 | 222 | 1 | 271 | ✓ mapped |
| gyosei-tetsuzuki | 66 | 0 | 78 | 0 | 144 | **✗ unmapped** |
| gyosei-fufuku | 63 | 0 | 65 | 1 | 129 | ✓ mapped |
| gyosei-jiken | 72 | 0 | 84 | 0 | 156 | ✓ mapped |
| gyosei-kokubai | 6 | 0 | 55 | 0 | 61 | ✓ mapped |
| gyosei-chiho | 89 | 5 | 155 | 1 | 250 | ✓ mapped |
| minpo-sosoku | 110 | 0 | 71 | 0 | 181 | ✓ mapped |
| **minpo-bukken** | 8 | 6 | **187** | 4 | 205 | **✗ unmapped** |
| **minpo-saiken** | 0 | 21 | **319** | 36 | 376 | **✗ unmapped** |
| minpo-shinzoku | 0 | 0 | 64 | 10 | 74 | ✗ unmapped |
| minpo-sozoku | 0 | 0 | 56 | 2 | 58 | ✗ unmapped |
| shoho-shoho | 0 | 0 | 67 | 0 | 67 | ✗ unmapped |
| shoho-kaisha | 0 | 9 | 150 | 13 | 172 | ✗ unmapped |
| kiso-hogaku-gairon | 0 | 0 | 32 | 0 | 32 | ✗ unmapped |
| kiso-hogaku-funso | 0 | 0 | 10 | 0 | 10 | ✗ unmapped |
| **kiso-chishiki-gyomu** | 0 | 0 | 100 | 0 | 100 | **✗ unmapped**（v109 で大幅追加） |
| **kiso-chishiki-joho** | 0 | 7 | 54 | 0 | 61 | **✗ unmapped**（v109 で大幅追加） |

**核心**:
- **mapped 7 chapter**: `EXACT_MAPPING` でカバーされた raw はすべて統一 NN_ display へ正規化される。カバーされていない raw は素通り（mapped chapter でも display が混在しうる）
- **unmapped 15 chapter**: raw がそのまま UI 表示される。後半 (v101-v109) で大量追加された minpo-bukken / minpo-saiken / kiso-chishiki-gyomu / kiso-chishiki-joho は **すべて unmapped**

### 2-4. UI 表示「その他」の発生源

`src/app/exercise/page.tsx:121` の `rawSec.trim() || 'その他'` フォールバック → empty sectionTitle が "その他" として描画される。chapter 別 empty 件数：

| chapter | empty count |
|---|---:|
| minpo-saiken | 36 |
| shoho-kaisha | 13 |
| minpo-shinzoku | 10 |
| minpo-bukken | 4 |
| その他 | 8 |
| **計** | **71** |

→ ユーザー画面で「その他」と表示される項目はすべて、raw sectionTitle が空の branches。empty raw は前半 (4) + 後半 (67) で発生しており、後半（Gemini OCR）の方が頻度高い。

### 2-5. ユーザー screenshot 例示の出典確認

ユーザー提示の labels を data に照合：

| ユーザー観測 label | raw データ照合 | 出典 |
|---|---|---|
| `02_権利能力・行為能力` | **raw データには NOT FOUND**。`EXACT_MAPPING['minpo-sosoku']` 経由で raw "01_権利能力・行為能力" / "行為能力" / "意思能力" / etc. → display へ正規化された結果 | UI 正規化由来（=display 計算結果） |
| `03_人・法人・物` 等 | 同上、`minpo-sosoku` 正規化 display 値 | UI 正規化由来 |
| `02_物権変動と登記` | raw として p247-p249 に 8 件存在（前半 L1 由来）、minpo-bukken | raw 直接表示（minpo-bukken は unmapped） |
| `公序良俗` | raw として p220-p221 に 2 件存在、minpo-sosoku | raw 直接表示（`EXACT_MAPPING['minpo-sosoku']` に "公序良俗" entry なし → 素通り） |
| `その他` | raw が空 → UI フォールバック | UI フォールバック（71 件） |
| `一括競売` | raw として p279 に 1 件、minpo-bukken（v101-v102 由来） | raw 直接表示 |
| `共同抵当` | raw として p281 に 2 件、minpo-bukken（v101-v102 由来） | raw 直接表示 |
| `共有` | raw として p259 に 5 件、minpo-bukken（v101-v102 由来） | raw 直接表示 |
| `根抵当権` | raw として p282 に 5 件、minpo-bukken（v101-v102 由来） | raw 直接表示 |
| `4 用益物権` | raw として p262 に 1 件、minpo-bukken | raw 直接表示（"N 名前" pattern、Gemini OCR 由来） |
| `3 所有権 1) 所有権の限界（相隣関係）` | raw として 5 件存在、minpo-bukken | raw 直接表示（"N 名前 N) サブ" pattern、Gemini OCR 由来） |

**重要**: ユーザーが「番号付き」と認識した `02_権利能力・行為能力` 等は **raw データには存在せず**、`EXACT_MAPPING` 経由の **正規化 display 計算結果**。つまり「番号がある分類」と「番号がない分類」が UI 上に混在しているのは、**chapter ごとに正規化が完了しているか否かの差**であって、データ層の bug ではない。

---

## 3. 5 分類への当てはめ

| Cat | 内容 | 該当 | 根拠 |
|---|---|---|---|
| **A** | source 側も番号なし | **該当（部分的）** | 後半 (v101-v109) は Gemini OCR raw が原本の subsection を字義通り抽出 → 番号なし。書籍原本の subsection 自体が「共有」「根抵当権」のような番号なし label を使っているため、**source 側も番号なしという仕様**。修正不要 |
| **B** | source has 番号、import で欠落 | **該当なし** | `importParsedBatch` は `branch.sectionTitle ?? ''` を素通りで保存（src/lib/import-parsed.ts:167, 182）。raw を改変しない設計。前半 NN_ raw も後半 no_num raw もすべて原 raw のまま保存されている |
| **C** | data には番号、UI で欠落 | **bug ではない / coverage 改善候補あり** | UI 表示処理のバグではない（`displaySectionTitle ?? sectionTitle` の優先順で raw まで必ずフォールバック、src/app/exercise/page.tsx:120 / db.ts は `attr.displaySectionTitle` 優先 + on-the-fly `resolveDisplaySectionTitle()` 解決）。ただし `displaySectionTitle` 正規化 mapping の chapter coverage が未整備なため、unmapped chapter では raw sectionTitle がそのまま表示される。**data bug ではなく UI 正規化 coverage の改善候補**（§5-2 / §9 参照） |
| **D** | 番号体系混在 source 通り | **該当（dominant）** | 前半 L1 import (p001-p249) は raw が NN_ と no_num の混在、後半 v101-v109 は no_num のみ。原本に忠実に取り込んだ結果、混在状態は **source 通り**。**`EXACT_MAPPING` の partial coverage により mapped chapter では正規化が走り、unmapped chapter では素通り** という二重構造で UI 表示の混在が増幅されている |
| **E** | sectionTitle override が誤って番号を落とした | **該当なし** | v109 を含む override 履歴は `subjectCandidate` / `chapterCandidate` のみを書き換え、`sectionTitle` raw は変更していない（`docs/override_rule_design.md` §2-2、check_classification.py も sectionTitle を read のみ）。check_classification.py v0.1 は read-only proposal で副作用なし |

---

## 4. v109 由来 vs 既存由来の切り分け

| 観測 | v109 由来か | 根拠 |
|---|---|---|
| 後半 chapter で番号なし raw が大量 | **v101-v109 全体由来**（v109 単独ではない） | sourcePage ≥ 250 の NN_ count が **0**。後半 OCR は最初から NN_ を含まない。v109 (p441-470) の追加 136 肢も同 pattern で、v109 が新規に「番号を落とした」わけではない |
| `kiso-chishiki-gyomu` / `kiso-chishiki-joho` の番号なし表示 | **v108-v109 で初登場 + unmapped** | これらの chapter は v108 (p437) で初出、v109 (p441-464) で 161 肢が一気に追加された。**`EXACT_MAPPING` がまだ作られていない**ため raw が素通り。これは「v109 由来の bug」ではなく「unmapped chapter に大量追加した結果」 |
| 前半 chapter (e.g., minpo-sosoku) の整然とした番号 display | **v101-v109 とは独立** | mapped 7 chapter は前半 L1 import 当時に正規化されている。v101-v109 は後半 chapter (主に minpo-saiken / minpo-bukken / shoho-* / kiso-chishiki-*) を扱っており、mapped chapter は触っていない |

→ **v109 単独に起因する番号欠落は検出されない**。

---

## 5. 修正が必要かの判定

### 5-1. data 層

**修正不要**。raw sectionTitle は import 時に原本忠実に保存されており、bug ではない。

### 5-2. UI / sectionNormalization 層

**修正不要だが、既存の partial 正規化プロジェクトの自然な進行候補が存在**。具体的には：

- `EXACT_MAPPING` が未整備の 12 chapter（minpo-bukken / minpo-saiken / minpo-shinzoku / minpo-sozoku / shoho-shoho / shoho-kaisha / kiso-hogaku-gairon / kiso-hogaku-funso / kiso-chishiki-gyomu / kiso-chishiki-joho / kenpo-soron / kenpo-jinken）について、raw → 統一 NN_ display への mapping を **chapter 単位で順次追加** する選択肢がある
- これは v3 / v4 ingestion_flow とは独立した「UI 正規化の進行中プロジェクト」。`gyosei-fufuku` / `gyosei-chiho` / `gyosei-jiken` / `kenpo-tochi` 等が GPT レビューを経て段階的に追加された経緯と同じ
- **本 audit の scope 外**。「番号欠落の bug 修正」ではなく「UI 表示一貫性の改善」案件として、user 判断で別 P1 化するか保留するかを決める

### 5-3. もし将来 EXACT_MAPPING を拡張する場合の最小 patch ガイド

（あくまで参考。本 audit では実施しない）

- 1 chapter ごとに分けて PR
- raw → display mapping は **手動 review 必須**（broad raw / page-split は PROBLEM_ID_OVERRIDES / PAGE_SPLIT_RULES 経由）
- 既存 mapped chapter の precedent をコピペで他 chapter に適用しない（書籍構造が違う）
- DATA_VERSION bump は不要（data 無変更、表示層のみ）

---

## 6. 修正不要と判断する理由（明文化）

1. **raw sectionTitle は原本忠実**: import 経路に番号削除ロジックは存在しない（`src/lib/import-parsed.ts:167, 182` で `branch.sectionTitle ?? ''` を素通り保存）
2. **後半 OCR は仕様通り無番号**: 書籍原本の subsection label が番号なしのもの（"共有" / "根抵当権" 等）を、Gemini が字義通り抽出している。番号を「捏造」する設計の方が source 不在の擬似確証になる
3. **v109 は sectionTitle を変更していない**: override は `subjectCandidate` / `chapterCandidate` のみ書き換え、`sectionTitle` は read-only
4. **UI 表示の混在は既知の partial 正規化**: 7/22 chapter のみ `EXACT_MAPPING` で正規化されているのは GPT review を経て段階的に追加した結果（コメント `GPTレビュー承認済み（2026-04-12）` 等が裏取り）。残 15 chapter の正規化は **incomplete project** であり bug ではない

---

## 7. 残リスク（許容範囲）

1. **ユーザー学習体験への影響**: UI 上「02_権利能力・行為能力」と「共有」が並ぶことで、進捗整理の見通しが悪い可能性。これは **UX issue** であって data 整合性 issue ではない。改善するなら EXACT_MAPPING 拡張で対応
2. **v3 ingestion_flow との関係**: v3 §0 不変条件「raw 改変禁止」は守られている。v4 draft でも sectionTitle は read のみで触らない設計
3. **検証バッチへの示唆**: v4 draft で計測する 4 metrics（auto_apply / review_queue / Hard 未達 / 想定外ケース）に **直接の影響なし**。本 audit は override script の rule とは独立した観察

---

## 8. read-only 確認 log（本 audit で触ったもの）

| ファイル | 行為 |
|---|---|
| `src/data/master.ts` | read |
| `src/data/sectionNormalization.ts` | read |
| `src/app/exercise/page.tsx` | read |
| `src/lib/import-parsed.ts` | read |
| `data/reviewed_import.json` | read（python集計） |
| `context/working/classification_number_audit.md` | **新規作成 = 本ファイル** |

**触っていない**:
- `data/reviewed_import.json` / `public/data/reviewed_import.json`（write）
- `src/` 配下すべて（write）
- `DATA_VERSION`（read のみ、bump なし）
- `context/stable/`（read のみ）
- `context/working/handoff.md` / `current_status.md`
- `docs/ingestion_flow_v4_draft.md`
- `scripts/check_classification.py`

---

## 9. user 判断ポイント

1. **「番号欠落 bug」と認識し続けるか、UX 改善 backlog として整理するか**
   - 本 audit の判定は「bug ではない」だが、user の学習体験では「気になる」可能性
   - UX 改善で扱うなら「`EXACT_MAPPING` chapter-by-chapter 拡張」を P3 queue 化
2. **拡張するなら、どの chapter から着手するか**
   - 件数最大: minpo-saiken (376 肢、unmapped) → 投資対効果最大
   - v109 で大量追加: kiso-chishiki-gyomu (100) / kiso-chishiki-joho (61) → 後半完走の見通しと整合
   - 整合性最重要: minpo-bukken (205, raw 混在 NN_ 8 + no_num 187) → 既存 NN_ raw を起点に拡張可能
3. **本 audit の保全方針**
   - docs-only PR で commit するか、untracked のまま保持するか
   - v4 draft (PR #89) と同じく「保全 PR」を起こすのが自然。ただし scope は 1 ファイル新規追加のみ
