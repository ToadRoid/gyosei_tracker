# 民法 > 物権 > 物権総論 reclassify audit

date: 2026-05-20
base: origin/main `de91e1a`
scope: 民法・物権 chapter の `sectionTitle = 物権総論` 63 件を、page-anchored 規則で下位 section に再分類する。

**重要**: page / heading / neighboring record による高確度判定のみ採用。Q/E/answerBoolean/sourcePage 系は一切変更しない。曖昧なものは unresolved に残す。

---

## 1. 背景

PR #165 で taxonomy normalization design (Gate B blocked) を merge 済み。本タスクは、その design の Phase 2「親見出し分解」を **image 不在のページについて page-anchored で部分着手** する。

「物権総論」63 件は p.246..264（spQ 594..630）に分布し、本来複数の下位 section（02_物権変動と登記 / 所有権 / 共有 / 用益物権 等）に属するはず。

---

## 2. Page-based inventory（着手前）

| sourcePage | sourcePageQuestion | 物権総論 件数 | 同 page 上の他 section（anchor 候補） |
|---|---|---|---|
| 246 | 594 | 7 | （単独） — p.247 (596): 02_物権変動と登記 / p.245 (592): 不動産物権変動 |
| 248 | 598 | 1 | **同 page**: 登記を対抗要件とする物権変動 (4件) |
| 250 | 602 | 4 | （単独） — p.249 (600): 02_物権変動と登記 / p.251 (605): 動産物権変動 |
| 253 | 608 | 4 | **同 spQ=608**: 物権 (7件、catch-all label) |
| 254 | 610 | 6 | （単独） |
| 255 | 612 | 7 | （単独） |
| 257 | 616 | 5 | （単独） — p.256 (614): 3 所有権 1) 所有権の限界 (相隣関係) |
| 258 | 618 | 6 | （単独） |
| 260 | 622 | 7 | （単独） — p.259 (620): 共有 |
| 261 | 624 | 6 | （単独） — p.260 が patch 後「共有」となる / p.262 (626): 4 用益物権 |
| 263 | 628 | 7 | （単独） — p.262 (626): 4 用益物権 |
| 264 | 630 | 3 | （単独） — p.263 が patch 後「4 用益物権」 / p.265 (632): 担保物権 |
| **合計** | | **63** | |

---

## 3. 分類 anchor の判定基準

| 判定 | 基準 |
|---|---|
| **HIGH-confidence** | (a) 同一 spQ ページに他 section が存在しそこへの集約が自然 / (b) 隣接 page と内容が page 全体で一貫し既存 section と一致 |
| **MEDIUM-confidence** | 隣接 page と一致するが内容が混在 |
| **UNRESOLVED** | 該当 anchor section が章に存在しない（例: 占有権） / 内容が混在 |

---

## 4. High-confidence 修正対象（40 件、本 PR で patch）

| sourcePage | spQ | 件数 | 移動先 sectionTitle | anchor 根拠 |
|---|---|---|---|---|
| 246 | 594 | 7 | `02_物権変動と登記` | 内容（7件すべて二重譲渡/第三者対抗/移転登記）+ p.247-249 が同 section |
| 248 | 598 | 1 | `登記を対抗要件とする物権変動` | **同 page anchor**: 同 page の 4件が既にこの section |
| 250 | 602 | 4 | `02_物権変動と登記` | 内容（共同相続+登記）+ p.249 が同 section |
| 257 | 616 | 5 | `3 所有権 1) 所有権の限界 (相隣関係)` | 内容（相隣関係 5件すべて）+ p.256 が同 section |
| 260 | 622 | 7 | `共有` | 内容（共有 7件すべて）+ p.259 が同 section |
| 261 | 624 | 6 | `共有` | 内容（共有 6件すべて）+ patch 後の p.260 が同 section |
| 263 | 628 | 7 | `4 用益物権` | 内容（地上権/地役権 7件すべて）+ p.262 が同 section |
| 264 | 630 | 3 | `4 用益物権` | 内容（地役権 3件すべて）+ patch 後の p.263 が同 section |
| **合計** | | **40** | | |

### 個別 record（HIGH-confidence patch 対象 40件）

#### → 02_物権変動と登記（11件）

- KB2025-p246-q01 seq=1..7（7件、二重譲渡・移転登記・対抗）
- KB2025-p250-q01 seq=1..4（4件、共同相続+登記）

#### → 登記を対抗要件とする物権変動（1件）

- KB2025-p248-q01 seq=1（背信的悪意者+移転登記）

#### → 3 所有権 1) 所有権の限界 (相隣関係)（5件）

- KB2025-p257-q01 seq=1..5（隣地電気ガス/雨水/境界標/相隣境界）

#### → 共有（13件）

- KB2025-p260-q01 seq=1..7（7件、共有者持分・同意・変更）
- KB2025-p261-q01 seq=1..6（6件、共有 賃貸借・保存行為・管理費用）

#### → 4 用益物権（10件）

- KB2025-p263-q01 seq=1..7（7件、地上権・地役権）
- KB2025-p264-q01 seq=1..3（3件、地役権）

---

## 5. Unresolved（23 件、本 PR で patch しない）

| sourcePage | spQ | 件数 | 理由 |
|---|---|---|---|
| 253 | 608 | 4 | 内容混在（盗品即時取得 + 抵当権混同 + 賃借占有）+ 同 spQ の「物権」label も catch-all で anchor 不適 |
| 254 | 610 | 6 | 全件が占有権だが、章内に「占有権」section が存在しない（新 section 創設は別 phase） |
| 255 | 612 | 7 | 同上（占有権） |
| 258 | 618 | 6 | 内容混在（相隣 2件 + 無主物先占/遺失物拾得/付合 4件）+ 後者の anchor section なし |

→ **占有権 section が章にないこと**が主因。今回は新 section 作成を回避し、unresolved として記録。Phase 3 で占有権 section 創設 + p.253 含む混在ページの個別分類を行う。

---

## 6. Patch 後の section 件数（minpo-bukken）

| section | before | after | delta |
|---|---|---|---|
| 物権総論 | 63 | **23** | -40 |
| 02_物権変動と登記 | 8 | **19** | +11 |
| 登記を対抗要件とする物権変動 | 4 | **5** | +1 |
| 3 所有権 1) 所有権の限界 (相隣関係) | 5 | **10** | +5 |
| 共有 | 5 | **18** | +13 |
| 4 用益物権 | 1 | **11** | +10 |
| 他 section | 119 | 119 | 0 |
| **合計（minpo-bukken）** | **205** | **205** | **0** |

合計 invariant ✓

---

## 7. Q/E/answerBoolean/sourcePage 不変確認

| 項目 | 結果 |
|---|---|
| branch count（data/public） | 2448 不変 |
| answerBoolean count（data/public） | true:1140 / false:1308 不変 |
| 40 target Q | すべて未変更（sample: KB2025-p246-q01 seq=1 Q 先頭「甲はその所有の土地を乙に売り渡し」） |
| 40 target E | すべて未変更（sample: KB2025-p246-q01 seq=1 E 先頭「不動産が二重譲渡された場合」） |
| 40 target sourcePageQuestion | 未変更（sample: KB2025-p246-q01 seq=1 spQ=594） |
| subjectCandidate / chapterCandidate | 未変更（minpo / minpo-bukken のまま） |
| questionType | 未変更 |
| 過去 patch（PR #158〜#173） | すべて preserved（Q/E/ab/sectionTitle 含む） |

---

## 8. DATA_VERSION

| 時点 | 値 |
|---|---|
| before | `2026-05-19-jikou-e-micro-fix-c1` |
| after | `2026-05-20-bukken-soron-reclassify-d1` |

---

## 9. 検証

| 項目 | 結果 |
|---|---|
| JSON parse（data/public） | OK |
| data/public 同期 diff byte-identical | OK |
| 40 target sectionTitle correct（data/public） | OK |
| section count expectations | すべて期待値一致 |
| minpo-bukken total branches 205 unchanged | OK |
| `git diff --check` | clean |
| `tsc --noEmit` | pass |
| `npm run build` | pass |
| `stash@{0}` | 残存 |

---

## 10. 残タスク（次 phase）

1. **占有権 section の創設判断**: p.253/254/255 の占有権系問題（17件）を移動するなら新 section が必要。命名規則（既存「3 所有権 1) ...」「4 用益物権」と整合を取って「2 占有権」程度）の合意が必要
2. **p.258 の split**: seq 1-2 を相隣関係へ、seq 3-6 を「所有権の取得（無主物・遺失物・付合）」へ — どちらも anchor section が存在 or 不在
3. **物権 catch-all label（10件、p.252/284）の分解**: spQ=608 (p.252) と spQ=670 (p.284) で異なる内容。分解必要
4. **物権 taxonomy normalization Phase 1（PR #165 design）**: images 0251-0285 の追加捕捉により、source-anchored で更に精密な分類が可能になる

---

本 doc は MD source of truth、HTML 版なし（本 phase は単発実装、過去の design doc を参照する補助記録）。
