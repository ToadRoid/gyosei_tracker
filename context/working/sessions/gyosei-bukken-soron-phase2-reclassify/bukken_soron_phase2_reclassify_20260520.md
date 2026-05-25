# 民法 > 物権 > 物権総論 Phase 2 reclassify audit

date: 2026-05-20
base: origin/main `44e914d`
scope: PR #176 で確定した参考書見出し anchor をもとに、物権総論残存 23 件のうち 22 件を reclassify する。p.253 seq3「混同」1 件は unresolved として物権総論に残す。

---

## 1. 結論

**patch 22 件 / unresolved 1 件**。DATA_VERSION を `d1 → d2` に bump。

| 移動先 sectionTitle | 件数 | sourcePage / seq |
|---|---:|---|
| `動産物権変動 2 即時取得` | 2 | p.253 seq1, seq2 |
| `2 占有権`（新 section） | 14 | p.253 seq4, p.254 seq1-6, p.255 seq1-7 |
| `3 所有権 1) 所有権の限界 (相隣関係)` | 2 | p.258 seq1, seq2 |
| `3 所有権 2) 所有権の取得`（新 section） | 4 | p.258 seq3-6 |
| **patch 合計** | **22** | |
| `物権総論`（unresolved 残存） | 1 | p.253 seq3（混同） |

---

## 2. 各 patch の根拠

### 2-1. p.253 seq1, seq2 → `動産物権変動 2 即時取得`

- 内容: 盗品の即時取得（美術商A・盗まれた絵画）
- anchor: 同 spQ=608 page の前半は即時取得（Q11, Q12 = 前 page p.252 の続き）。既存 section `動産物権変動 2 即時取得` に直接該当
- 参考書 capture: `~/Desktop/kindle_shots/0253.png`（PR #176 で確認済）

### 2-2. p.253 seq4 + p.254 seq1-6 + p.255 seq1-7 → `2 占有権`

- 内容: 占有権の取得・代理占有・指図占有・占有相続・186 条推定・占有訴権（保持・保全・回収）・占有の効力
- anchor: `0253.png` 下半に **「2 占有権」** 見出しを確認（PR #176 §3-1）。p.254 / p.255 はその配下の続き（新規見出しなし、page footer のみ「物権総論」「810-813」）
- 新 section 命名: 参考書原文の **「2 占有権」** を section 名としてそのまま採用。既存命名規則（番号 + 半角スペース + 名称: 例 `02_物権変動と登記` / `4 用益物権`）と整合
- 14 件すべて HIGH-confidence

### 2-3. p.258 seq1, seq2 → `3 所有権 1) 所有権の限界 (相隣関係)`

- 内容: 隣地竹木の根や枝（233 条）/ 境界線から 1m 未満の窓・縁側（235 条）
- anchor: `0258.png` 上半は p.256-257 の相隣関係の続き。既存 section（PR #174 で確立済）に直接該当

### 2-4. p.258 seq3-6 → `3 所有権 2) 所有権の取得`

- 内容: 無主物先占 2 件 / 遺失物拾得 1 件 / 付合 1 件
- anchor: `0258.png` 中央に **「2) 所有権の取得」** 見出し確認（PR #176 §3-4）
- 新 section 命名: 既存 `3 所有権 1) 所有権の限界 (相隣関係)` の命名 pattern に揃え、**`3 所有権 2) 所有権の取得`** とする

---

## 3. unresolved（1 件）

### p.253 seq3「混同」 — 物権総論に残す

- 内容: 「甲の所有地に対し、乙が 1 番抵当権、丙が 2 番抵当権を有していた場合、乙が甲からその土地を買い受けたときは、乙の 1 番抵当権は…」
- 参考書見出し: `0253.png` 中央に **「4) 混同」** 見出し confirmed（PR #176 §3-1）
- 判定: MEDIUM-confidence。新 section `混同` 創設は user 承認待ち
- 既存近接 section への寄せ: 候補は (a) 担保物権関連 / (b) 物権の消滅原因 等、いずれも既存に該当 section なし
- 現状維持: `物権総論` に残す。task 指示「reference 未確認・MEDIUM の p.253 seq3「混同」は今回は移動しない」に従う

---

## 4. patch 前後の section 件数（minpo-bukken chapter）

| section | before | after | delta |
|---|---:|---:|---:|
| 物権総論 | 23 | **1** | -22 |
| 2 占有権（new） | 0 | **14** | +14 |
| 3 所有権 2) 所有権の取得（new） | 0 | **4** | +4 |
| 動産物権変動 2 即時取得 | 3 | **5** | +2 |
| 3 所有権 1) 所有権の限界 (相隣関係) | 10 | **12** | +2 |
| 他 section | 169 | 169 | 0 |
| **合計（minpo-bukken）** | **205** | **205** | **0** |

合計 invariant ✓

---

## 5. invariant 検証

| 項目 | before | after |
|---|---|---|
| total branches（data） | 2448 | 2448 ✓ |
| total branches（public） | 2448 | 2448 ✓ |
| answerBoolean true | 1140 | 1140 ✓ |
| answerBoolean false | 1308 | 1308 ✓ |
| data / public byte-identical (構造) | — | sectionTitle 行のみ完全同期 |
| Q / E / sourcePage / sourcePageQuestion / sourcePageAnswer / answerBoolean | — | **未変更** |
| subjectCandidate / chapterCandidate | — | **未変更**（minpo / minpo-bukken のまま） |
| `git diff --numstat` | — | data 22+/22-, public 22+/22-, src/lib/db.ts 1+/1- |
| `git diff --check` | — | clean |
| `tsc --noEmit` | — | pass |
| `npm run build` | — | pass |
| stash@{0} | 残存 | 残存 ✓ |

`git diff` で変更されたのは 4 種類の `sectionTitle` 行のみ:
- `-          "sectionTitle": "物権総論",`
- `+          "sectionTitle": "動産物権変動 2 即時取得",`(×2)
- `+          "sectionTitle": "2 占有権",`(×14)
- `+          "sectionTitle": "3 所有権 1) 所有権の限界 (相隣関係)",`(×2)
- `+          "sectionTitle": "3 所有権 2) 所有権の取得",`(×4)

---

## 6. DATA_VERSION

| 時点 | 値 |
|---|---|
| before | `2026-05-20-bukken-soron-reclassify-d1` |
| after | `2026-05-20-bukken-soron-reclassify-d2` |

---

## 7. 残タスク

1. user 判断: 「混同」section 創設可否（残 1 件の解消）
2. （別 phase）`物権` catch-all label 10 件（p.252, p.284）の分解
3. （別 phase）`images_preprocessed/` への 0251-0470 preprocess
4. UI QA（merge 後）
