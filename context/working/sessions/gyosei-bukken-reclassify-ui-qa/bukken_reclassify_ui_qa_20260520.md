# 物権総論 reclassify UI QA — PR #174 merge 後

date: 2026-05-20
target commit: `503a17f` (PR #174 merge — fix: reclassify 物権総論 page-anchored taxonomy)
base: origin/main `503a17f`
DATA_VERSION (code): `2026-05-20-bukken-soron-reclassify-d1`

---

## 1. QA 環境

| 項目 | 値 |
|---|---|
| 方式 | served public JSON data-layer QA（前回 #171/#172/#173 QA と同方針） |
| 理由 | `/exercise` / `/review` は login wall で preview MCP からは未到達。前回 session `gyosei-post-data-fix-qa` で確立された切り替え条件に従う |
| 対象 file | `public/data/reviewed_import.json` |
| 検証 tool | `jq` / `git show` |
| OS | macOS |

---

## 2. DATA_VERSION / public JSON 反映状況

| 項目 | 結果 |
|---|---|
| `src/lib/db.ts` の DATA_VERSION | `2026-05-20-bukken-soron-reclassify-d1` ✅ |
| `data/reviewed_import.json` ↔ `public/data/reviewed_import.json` | byte-identical（diff 0 行、同サイズ 2,377,012 bytes、同 mtime） ✅ |
| PR #174 numstat | `data/reviewed_import.json` 40+/40-, `public/data/reviewed_import.json` 40+/40-, `src/lib/db.ts` 1+/1- ✅ |

→ DATA_VERSION 更新と public JSON 反映は **PASS**。

---

## 3. PR #174 の差分内訳（sectionTitle 再分類 40 件）

`git show 503a17f -- public/data/reviewed_import.json` の `sectionTitle` 行集計：

| from | to | count |
|---|---|---:|
| 物権総論 | 共有 | 13 |
| 物権総論 | 02_物権変動と登記 | 11 |
| 物権総論 | 4 用益物権 | 10 |
| 物権総論 | 3 所有権 1) 所有権の限界 (相隣関係) | 5 |
| 物権総論 | 登記を対抗要件とする物権変動 | 1 |
| **合計** | | **40** |

→ 期待どおり high-confidence 40 件が物権総論から各小分類へ移動。**PASS**

---

## 4. 民法>物権 section 件数（current public JSON 集計）

`jq '[.pages[].branches[] | select(.chapterCandidate == "minpo-bukken")] | group_by(.sectionTitle) ...'` 結果：

| count | sectionTitle | 観点 |
|---:|---|---|
| 64 | 担保物権 | 影響対象外（参考） |
| 23 | 物権総論 | **期待 23 ✅**（63 − 40 = 23） |
| 19 | 02_物権変動と登記 | 11 増（≈8→19） ✅ |
| 18 | 共有 | 13 増（≈5→18） ✅ |
| 11 | 4 用益物権 | 10 増（≈1→11） ✅ |
| 10 | 3 所有権 1) 所有権の限界 (相隣関係) | 5 増（≈5→10） ✅ |
| 10 | 物権 | 影響対象外 |
| 7 | 抵当権の効力及び目的物の範囲 | 影響対象外 |
| 5 | 根抵当権 | 影響対象外 |
| 5 | 登記を対抗要件とする物権変動 | 1 増（≈4→5） ✅ |
| 4 | (空) | 既存。今回の reclassify と無関係 |
| 4 | 先取特権 | 影響対象外 |
| 3 | 動産物権変動 2 即時取得 | 影響対象外 |
| 3 | 抵当権者に対抗できない賃借人の地位 | 影響対象外 |
| 3 | 物権的請求権 | 影響対象外 |
| その他 | （根抵当・法定地上権・一括競売 等） | 影響対象外。崩れなし |

→ 観点 3（物権総論 = 23）と観点 4（物権変動/登記系・共有・用益物権 等の増加）、観点 6（その他 section の崩れなし）すべて **PASS**。

---

## 5. スクショ問題（観点 5）

検索クエリ: questionText 先頭が「甲はその所有の土地を乙に売り渡し」

| 項目 | 値 |
|---|---|
| 現在の sectionTitle | `02_物権変動と登記` ✅ |
| 期待 | 02_物権変動と登記、または不動産物権変動・登記系 |
| 旧表示（PR #174 前） | 物権総論 |

→ 期待どおり「物権変動と登記」系に再分類済み。**PASS**。

---

## 6. /exercise・/review 画面確認（観点 7）

| URL | 結果 |
|---|---|
| `/exercise` | **BLOCKED — 認証必須**（preview MCP 未ログイン。前回 session と同 blocker） |
| `/review` | **BLOCKED — 認証必須**（同上） |

→ 観点 7（/exercise と /review の分類表示一致）は UI 経路では **BLOCKED**。
→ 代替として data-layer 上で sectionTitle を確認済み。両画面は同じ `public/data/reviewed_import.json` を経由して `importParsedBatch` するため、データ層で分類が一致していれば両画面とも同一の section を表示する想定。コード経路の不一致は本 PR の差分（sectionTitle のみ）からは発生しない（src 変更は `src/lib/db.ts` の DATA_VERSION 文字列 1 行のみ）。

---

## 7. 変更ファイル検証（task constraints）

```
$ git status -sb
## claude/intelligent-shockley-90980d...origin/main
?? context/working/sessions/gyosei-bukken-reclassify-ui-qa/

$ git diff --check  → 0 行
```

- `data/` 差分なし ✅
- `public/` 差分なし ✅
- `src/` 差分なし ✅
- DATA_VERSION 変更なし ✅
- taxonomy 編集なし ✅
- stash@{0} 残存 ✅
- 追加 file: docs-only 1 件（本 MD）✅

---

## 8. 結論

**PASS**

- DATA_VERSION 更新・public JSON 反映: PASS
- 物権総論 23 件残存: PASS
- 物権変動と登記 / 共有 / 用益物権 / 相隣関係 / 登記対抗要件の増加: PASS
- スクショ問題（甲はその所有の土地を乙に売り渡し...）の sectionTitle = `02_物権変動と登記`: PASS
- 他 section の件数崩れ: なし、PASS
- /exercise・/review UI 直接確認: BLOCKED（login wall、想定どおりの既知制約）。data-layer で代替確認済み。

---

## 9. Next action

- UI 直接 QA は引き続き login wall でブロックされる。ローカル dev で認証経路を整える、または preview MCP に test user を投入する手段の検討は別 session で扱う。
- 残存 23 件の物権総論（high-confidence でなかった肢）の追加 reclassify が必要かは別途データ精査の判断対象。本 QA では本 PR の範囲のみ扱う。
