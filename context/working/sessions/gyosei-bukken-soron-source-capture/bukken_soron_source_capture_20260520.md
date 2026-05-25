# 民法 > 物権 > pages 251-285 source capture availability report

date: 2026-05-20
base: origin/main `300962d`
scope: Phase 2 reclassify (PR #175 で blocked) の前提となる、pages 251-285 の参考書 source image 捕捉状況を確認し、unresolved 23 件の参考書見出しを report する。本 PR は **docs-only**、JSON / DATA_VERSION 変更なし。

---

## 1. 結論

**capture 済 ✓ / 参考書見出し確認済 ✓ / patch は別 PR**

`~/Desktop/kindle_shots/` に 0001-0470.png（合計 470 枚）が既に存在し、target range **0251-0285 は 35/35 枚揃っている**。`kindle_capture.sh` の追加実行は不要。

target 4 pages (253 / 254 / 255 / 258) の参考書見出しを Read tool で確認し、Phase 1 design doc の推定階層に **未掲載の見出し 2 件** を新たに確定した:

- p.253 後半: **「2 占有権」**（テキストP404-407 参照）
- p.258 中央: **「2) 所有権の取得」**

これにより PR #175 で unresolved とした 23 件のうち、占有権関連 17 件 + 所有権の取得 4 件 = **21 件** は anchor が確定。残り p.253 前半 4 件は混在で個別判定が必要。

本 PR では capture availability と heading 発見のみ記録。patch は task 指示に従い別 PR で実施。

---

## 2. Capture 状況

| 項目 | 値 |
|---|---|
| capture script | [`scripts/kindle_capture.sh`](scripts/kindle_capture.sh) — Kindle for Mac 自動スクショ |
| 既存 capture path | `~/Desktop/kindle_shots/` |
| 現在の保存範囲 | `0001.png` 〜 `0470.png`（合計 470 枚） |
| **target range 0251-0285** | **35/35 枚揃い ✓** |
| capture 日 | 2026-04-23（mtime） |
| `images_preprocessed/` 状態 | 0001-0250 のみ。0251-0470 は **未処理** |

→ user 側で kindle_capture を改めて実行する必要は **なし**。0251-0470 を `images_preprocessed/` に preprocess する別 task は将来検討対象（本 phase の scope 外）。

---

## 3. 参考書見出し確認結果（target 4 pages）

確認方法: `~/Desktop/kindle_shots/0NNN.png` を Read tool で表示し、見出し / 章立てを目視確認。

### 3-1. p.253 (`0253.png`, sourcePage=253, sourcePageQuestion=608-609)

| 位置 | 見出し | 備考 |
|---|---|---|
| 上半 | 即時取得（盗品・遺失物）の続き | Q11, Q12（前ページ p.252 からの継続） |
| 中央 | **「4) 混同」** | 新発見の見出し。Q8 が該当（甲の所有地・1番抵当権の混同） |
| 下半 | **「2 占有権」** + 「テキストP404-407」参照 | 新発見の見出し。Q8 が該当（代理占有: 賃貸借による占有移転） |

→ 確定: 参考書には「占有権」見出しが存在する。「2 占有権」の番号付けは、recoverable な親 section 配下の節番号と推定（前段の「1 ...」は image 上未確認）。

### 3-2. p.254 (`0254.png`, sourcePage=254, sourcePageQuestion=610-611)

| 位置 | 見出し | 備考 |
|---|---|---|
| 全体 | 占有権の取得・代理占有・推定 | **新規見出しなし**。p.253 「2 占有権」配下の続き |
| page footer | 「物権総論」「810/811」 | 本のページラベル / running header（本のページ番号は 810/811） |

→ 6 件すべて「占有権」配下と判断可能。

### 3-3. p.255 (`0255.png`, sourcePage=255, sourcePageQuestion=612-613)

| 位置 | 見出し | 備考 |
|---|---|---|
| 全体 | 占有訴権（保持・保全・回収）・占有の効力 | **新規見出しなし**。「占有権」配下の続き |
| page footer | 「物権総論」「812/813」 | running header |

→ 7 件すべて「占有権」配下と判断可能。

### 3-4. p.258 (`0258.png`, sourcePage=258, sourcePageQuestion=618-619)

| 位置 | 見出し | 備考 |
|---|---|---|
| 上半 | 相隣関係続き（竹木・境界 1m） | p.256-257「3 所有権 1) 所有権の限界 (相隣関係)」配下の継続。Q10, Q11 該当 |
| 中央 | **「2) 所有権の取得」** | 新発見の見出し。無主物先占・遺失物拾得・付合 が配下 |
| 下半 | 無主物先占・遺失物拾得・付合 | Q1-Q4 が「2) 所有権の取得」配下 |

→ split 確定: Q seq1-2 は相隣関係、Q seq3-6 は「2) 所有権の取得」。

---

## 4. 参考書階層の更新（unverified → confirmed 部分）

PR #175 §3-3 で示した推定階層に、本 capture 確認で **2 見出しを追加** する:

```
物権
├── 物権総論
│   ├── 1) 物権的請求権
│   └── 2) 不動産物権変動
├── 物権変動と登記
├── 動産物権変動
│   ├── 1) 対抗要件
│   ├── 2) 即時取得
│   └── 4) 混同                       ← p.253 中央で confirmed（番号は 3) を image 上未確認）
├── 占有権                             ← p.253 下半で「2 占有権」として confirmed
├── 所有権
│   ├── 1) 所有権の限界（相隣関係）
│   ├── 2) 所有権の取得                ← p.258 中央で confirmed
│   └── 共有
├── 用益物権
└── 担保物権
```

注意点:
- 「2 占有権」「2) 所有権の取得」の番号付けは、image 上は **節番号レベル** で見えている。親 section（物権総論 / 所有権 のどちら配下か）は本ページのみでは断定不可。**inferred**: 内容と慣例から「所有権の取得」は所有権配下、「占有権」は物権総論の sibling または配下、と推定。
- 確定的に親を決めるには、p.252 / p.256 等の section header capture を追加確認する必要あり（本 PR の scope 外）。

---

## 5. 23 件の Phase 2 patch 設計（**実施は別 PR**）

| sourcePage | seq | 移動先候補 sectionTitle | 確度 |
|---|---|---|---|
| 253 | 1 | `動産物権変動 2 即時取得` | HIGH（盗品即時取得、p.252 既存 section と整合） |
| 253 | 2 | `動産物権変動 2 即時取得` | HIGH（盗品即時取得） |
| 253 | 3 | （新 section）`混同` または既存近接 section | MEDIUM（「4) 混同」見出し独立。新 section 創設要承認） |
| 253 | 4 | （新 section）`占有権` | HIGH（代理占有、p.253 中央「2 占有権」配下） |
| 254 | 1-6 | （新 section）`占有権` | HIGH（占有権の取得・推定・承継） |
| 255 | 1-7 | （新 section）`占有権` | HIGH（占有訴権・占有の効力） |
| 258 | 1-2 | `3 所有権 1) 所有権の限界 (相隣関係)` | HIGH（相隣 竹木・境界 1m） |
| 258 | 3-6 | （新 section）`所有権の取得` | HIGH（無主物先占・遺失物拾得・付合、p.258 中央「2) 所有権の取得」配下） |

合計: HIGH 21 件 / MEDIUM 1 件（混同）/ 既存 section へ寄せ 2 件（相隣）。

**新 section 創設候補（user 承認要）**:
1. `占有権`（13 件: p.254×6, p.255×7）→ p.253 seq4 + で 14 件
2. `所有権の取得` または `2) 所有権の取得`（4 件: p.258 seq3-6）
3. （optional）`混同`（1 件: p.253 seq3）

→ user 判断ポイント:
- 新 section 名は既存命名規則（番号付き / かっこ付き）と整合させるか？
- 「混同」を独立 section にするか、既存の「物権総論」「物権 (catch-all)」に残すか？

---

## 6. patch 件数（本 PR）

| 項目 | 件数 |
|---|---:|
| patch した件数 | **0** |
| 新 section 創設 | **0** |
| DATA_VERSION 変更 | **なし** |
| 変更ファイル | docs-only 1 件 |

---

## 7. 検証

| 項目 | 結果 |
|---|---|
| data / public JSON | 未変更 |
| src | 未変更 |
| DATA_VERSION | 未変更 |
| `git diff --check` | clean |
| stash@{0} | 残存 |

---

## 8. 次 action

1. user が新 section 命名と「混同」の扱いを承認
2. 別 commit / PR で Phase 2 reclassify patch を実行（21 件 HIGH-confidence + MEDIUM 判断）
3. （別 task）`images_preprocessed/` への 0251-0470 preprocess を将来検討
