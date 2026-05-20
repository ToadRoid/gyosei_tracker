# 民法 > 物権 > 物権総論 Phase 2 reference-anchored reclassify audit

date: 2026-05-20
base: origin/main `8ddf884`
scope: PR #174 後に物権総論に残存する 23 件を、**参考書ページ見出し** anchor で reclassify する。reference 未確認の page group は patch せず unresolved に残す（既存 section への semantic 押し込み禁止）。

---

## 1. 結論（先出し）

**patch 0 件 / unresolved 23 件**。本 PR は docs-only。

理由: 対象 4 page group (253 / 254 / 255 / 258) すべてが **source image 不在**。参考書見出しが exact 確認できないため、task の strict rule「参考書見出しが確認できない page group は patch しない」「既存 section に無理やり寄せない」に従い、全件保留。

DATA_VERSION 変更なし（`2026-05-20-bukken-soron-reclassify-d1` のまま）。

---

## 2. 対象 23 件 inventory

`jq` 抽出（[public/data/reviewed_import.json](public/data/reviewed_import.json) より、`sectionTitle == "物権総論" AND chapterCandidate == "minpo-bukken"`）:

### p.253 (sourcePageQuestion=608, sourcePageAnswer=609) — 4 件

| problemId | seqNo | questionText 先頭 |
|---|---|---|
| KB2025-p253-q01 | 1 | 美術商Aは、Bが運営する個人美術館に盗まれた自己所有の絵画…（**即時取得 / 盗品特則**） |
| KB2025-p253-q01 | 2 | 美術商Aは、画廊に保管しておいた自己所有の絵画が盗難に遭ったが、ある日…（**即時取得**） |
| KB2025-p253-q01 | 3 | 甲の所有地に対し、乙が1番抵当権、丙が2番抵当権を有していた場合…（**抵当権の混同**） |
| KB2025-p253-q01 | 4 | 土地の所有者が自己所有地を他人に賃貸して土地を引き渡した場合…（**代理占有**） |

### p.254 (sourcePageQuestion=610, sourcePageAnswer=611) — 6 件

| problemId | seqNo | questionText 先頭 |
|---|---|---|
| KB2025-p254-q01 | 1 | 占有権の譲渡は、占有物を現実に引き渡さなければ… |
| KB2025-p254-q01 | 2 | 代理人が本人のために占有物を占有する意思を表示したときは… |
| KB2025-p254-q01 | 3 | Aが所有する動産戊を保管することをBに寄託し…（**指図による占有移転**） |
| KB2025-p254-q01 | 4 | 土地賃借人である被相続人が死亡した場合…（**占有の相続**） |
| KB2025-p254-q01 | 5 | 権原の性質上占有者に所有の意思がないものとされる場合…（**所有の意思の証明**） |
| KB2025-p254-q01 | 6 | 占有者は、所有の意思をもって、善意、平穏かつ公然に…（**186 条推定**） |

→ **6 件すべて「占有権」の取得・推定・承継**。

### p.255 (sourcePageQuestion=612, sourcePageAnswer=613) — 7 件

| problemId | seqNo | questionText 先頭 |
|---|---|---|
| KB2025-p255-q01 | 1 | 甲が土地を10年間占有した後…（**占有の承継 / 取得時効**） |
| KB2025-p255-q01 | 2 | 占有者が占有物の上に行使する権利は、適法なものであるとみなされる（**188 条**） |
| KB2025-p255-q01 | 3 | 占有者がその占有を妨害されたときは、**占有保持の訴え**… |
| KB2025-p255-q01 | 4 | 占有者がその占有を妨害されるおそれがあるときは、**占有保全の訴え**… |
| KB2025-p255-q01 | 5 | 占有者がその占有を奪われたときは、**占有回収の訴え**… |
| KB2025-p255-q01 | 6 | だまされて任意に自己所有の動産を他人に引き渡した者は、占有回収の訴え… |
| KB2025-p255-q01 | 7 | 占有回収の訴えは、占有を侵奪した者の特定承継人に対して… |

→ **7 件すべて「占有権」の効力・占有訴権**。

### p.258 (sourcePageQuestion=618, sourcePageAnswer=619) — 6 件

| problemId | seqNo | questionText 先頭 |
|---|---|---|
| KB2025-p258-q01 | 1 | 土地の所有者は、隣地の竹木の根や枝が境界線を越えるときは…（**相隣関係**） |
| KB2025-p258-q01 | 2 | 甲土地を所有するAは、境界線から1メートル未満の距離において…（**相隣関係 / 235 条**） |
| KB2025-p258-q01 | 3 | 所有者のない動産または不動産を、所有の意思をもって占有した者は…（**無主物先占**） |
| KB2025-p258-q01 | 4 | Aは、所有者のいない動産を所有の意思をもって占有を始めた場合…（**無主物先占**） |
| KB2025-p258-q01 | 5 | 遺失物は、遺失物法の規定に従い、公告後3カ月以内に…（**遺失物拾得**） |
| KB2025-p258-q01 | 6 | Bの所有する動産がAの所有する不動産に従として付合した場合…（**付合**） |

→ 内容混在: 相隣関係 2 件 + 所有権の取得（先占・拾得・付合）4 件。

---

## 3. Reference heading 確認結果

### 3-1. Source image inventory

```
$ ls images_preprocessed/ | sort | tail -3
0248.png
0249.png
0250.png

$ ls -d images
ls: images: No such file or directory
```

- `images_preprocessed/` 範囲: **0001-0250 のみ**（合計 213 枚、欠番あり）
- `images/` ディレクトリ: **不在**
- 対象 sourcePage: **253 / 254 / 255 / 258** — **全件 image 不在**

Phase 1 design doc (`bukken_taxonomy_normalization_design_20260518.md` line 99-107) と整合: "pages 251〜285 は source image 不在 / 民法 > 物権 は Kindle pages 245〜285 に分布"。

### 3-2. Repo 内代替 source 探索結果

```
$ grep -lE "p25[3-8]|占有保持の訴え|占有訴権" \
    context/ docs/ scripts/ data/ --include="*.md" --include="*.txt" --include="*.json"
```

- OCR text / 参考書見出し OCR / page-anchored heading 抽出: **不在**
- 関連 session (`bukken-ocr-source-check`, `syllabus-section-order-source`) を確認したが、target page (253/254/255/258) の見出し OCR は未捕捉
- 既存の reviewed_import.json 上の sectionTitle は import 元の自動抽出のみで、reference book の見出しと一致する保証なし（design doc §5 で "blocked" 明記）

### 3-3. 推定参考書階層（Phase 1 design doc §3 より、unverified）

```
物権
├── 物権総論
│   ├── 1) 物権的請求権
│   └── 2) 不動産物権変動
├── 物権変動と登記
├── 動産物権変動
│   ├── 1) 対抗要件
│   └── 2) 即時取得
├── 所有権
│   ├── 1) 所有権の限界（相隣関係）
│   ├── 2) 共有
│   └── ...
├── 用益物権
└── 担保物権
```

→ **「占有権」見出しが推定階層に存在しない**。ただしこれは推定であり、reference 直接確認できていない。

---

## 4. Page group 別 patch 判定

| sourcePage | 件数 | 主内容 | 候補 anchor | 判定 | 理由 |
|---|---:|---|---|---|---|
| 253 | 4 | 即時取得2 / 抵当権混同1 / 代理占有1 | （混在） | **UNRESOLVED** | (a) 内容混在、(b) 参考書見出し未確認、(c) 既存 `動産物権変動 2 即時取得` への寄せは page anchor なし |
| 254 | 6 | 占有権の取得・推定・承継 | 占有権（新設候補） | **UNRESOLVED** | 参考書に「占有権」見出しがあるか未確認。images 不在で確認不可。新 section 創設は reference confirm 必須 |
| 255 | 7 | 占有訴権・占有の効力 | 占有権（新設候補） | **UNRESOLVED** | 同上 |
| 258 | 6 | 相隣関係2 / 無主物先占2 / 遺失物1 / 付合1 | （混在） | **UNRESOLVED** | (a) 内容 split、(b) 相隣関係への 2件 寄せは page anchor なし（p.256-257 patch 済とは 1 ページ離れる）、(c) 所有権の取得系 4件 の anchor 不在 |
| **合計** | **23** | | | **patch 0** | |

→ task rule「参考書見出しが確認できない page group は patch しない」「既存 section に無理やり寄せない」適用結果として、4 page group 全件 unresolved。

---

## 5. patch 件数

| 項目 | 件数 |
|---|---:|
| patch した件数 | **0** |
| patch しなかった件数 | **23** |
| 新 section 創設 | **0**（reference 未確認のため判断保留） |
| DATA_VERSION 変更 | **なし** |

---

## 6. unresolved の解消に必要な前提

以下のいずれかが揃った時点で Phase 2 再開可能:

1. **kindle_capture.sh で pages 251-285 を捕捉** → `images_preprocessed/` に 0251.png-0285.png を追加 → OCR で見出し確認 → page 別の見出し anchor 確定
2. **user 直接の参考書見出し共有**: p.253 / p.254 / p.255 / p.258 の参考書見出し名（chapter heading / section heading）を user から提示してもらう
3. **新 section 創設の明示承認**: reference 確認なしで「占有権」section を新設してよい旨を user が明示。ただし taxonomy normalization design (PR #165) の strict 方針からは逸脱

推奨: **1 を先行**。`bash scripts/kindle_capture.sh` で Kindle for Mac を捕捉 → 該当 pages の OCR → 参考書見出しを reference として確定 → Phase 2 を anchor-based で実施。

---

## 7. 検証

| 項目 | 結果 |
|---|---|
| JSON parse（data/public） | 未変更（差分なし） |
| data/public 同期 | byte-identical（差分なし） |
| branch count（data/public） | 2448 不変 |
| answerBoolean count | true:1140 / false:1308 不変 |
| Q/E/sourcePage 系 | すべて未変更（diff 0 行） |
| taxonomy / sectionTitle | **未変更**（patch 0 件のため） |
| 物権総論 件数（minpo-bukken） | 23（変化なし） |
| `git diff --check` | clean |
| `tsc --noEmit` | skip（src 変更なし） |
| `npm run build` | skip（src/data 変更なし） |
| `stash@{0}` | 残存 |

---

## 8. 次 action

- [ ] user に kindle_capture for pages 251-285 を依頼するか、参考書見出しを直接共有してもらう
- [ ] 上記が揃ったら、本 doc の §4 を更新し Phase 2 patch を実行
- [ ] 占有権 section 新設の可否を user が判断（reference に見出し有なら新設、無ければ既存 `所有権` 配下 or 「物権総論 / 占有」など別構造を検討）
