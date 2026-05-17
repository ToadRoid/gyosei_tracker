# P0 textual-only patch design — source-confirmed 6 problems

date: 2026-05-18
base: origin/main `1d62f69` (PR #156 merged)

scope: questionText / explanationText の置換設計のみ。
**answerBoolean 変更を含む時効 #17 は対象外**（別 PR で単独実施）。

参照する source-check docs:
- [p0_source_check_03_dairi_ai_deep_dive.md](p0_source_check_03_dairi_ai_deep_dive.md)
- [p0_source_check_muko_torikeshi_ai_deep_dive.md](p0_source_check_muko_torikeshi_ai_deep_dive.md)
- [p0_source_check_jikou_ai_deep_dive.md](p0_source_check_jikou_ai_deep_dive.md)

---

## 結論サマリー

| # | target | answerBoolean | Q patch | E patch | 確度 | 同一 PR 可 |
|---|---|---|---|---|---|---|
| **A1-1** | 03_代理 #15 / KB2025-p230-q01 seq=6 | 不変（false） | 必須 | 必須 | **exact source-confirmed** | ✅ |
| **A1-2** | 03_代理 #30 / KB2025-p233-q01 seq=3 | 不変（true） | 必須 | 不要 | **exact source-confirmed** | ✅ |
| **A1-3** | 無効・取消し #2 / KB2025-p236-q01 seq=1 | 不変（false） | 不要 | 必須 | **exact source-confirmed** | ✅ |
| **A1-4** | 無効・取消し #8 / KB2025-p237-q01 seq=1 | 不変（true） | 必須 | 必須 | **exact source-confirmed** | ✅ |
| **A1-5** | 時効 #21 / KB2025-p244-q01 seq=2 | 不変（false） | 必須 | 必須 | **exact source-confirmed** | ✅ |
| **A2** | **時効 #5 / KB2025-p240-q01 seq=5** | 不変（false） | 必須 | 必須 | **caveated（推定読み含む）** | ❌ **blocked** |

**重要判断**:
- A1（5 problems）: **exact source-confirmed**。1 PR でまとめて patch 可能
- A2（時効 #5）: Q 中央部「これを乙建物賃借人Cに賃貸している場合に」と E の「建物の所有者」vs「建物の賃借人」は image 解像度に基づく推定的読み取り。**追加 source 確認まで blocked**

→ 対象 5 件で「**全 replacement が exact source-confirmed**」を満たす。1 PR でまとめる方針可。

---

## A1-1: 03_代理 #15 / KB2025-p230-q01 seq=6

### Identification
- problemId: `KB2025-p230-q01`
- seqNo: `6`
- sourcePage: 230 / sourcePageQuestion: 562 / sourcePageAnswer: 563
- subjectCandidate: `minpo` / chapterCandidate: `minpo-sosoku` / sectionTitle: `03_代理`

### Sync 確認
- data/reviewed_import.json と public/data/reviewed_import.json は完全 sync（前 audit で確認）

### answerBoolean
- 現在: `false`
- patch 後: `false`（**不変**）

### Q patch（必須）

**Current**:
> 債務者が本人の意思を第三者に表示する場合、その意思表示に錯誤があったか否かは、本人を基準に判断する。

**Replacement (exact source-confirmed)**:
> 使者が本人の意思を第三者に表示する場合、その意思表示に錯誤があったか否かは、使者を基準に判断する。

差分: `債務者` → `使者`（2 箇所、主語と判断基準）、`本人を基準` → `使者を基準`

### E patch（必須）

**Current**:
> 誤意思表示は本人のもとで完結しているから、債権者は単に相手方に表示するだけだからである。

**Replacement (exact source-confirmed)**:
> 使者が本人の意思を第三者に表示する場合、その意思表示に錯誤があったかどうかは、本人を基準に判断する。意思決定は本人のもとで完了しており、使者はこれを相手方に表示するだけである。

差分: 全文置換（書籍 E は冒頭文 + 補足文の 2 文構成）

---

## A1-2: 03_代理 #30 / KB2025-p233-q01 seq=3

### Identification
- problemId: `KB2025-p233-q01`
- seqNo: `3`
- sourcePage: 233 / sourcePageQuestion: 568 / sourcePageAnswer: 569
- subjectCandidate: `minpo` / chapterCandidate: `minpo-sosoku` / sectionTitle: `03_代理`

### Sync 確認
- data/public 完全 sync

### answerBoolean
- 現在: `true`
- patch 後: `true`（**不変**）

### Q patch（必須）

**Current**:
> Bが何の代理権もないのにAの代理人だと偽ってAから預かった絵画をCに売却し、その後にAがBを ratify したときは、AはBの行為につき追認を拒むことができる。

**Replacement (exact source-confirmed)**:
> Bが何の代理権もないのにAの代理人だと偽ってAから預かった絵画をCに売却し、その後にAがBを相続したときは、AはBの行為につき追認を拒むことができる。

差分: `ratify` → `相続`（1 単語置換）

### E patch
**不要**（書籍 E と現状 data E がほぼ一致、軽微な読点差のみで実害なし）

---

## A1-3: 無効・取消し #2 / KB2025-p236-q01 seq=1

### Identification
- problemId: `KB2025-p236-q01`
- seqNo: `1`
- sourcePage: 236 / sourcePageQuestion: 574 / sourcePageAnswer: 575
- subjectCandidate: `minpo` / chapterCandidate: `minpo-sosoku` / sectionTitle: `04_無効・取消し・条件・期限`

### Sync 確認
- data/public 完全 sync

### answerBoolean
- 現在: `false`
- patch 後: `false`（**不変**）

### Q patch
**不要**（書籍 Q と現状 data Q は完全一致）

### E patch（必須）

**Current**:
> 制限行為能力者の返還義務の範囲を現存利益に限定した民法121条の2第3項は限定後に、制限行為能力者が追認する場合、相手方により適用されない。制限行為能力者が自己の行為を取り消した場合は、「相手方」は原則として無効用義務（121条の2第1項）、善意であれば現存利益の返還義務（121条の2第3項）を負う。

**Replacement (exact source-confirmed)**:
> 制限行為能力者の返還義務の範囲を現存利益に限定した民法121条の2第3項後段は、制限行為能力者保護のための規定であるから、相手方には適用されない。制限行為能力者が自己の行為を取り消したときは、「相手方」は原則として原状回復義務（121条の2第1項）、善意であれば現存利益の返還義務（121条の2第3項）を負う。

差分:
- 第1文を書籍原文どおりに書き直し（「121条の2第3項は限定後に、制限行為能力者が追認する場合、相手方により適用されない」→「121条の2第3項後段は、制限行為能力者保護のための規定であるから、相手方には適用されない」）
- 「無効用義務」→「原状回復義務」

**注意**: 書籍の「善意であれば現存利益の返還義務（121条の2第3項）」の法的記述は維持する。書籍の法的解釈の改変は行わない。

---

## A1-4: 無効・取消し #8 / KB2025-p237-q01 seq=1

### Identification
- problemId: `KB2025-p237-q01`
- seqNo: `1`
- sourcePage: 237 / sourcePageQuestion: 576 / sourcePageAnswer: 577
- subjectCandidate: `minpo` / chapterCandidate: `minpo-sosoku` / sectionTitle: `04_無効・取消し・条件・期限`

### Sync 確認
- data/public 完全 sync

### answerBoolean
- 現在: `true`
- patch 後: `true`（**不変**）

### Q patch（必須）

**Current**:
> AはBの強迫によって、自己所有の甲土地をBに売却する旨の契約を締結したが、その後Bに対する追認の撤回もないためで取消しの意思表示をしないまま10年が経過した。このような場合であっても、AはBの強迫を理由として本件売買契約を取消すことができる。

**Replacement (exact source-confirmed)**:
> AはBの強迫によって、自己所有の甲土地をBに売却する旨の契約を締結したが、その後もBに対する畏怖の状態が続いたので取消しの意思表示をしないまま10年が経過した。このような場合であっても、AはBの強迫を理由として本件売買契約を取り消すことができる。

差分:
- 「その後Bに対する追認の撤回もないためで」→「その後もBに対する畏怖の状態が続いたので」
- 「取消すことができる」→「取り消すことができる」（送り仮名統一）

### E patch（必須）

**Current**:
> 取消権は、追認をすることができる時（取消の原因となっていた状況が消滅した後：民法124条1項参照）から５年間行使しないときは、時効によって消滅する（126条前段）。

**Replacement (exact source-confirmed)**:
> 取消権は、追認をすることができる時（取消しの原因となっていた状況が消滅した後：民法124条1項参照）から5年間行使しないときは、時効によって消滅する（126条前段）。本肢では、「追認をすることができる時」に該当する状況がないため、取消権の時効消滅しておらず、Aは売買契約を取り消すことができる（96条1項）。

差分:
- 「取消の」→「取消しの」
- 「５年間」→「5年間」（半角数字統一）
- 結論文の追加: 「本肢では、…取り消すことができる（96条1項）。」

---

## A1-5: 時効 #21 / KB2025-p244-q01 seq=2

### Identification
- problemId: `KB2025-p244-q01`
- seqNo: `2`
- sourcePage: 244 / sourcePageQuestion: 590 / sourcePageAnswer: 591
- subjectCandidate: `minpo` / chapterCandidate: `minpo-sosoku` / sectionTitle: `06_時効`

### Sync 確認
- data/public 完全 sync

### answerBoolean
- 現在: `false`
- patch 後: `false`（**不変**）

### Q patch（必須・全文置換）

**Current**:
> AがBに電化製品を売却し、Bの任意の支払方法によ  き、数回の期日の分割して弁済するとの明示の利息支払約束がないでした場合、Bが1回でも支払を怠ればAの請求により前後に残債務全部弁済するときは時効が成立する。

**Replacement (exact source-confirmed)**:
> AがBに電化製品を売却し、Bの代金の支払方法につき、数回の期日に分割して弁済する旨の期限の利益喪失約款を付けた場合、Bが1回でも支払を怠ればAの請求により残債務全額を弁済する約定があるときは、残債務全額の消滅時効は、Bが支払を怠った時から進行する。

差分: 3 箇所の重度 parser hallucination 領域を書籍原文で全置換

### E patch（必須・全文置換）

**Current**:
> 判例（最判昭42.6.23）において、割賦の利益支払約定が付与しされ契約の期から1回関内支払の不履行があっても、何ら減免減量との評定がされている場合には非実行する。債権者が残務債務の消を求める言ありのお意表示をしたとき限り、その時から残余金額について消滅時効が進行するとしている。

**Replacement (exact source-confirmed)**:
> 判例（最判昭42.6.23）は、期限の利益喪失約款付契約の場合、1回の割賦金支払の不履行があっても、各部割賦金額について約定弁済期間の到来ごとに順次消滅時効が進行し、債権者（A）が特に残債務全額の弁済を求める旨の意思表示をしたとき限り、その時から残債務全額について消滅時効が進行するとしている。

差分: E 全文 parser hallucination を書籍原文で置換

---

## A2: 時効 #5 / KB2025-p240-q01 seq=5（**blocked**）

### Identification
- problemId: `KB2025-p240-q01`
- seqNo: `5`
- sourcePage: 240 / sourcePageQuestion: 582 / sourcePageAnswer: 583
- subjectCandidate: `minpo` / chapterCandidate: `minpo-sosoku` / sectionTitle: `06_時効`

### Sync 確認
- data/public 完全 sync

### answerBoolean
- 現在: `false`
- patch 後: `false`（**不変**、書籍 × と一致）

### Caveat 詳細

source-check log（p0_source_check_jikou_ai_deep_dive.md）で記録した caveat:

**Q 中央部**:
- 推定読み: 「これを乙建物賃借人Cに賃貸している場合に」
- image 上の判読困難領域。書籍の論点（A=不法占拠者・建物所有者、C=賃借人）から合理的に推定したが、**exact source-confirmed ではない**

**E 主体識別**:
- 推定読み: 書籍 E の「直接利益を受けるのは『建物の所有者』」
- image 上は「建物の所有者」vs「建物の賃借人」のいずれかが判読困難。判例（最判昭44.7.15）の法的に正しい構造から推定したが、書籍自体の文言が異なる可能性も残る

### 判定: **blocked**

- exact source-confirmed ではない箇所が複数ある
- 推定読みのまま patch すると、書籍と異なる文言を導入するリスク
- → A1 batch には含めない

### 次アクション

**user による物理原本（Kindle 拡大）での再確認**を別タスクで実施。再確認後に exact source-confirmed が得られれば A1 同等の patch design に移行。

---

## #17 の扱い（除外）

時効 #17 / KB2025-p242-q01 seq=4 は **本 design の対象外**。

理由:
- answerBoolean を `false → true` に変更する必要がある
- 変更影響範囲が異なる（学習者の既往回答記録の正誤判定が遡及的に変わる）
- 単独 PR で別承認・別 review プロセスが必要

→ **時効 #17 は別 design / 別 PR**として扱う（次々タスク）。

---

## Patch 実装 plan（A1 5 件まとめ）

### Patch 範囲

| target | data field | public field |
|---|---|---|
| A1-1 | questionText, explanationText | questionText, explanationText |
| A1-2 | questionText | questionText |
| A1-3 | explanationText | explanationText |
| A1-4 | questionText, explanationText | questionText, explanationText |
| A1-5 | questionText, explanationText | questionText, explanationText |

### 触らないもの

- answerBoolean（全 5 件不変）
- sourcePage / sourcePageQuestion / sourcePageAnswer
- subjectCandidate / chapterCandidate / sectionTitle
- questionType
- 他の branch（同じ originalProblemId 内の他 seqNo は触らない）
- 他の page

### DATA_VERSION bump 判断

**結論**: **bump 必須**

理由:
- 既存ユーザーの IndexedDB には parser hallucination されたテキストが入っている
- `refreshProblemDataIfNeeded` は DATA_VERSION の変更時のみ re-import を trigger
- DATA_VERSION を bump しないと、修正したテキストが既存ユーザーに反映されない（新規ユーザー or IndexedDB clear したユーザーのみ反映）
- → 学習被害を解消するには DATA_VERSION bump 必須

bump 案: `2026-05-18-p0-textual-fix-a1` のような日付＋目的形式（既存規約に従う）

### import 実行判断

- patch PR では import 実行不要
- DATA_VERSION bump 後、ユーザーのブラウザログイン時に AuthProvider 経由で自動的に refreshProblemDataIfNeeded → importParsedBatch が走る
- importParsedBatch の安全性（既知バグ: フラグ消失、subjectId 空保存）は本タスクの範囲外

### 実装手順案（patch PR で実施、本 design は実施しない）

1. data/reviewed_import.json で 5 件の branch を順次編集
2. public/data/reviewed_import.json で同一 5 件を同期編集
3. src/lib/db.ts の `DATA_VERSION` を bump
4. tsc / build / git diff --check で安全確認
5. git diff で「該当 branch の questionText / explanationText 以外に変更がない」ことを確認
6. answerBoolean 列が変更されていないことを grep で確認
7. PR 作成 / Vercel 確認 / merge

### Verification plan（patch PR で実施）

| 検証項目 | 方法 |
|---|---|
| 変更ファイル数 | 3（data, public, db.ts） |
| 変更 branch 数 | 5 |
| answerBoolean 変更 | 0 |
| sourcePage / sourcePageQuestion / sourcePageAnswer 変更 | 0 |
| subjectCandidate / chapterCandidate / sectionTitle 変更 | 0 |
| data/public sync | grep で 5 件の Q/E が両ファイル一致 |
| DATA_VERSION bump | src/lib/db.ts で確認 |
| tsc | pass |
| build | pass |
| git diff --check | pass |
| stash@{0} 残存 | 確認 |
| 他 page / 他 branch 変更 | 0 |

---

## 停止判定

| 停止条件 | 該当 |
|---|---|
| source-check doc に replacement がない | 該当せず |
| source-confirmed ではなく推定読みしかない | **該当（A2 = 時効 #5 のみ）** → blocked 判定で対処 |
| data/public が同期していない | 該当せず（全 5 件 sync OK） |
| target problem の同定にズレ | 該当せず（6/6 confirmed） |
| answerBoolean 変更が必要になった | 該当せず（A1 5件は全て ab 不変） |
| #17 が混入しそう | 該当せず（明示的に除外） |
| data patch を実行したくなった | 該当せず（design のみ） |

→ A1 batch（5 件）は **patch design 確定**。次の data patch PR に進める。

A2（時効 #5）は **blocked**。別 source 再確認後に再評価。

---

## 次のステップ（提案、要承認）

1. **本 design doc を docs-only で commit / PR / merge**（足場固定）
2. **A1 5件まとめ data patch PR**: 上記 implementation plan + verification plan に従って実施
3. **時効 #5 の追加 source 確認**: user による Kindle 拡大確認、または別タスク
4. **時効 #17 単独 PR**: answerBoolean 変更を含む別 PR

---

## 禁止事項確認

- [x] data/reviewed_import.json 修正なし
- [x] public/data/reviewed_import.json 修正なし
- [x] answerBoolean 変更なし
- [x] questionText 変更なし
- [x] explanationText 変更なし
- [x] src 修正なし（DATA_VERSION bump 含む）
- [x] import 実行なし
- [x] DATA_VERSION bump 実行なし（要否のみ判断）
- [x] stash apply/drop なし
- [x] padding 調整なし
- [x] 推定による replacement 確定なし（A2 は blocked 判定）
- [x] commit / push / PR なし
