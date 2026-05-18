# 時効 caveated 2件 追加 source recheck

date: 2026-05-18
base: origin/main `bc22807`（PR #167 merged）
scope: `p1_source_check_batch1.md` で caveated とされた 時効 #1, #2 の再確認

参照 docs:
- `p1_source_check_batch1.md`（PR #164 で merge 済み）
- `ai_deep_dive_jikou_problem_mapping_audit.md`

---

## 1. 背景

PR #164 の P1 source-check batch1 で、以下 2 件を **caveated**（推定読み含む）と判定した:
- 時効 audit #1 / KB2025-p240-q01 seq=1
- 時効 audit #2 / KB2025-p240-q01 seq=2

その後の追加検討:
- PR #166 で 時効 #19（answerBoolean fix）処理済み
- PR #167 で B1 textual-only 6 件処理済み（caveated 2 件は除外）

本 recheck では、`images/0240.png`（raw, 3.1MB）を再度高解像度で読み込み、caveat 解消を試みる。

---

## 2. 対象一覧

| audit # | problemId | seqNo | sourcePage | sourcePageQuestion | answerBoolean |
|---|---|---|---|---|---|
| 1 | KB2025-p240-q01 | 1 | 240 | 582 | true |
| 2 | KB2025-p240-q01 | 2 | 240 | 582 | false |

両者とも書籍 p.582-583（image 0240.png）に対応。

### #19 除外確認

時効 #19 = KB2025-p242-q01 seq=6 は本 recheck の対象外。PR #166 で merge 済み（ab false → true、Q/E 修正済み）。

### B1 6件除外確認

PR #167 で merge 済みの 6 件:
- 03_代理 #17 / KB2025-p231-q01 seq=1
- 03_代理 #23 / KB2025-p232-q01 seq=2
- 03_代理 #24 / KB2025-p232-q01 seq=3
- 無効取消 #5 / KB2025-p236-q01 seq=4
- 無効取消 #7 / KB2025-p236-q01 seq=6
- 時効 #8 / KB2025-p241-q01 seq=2

いずれも本 recheck の対象外。data には触らない。

---

## 3. data/public sync 確認

両 caveated 対象とも data と public で `questionText`/`explanationText`/`answerBoolean` 完全一致。

---

## 4. 現状 data Q/E/answerBoolean

### 時効 #1 / KB2025-p240-q01 seq=1（ab=true）

**Q**: 「AがBに対する甲債権の担保として所有の不動産に抵当権を有している場合。**債務者Aには、対抗すべき他人に対する負債がないため**、甲債権が消滅すれば**再び**同一不動産の処分を免れる地位にあるため、甲債権につき消滅時効を援用することができる。」

**E**: 「物上保証人は、当該他人の債務の消滅時効を援用することができる（**民法は条かっこ書**）。したがって、物上保証人は、AのBに対する甲債権につき消滅時効を援用することができる。」

### 時効 #2 / KB2025-p240-q01 seq=2（ab=false）

**Q**: 「Bの詐害行為によってB所有の不動産を取得したCは、AのBに対する甲債権が消滅すれば**法人による前行為が債権者の最終損失になるため**、このような利益は反射的なものにすぎないため、甲債権につき消滅時効を援用することができない。」

**E**: 「判例（最判平16.6.22）によれば、詐害行為の受益者は、詐害行為取消権を行使する債権者の債権の消滅時効を援用することができるとしている。したがって、Bの詐害行為によってB所有の不動産を取得したCも、AのBに対する甲債権につき消滅時効を援用することができる。」

---

## 5. Source image / raw image 確認結果

### 試行

- `images/0240.png`（raw, 3.1MB）を再度全画面で読み込み
- `images_preprocessed/0240.png`（460KB、低解像度）は前回時点で判読困難と確認済み、今回は補助的に参照のみ

### 読取結果

**書籍 #5（時効 #1 / 左 p.582）**:
画像上で読み取れる範囲（推定含む）:
> 5 AがBに対する甲債権の担保として（C所有？／所有？）の不動産に抵当権を有している場合、物上保証人は、AにBに対する債務を負っていない地位にあるが（or 自己はBに対する債務を負っていない地位にあるが）、甲債権が消滅すれば同一不動産の処分を免れる地位にあるため、甲債権につき消滅時効を援用することができる。

**右 p.583 #5 の正答記号**: ○ ✓ data ab=true 一致

**E（右 p.583 #5）**:
> ○ 物上保証人は、当該他人の債務の消滅時効を援用することができる（民法145条かっこ書）。したがって、物上保証人は、AのBに対する甲債権につき消滅時効を援用することができる。

→ **E は exact source-confirmed**。「民法は条かっこ書」→「民法145条かっこ書」が確定（前回 source-check で既に確定済み）。

---

**書籍 #6（時効 #2 / 左 p.582）**:
画像上で読み取れる範囲（推定含む）:
> 6 Bの詐害行為によってB所有の不動産を取得したCは、AのBに対する甲債権が消滅すれば（その詐害行為取消しを免れる地位にあるが？／詐害行為の効果が確定する地位にあるが？）、このような利益は反射的なものにすぎないため、甲債権につき消滅時効を援用することができない。

**右 p.583 #6 の正答記号**: × ✓ data ab=false 一致

**E（右 p.583 #6）**:
> × 判例（最判平16.6.22）によれば、詐害行為の受益者は、詐害行為取消権を行使する債権者の債権の消滅時効を援用することができるとしている。したがって、Bの詐害行為によってB所有の不動産を取得したCも、AのBに対する甲債権につき消滅時効を援用することができる。

→ **E は exact source-confirmed**。data E と書籍 E が完全一致しているため E patch 不要。

---

## 6. Caveat 解消判定

| 対象 | Q caveat 解消 | E caveat 解消 | answerBoolean |
|---|---|---|---|
| 時効 #1 | **No**（中央部「物上保証人の主語・債務負担関係」が image 解像度で完全判読困難） | **Yes**（「民法145条かっこ書」確定、data E 修正候補は前回どおり） | true 一致 ✓ |
| 時効 #2 | **No**（中央部「C の取得地位の効果説明」が image 解像度で完全判読困難） | **Yes**（書籍 E と data E がほぼ一致、patch 不要） | false 一致 ✓ |

### 詳細

- **時効 #1 Q**: 「物上保証人は、AにBに対する債務を負っていない地位にあるが」「自己はBに対する債務を負っていない地位にあるが」のどちらかは image 上で確定できない。これらは法的に同義だが、書籍原文を data に反映する以上、確定文字列が必要
- **時効 #2 Q**: 「その詐害行為取消しを免れる地位にあるが」「詐害行為の効果が確定する地位にあるが」など複数の自然な書き方が考えられ、image だけでは確定不可

→ **両者とも Q caveat は持続**。

---

## 7. 分類

| 対象 | 区分 |
|---|---|
| 時効 #1 Q | **still caveated** |
| 時効 #1 E | **exact confirmed**（前回 source-check 段階で既に確定済み、要 patch） |
| 時効 #2 Q | **still caveated** |
| 時効 #2 E | **exact confirmed but no patch needed**（書籍 E と data E がほぼ一致） |

### 件数

| 区分 | 件数 |
|---|---|
| exact confirmed | 2（#1 E, #2 E） |
| still caveated | 2（#1 Q, #2 Q） |
| blocked / unreadable | 0 |
| **うち answerBoolean 疑い** | **0** |

---

## 8. answerBoolean 疑いの有無

**なし**。両者とも書籍正答記号と data ab が一致:
- 時効 #1: 書籍 ○ / data true ✓
- 時効 #2: 書籍 × / data false ✓

---

## 9. patch 候補

### exact-confirmed patch 候補（小さな batch B2 として実装可）

| 対象 | patch | 内容 |
|---|---|---|
| 時効 #1 E | 軽微 | 「**民法は条かっこ書**」→「**民法145条かっこ書**」（1 語） |
| 時効 #2 E | 不要 | data E は書籍 E とほぼ一致、patch なし |

### still caveated（patch 保留）

| 対象 | 必要な追加確認 |
|---|---|
| 時効 #1 Q | 書籍の Q 中央部「物上保証人の主語・債務関係」を user 物理確認、または高解像度の別 image 入手 |
| 時効 #2 Q | 書籍の Q 中央部「C の取得地位効果説明」を user 物理確認、または高解像度の別 image 入手 |

---

## 10. 次の patch design に進める対象

**新規発見**: **時効 #1 E の「民法145条かっこ書」のみは exact-confirmed**。
→ 1 行 patch で対応可能。B2 micro-patch として実装するか、Q caveat 解消を待ってまとめるかの判断は次タスクで。

### Q caveat 解消の選択肢

| 選択肢 | 内容 |
|---|---|
| A | user が物理書籍 / Kindle 端末で Q 中央部を直接読み取り、確定文字列を提供 |
| B | スクリーンキャプチャを再撮影（高 dpi）してより明瞭な image を取得 |
| C | 諦めて現状の崩れた Q のまま継続。E のみ patch |
| D | 推定文字列で patch するが、「inferred」と doc に明記し、後日訂正余地を残す |

推奨は **A or B**（物理書籍 / 高解像度 image）。**D（推定 patch）は禁止**（推定を data に焼くのは過去のセッション方針に反する）。

---

## 11. blocked / caveated 理由

- 両 Q とも、書籍中央部の文字が image の resolution / typeset / OCR 由来の判読困難領域に位置している
- raw image（3.1MB）でも outer structure は読めるが、具体的助詞・主語確定に必要な精度に届かない
- 推定で patch すると、書籍と異なる文言を data に焼き付ける副作用がある

---

## 12. #19 除外確認

時効 #19（KB2025-p242-q01 seq=6）は本タスクで一切触らず。PR #166 後の状態（ab=true、Q「法定代理人がないとき」）が維持されている。

---

## 13. B1 6件除外確認

PR #167 で merge 済みの 6 件は本タスクで一切触らず。data には patch 済みの状態が維持されている。

---

## 14. 変更しなかったもの

- data/reviewed_import.json
- public/data/reviewed_import.json
- src/lib/db.ts（DATA_VERSION 含む）
- src/ 全般
- 他 chapter / 他 problem
- Q / E / answerBoolean / sourcePage / questionType
- stash@{0}

---

## 15. stash@{0} 残存確認

```
stash@{0}: WIP on main: 9c3793d docs: record descriptive ui re-qa (#141)
```
本タスク前後で touch せず、apply/drop なし。

---

## 16. 検証結果

| 項目 | 結果 |
|---|---|
| 対象 2 件 同定 | OK |
| data/public sync | OK（両者 sync） |
| #19 / B1 6件 除外 | OK |
| `git diff --check` | clean（docs 追加のみ） |
| `tsc --noEmit` | 該当変更なしのため未実施（src 未変更） |
| stash@{0} | 残存、未変更 |

---

## 17. 次のステップ（提案）

1. **本 recheck doc を docs-only で commit / PR / merge**（足場固定）
2. **時効 #1 E の単独 micro-patch**（「民法は条かっこ書」→「民法145条かっこ書」、E 1 語のみ）
3. **時効 #1, #2 Q の物理確認依頼**（user 側で書籍 / Kindle 端末から確定文字列取得）
4. Q 確定後に B3 textual batch で実装

---

## 注意事項

本 doc は MD を source of truth とする。HTML 版は閲覧用 snapshot であり、直接編集してはならない。
