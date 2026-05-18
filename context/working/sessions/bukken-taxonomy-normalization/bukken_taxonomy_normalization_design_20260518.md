# 民法 > 物権 taxonomy / sectionTitle 正規化 — 設計（Gate B: blocked）

date: 2026-05-18
base: origin/main `54ab4ab`
scope: data/reviewed_import.json と public/data/reviewed_import.json における `subjectCandidate=minpo / chapterCandidate=minpo-bukken` 配下の sectionTitle 粒度を、参考書の階層構造に寄せる正規化の設計

**判定: Gate B（blocked）— 必要な source image が不足しているため、data patch には進めない。本 PR は design doc のみ**。

---

## 1. 背景

- PR #161 で `/exercise` のセクション sort は `sourcePageQuestion / sourcePage / seqNo` 順に修正済み
- ただし sort では「並び」しか直せない。「分類粒度」の問題は残ったまま
- 民法 > 物権 では、参考書上の **親見出し（例: 物権総論 / 担保物権）と子見出し（例: 不動産物権変動 / 抵当権の効力）と OCR 由来の細目見出しが同一階層に混在** している
- 結果として `/exercise` で物権を開くと、24 個の section が異なる粒度で並んでしまう

---

## 2. 現在の問題

### 民法 > 物権 sectionTitle inventory（sourcePageQuestion 昇順）

| count | unique problemIds | min sourcePageQuestion | min sourcePage | sectionTitle |
|---|---|---|---|---|
| 3 | 1 | 592 | 245 | 物権的請求権 |
| 1 | 1 | 592 | 245 | 不動産物権変動 |
| **63** | **12** | **594** | **246** | **物権総論** ← 親レベルの大規模カテゴリ |
| 8 | 2 | 596 | 247 | 02_物権変動と登記 |
| 4 | 1 | 598 | 248 | 登記を対抗要件とする物権変動 |
| 2 | 1 | 605 | 251 | 動産物権変動 1 対抗要件 |
| 3 | 1 | 605 | 251 | 動産物権変動 2 即時取得 |
| 10 | 2 | 608 | 252 | 物権 |
| 5 | 1 | 614 | 256 | 3 所有権 1) 所有権の限界 (相隣関係) |
| 5 | 1 | 620 | 259 | 共有 |
| 4 | 1 | 626 | 262 | (EMPTY) |
| 1 | 1 | 626 | 262 | 4 用益物権 |
| **64** | **14** | **632** | **265** | **担保物権** ← 親レベルの大規模カテゴリ |
| 4 | 1 | 636 | 267 | 先取特権 |
| 7 | 1 | 646 | 272 | 抵当権の効力及び目的物の範囲 |
| 4 | 1 | 654 | 276 | 法定地上権 |
| 1 | 1 | 660 | 279 | 一括競売 |
| 3 | 1 | 660 | 279 | 抵当権者に対抗できない賃借人の地位 |
| 2 | 1 | 662 | 280 | 抵当不動産の第三取得者の保護 |
| 2 | 1 | 664 | 281 | 抵当権の処分 |
| 2 | 1 | 664 | 281 | 共同抵当 |
| 1 | 1 | 664 | 281 | 抵当権の消滅 |
| 5 | 1 | 666 | 282 | 根抵当権 |
| 1 | 1 | 670 | 284 | 譲渡担保 |

**合計**: 24 sections / 205 branches

### 主要な所見

1. **物権総論（63 問、page 246-264）と 担保物権（64 問、page 265-285）が大規模** → 親見出しレベルで OCR/parser が問題を集約してしまい、子見出しごとに分けられていない疑い
2. **これら 2 親カテゴリ + 22 個の細目 sections が同一階層** に並んでいる
3. **(EMPTY) 4 問** が page 262 にあり、おそらく `4 用益物権` の前後に属する section が空欄になっている
4. 「**動産物権変動 1 対抗要件**」「**動産物権変動 2 即時取得**」「**3 所有権 1) 所有権の限界 (相隣関係)**」は番号 + 名称形式で書かれている。参考書の見出し形式が漏れた可能性

---

## 3. 参考書階層（user 共有情報による推定）

```
物権
├── 物権総論
│   ├── 1) 物権的請求権
│   └── 2) 不動産物権変動
│       └── 177条の「第三者」
├── 物権変動と登記
│   └── 登記を対抗要件とする物権変動
├── 動産物権変動
│   ├── 1) 対抗要件
│   └── 2) 即時取得
├── 所有権
│   ├── 1) 所有権の限界（相隣関係）
│   ├── 2) 共有
│   └── ...
├── 用益物権
└── 担保物権
    ├── 先取特権
    ├── 抵当権の効力及び目的物の範囲
    ├── 法定地上権
    ├── 一括競売
    ├── 抵当権者に対抗できない賃借人の地位
    ├── 抵当不動産の第三取得者の保護
    ├── 抵当権の処分
    ├── 共同抵当
    ├── 抵当権の消滅
    ├── 根抵当権
    └── 譲渡担保
```

→ **物権総論 / 担保物権 は親見出し**、それ以下の細目見出しが siblings として併存しているのが現在の data の問題。

---

## 4. Source image 確認結果（critical）

```bash
ls images/*.png | sort -n | tail -1
→ 0250.png
```

- `images/` には **0001.png 〜 0250.png** までしか存在しない
- 民法 > 物権 は Kindle pages **245〜285** に分布
- → **pages 251〜285 は source image 不在**

### Image 有無別 branch カウント

| 範囲 | branch 数 | 比率 |
|---|---|---|
| **image 有（sourcePage ≤ 250）** | 28 | 14% |
| **image 無（sourcePage > 250）** | **177** | **86%** |

### Image 無し branches を sectionTitle 別に集計

| 件数 | sectionTitle |
|---|---|
| 64 | 担保物権（全件 image 無し） |
| 51 | 物権総論（page 251-264 部分） |
| 10 | 物権（page 252, 284） |
| 7 | 抵当権の効力及び目的物の範囲 |
| 5 | 3 所有権 / 共有 / 根抵当権 |
| 4 | (EMPTY) / 先取特権 / 法定地上権 |
| 3 | 動産物権変動 2 即時取得 / 抵当権者に対抗できない賃借人の地位 |
| 2 | 動産物権変動 1 対抗要件 / 抵当不動産の第三取得者の保護 / 抵当権の処分 / 共同抵当 |
| 1 | 4 用益物権 / 一括競売 / 抵当権の消滅 / 譲渡担保 |

→ 圧倒的多数で source image が不在。**exact source-confirmed な分類正規化が不可能**。

---

## 5. 正規化 mapping table（参考設計、未実装）

仮に source image が揃った場合の正規化方針（**Gate A になったら採用する設計**）:

| 現在 sectionTitle | 提案 normalized sectionTitle | 確度 |
|---|---|---|
| 物権的請求権 | `物権総論 / 物権的請求権` | inferred |
| 不動産物権変動 | `物権総論 / 不動産物権変動` | inferred |
| 物権総論（63 件） | 個別に再分類が必要（page 別 source 確認） | **blocked** |
| 02_物権変動と登記 | `物権変動と登記` または `物権総論 / 物権変動と登記` | inferred |
| 登記を対抗要件とする物権変動 | `物権変動と登記 / 登記を対抗要件とする物権変動` | inferred |
| 動産物権変動 1 対抗要件 | `動産物権変動 / 対抗要件` | inferred |
| 動産物権変動 2 即時取得 | `動産物権変動 / 即時取得` | inferred |
| 物権（10 件） | 個別に再分類が必要（特に page 252, 284） | **blocked** |
| 3 所有権 1) 所有権の限界 (相隣関係) | `所有権 / 所有権の限界（相隣関係）` | inferred |
| 共有 | `所有権 / 共有` | inferred |
| (EMPTY) 4 件 page 262 | `用益物権 / ?`（page 262 source 確認必須） | **blocked** |
| 4 用益物権 | `用益物権` | inferred |
| 担保物権（64 件） | 個別に再分類が必要 | **blocked** |
| 先取特権 〜 譲渡担保（13 個の sub-sections） | `担保物権 / <name>` パターンで再分類 | inferred / 一部 blocked |

**確度の凡例**:
- inferred: 法律体系・参考書通例から推定可能だが、書籍の section header が一致する保証はない
- blocked: source image 不在のため exact 確認不可

---

## 6. exact confirmed / inferred / blocked 区分

| 区分 | 件数 | 内訳 |
|---|---|---|
| exact source-confirmed | 0 | — |
| inferred（法律体系/参考書通例から推定） | ~10 sections | 動産物権変動, 所有権 配下など |
| **blocked（source image 不在）** | **2 大親 + 数件 = 大部分** | 物権総論 63件, 担保物権 64件, 物権 10件, (EMPTY) 4件 など |

→ exact source-confirmed が **0** のため、Gate A 不可。

---

## 7. data patch 対象

**本 PR では data patch を行わない**。

理由:
1. 86% の branches が image 不在で exact 確認不能
2. 「inferred」だけで正規化を強行すると、参考書と異なる分類体系を data に焼き付けるリスク
3. 親見出しの「物権総論」「担保物権」を分解するには、各 problemId がどの sub-section に属するか書籍で確認しなければならない（127 件の確認作業）

---

## 8. data patch 対象外

- 全 24 sections / 205 branches すべて、本 PR では未変更
- Q / E / answerBoolean / sourcePage 系 / questionType も未変更

---

## 9. DATA_VERSION bump 要否

- 本 PR は data 未変更のため、**DATA_VERSION bump 不要**
- 現状: `2026-05-18-p0-textual-fix-a2` のまま

---

## 10. 検証方針（実装時、Gate A になった場合の参考）

将来の Gate A patch では以下が必須:

| 検証項目 | 期待 |
|---|---|
| JSON parse | OK |
| data/public sync | 完全一致 |
| 物権以外の branch 変更 | 0 |
| Q / E / answerBoolean / sourcePage / questionType 差分 | 0 |
| branch count | 205 不変 |
| answerBoolean count | 不変 |
| DATA_VERSION bump | 必須 |
| src diff | DATA_VERSION line のみ |
| /exercise 物権 表示 | 親→子の階層が見える |
| tsc / build | pass |
| git diff --check | clean |

---

## 11. 変更しなかったもの

- data/reviewed_import.json
- public/data/reviewed_import.json
- src/lib/db.ts（DATA_VERSION 含む）
- src/ 全般
- 他 chapter の taxonomy
- Q / E / answerBoolean
- sourcePage / sourcePageQuestion / sourcePageAnswer
- questionType
- stash@{0}

---

## 12. stash@{0} 残存確認

```
stash@{0}: WIP on main: 9c3793d docs: record descriptive ui re-qa (#141)
```
本タスク前後で touch せず、apply/drop なし。

---

## 13. Gate 判定根拠

| 判定条件 | 結果 |
|---|---|
| exact source-confirmed mapping が十分にあるか | **NO**（image 不足、0/24 sections） |
| 推定が多いか | **YES**（10/24 sections は inferred、それ以外は blocked） |
| reference book pages が足りないか | **YES**（pages 251-285 = 35 pages 不在） |

→ **Gate B（blocked）確定**。data patch 禁止、本 PR は design doc のみ。

---

## 14. 次のステップ（提案）

### Phase 1: Source image extension（最優先）

`images/` に **pages 0251〜0285** を追加捕捉する。これがなければ正規化は推定で進めるしかない。

- kindle_capture.sh の sourcePage 範囲を拡張
- 既存 OCR/import pipeline は触らない（reviewed_import.json は既に branch を持っている）
- 純粋に画像追加のみ

### Phase 2: 親見出し分解 audit

「物権総論」63 件と「担保物権」64 件を、page 別 + 問題内容別に再分類する audit を作成。各 branch の正しい sub-section を source image で確定する。

### Phase 3: 細目見出し正規化

`02_` 番号付き、` 1) ` 番号付き、`(EMPTY)` などを参考書見出しに揃える。

### Phase 4: data patch

Phase 2 / 3 の exact mapping が揃った段階で、本 design doc を Gate A に格上げして patch 実装。

---

## 15. 残タスク

- 同じ問題は **民法 > 債権** や **行政法** など他 chapter でも発生している可能性。同様の inventory を取って優先度を判断
- 「(EMPTY) sectionTitle」 4 件（page 262）は image 範囲外。OCR text-quality バックログに統合検討

---

## 注意事項

本 doc は MD を source of truth とする。HTML 版は閲覧用 snapshot であり、直接編集してはならない。
