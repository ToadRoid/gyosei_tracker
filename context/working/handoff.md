# handoff — 次セッション引き継ぎ

最終更新: 2026-04-22 (**v98 polarity hotfix**：`p006-q01 seq2` の `answerBoolean` を True → False に単独 flip。現 DB が Q「留保あり、司法審査は及ばない」/ E「留保は付されていない」で自己矛盾していたため、polarity のみ先行修正。**Q / E は未修正維持**。理由：p006 原本画像（`images/0006.png` / `images_preprocessed/0006.png`）が repo 内に未存在で、Q/E の verbatim restore は「推測禁止 / repo 実状態優先」ルールに抵触するため保留。**二層表現採用**：層 1 = polarity hotfix（ans flip 完了）／ 層 2 = Q/E verbatim restore 保留（原本画像到着待ち）。他 seq (1/3/4) 完全不変、他 seq の hash 変化なし確認済。DATA_VERSION v97 → v98 bump。)

post-merge 追加更新: 2026-04-22 (**handoff-only 更新 = v98 merge SHA backfill + p006 source 存在ログ**, data 変更なし / DATA_VERSION bump なし / v98 維持): v98 squash merge SHA = `671eb79f622bb797ec78b2c97788edba9ebe7b54`（PR #62）を `latest data merge` / `latest main HEAD at handoff edit time` / 直近 data merge 履歴の 3 箇所に backfill。同時に **p006 source 存在ログ**を追加：`~/Desktop/kindle_shots/0006.png`（kindle_capture.sh の OUTDIR デフォルト）に DB `p006` 対応の書籍見開き（書籍 p.116-117「裁判所」section の統治行為小項目）が scan されていることを確認（画像左ページ A 2段目 = seq2 Q 冒頭「内閣による衆議院の解散は、高度の政治性を有する国家行為であるから」が一致、右ページ 12 番が苫米地事件 E の原本）。**ただし現物は低解像度の見開き 1 枚**ゆえ「source existence の確認には使えるが、verbatim restore の根拠としては不十分」(user directive 2026-04-22)。**方針（固定）**: local-only 運用ではなく repo に source を残す。ただし **低解像度 0006.png のみを根拠に本文修正はしない**。**B1-B4 frozen 解除条件を「原本画像 repo 追加」→「高解像度 recrop 収載」に更新**。優先順 `B2 → B3 → B1 → B4` は維持、p006 は高解像度 source 収載まで frozen 扱い。

post-merge 追加更新 #2: 2026-04-22 (**p006 source 収載 = B 群 frozen 解除**, data 変更なし / DATA_VERSION bump なし / v98 維持): Claude 自力で p006 高解像度 source を作成し `images_preprocessed/0006.png` に収載（6048x3536, 390KB, 既存 B5 `0090.png` / B6 `0118.png` と同仕様）。**作成経路**: 既存 local raw `~/Desktop/kindle_shots/0006.png`（3024x1768, 2x 前の未 preprocess 版）を `scripts/preprocess_images.py` に通して生成（2x upscale + grayscale + CLAHE + 二値化 + 傾き補正 + 余白除去 + シャープ化の既存 OCR 前処理 pipeline、既存 tracked と同一手順）。**user 手作業不要**（ユーザー directive 2026-04-22 「Claude 側で自力実行を試す」に応答）。**帰結**: B1-B4 の frozen 解除、優先順 `B2 → B3 → B1 → B4` で verbatim restore に着手可能。ただし既存 B5/B6 と同仕様ゆえ、既存 `closed to limit of source quality` と同様に **一部 fragment が ERROR_UNREADABLE_SOURCE 残置になる可能性は継続**（layer 2 = 原本逆算禁止 / future high-res recrop candidate only の運用継続）。**v98 polarity hotfix との整合**: 画像で苫米地事件（行 13）解説末尾に「『一見極めて明白に違憲無効と認められる場合を除き』という留保は付されていないという本肢は誤っている」と明記されており v98 の ans=False polarity は維持で整合。**Q / E の verbatim restore は本 PR では行わない**（scope = image addition + handoff 更新のみ、restore は次 PR v99 で実施予定）。

直前: v97 (B 群 active #2 = B6 `p118-q01 seq1 E` closed to limit of source quality、B 群 active 完走、二層表現採用、`7171dac` PR #58 + SHA backfill `424fbc5` PR #59) → **別領域移行 #1 = `importParsedBatch` 分類継承バグ部分修正**（PR #60、data 変更なし / v97 維持）→ **v98 polarity hotfix**（PR #62, `671eb79`）→ **本 handoff-only 更新**（post-v98-merge SHA backfill + p006 source 存在ログ, data 変更なし / v98 維持）。

**本ファイル単体で引き継ぎが成立することを目標にする**。repo 外 memory は補助扱い。

## 現在地（confirmed, 2026-04-22 post-v98-merge + PR #63 merged + p006 source 収載）

* **latest data merge**: `671eb79f622bb797ec78b2c97788edba9ebe7b54`（v98 squash merge, PR #62, B2 `p006-q01 seq2` ans polarity hotfix = True → False single byte flip、Q/E 未修正維持）/ 直前の merged v## = v97 (`7171dac9ad13a92fa051da26d9110ac5d8f3c74e`, PR #58, B6 closed to limit of source quality = **B 群 active 完走**)
* **latest main HEAD at handoff edit time**: `0c6ea3beffcd4daa64cb432c5b7e6b968e804a98`（PR #63 squash merge = post-v98-merge handoff-only SHA backfill + p006 source 存在ログ、本 PR 編集時の repo 先端。v99 SHA backfill は次の実作業 PR = B2 seq2 restore に同梱予定）
* **総ページ**: 239 / **総肢**: 1312（不変）
* **DATA_VERSION**: `2026-04-22-audit-v98-p006-q01-seq2-ans-polarity-hotfix`（本 PR で v97 → v98 bump。`p006-q01 seq2` の ans のみ True → False、Q / E は未修正）
* **L1 本線**: ✅ 実質完了維持
* **直近 data merge 履歴**: v88 (PR #43, `bd45bd7`) → v89 (PR #44, `2305dad`, A1) → v90 (PR #45, `e2321a9`, A2) → v91 (PR #47, `c9fe732`, A3) → v92 (PR #49, `ece5d89`, A4) → v93 (PR #51, `075e4a2`, A5) → v94 (PR #54, `54ec51f`, A6) → v95 (PR #55, `95a50f9`, A7 = A 群完走) → v96 (PR #57, `a076e59`, B5) → v97 (PR #58, `7171dac`, **B6 = B 群 active 完走**) → v98 (PR #62, `671eb79`, **B2 polarity hotfix のみ = Q/E 保留**)
* **付随 sync PR**: PR #46 (`8b8c3b0`) / PR #48 (`a2b2611`) / PR #50 (`8286ebb`) / PR #52 (`d161966`) — 旧「都度 mainHEAD sync」運用の痕跡（PR #53 で廃止、v94 以降は新方針で運用）
* **運用（2026-04-20 PR #53 で確立、v94 = PR #54 で初適用、本 PR で 2 サイクル目）**:
  - `latest data merge` = **最新の v## restore PR の squash merge commit**（data 到達点。SHA 確定は merge 後で、**本 PR のように進行中は PR # で参照し SHA は次 handoff 編集で補完**。次の v## restore までは stable）
  - `latest main HEAD at handoff edit time` = **handoff 編集時点の repo 先端**の snapshot（merge 後 stale 化するが意図的に許容）
  - **sync PR は起票しない**。v## restore PR 1 本で両フィールドを更新し、commit 時点の snapshot として閉じる

### v76 差分（v75 → v76）

| PR  | v   | 種類              | 範囲                                         | 件数                 |
| --- | --- | --------------- | ------------------------------------------ | ------------------ |
| #30 | v76 | polarity + Q文復元 | p238-q1 (seq1, 書籍Q6), p238-q2 (seq2, 書籍Q7) | 2 flips + Q 文 3 箇所 |

内訳:

* **p238-q1 (seq1, 書籍Q6)**: 停止条件結語 `無効 → 無条件`、`ans false → true`（民法131条1項）
* **p238-q2 (seq2, 書籍Q7)**: `〇〇法律行為 → その法律行為` OCR 復元、解除条件結語 `無効 → 無条件`、`ans false → true`（民法131条2項）

確認経路: `0238.png` vision + Gemini OCR + 民法131条 1項/2項 条文整合、3経路一致。

### v76 で close 済み

* ~~p238-q1 / q2 原本再照合~~ → v76 で確定 close

### v77 差分（2026-04-19）

* **PR #31 / p238-q2 explanation**: `民法132条2項 → 民法131条2項`（条文番号 typo 修正、polarity 非影響）

### v78 差分（2026-04-19）

* **PR #32 / p227 seq1/seq2/seq3**:
  * seq1: `ans false → true`（強迫取消は善意無過失第三者に対抗可、96条3項、explanation 自己整合）
  * seq2: `sectionTitle 03_代理 → 02_意思表示と瑕疵`（drift のみ、polarity 非影響）
  * seq3: `ans true → false`（98条の2 は意思能力欠如/未成年者/成年被後見人 限定、Q「制限行為能力者」overbroad）

確認経路: 0227.png 原本 + 条文整合 + DB 内 explanation 自己整合の 3 経路一致。

### v81 差分（2026-04-20）

* **PR #36 / p219-q01 seq3 Q**: OCR 復元（Q text のみ、polarity 非影響）
  * event: `Aが結婚の式授挙` → `Aの船舶の沈没事故`
  * 請求者: `Aの実父の請求` → `Aの妻の請求`
  * ans=false 維持（特別失踪 30条2項/31条：危難が去った時、Q「7年経過」主張を否定）

確認経路: 0219.png 原本（Claude vision, page 541 Q4 = DB seq3） + 民法30条2項/31条整合 + 既存 explanation「本肢は特別失踪」自己整合 の 3 経路一致。

### v82 差分（2026-04-20）

* **PR #37 / p227-q01 seq2 substantive restore**（Q + E + polarity 1 PR bundled）
  * 現 DB が Q / E / ans 相互矛盾のため、単独修正では壊れた中間状態になる → 原本復元として束ねて修正
  * Q 強迫者: `AがBの強迫` → `DがAに強迫`（第三者強迫 scenario）
  * Q 中盤 garble: `知ることができる適当先がなかった` → `知ることができなかったことにつき善意無過失であった`
  * Q 結語: `取り消すことができない` → `取り消すことができる`
  * ans: `false → true`
  * E: `Bが善意の場合であっても、AはBの強迫` → `BがDの事実につき善意無過失であっても、AはDの強迫`
  * scope: seq2 のみ。seq3 E は別 pending 項目として温存

確認経路: 0227.png 原本（Claude vision, page 556 Q7 = DB seq2、page 557 右列 7 ○） + 民法96条2項対照（詐欺との対比、強迫は第三者強迫でも取消可） + DB 内 E 前段「第三者が強迫をした場合であっても」自己整合 の 3 経路一致。

### v83 差分（2026-04-20）

* **PR #38 / p227-q01 seq3 E high-confidence restore**（E text のみ、polarity 非影響、高信頼4箇所）
  * 冒頭: `意思能力を有していた` → `意思能力を有しなかった`
  * 98条の2 結語: `対抗することができる` → `対抗することができない`
  * 4類型列挙: `被後見人、被補助人、被補佐人` → `被後見人、被保佐人、被補助人`（条番号順 + 保佐の正字）
  * 結語ペア重複: `成年被後見人と成年被後見人` → `未成年者と成年被後見人`
  * **保留（低信頼）**: 条文引用 `13歳2項110号` → 画像 digit 読み切れず未修正、OCR pending に残存

確認経路: 0227.png 原本（Claude vision, page 557 右列 row 1 ×） + 民法98条の2 本文条文整合（意思能力なし/未成年者/成年被後見人 限定） + DB 内 Q「制限行為能力者」overbroad + ans=false（v78 close 済み）自己整合 の 3 経路一致。

### v84 差分（2026-04-20）

* **PR #39 / p062-q01 seq7 Q+E restore**（文末欠落復元 + OCR 誤字訂正、polarity 非影響）
  * Q OCR 誤字: `移動者が自主的に除却しない` → `義務者が自主的に除却しない`
  * Q 文末欠落: `行政の...` → `行政庁が義務者に代わって除却する行為は、行政法理論上、「即時強制」にあたる。`
  * E 文頭: `前提としないことから` → `前提としないところ`
  * E 文末欠落: `代替的作為義務を執行するもので、...` → `…代替的作為義務は義務者本人でなくても他人が代わって履行することができ、現に行政の職員が行っている。それゆえ、かかる行為は代執行である（行政代執行法2条）。`
  * ans=false 維持（本肢は代執行に該当するため「即時強制」と断定する記述は誤り）
  * scope: p062-q01 seq7 のみ

確認経路: images/0062.png 原本（Claude vision, book p226-227 行9、section 即時強制） + 行政代執行法2条（代替的作為義務の代執行）との整合 + DB 内 ans=false 自己整合 の 3 経路一致。

### v85 差分（2026-04-20）

* **PR #40 / p078-q01 seq4 Q+E restore**（OCR 誤字 + 文末欠落復元 + E substantive garble 復元、polarity 非影響）
  * Q 送り仮名: `手続 → 手続き`
  * Q 文末欠落: `とら… → とらなければならない。`
  * E 表記統一: `名宛人 → 名あて人`
  * E OCR 誤: `申請以外の者 → 申請者以外の者`
  * E OCR garble: `見張り機会を提供できる公聴会 → 意見を聴く機会である公聴会`
  * ans=false 維持（行政手続法13条1項は意見陳述の手続＝聴聞または弁明、公聴会ではない）
  * scope: p078-q01 seq4 のみ、Q+E 束ね（同一 seq・同一原本行、v84 と同方針）
  * handoff pending queue には Q のみ記録だったが、原本読取時に E substantive garble 3箇所を発見し束ねて修正

確認経路: images/0078.png 原本（Claude vision, book p258-259 行4、section 不利益処分） + 行政手続法13条1項（意見陳述の手続）+ 10条（公聴会は申請処分側の手続） + DB 内 ans=false 自己整合 の 3 経路一致。

### v86 差分（2026-04-20）

* **PR #41 / p119-q01 seq1 substantive restore**（Q + E + polarity 1 PR bundled、**polarity flip true→false**）
  * 現 DB が Q 中盤 OCR garble ＋ Q 文末欠落 ＋ ans 誤り（処分庁/他行政庁の採るべき措置が原本と逆）で相互矛盾のため、v82 precedent に倣い Q/E/ans 束ねて原本復元
  * Q 復元（全面置換）: `行政庁が処分を行う際に教示をしなかった場合、当該処分庁に不服申立書を提出することができ、当該処分が処分庁に審査請求をすることができるものであったときは、処分庁は、速やかに、当該不服申立書を当該処分庁以外の行政庁に送付しなければならないのに対して、当該処分が処分庁以外の行政庁に審査請求をすることができるものであったときは、不服申立書の提出時に初めから適法な審査請求がされたものとみなされる。`
  * ans: `true → false`（polarity flip）
  * E 復元（条文引用を 83条1項/3項/4項/5項 に整理）: `行政庁が処分を行う際に教示をしなかった場合、処分庁に不服申立書を提出することができる（行政不服審査法83条1項）。処分が処分庁に審査請求できるものであったときは不服申立書提出時に適法な審査請求がされたものとみなされ（同条5項）、処分庁以外の行政庁に審査請求をすることができるものであったときは、処分庁は当該処分庁以外の行政庁に不服申立書を送付し（同条3項）、初めから裁決等をする権限庁に不服申立てがあったものとみなされるため（同条4項）、採るべき措置が逆である本肢は誤っている。`
  * scope: p119-q01 seq1 のみ

確認経路: images/0119.png 原本（Claude vision, 教示をしなかった場合の救済 section） + 行政不服審査法83条1項/3項/4項/5項（2014改正後条番号、処分庁と他行政庁への審査請求それぞれの帰結）との整合 + DB 内 E 後半「本肢は誤っている」自己整合 の 3 経路一致。

### v87 差分（2026-04-20）

* **PR #42 / p136-q01 seq4 Q+E restore**（Q/E 両方に substantive garble + 文末欠落、polarity 非影響）
  * Q 中盤 substantive garble: `その審査請求は違法なもの` → `その審査請求は適法なもの`
  * Q 文末欠落: `却下裁決に対する... ` → `却下裁決に対する取消訴訟を提起すべきこととなる。`
  * E 冒頭 substantive garble: `違法な審査請求に対する裁決を経ない取消訴訟を提起できない` → `適法な審査請求に対する裁決を経なければ取消訴訟を提起できない`
  * E 文末欠落: `（行政事件訴訟法8条... ` → `（行政事件訴訟法8条1項ただし書）。ただ、適法な審査請求がなされた場合には、審査庁が誤って不適法却下したとしても、適法な審査請求を経たものと取り扱われるから(最判昭36.7.21)、本肢所定の場合の原処分取消しの訴えは許される。`
  * ans=false 維持（Q の結語「却下裁決に対する取消訴訟を提起すべき」は誤り、最判昭36.7.21 により原処分取消しの訴えが許される）
  * scope: p136-q01 seq4 のみ、Q+E 束ね（v85 同方針、polarity 非影響）
  * handoff pending queue には Q のみ記録だったが、原本読取時に E substantive garble + 文末欠落を発見し束ねて修正（v85 precedent 同様）

確認経路: images/0136.png 原本（Claude vision, book p374-375 行4、section 取消訴訟と審査請求との関係） + 行政事件訴訟法8条1項ただし書 + 最判昭36.7.21（誤って不適法却下された適法な審査請求は経たものと扱う） + DB 内 ans=false 自己整合 の 3 経路一致。

### v98 差分（2026-04-22）

* **本 PR / p006-q01 seq2 ans polarity hotfix**（**B 群 B2 の層 1 のみ = polarity flip 先行**、Q / E 未修正維持、書籍 page 014-015 見開き section 統治行為論、書籍 page 015 右列 row 2 ×）
  * **ans**: `True → False`（polarity flip、single byte diff）
  * **Q / E**: **未修正維持**。以下の破損は検出済みだが今回は **touch しない**:
    - Q: 「一見極めて明白に違憲無効と認められる場合を除き、司法審査は及ばない」と**留保あり**と記述
    - E: 冒頭 `判例（最判昭35.6.8：苫米地事件）は...` の `...` 未充填、`「` 開き欠落で `」` のみ閉じ、「**留保は付されていない**」と Q を正面否定する記述
    - Q（留保あり）vs E（留保なし）= 自己矛盾。ans=True はこの矛盾の下で Q を肯定していたが、E 側と整合させるなら ans=False が妥当
  * **なぜ ans だけ先行修正か**: 現 DB 内部の Q / E 対比から ans=False の妥当性が単独で読め、polarity 誤りは学習体験に直接影響するため早期修正の価値が高い。Q / E の verbatim restore は原本画像なしには AGENTS.md「推測で断定しない / data 全体書き換え禁止」ルールに抵触するため**層 1 と層 2 を明確に分離**する。
  * **なぜ Q / E を保留したか**: `images/0006.png` / `images_preprocessed/0006.png` が **repo 内に未存在**（2026-04-22 worktree 確認、`git ls-files` でも未追跡、`images_preprocessed/` は 0004.png → 0007.png で 0005/0006 欠落）。原本画像なしに verbatim Q/E 復元は条文逆算と同種の「domain knowledge 補完」となり、v96 / v97 で確立した **ERROR_UNREADABLE_SOURCE 維持 / 原本逆算禁止** ルールに抵触する。
  * **原本到着後に何を再開するか**:
    1. p006 原本画像（`0006.png`）が repo に追加された時点で frozen 解除
    2. B2 の Q / E verbatim restore（苫米地事件判旨の `...` 部分 + 「留保なし」記述の verbatim 確定）
    3. B3（seq3, 統治行為論）の read-only 判定 → ans=False→True flip 可否 + E restore（判例特定は原本照合後に確定）
    4. B1（seq1, 共産党除名事件、現 handoff `cosmetic close` 前提は**誤り**。Q+E restore 対象）の再 open
    5. B4（seq4, 在宅投票事件、E 中央 restore が主対象、Q 軽微修正は同 PR で可）の restore
  * scope: p006-q01 seq2 `answerBoolean` のみ、他 seq (1/3/4) の ans / Q / E sha256 変化なし確認済、data ↔ public byte-identical mirror 維持（1,224,336 bytes、+1 byte = `true`→`false`）

確認経路: **原本画像なし**ゆえ従来の 3 経路一致は不成立。代わりに DB 内部整合のみに依拠: (a) 現 DB Q は「留保あり＝除き、司法審査は及ばない」と記述 / (b) 現 DB E は「留保は付されていない」と明示 / (c) Q と E は polarity 反対の主張をしており、どちらかが誤りである / (d) E 側（苫米地事件は純粋統治行為、留保不在）は一般法学知識と整合 → ans=False が単独妥当。**この判定は原本による verbatim 確認を経ておらず、Q / E 本文の復元を伴わないことを前提とした polarity hotfix に限定する**。

load-bearing Python assertion（編集時に検証済み、7 点）:
- `p006 seq2 answerBoolean === False`（edit 後）
- `p006 seq2 Q sha256 前後で不変（a5d5d47e2c5b）`
- `p006 seq2 E sha256 前後で不変（6582419beec5）`
- `p006 seq1/seq3/seq4 answerBoolean 前後で不変（True / False / True）`
- `p006 seq1/seq3/seq4 Q + E sha256 前後で不変`
- `data/reviewed_import.json ↔ public/data/reviewed_import.json byte-identical`
- `size delta = +1 byte（"true" → "false"）`

### v97 差分（2026-04-21）

* **PR #58 / p118-q01 seq1 E restore**（**B 群 active #2 = B6 = B 群 active 完走**、E text のみ、Q 無修正、polarity 非影響、書籍 page 338-339 見開き、section 教示, テキスト p.225〜227、書籍 page 339 右列 row 1 ×）
  * **E 中盤 教示事項**: `口頭又は書面で当該処分に係る部分を教示` → `①審査請求をすることができること、②審査請求をすべき行政庁および③審査請求期間を書面で教示`
    - 行政不服審査法82条1項の教示 3 事項（①審査請求可能な旨、②審査請求をすべき行政庁、③審査請求期間）+ 方法（書面）を、abstract drift `当該処分に係る部分` から concrete 3 点列挙へ restore
    - 方法も `口頭又は書面で` → `書面で`（82条1項本文は書面、口頭処分は冒頭「口頭でする場合を除き」で既に除外済み、二重表現の解消）
  * **E 括弧内ラベル**: `職権による必要的記載` → `職権による必要的教示`（講学上のラベル正字化、OCR 1 char drift）
  * **E 84条 tail は ERROR_UNREADABLE_SOURCE として完全不変維持**: `不服申立ての記載に関する事項は、教示ではなく、裁決をする権限庁に情報提供努力義務が課せられている（84条）。` は画像解像度で「努力/供与」「課せられている/課されている」等の微差 verbatim 確定不能、条文逆算禁止ルールに従い touch せず（v96 B5 `...` 保持と同方針）
  * **E 冒頭 `...`** は原本教科書自体が `…` 省略ゆえ touch なし（handoff 既判定、non-issue）
  * **括弧内 separator `・`** は低信頼ゆえ touch なし（`・` vs `：` の差、cosmetic 寄り）
  * **Q 無修正**: 現行 Q の overbroad `審査請求書に記載すべき事項` は 82条1項の教示 3 点に含まれず、本肢の誤答ポイント = ans=False の根拠そのもの、正常
  * ans=False 維持（polarity 非影響）
  * scope: p118-q01 seq1 のみ、他 seq (2-5) hash 変化なし確認済

確認経路: images_preprocessed/0118.png（Claude vision, 書籍 page 338-339 見開き、section 教示, テキスト p.225〜227、書籍 page 339 右列 row 1 ×） + 行政不服審査法82条1項（教示 3 事項 + 書面）との整合 + DB 内 ans=False / Q overbroad を E 3 点列挙で正面否定の自己整合 の 3 経路一致（84条 tail + separator + `...` は未確定、3 経路一致の対象から除外）。

load-bearing Python assertion（編集時に検証済み、9 点）:
- data ↔ public byte-identical mirror（1,224,335 bytes）
- Q 完全 verbatim 一致（touch なし確認）
- E: `①審査請求をすることができること、②審査請求をすべき行政庁および③審査請求期間を書面で教示` 含有
- E: 旧 drift `口頭又は書面で当該処分に係る部分を教示` 非含有
- E: `（職権による必要的教示・行政不服審査法82条1項）` 含有
- E: `必要的記載` 非含有
- E: 84条 tail verbatim 保持 + E 末尾終端
- ans=False 維持
- 他 seq (2/3/4/5) E sha256 変化なし

### v96 差分（2026-04-21）

* **PR #57 / p090-q01 seq1 Q+E restore**（**B 群 active #1 = B5**、Q 1 char OCR + E 末尾 substantive restore、書籍 page 282-283 見開き、section 届出, テキスト p.201〜202、書籍 page 283 右列 row 1 ×）
  * **Q**: `語否` → `諾否`（OCR 1 char 誤字、届出定義「諾否の応答が義務づけられている」の正字化、polarity 非影響）
  * **E 末尾**: `応答義務があり、通知により自己の期待する` → `応答義務がなく、通知により届出人の期待する`
    - `応答義務があり` → `応答義務がなく`: 届出定義（行政手続法2条7号）との整合、現行 E は条文定義と真っ向から反転していたため substantive restore の核心
    - `自己の期待する` → `届出人の期待する`: 主語 drift の原本復元
  * **E 中盤 `...` は unresolved 維持**: `申請（2条3号）...届出の場合には、` の `...` 部分 = transitional sentence は `images_preprocessed/0090.png` の解像度で verbatim 確定不能のため **ERROR_UNREADABLE_SOURCE** として unresolved 維持。条文逆算による補完は運用ルール上禁止（user directive 2026-04-21 確立）
  * ans=False 維持（Q「届出は諾否応答義務あり」を E が届出定義で正面否定、polarity 非影響）
  * scope: p090-q01 seq1 のみ、Q+E 束ね（v84/v85/v87/v92 と同型）、他 seq (2-5) hash 変化なし確認済

確認経路: images_preprocessed/0090.png（Claude vision, 書籍 page 282-283 見開き、section 届出, テキスト p.201〜202、書籍 page 283 右列 row 1 ×） + 行政手続法2条3号（申請の諾否応答義務）/ 2条7号（届出の通知義務、応答義務なし、通知による法的効果発生）+ DB 内 ans=False / Q-E polarity の自己整合 の 3 経路一致（中盤 transitional sentence は画像解像度限界で未確定、3 経路一致の対象から除外）。

load-bearing Python assertion（編集時に検証済み、v95 までの precedent 継承）:
- Q: `諾否` 含有、`語否` 非含有
- E: `応答義務がなく、通知により届出人の期待する` 含有
- E: 旧 garble `応答義務があり、通知により自己の期待する` 非含有
- E: `申請（2条3号）...届出の場合には、` 構造保持（`...` を unresolved marker として意図的に残置）
- ans=False 維持
- data/reviewed_import.json ↔ public/data/reviewed_import.json byte-identical（1,224,257 bytes）
- p090 他 seq (2/3/4/5) E sha256 変化なし（seq2: `85facba259e4` / seq3: `92e63992b12d` / seq4: `5e4fb546c376` / seq5: `efea57758032`）

### v95 差分（2026-04-21）

* **PR #55 / p136-q01 seq3 E restore**（**A 群 #7 = A 群最終項目**、E text のみ、polarity 非影響、書籍 page 375 右列 row 3 ×）
  * stray opening bracket + 語句 substantive 誤字: `「直ちに提出できるのが原則` → `直ちに提起できるのが原則`（開き「を除去 + 提出/提起の法律用語正字化）
  * 大幅文末欠落復元（行訴法 3 条文整合の全段）:
    - 前段評価: `、裁決を経なければ取消訴訟を提起できないのが原則であるとする前段は誤っている。`（Q 前段「裁決を経ることなく…できない」を否定）
    - 例外 section citation: `なお、審査請求前置主義が採用されている場合でも（8条1項ただし書）、`
    - 3 か月 rule + 後段評価: `審査請求があった日から3か月を経過しても裁決がないときは、裁決を経ないで処分取消訴訟を提起することができるから（8条2項1号）、後段は正しい。`（Q 後段「審査請求をするか否かを確認する必要がある」の方を正しいと評価）
  * ans=false 維持（Q 全体としては前段が誤りゆえ不正解、polarity 非影響）
  * scope: p136-q01 seq3 E のみ。**本 PR で A 群 7 件全て close**
  * 新方針 2 サイクル目適用（PR #53 確立、PR #54 で初適用）

確認経路: images_preprocessed/0136.png 原本（Claude vision, Kindle p374-375 見開き、書籍 page 375 右列 row 3 ×、section 7) 取消訴訟と審査請求との関係） + 行政事件訴訟法8条1項本文（自由選択主義 = 原則）/ 8条1項ただし書（審査請求前置主義 = 例外）/ 8条2項1号（3か月経過で直ちに提起可）との整合 + DB 内 ans=false / 前段誤り・後段正しいの分離評価の自己整合 + v87 close 済み seq4（8条1項ただし書）/ v93 close 済み seq1（8条1項本文）/ v94 close 済み seq2（8条1項本文 + ただし書）との対比整合 の 3 経路一致。

load-bearing Python assertion（編集時に検証済み）:
- 冒頭 `処分取消しの訴えは、審査請求ができる場合であっても直ちに提起できるのが原則であるから` で開始（`「直ちに` の stray bracket なし、`提出` なし）
- `（行政事件訴訟法8条1項本文：自由選択主義）` 含有
- `裁決を経なければ取消訴訟を提起できないのが原則であるとする前段は誤っている。` 含有
- `なお、審査請求前置主義が採用されている場合でも（8条1項ただし書）` 含有
- `審査請求があった日から3か月を経過しても裁決がないときは` 含有
- `（8条2項1号）` 含有
- `後段は正しい。` で末尾終端
- 旧 garble 非含有: `「直ちに` / `直ちに提出` / `...` / `…`

### v94 差分（2026-04-20）

* **PR #54 / p136-q01 seq2 E restore**（A 群 #6、E text のみ、polarity 非影響、書籍 page 375 右列 row 2 ×）
  * 中盤 structural garble: `、法律に別段の定めがない限り、直ちに処分の取消しの訴えを提起してもよいのが原則である）...自由選択主義...`
    → `、不服申立てをしてもよいし、直ちに処分の取消しの訴えを提起してもよいのが原則であり（行政事件訴訟法8条1項本文：自由選択主義）、`
  * 文末欠落（残り本文全段の復元）:
    - `、法律により不服申立てに対する裁決を経た後でなければ、処分の取消しの訴えを提起できないのは例外である（8条1項ただし書：審査請求前置主義）。`（審査請求前置主義 = 例外の明示）
    - `よって、処分の取消しの訴えは、法律に別段の定めがない限り、審査請求に対する裁決を経ないで直ちに処分の取消しの訴えを提起できる。`（本肢 Q の結語「裁決を経た後でなければ提起できない」を正面否定）
  * ans=false 維持（Q 前段「原則として審査請求前置主義」を E が自由選択主義＝原則、審査請求前置主義＝例外と反転して正面否定、polarity 非影響）
  * scope: p136-q01 seq2 E のみ。p136 残は A7 seq3 E のみ（v87 で seq4 close、v93 で seq1 close、本 PR で seq2 close）
  * 新方針（PR #53 確立）初適用: sync PR 無し、restore PR 1 本のみで完結

確認経路: images_preprocessed/0136.png 原本（Claude vision, Kindle p374-375 見開き、書籍 page 375 右列 row 2 ×、section 7) 取消訴訟と審査請求との関係） + 行政事件訴訟法8条1項本文（自由選択主義 = 原則）/ 8条1項ただし書（審査請求前置主義 = 例外）との整合 + DB 内 ans=false / Q「原則として審査請求前置主義」を E が正面否定の自己整合 + v93 close 済み seq1（同じく自由選択主義側）/ v87 close 済み seq4（8条1項ただし書）との対比整合 の 3 経路一致。

load-bearing Python assertion（編集時に検証済み）:
- 冒頭 `行政処分に対し不服申立てをすることができる場合、不服申立てをしてもよいし、` で開始
- `（行政事件訴訟法8条1項本文：自由選択主義）` 含有
- `（8条1項ただし書：審査請求前置主義）` 含有
- `よって、処分の取消しの訴えは、法律に別段の定めがない限り、` 含有
- `審査請求に対する裁決を経ないで直ちに処分の取消しの訴えを提起できる。` で末尾終端
- 旧 garble 非含有: `場合、法律に別段の定めがない限り、直ちに処分の取消しの訴えを提起してもよいのが原則である` / `原則である）` / `...` / `…`

### v93 差分（2026-04-20）

* **PR #51 / p136-q01 seq1 E restore**（A 群 #5、E text のみ、polarity 非影響、書籍 page 375 右列 row 1 ○）
  * 中盤 substantive garble: `当該処分につき定めがなければ、` → `当該処分につき法令の規定により審査請求をすることができる場合においても、`
  * duplicate phrase 除去: `直ちに処分の取消しの訴えを提起すること...` → `直ちに提起することができる`（主語「処分の取消しの訴えは」は既に冒頭で提示済みゆえ重複句を削除、同時に文末欠落 `...` を `ができる` で閉じる）
  * 結語 citation は変更なし: `（行政事件訴訟法8条1項本文：自由選択主義）。`
  * ans=true 維持（Q「審査請求ができる場合でも処分取消の訴えを直ちに提起してよいか」を E「直ちに提起することができる」で肯定、polarity 非影響）
  * scope: p136-q01 seq1 E のみ

確認経路: images_preprocessed/0136.png 原本（Claude vision, Kindle p374-375 見開き、書籍 page 375 右列 row 1 ○、section 7) 取消訴訟と審査請求との関係） + 行政事件訴訟法8条1項本文（自由選択主義 = 審査請求できる処分でも取消訴訟を直ちに提起可）との整合 + DB 内 ans=true / Q を E が正面肯定の自己整合 + v87 で close 済みの seq4（8条1項ただし書）との対比整合 の 3 経路一致。

load-bearing Python assertion（編集時に検証済み）:
- 冒頭 `処分の取消しの訴えは、当該処分につき法令の規定により審査請求をすることができる場合においても、` で開始
- `直ちに提起することができる（行政事件訴訟法8条1項本文：自由選択主義）。` 含有
- `（行政事件訴訟法8条1項本文：自由選択主義）。` で末尾終端
- 旧 garble `定めがなければ` / 重複句 `直ちに処分の取消しの訴えを提起すること` 非含有
- `...` / `…` 非含有

### v92 差分（2026-04-20）

* **PR #49 / p116-q01 seq2 E restore**（A 群 #4、E text のみ、polarity 非影響、書籍 page 335 右列 row 8 ×）
  * 頭欠落復元: （冒頭に追加）`再調査の請求においては、`
  * OCR 誤字: `処分庁が、必要があると認める場合には` → `処分庁は、必要があると認める場合には`（「が→は」）
  * 中盤 substantive garble + 文末欠落復元: `申立てによる場合で…` → `申立てによりまたは職権で、処分の効力、処分の執行または手続の続行の全部または一部の停止その他の措置（執行停止）をとることができる。`
  * ans=false 維持（Q「請求人が申し立てることはできない」に対し、E が「審査請求人の申立てによりまたは職権で」執行停止可能と示し正面否定、polarity 非影響）
  * scope: p116-q01 seq2 E のみ。Q 側の軽微 OCR 差（`なされたとき/なされた場合`、`職権で、/職権で`）は非substantive で保持
  * 書籍 page 335 の row 番号は p115 からの継続（row 7-10）。DB p116 seq1-4 ↔ 書籍 row 7-10 対応

確認経路: images_preprocessed/0116.png 原本（Claude vision, Kindle p334-335 見開き、書籍 page 335 右列 row 8 ×、section 再調査の請求） + 行政不服審査法25条2項（執行停止は審査請求人の申立てまたは職権）+ 61条（再調査の請求への準用）+ DB 内 ans=false / Q「請求人が申し立てることはできない」を E で正面否定の自己整合 の 3 経路一致。

load-bearing Python assertion（編集時に検証済み）:
- 冒頭 `再調査の請求においては、` で開始
- `行政不服審査法25条2項が準用され（61条）` 含有
- `処分庁は、必要があると認める場合には` 含有
- `審査請求人の申立てによりまたは職権で` 含有
- `（執行停止）をとることができる。` で末尾終端
- 旧 garble `処分庁が、` / `申立てによる場合で` 非含有、`…` / `...` 非含有

### v91 差分（2026-04-20）

* **PR #47 / p162-q01 seq2 E restore**（A 群 #3、E text のみ、polarity 非影響、書籍 page 427 右列 row 2 ×）
  * OCR 1 char drop: `負担者というためには` → `負担者といえるためには`（「え」欠落）
  * OCR 1 char drop: `実質的にこの者と` → `実質的にはこの者と`（「は」欠落）
  * 文末欠落（`…` → 原本復元）: `と認められる者であって、当該営造物の瑕疵による危険を効果的に防止しうる者であることが必要であり（最判昭50.11.28）、補助金を交付する場合、常に費用負担者にあたるとするものではない。`（国賠法3条1項共同執行者論の判例 + 結語復元）
  * ans=false 維持（E 末尾「補助金を交付する場合、常に費用負担者にあたるとするものではない」で Q「国も、…常に賠償責任を負う」を正面否定、polarity 非影響）
  * scope: p162-q01 seq2 E のみ。`国家賠償法３条１項` の全角表記は p162 内（seq1/seq3 含む）の DB 既存 convention を保持（変更せず）

確認経路: images_preprocessed/0162.png 原本（Claude vision, Kindle p426-427 見開き、書籍 page 427 右列 row 2 ×、section 賠償責任者、求償権） + 国家賠償法3条1項（費用負担者の損害賠償責任）+ 最判昭50.11.28（補助金交付のみでは費用負担者に当たらない判例）との整合 + DB 内 ans=false / Q「常に賠償責任を負う」を E で正面否定の自己整合 の 3 経路一致。

load-bearing Python assertion（編集時に検証済み）:
- `負担者といえるためには` 含有
- `実質的にはこの者と` 含有
- `（最判昭50.11.28）` 含有
- `常に費用負担者にあたるとするものではない。` で末尾終端
- `執行していると認められる者であって` 含有
- 旧 garble `というためには` / `実質的にこの者と` 非含有、`…` / `...` 非含有
- 全角 `国家賠償法３条１項` 保持、半角 variant 非混入

### v90 差分（2026-04-20）

* **PR #45 / p175-q01 seq3 E restore**（A 群 #2、E text のみ、polarity 非影響、書籍 page 453 右列 row 3 ×）
  * 条番号 garble: `（地方自治法102条1項）` → `（地方自治法102条2項）`（定例会招集の根拠条項訂正、seq2 が既に 102条1項 を「議会＝定例＋臨時」として引用済みとの整合改善）
  * 接続詞 OCR: `。また、` → `。なお、`
  * 構造 + 語句 garble: `普通地方公共団体の議会（定例会および臨時会とするのが妥当であるが）` → `普通地方公共団体の議会は定例会および臨時会とするのが原則であるが（102条1項）、`（括弧位置マングル + 妥当/原則 substantive garble + 102条1項 引用欠落、一括復元）
  * 文末欠落（`...` → 原本復元）: `条例の定めにより通年の会期（条例で定める日から翌年の当該日の前日までを会期とするもの）とすることができる（102条の2第1項）。`（通年会期制 102条の2第1項 の本文全段復元）
  * ans=false 維持（E 前段「4回以内で規則で定める回数」ではなく「条例で定める回数」で Q を正面否定、polarity 非影響）
  * scope: p175-q01 seq3 E のみ

確認経路: images_preprocessed/0175.png 原本（Claude vision, Kindle p452-453 見開き、書籍 page 453 右列 row 3 ×、section 3) 招集及び会期） + 地方自治法102条1項（議会＝定例＋臨時）/ 102条2項（定例会は条例で定める回数）/ 102条の2第1項（通年会期制）との整合 + DB 内 ans=false / seq2 が同条1項を別文脈で引用済みとの自己整合 の 3 経路一致。

load-bearing Python assertion（編集時に検証済み）:
- `（地方自治法102条2項）` 含有
- `とするのが原則であるが（102条1項）` 含有
- `通年の会期` 含有
- `（102条の2第1項）。` で末尾終端
- `なお、` 使用（`また、` 不使用）
- 旧 garble `妥当であるが` / `また、` / head の `（地方自治法102条1項）` 非含有

### v89 差分（2026-04-20）

* **PR #44 / p175-q01 seq1 E restore**（A 群 §5 再走検出分の先頭、E text のみ、polarity 非影響、書籍 page 453 右列 row 1 ×）
  * OCR 誤字: `議案または議員定数` → `議長または議員定数`
  * OCR 誤字: `あったときは（101条2項・3項）` → `あったときも（101条2項・3項）`
  * 条番号 garble: `（104条4項）` → `（101条4項）`
  * 文末欠落（`。も...` → 原本復元）: `。もっとも、議長または議員による臨時会招集請求（101条2項、3項参照）のあった日から20日以内に当該普通地方公共団体の長が臨時会を招集しないときは、議長は、議長による臨時会招集請求の場合には自ら臨時会を招集することができ（101条5項）、議員による臨時会招集請求の場合には請求者の申出に基づき当該申出の日から都道府県および市にあっては10日以内、町村にあっては6日以内に臨時会を招集しなければならない（101条6項）。`
  * ans=false 維持（E 冒頭「議長ではなく、原則として普通地方公共団体の長が招集する」で Q を正面否定、polarity 非影響）
  * scope: p175-q01 seq1 E のみ

確認経路: images_preprocessed/0175.png 原本（Claude vision, Kindle p452-453 見開き、書籍 page 453 右列 row 1 ×、section 3) 招集及び会期） + 地方自治法101条1項/2項・3項/4項/5項/6項（書籍が引用する条項番号）との整合 + DB 内 ans=false / Q「議長が招集」を E で正面否定 の 3 経路一致。

### v88 差分（2026-04-20）

* **PR #43 / p227-q01 seq3 E digit restore**（v83 保留の digit garble を高解像度 crop で close + 同 seq 内追加破損束ね修正、polarity 非影響）
  * 条文引用 digit（v83 保留項目）: `13歳2項110号` → `13条1項10号`（民法13条1項10号 = 制限行為能力者 4 類型の定義的引用箇所）
  * 論理接続詞: `有しなかったときは、「未成年者もしくは...」であったときは` → `有しなかったときまたは「未成年者もしくは...」であったときは`（民法98条の2 本文の「又は」構造）
  * 1 文字欠落: `受領に制限行為能力者` → `受領時に制限行為能力者`
  * 区切り記号: `；` → `：`
  * 結語 quote: `未成年者と成年被後見人」` → `「未成年者と成年被後見人」`（開き「欠落）
  * ans=false 維持（v78 で確定、polarity 非影響）
  * scope: p227-q01 seq3 E のみ

確認経路: images/0227.png 原本**高解像度 crop**（Claude vision, book p557 row 1 ×、section 意思表示の効力発生時期、digit が明瞭に `13条1項10号` と読取可能） + 民法13条1項10号（制限行為能力者の定義的引用：未成年者、成年被後見人、被保佐人、被補助人 4 類型を列挙）整合 + DB 内 ans=false / Q「制限行為能力者」overbroad（v78 close 済み）自己整合 の 3 経路一致。

v83 時点では「画像単独では digit 確定不能 / legal fit 弱く推定復元不可」として保留していたが、高解像度再 crop で digit 確定可能となり、かつ民法13条1項10号は制限行為能力者の定義的引用として legal fit も強く確立したため close。prior 保留理由の両条件が解消した局面での判断。

### post-v76 housekeeping

* leaked-key 由来の ephemeral JSON 削除済み
* 旧 PR branch / tmp branch cleanup 実施済み
* Gemini leaked key 2 本の rotate 完了（2026-04-19）：旧 2 本失効済み / 新 1 本発行済み / 値は未記載

## 次セッション最優先タスク

### 1. 累積 recheck queue 整理（C レーン一括 PR 候補）

C レーン先頭（次に触るべき 1 件）= **OCR pending queue の先頭項目（下記 §2）**

* ~~p214 seq1-3 追跡項目~~ → 2026-04-19 照合済み close（polarity / 条文整合 / ledger `master_correction_ledger.json` の 2026-04-07 fix と整合、修正不要）
* ~~p227 seq1/seq2/seq3 polarity / sectionTitle drift~~ → v78 で close（PR #32）
* ~~p219-q01 seq3 Q OCR 破損~~ → v81 で close（PR #36）
* ~~p227-q01 seq2 Q/E/ans 相互矛盾（第三者強迫 D への復元）~~ → v82 で close（PR #37）
* ~~p227-q01 seq3 E 高信頼4箇所（有していた→有しなかった、できる→できない、類型順序+正字、重複ペア）~~ → v83 で close（PR #38）。条文引用 `13歳2項110号` は低信頼のため未修正、下記 §2 の `—` 行に残存（実作業キュー外）
* ~~p062-q01 seq7 Q+E 文末欠落 + OCR 誤字（移動者→義務者、行政代執行法2条引用復元）~~ → v84 で close（PR #39）
* ~~p078-q01 seq4 Q+E 文末欠落 + 送り仮名 + E substantive garble（公聴会 vs 意見陳述の手続）~~ → v85 で close（PR #40）
* ~~p119-q01 seq1 Q+E+ans substantive restore（Q 全面復元 + polarity flip true→false + E 条文引用整理、行政不服審査法83条1項/3項/4項/5項）~~ → v86 で close（PR #41）
* ~~p136-q01 seq4 Q+E 文末欠落 + Q/E 両方の substantive garble（違法/適法の反転、行政事件訴訟法8条1項ただし書 + 最判昭36.7.21）~~ → v87 で close（PR #42）
* ~~p227-q01 seq3 E 条文引用 digit（13歳2項110号→13条1項10号）+ 同 seq 内追加破損束ね（または/受領時/開き「）、民法13条1項10号 整合~~ → v88 で close（PR #43、v83 保留項目の最終 close）
* ~~A1 p175-q01 seq1 E（§5 再走検出分の先頭、OCR 誤字 2 箇所「議案→議長」「ときは→ときも」+ 条番号 garble 104条4項→101条4項 + 文末欠落 `。も...` → 101条5項/6項まで復元、地方自治法101条全項整合）~~ → v89 で close（PR #44）
* ~~A2 p175-q01 seq3 E（条番号 garble 102条1項→2項 + 接続詞「また→なお」+ 構造 garble「議会（…妥当であるが）」→「議会は…原則であるが（102条1項）」+ 文末欠落 → 通年会期制 102条の2第1項 まで復元、地方自治法102条全項整合）~~ → v90 で close（PR #45）
* ~~A3 p162-q01 seq2 E（OCR 1 char drop 2 箇所「という→といえる」「実質的に→実質的には」+ 文末欠落 → 国賠法3条1項共同執行者論 + 最判昭50.11.28 引用復元）~~ → v91 で close（PR #47）
* ~~A4 p116-q01 seq2 E（頭欠落「再調査の請求においては、」+ OCR 誤字「処分庁が→は」+ 中盤 garble「申立てによる場合で…→申立てによりまたは職権で、…執行停止…」復元、行審法25条2項 + 61条整合）~~ → v92 で close（PR #49）
* ~~A5 p136-q01 seq1 E（中盤 substantive garble「定めがなければ、→法令の規定により審査請求をすることができる場合においても、」+ duplicate phrase 除去 + 文末欠落「提起すること...→提起することができる」、行訴法8条1項本文: 自由選択主義）~~ → v93 で close（PR #51）
* ~~A6 p136-q01 seq2 E（中盤 structural garble「法律に別段の定めがない限り、直ちに〜原則である）...→不服申立てをしてもよいし、直ちに〜原則であり（8条1項本文: 自由選択主義）」+ 大幅文末欠落「8条1項ただし書: 審査請求前置主義 + 結論」、行訴法8条1項本文 + ただし書 + 結論の 3 段構成復元）~~ → v94 で close（PR #54）
* ~~A7 p136-q01 seq3 E（stray 開き「 + 提出/提起 substantive 誤字 + 大幅文末欠落「前段誤り評価 + 8条1項ただし書 + 8条2項1号 3か月 rule + 後段正しい評価」復元、行訴法 3 条文整合）~~ → v95 で close（PR #55）**= A 群完走**

### 2. OCR pending queue（browser OCR / vision 要）

旧「cosmetic OCR 揺れ ~7 件」を廃止し、明示列挙に置換（2026-04-20）。
CLAUDE.md §5 auto-detection rule を **v88 反映後に再走**（2026-04-20）→ 新規に 13 件の未拾い案件を検出。A 群 7 件 = substantive 文末欠落（実作業対象）、B 群 6 件 = 判例/条文の `...` 圧縮で原本照合が必要（判断保留）、C 群 3 件 = 標準的な `……` 学術引用ゆえ修正不要（queue 外）。

**運用**:

* 修正は **1 ページずつ別 PR**（バンドル禁止、page-by-page PR 対象）
* browser OCR / vision で正文確定後に着手
* 確定前は polarity / ledger を触らない
* A 群を先に消化し、B 群は A 群完了後に原本照合で substantive/cosmetic を再判定

**A 群 — substantive 文末欠落（実作業対象, 7 件, 2026-04-20 §5 再走反映）**:

| # | 対象 | 症状 | 状態 |
| --- | --- | --- | --- |
| ~~A1~~ | ~~p175-q01 seq1 E~~ | ~~末尾 `（104条4項）。も...` で dangling（「も...」だけ残存）~~ | ~~close（v89, PR #44）~~ |
| ~~A2~~ | ~~p175-q01 seq3 E~~ | ~~末尾 `（定例会および臨時会とするのが妥当であるが）...` で中断（+ 前半に 102条1項/2項 条番号 garble、「また/なお」接続詞 garble、括弧構造 + 妥当/原則 garble）~~ | ~~close（v90, PR #45）~~ |
| ~~A3~~ | ~~p162-q01 seq2 E~~ | ~~末尾 `事業を共同して執行している…` で中断、国賠法3条1項共同執行者論の結語欠落（+ 前半に OCR 1 char drop 2 箇所「という/といえる」「実質的に/実質的には」）~~ | ~~close（v91, PR #47）~~ |
| ~~A4~~ | ~~p116-q01 seq2 E~~ | ~~末尾 `…審査請求人の申立てによる場合で…` で中断、行審法25条2項準用の帰結欠落（+ 頭欠落 + 「処分庁が/は」OCR 誤字）~~ | ~~close（v92, PR #49）~~ |
| ~~A5~~ | ~~p136-q01 seq1 E~~ | ~~`提起すること...（行政事件訴訟法8条1項本文：自由選択主義）。` — 「ができる」等の語欠落（+ 中盤 substantive garble「定めがなければ」、duplicate phrase）~~ | ~~close（v93, PR #51）~~ |
| ~~A6~~ | ~~p136-q01 seq2 E~~ | ~~末尾 `…自由選択主義...` で中断、結論文欠落（+ 中盤 structural garble 「法律に別段の定め/不服申立てをしてもよいし」、8条1項ただし書〜結論の 3 段全欠落）~~ | ~~close（v94, PR #54）~~ |
| ~~A7~~ | ~~p136-q01 seq3 E~~ | ~~末尾 `（行政事件訴訟法8条1項本文：自由選択主義）...` で中断（+ 冒頭 stray 「 と 提出/提起 誤字）~~ | ~~close（v95, PR #55）= A 群最終項目~~ |

**着手順**: 上表 ~~A1~~ → ~~A2~~ → ~~A3~~ → ~~A4~~ → ~~A5~~ → ~~A6~~ → ~~A7~~（全 close、**A 群完走**）。v87 で p136-q01 seq4 close + v93/v94/v95 で p136 seq1/seq2/seq3 close により、**p136 全 4 seq 完了**。**次着手 = B 群**（判断保留 6 件、原本照合で substantive/cosmetic 再判定）。

**B 群 — borderline（判断保留, 6 件, 原本照合後に substantive/cosmetic 再判定。2026-04-21 read-only 判定で内訳再整理）**:

| # | 対象 | 症状 | 状態 |
| --- | --- | --- | --- |
| B1 | p006-q01 seq1 Q + E | 共産党除名事件、Q + E 両方に restore 要。旧 handoff `cosmetic close` 判定は**誤り**（2026-04-22 user directive で再 open） | **pending, source ready** — `images_preprocessed/0006.png` 収載済（本 PR）、次の v## restore PR で Q + E verbatim restore（優先順 B2/B3 の後） |
| B2 | p006-q01 seq2 Q + E + ans | 苫米地事件、Q「留保あり」vs E「留保不在」の自己矛盾 + E 冒頭 `...` / 開き「欠落 | **層 1 = ans polarity flip True→False 完了**（v98 PR #62, `671eb79`）／ **層 2 = Q/E verbatim restore pending, source ready**（`images_preprocessed/0006.png` 収載済、次の v99 PR で Q/E verbatim restore。ans=False polarity は画像解説末尾「留保は付されていない...本肢は誤っている」と整合、維持で可） |
| B3 | p006-q01 seq3 E + ans | 統治行為論、`判例は...場合でも` 中間語脱落、**ans False→True flip 候補**（read-only 判定時点の心証。判例特定・verbatim restore 詳細は原本画像到着後に確定） | **polarity flip pending, source ready** — `images_preprocessed/0006.png` 収載済、次の v## restore PR で E restore + ans flip（B2 の次） |
| B4 | p006-q01 seq4 Q + E | 在宅投票事件、**E 中央 restore** が主対象、Q 軽微修正は同 PR で可 | **pending, source ready** — `images_preprocessed/0006.png` 収載済、次の v## restore PR で E 中央 restore + Q 軽微修正（優先順 B2/B3/B1 の後） |
| ~~B5~~ | ~~p090-q01 seq1 E~~ | ~~`申請（2条3号）...届出の場合には` — 申請と届出の対比記述が圧縮~~ | ~~**closed to limit of source quality**（v96, PR #57）。**層 1 = substantive risk mitigated**（Q 1 char「語否→諾否」+ E 末尾 論理反転「応答義務があり→応答義務がなく」+ 主語 drift「自己の→届出人の」を原本復元、ans=False 維持）／ **層 2 = image-quality-limited fragment unresolved**（E 中盤 `申請（2条3号）...届出の場合には、` の `...` transitional sentence は画像解像度で verbatim 確定不能、**ERROR_UNREADABLE_SOURCE** 維持、条文逆算禁止、**future high-res recrop candidate only**）~~ |
| ~~B6~~ | ~~p118-q01 seq1 E~~ | ~~`審査請求...をすることができる` — 条文列挙の `等` 圧縮（read-only 判定で E 中盤〜末尾の教示 3 点列挙 drift + `必要的記載` → `必要的教示` 差検出、substantive restore 対象）~~ | ~~**closed to limit of source quality**（v97, PR #58）。**層 1 = substantive risk mitigated**（E 中盤 `口頭又は書面で当該処分に係る部分を教示` → `①審査請求をすることができること、②審査請求をすべき行政庁および③審査請求期間を書面で教示`（行審法82条1項 教示 3 事項 + 書面、abstract drift から concrete restore）+ `職権による必要的記載` → `職権による必要的教示`（講学ラベル正字化）を原本復元、ans=False 維持）／ **層 2 = image-quality-limited fragment unresolved**（84条への繋ぎ末尾は画像解像度で verbatim 確定不能、**ERROR_UNREADABLE_SOURCE** として**完全不変維持**、条文逆算禁止、**future high-res recrop candidate only**）~~ |

**C 群 — 修正不要（標準的学術引用, 3 件, queue 外 / 記録のみ）**:

判例・条文の標準的 `……` 圧縮引用ゆえ OCR 破損ではない。再 scan 時の誤検知回避のため記録。

| # | 対象 | 理由 |
| --- | --- | --- |
| C1 | p005-q01 seq4 E | 富山大学事件 `……` 学術引用（標準） |
| C2 | p005-q01 seq5 E | 板まんだら事件 `……` 学術引用（標準） |
| C3 | p016-q01 seq7 E | 憲法41条/94条 `……` 条文引用（標準） |

**件数増減のルール**: 新たな scan hit や user 指摘で件数が増減する場合、理由を 1 行ずつ本表末に追記する。

- 2026-04-20: v81 反映で `p219-q01 seq3 Q` を close（-1 → 6 件）
- 2026-04-20: v82 反映で `p227-q01 seq2 Q` を close（substantive restore：Q + E + polarity 束ねて修正）（-1 → 5 件）
- 2026-04-20: v83 反映で `p227-q01 seq3 E` 高信頼4箇所を close、条文引用 `13歳2項110号`（低信頼）を新規 #1 に差し替え（±0 → 5 件）
- 2026-04-20: handoff-only 更新。`p227-q01 seq3 E 条文引用` を `requires user browser OCR or book reference` に降格し実作業キューから除外（±0 → 5 件、実作業は 4 件）。理由：画像 digit 断定不能、legal fit 弱く、推定復元は repo に入れない方針。close しない。
- 2026-04-20: v84 反映で `p062-q01 seq7 Q+E` を close（Q OCR 誤字 + Q/E 文末欠落を原本復元、行政代執行法2条 整合、polarity 非影響）（-1 → 4 件、実作業は 3 件）
- 2026-04-20: v85 反映で `p078-q01 seq4 Q+E` を close（Q 送り仮名 + 文末欠落、E substantive garble 3箇所を原本復元、行政手続法13条1項/10条 整合、polarity 非影響。handoff 記録は Q のみだったが原本読取時に E 破損発見し束ね修正）（-1 → 3 件、実作業は 2 件）
- 2026-04-20: v86 反映で `p119-q01 seq1 Q+E+ans` を close（Q 全面復元 + polarity flip true→false + E 条文引用を 行政不服審査法83条1項/3項/4項/5項 に整理、v82 precedent の Q+E+ans 束ねパターン）（-1 → 2 件、実作業は 1 件）
- 2026-04-20: v87 反映で `p136-q01 seq4 Q+E` を close（Q/E 両方の substantive garble「違法/適法」反転 + 文末欠落を原本復元、行政事件訴訟法8条1項ただし書 + 最判昭36.7.21 整合、polarity 非影響。handoff 記録は Q のみだったが原本読取時に E 破損発見し束ね修正、v85 precedent 同様）（-1 → 1 件、実作業は 0 件）
- 2026-04-20: v88 反映で `p227-q01 seq3 E` を close（v83 保留の digit garble `13歳2項110号` を高解像度 crop で `13条1項10号` に確定復元、民法13条1項10号＝制限行為能力者定義的引用との legal fit 強、prior 保留理由の両条件解消。同 seq 内追加破損 4 箇所「または/受領時/区切り/開き「」も束ね修正、polarity 非影響）（-1 → 0 件、実作業・外部確認待ちとも 0 件）
- 2026-04-20: **CLAUDE.md §5 auto-detection rule を v88 反映後に再走 → 新規 hit 13 件を検出**。A 群 7 件（substantive 文末欠落: p175 seq1/seq3, p162 seq2, p116 seq2, p136 seq1/seq2/seq3）を queue に追加（実作業対象）、B 群 6 件（borderline 判例/条文 `...` 圧縮: p006 seq1/seq2/seq3/seq4, p090 seq1, p118 seq1）を queue に追加（原本照合後に再判定）、C 群 3 件（cosmetic 標準学術引用: p005 seq4/seq5, p016 seq7）は管理対象外として記録のみ（+13 → 13 件、実作業は 7 件）。理由：v88 まで「pending queue 完全空」と見なしていたが、§5 再走により未拾い案件が明確に検出されたため、source of truth を再走結果に合わせて復帰。
- 2026-04-20: v89 反映で A 群 `A1 p175-q01 seq1 E` を close（OCR 誤字 2 箇所「議案→議長」「ときは→ときも」+ 条番号 garble「104条4項→101条4項」+ 文末欠落 `。も...` → 地方自治法101条5項/6項までの正文復元、書籍 page 453 右列 row 1 × と 3 経路一致、polarity 非影響）（-1 → 12 件、実作業は 6 件）。
- 2026-04-20: v90 反映で A 群 `A2 p175-q01 seq3 E` を close（条番号 garble「102条1項→2項」+ 接続詞 OCR「また→なお」+ 構造 + 語句 garble「議会（…妥当であるが）→議会は…原則であるが（102条1項）、」+ 文末欠落 → 通年会期制 102条の2第1項 までの正文復元、書籍 page 453 右列 row 3 × と 3 経路一致、load-bearing 4 点「102条2項 / 原則 / 通年の会期 / 102条の2第1項」を Python assertion で確認、polarity 非影響）（-1 → 11 件、実作業は 5 件。p175 関連 A 群はゼロに）。
- 2026-04-20: v91 反映で A 群 `A3 p162-q01 seq2 E` を close（OCR 1 char drop 2 箇所「という→といえる」「実質的に→実質的には」+ 文末欠落 → 国賠法3条1項共同執行者論 + 最判昭50.11.28 引用復元、書籍 page 427 右列 row 2 × と 3 経路一致、load-bearing 4 点「といえるためには / 実質的には / 最判昭50.11.28 / 常に費用負担者にあたるとするものではない」を Python assertion で確認、polarity 非影響、全角 ３条１項 保持）（-1 → 10 件、実作業は 4 件。p162 関連 A 群はゼロに）。
- 2026-04-20: v92 反映で A 群 `A4 p116-q01 seq2 E` を close（頭欠落「再調査の請求においては、」+ OCR 誤字「処分庁が→は」+ 中盤 garble「申立てによる場合で…→申立てによりまたは職権で、…執行停止…をとることができる。」復元、書籍 page 335 右列 row 8 × と 3 経路一致、load-bearing 4 点「再調査の請求においては / 処分庁は / 申立てによりまたは職権で / 執行停止」を Python assertion で確認、polarity 非影響）（-1 → 9 件、実作業は 3 件。p116 関連 A 群はゼロに）。
- 2026-04-20: v93 反映で A 群 `A5 p136-q01 seq1 E` を close（中盤 substantive garble「定めがなければ、→法令の規定により審査請求をすることができる場合においても、」+ duplicate phrase 除去「直ちに処分の取消しの訴えを提起すること...→直ちに提起することができる」、書籍 page 375 右列 row 1 ○ と 3 経路一致、load-bearing 3 点「法令の規定により審査請求 / 直ちに提起することができる / 自由選択主義末尾」を Python assertion で確認、polarity 非影響、v87 close 済み seq4 との対比整合）（-1 → 8 件、実作業は 2 件。残 A 群 2 件はすべて p136 seq2/seq3）。
- 2026-04-20: v94 反映で A 群 `A6 p136-q01 seq2 E` を close（中盤 structural garble「法律に別段の定めがない限り、直ちに〜原則である）...→不服申立てをしてもよいし、直ちに〜原則であり（8条1項本文: 自由選択主義）」+ 大幅文末欠落 → 8条1項ただし書（審査請求前置主義=例外）+ 結論「よって〜審査請求に対する裁決を経ないで直ちに処分の取消しの訴えを提起できる」を復元、行訴法8条1項本文 + ただし書 + 結論の 3 段構成、書籍 page 375 右列 row 2 × と 3 経路一致、load-bearing 5 点「不服申立てをしてもよいし / 自由選択主義 / 審査請求前置主義 / よって〜別段の定めがない限り / 末尾終端」を Python assertion で確認、polarity 非影響）（-1 → 7 件、実作業は 1 件。**新方針 = sync PR 無し、restore PR 1 本のみで完結**の初適用）。
- 2026-04-21: v95 反映で A 群 `A7 p136-q01 seq3 E` を close（stray 開き「除去 + 提出/提起 substantive 誤字「直ちに提出→直ちに提起」+ 大幅文末欠落「〜自由選択主義）...→前段誤り評価 +（8条1項ただし書）+ 3か月 rule +（8条2項1号）+ 後段正しい評価」を復元、行訴法8条1項本文 / ただし書 / 2項1号の 3 条文整合、書籍 page 375 右列 row 3 × と 3 経路一致、load-bearing 7 点「直ちに提起できる / 自由選択主義 / 前段は誤っている / 審査請求前置主義 / 3か月を経過 / 8条2項1号 / 後段は正しい」を Python assertion で確認、polarity 非影響、v87 seq4 / v93 seq1 / v94 seq2 との対比整合で p136 全 4 seq 完了）（-1 → 6 件、**実作業 0 件 = A 群完走**）。
- 2026-04-21: **handoff-only 更新**（data 変更なし、DATA_VERSION bump なし）。B 群 6 件の内訳を read-only 判定で再整理：
  - `B1 p006-q01 seq1 E` を **cosmetic close**（共産党除名事件判旨、bracket-balanced 標準学術引用 `「...」`、C 群 C1/C2 と同型 → queue から除外、data 変更は発生しない）
  - `B2 p006-q01 seq2 E` / `B3 p006-q01 seq3 E` / `B4 p006-q01 seq4 E` を **凍結（frozen）**。理由：`images_preprocessed/0006.png` が repo 内に未存在で原本照合が成立しないため、画像取得までは判定も data 修正も行わない（B2 は polarity 疑義 / B3 は substantive restore 候補 / B4 は typography restore 見込みの未検証心証のみ記録）
  - `B5 p090-q01 seq1 E` / `B6 p118-q01 seq1 E` を **次着手**（`images_preprocessed/0090.png` / `0118.png` は存在確認済み、次セッションで read-only 判定 → substantive なら A 群流の restore PR、cosmetic なら close）
  - v95 merge SHA `95a50f95aae52bf43fe5b1db8ef70d81a53bde51` を `latest data merge` / `latest main HEAD at handoff edit time` / 直近 data merge 履歴 の 3 箇所に補完（PR #55 merge 後の snapshot として確定）
  - 件数増減：close -1（B1）/ frozen -3（B2-B4、queue の active 枠からは外れるが記録は保持）/ active +2（B5-B6 を次着手化）。形式的には **6 件維持**（B1 close 済 + B2-B4 frozen + B5-B6 active）、**実作業（active）は 2 件**
- 2026-04-21: v96 反映で B 群 active #1 = `B5 p090-q01 seq1 Q+E` を **partial close**（Q OCR 1 char 誤字「語否→諾否」+ E 末尾 substantive 復元「応答義務があり→応答義務がなく」（届出定義 2条7号との論理反転修正）+「自己の期待する→届出人の期待する」（主語 drift 復元）、書籍 page 283 右列 row 1 × と 3 経路一致、load-bearing 7 点「諾否 / 語否非含有 / 応答義務がなく / 旧 garble 非含有 / `...` unresolved marker 保持 / ans=False 維持 / mirror byte-identical」を Python assertion で確認、polarity 非影響、他 seq (2-5) hash 変化なし）。**E 中盤 `申請（2条3号）...届出の場合には、` の `...` 部分は ERROR_UNREADABLE_SOURCE として unresolved 維持**（画像解像度で transitional sentence verbatim 確定不能、条文逆算禁止ルール 2026-04-21 確立に従い未補完）。（-1 → 1 件 active、B 群 active 2 → 1、残は B6 p118-q01 seq1 E = v97 予定）。
- 2026-04-21: v97 反映で B 群 active #2 = `B6 p118-q01 seq1 E` を **closed to limit of source quality**（E 中盤 `口頭又は書面で当該処分に係る部分を教示` → `①審査請求をすることができること、②審査請求をすべき行政庁および③審査請求期間を書面で教示`（行審法82条1項 教示 3 事項 + 書面、abstract drift から concrete restore）+ `職権による必要的記載` → `職権による必要的教示`（講学ラベル正字化）を原本復元、書籍 page 338 右列 row 1 × と 3 経路一致、load-bearing 9 点「教示 3 事項列挙 / 書面で教示 / 必要的教示 / 旧 `口頭又は書面で当該処分に係る部分を教示` 非含有 / 旧 `必要的記載` 非含有 / 84条 tail 不変（ERROR_UNREADABLE_SOURCE 維持） / ans=False 維持 / 他 seq (2-5) hash 変化なし / mirror byte-identical」を Python assertion で確認、polarity 非影響）。**二層表現採用**: 層 1 = substantive risk mitigated / 層 2 = 84条への繋ぎ末尾は画像解像度で verbatim 確定不能ゆえ ERROR_UNREADABLE_SOURCE として完全不変維持、条文逆算禁止、**future high-res recrop candidate only**。（-1 → 0 件 active、**B 群 active 完走**、残は B2-B4 frozen（p006 画像未存在、repo 追加待ち）+ B5/B6 の image-resolution-limited fragment（高解像度 recrop 待ち））。
- 2026-04-21: **別領域移行 #1 = `importParsedBatch` の分類継承バグを修正**（PR #60、data 変更なし / DATA_VERSION bump なし / v97 維持）。known_issues.md §1 原因 1 を解決：
  - `src/lib/import-parsed.ts`: 純関数 `inheritClassificationField(newValue, existingValue, fallback='')` を export、`subjectId` / `chapterId` の優先順を (1) 新 OCR → (2) 既存 existingAttr → (3) fallback '' に固定。`PreservedAttrs` に `subjectId` / `chapterId` を追加、preserved Map の条件を撤廃し attr 存在時は常に積むよう変更（旧コードは `isExcluded` / `needsSourceCheck` 有無で条件付けしていて、分類だけ持っていた既存レコードから拾えなかった）
  - `src/components/AuthProvider.tsx`: `prepareLocalDataOnce` を追加し `autoImportIfEmpty → refreshProblemDataIfNeeded → runOneTimeCleanup` を await で直列化。旧 `handleSignIn` は `autoImportIfEmpty()` / `runOneTimeCleanup()` を非 await で呼び競合の余地があったが、これを解消。guest モードのローディング UX は現状維持（`void prepareLocalDataOnce(); setLoading(false);`）
  - `src/lib/import-parsed.test.ts`（新規）: `inheritClassificationField` の優先順 12 ケースを vitest で回帰防止、全 187 テスト pass
  - `isExcluded` / `needsSourceCheck` の継承ロジックは挙動変更なし（既存コードで既に preserved → 新レコードへ復元していた。本修正は preserved Map の収集条件を緩めただけで副作用なし）
  - 残る制約（別トラック）: known_issues.md §1 原因 2（PATCH / localStorage フラグの DATA_VERSION 連動化）・原因 3（`subjectId === ''` 禁止設計）・§2（`needsSourceCheck` Dexie index）は未対応。属性継承が入ったため実害は軽減
  - build green（Next.js 16.2.1 Turbopack、TypeScript pass）、lint は main に pre-existing 38 errors があるが本修正で新規追加なし
- 2026-04-22: v98 反映で **B2 p006-q01 seq2 の ans polarity hotfix を先行**（PR #62, `671eb79`）。現 DB 内で Q「留保あり＝除き、司法審査は及ばない」と E「留保は付されていない」が polarity 逆で自己矛盾していたため、ans=True → False に single byte flip。**Q / E は未修正維持**（`images/0006.png` / `images_preprocessed/0006.png` が repo 内に未存在、`images_preprocessed/` は 0004→0007 で 0006 欠落、`git ls-files` 未追跡、原本照合不能ゆえ verbatim restore は原本到着まで保留）。**二層表現採用**（v96/v97 と同型）：層 1 = polarity hotfix 完了 / 層 2 = Q/E verbatim restore 保留。2026-04-21 read-only 判定で B1 を cosmetic close としていた前提も**誤り**と user directive で判明 → **B1 / B3 / B4 も pending に再分類**（B1: Q+E restore 対象 / B3: ans False→True flip + E restore pending / B4: E 中央 restore + Q 軽微修正 pending）。件数増減：B2 の ans のみ部分 close、Q/E + B1/B3/B4 は active pending（原本画像到着待ち）。
- 2026-04-22: **handoff-only 更新**（post-v98-merge SHA backfill + p006 source 存在ログ, data 変更なし / DATA_VERSION bump なし / v98 維持）。
  - **SHA backfill**: v98 squash merge SHA = `671eb79f622bb797ec78b2c97788edba9ebe7b54`（PR #62）を `latest data merge` / `latest main HEAD at handoff edit time` / 直近 data merge 履歴 の 3 箇所に補完（新方針 3 サイクル目: sync PR なし、次作業 PR 同梱で backfill）。
  - **p006 source 存在ログ**: v98 時点で「原本画像未存在」としていた B 群 p006 について、local の `~/Desktop/kindle_shots/0006.png`（kindle_capture.sh の OUTDIR デフォルト）に DB `p006` 対応の書籍見開き 1 枚が scan されていることを確認。書籍 p.116-117「裁判所」section の「統治行為」小項目ページ、画像左ページ A 2段目 = seq2 Q 冒頭「内閣による衆議院の解散は、高度の政治性を有する国家行為であるから」が一致、右ページ 12 番 = 苫米地事件 E 原本。**ただし現物は低解像度の見開き 1 枚**（字画・句読点・漢字選択の微差は verbatim 確定不能）ゆえ「source existence の確認には使えるが、verbatim restore の根拠としては不十分」（user directive 2026-04-22）。
  - **方針（固定, user directive 2026-04-22）**: local-only 運用ではなく **repo に source を残す** 方針にする。ただし **低解像度 0006.png のみを根拠に本文修正はしない**。直近アクション: (1) p006 seq2 の Q/E 該当箇所の **高解像度 recrop を作成**（user 側作業、Claude は着手しない）→ (2) recrop 画像を **tracked source path** = `images_preprocessed/` に追加（新 PR。`images/` は `.gitignore` 対象で tracked 不可ゆえ使用しない。B5 `0090.png` / B6 `0118.png` が `images_preprocessed/` で tracked されている実績に倣う。`images/` を使う必要が生じた場合は先に `.gitignore` 変更を別 PR で行う）→ (3) その後に限り **B2 seq2 の verbatim restore** を再開。
  - **制約**: 高解像度 recrop 前に Q/E 本文は修正しない / 現 `ans=False` は維持でよい / 優先順 `B2 → B3 → B1 → B4` は維持、**p006 は高解像度 source 収載まで frozen 扱い**。
  - **件数増減**: 形式的には B1-B4 active pending 維持（解除条件のみ「原本画像 repo 追加」→「高解像度 recrop 収載」に更新）。B5-B6 は従前通り `closed to limit of source quality` で高解像度 recrop 待ち。
- 2026-04-22: **p006 source 収載** (本 PR, image addition + handoff-only 更新, data 変更なし / DATA_VERSION bump なし / v98 維持):
  - **source**: `images_preprocessed/0006.png`（6048x3536, 390KB, 既存 B5 / B6 と同仕様）を追加。生成経路 = 既存 local raw `~/Desktop/kindle_shots/0006.png` (3024x1768) を `scripts/preprocess_images.py`（既存 OCR 前処理 pipeline）に通して出力
  - **判定**: user directive 2026-04-22 「Claude 側で自力実行を試す」に応答し、既存 raw + 既存 pipeline で tracked 規格と整合する source を生成 → user 手作業不要
  - **帰結**: B 群 B1-B4 frozen 解除、`pending, source ready` に状態変更。次 v## restore PR から **B2 → B3 → B1 → B4** の順で verbatim restore に着手可能
  - **Q/E verbatim は本 PR では行わない**（scope = image addition + handoff 更新のみ、restore は次 PR）
  - **v99 SHA backfill**: 本 PR（p006 source 収載）の squash merge SHA は次の実作業 PR = v99 = B2 seq2 restore で `latest main HEAD at handoff edit time` / 直近 merge 履歴に backfill 予定（new policy PR #53 準拠、sync-only PR は作らず次 work PR に相乗り）
  - **v98 polarity との整合**: 画像で行 13 解説末尾に「『一見極めて明白に違憲無効と認められる場合を除き』という留保は付されていないという本肢は誤っている」と明記、v98 の ans=False は維持で整合
  - **継続制約**: 既存 B5 / B6 と同仕様ゆえ、一部 fragment が ERROR_UNREADABLE_SOURCE として残置になる可能性は継続（layer 2 = 原本逆算禁止 / future high-res recrop candidate only の運用継続）

**次アクション**: **A 群完走** + **B 群 B6 まで close** + **別領域移行 #1 完了** + **B2 polarity hotfix（v98）完了** + **post-v98-merge handoff-only 更新（PR #63, `0c6ea3b`）完了** + **p006 source 収載（本 PR）完了**。次の優先順：
1. **B 群 p006 verbatim restore**（優先順 `B2 → B3 → B1 → B4` 維持、1 seq / 1 PR、`images_preprocessed/0006.png` を参照して Claude vision read）:
   - 次 PR = v99 = **B2 seq2 Q/E verbatim restore**（ans=False 維持。v99 PR 内で **本 PR = p006 source 収載 PR の squash merge SHA** を `latest main HEAD at handoff edit time` / 直近 merge 履歴に backfill）
   - B3 = E restore + ans False→True flip（統治行為論、判例特定は原本照合後）
   - B1 = Q+E restore（共産党除名事件、旧 cosmetic close 判定は誤り）
   - B4 = E 中央 restore + Q 軽微修正（在宅投票事件）
2. **別領域移行 #2 = `subjectId === ''` 禁止設計**（known_issues.md §3）— 空文字保存自体は許容されたまま。null / sentinel 値への移行は Dexie schema 変更 + 既存データ migration が必要ゆえ別 PR で設計検討から
3. **別領域移行 #3 = `needsSourceCheck` 自動検知**（known_issues.md §5）— CLAUDE.md 第 5 節のルール (`...`/`…` / 助詞重複 / 文末欠落 / 既知 OCR 誤字 / Q-E 極性矛盾 / broad raw / 空 raw) を自動走査する scan runner を追加。Dexie index は §2 と同時着手候補
4. **別領域移行 #4 = OCR パイプラインモデル差し替え**（known_issues.md §4、CLAUDE.md 第 4 節）— `scripts/ocr_batch.*` のみ対象、`kindle_capture.sh` / `reviewed_import.json` 形式 / `importParsedBatch` は維持
5. **B5 / B6 の image-quality-limited fragment は future high-res recrop 待ち**（B5 = `0090.png` 中盤 `...` transitional sentence、B6 = `0118.png` 84条繋ぎ末尾。高解像度 re-crop または手元原本で verbatim 確定できた時点で v## として追加 restore）

<!-- review-handoff:scope:begin -->
## 残件の大分類 (confirmed / inferred)

| 領域 | 状態 | 備考 |
|---|---|---|
| 肢別過去問データの原本照合 | 継続中。p238-q1/q2 は v76 で close 済み | 直近 v75-v76 で個別ページ単位の修正 |
| OCR パイプラインのモデル差し替え | 未着手 | `scripts/ocr_batch.*` が対象（CLAUDE.md 第 4 節） |
| `importParsedBatch` の分類継承バグ | **部分修正済み（2026-04-21, PR #60）** | 原因 1 を解決。`inheritClassificationField` で subjectId / chapterId の継承、cleanup 直列化。原因 2（PATCH 再実行条件）と 原因 3（`''` 禁止）は別トラック。詳細 `known_issues.md` §1 |
| `subjectId === ''` 保存の禁止設計 | 未修正 | `known_issues.md` §3。本修正で空文字上書きの経路 1 本は減ったが、許容設計自体は未変更 |
| `needsSourceCheck` 自動検知ルール | 未実装 | `known_issues.md` §5 |
| context automation Phase M1 | ✅ 完了 | PR #3〜#6 merged、`automation_plan.md` §0 参照。M2 は凍結 |

## 次に触るべき領域 (inferred)

automation は M1 で一旦凍結。本業に戻る方針。優先度順：

1. **累積 recheck queue 整理（A 群完走、B 群 active 完走）** — v88 反映後に CLAUDE.md §5 auto-detection 再走で新規 hit 13 件を検出（A 群 7 件 = 実作業 / B 群 6 件 = 判断保留 / C 群 3 件 = 管理対象外）。**v89-v95 で A 群 7/7 完了**、2026-04-21 B 群再整理：**B1 cosmetic close** / **B2-B4 frozen（p006 画像未存在）** / **v96 で B5 closed to limit of source quality（Q+E 末尾 substantive restore、E 中盤 `...` は ERROR_UNREADABLE_SOURCE 維持）** / **v97 で B6 closed to limit of source quality（E 中盤 教示 3 点列挙 + 書面で + 必要的教示 substantive restore、84条 tail は ERROR_UNREADABLE_SOURCE 維持）** = **B 群 active 2/2 完走**。**二層表現採用**（層 1 = substantive risk mitigated / 層 2 = image-quality-limited fragment unresolved = future high-res recrop candidate only）。**別領域へ移行済み**（下記 2 を参照）。B2-B4 の解凍は `0006.png` repo 追加待ち / B5-B6 の層 2 fragment 確定は高解像度 recrop 待ち。
2. **別領域移行（進行中、優先順は known_issues.md §1-5 に整合）**
   - **#1 `importParsedBatch` 分類継承バグ**: 2026-04-21 PR #60 で**部分修正**（原因 1 解決、原因 2/3 は別トラック）
   - **#2 `subjectId === ''` 禁止設計**（未着手、§3）
   - **#3 `needsSourceCheck` 自動検知**（未着手、§5。Dexie index §2 と同時着手候補）
   - **#4 OCR パイプラインモデル差し替え**（未着手、§4、`scripts/ocr_batch.*` のみ対象）
3. **原本照合の継続** — 未処理ページが残る場合、直近フェーズと同じスタイルで続行可能
   - 未処理ページは `data/` 配下の ledger / pending 系 CSV を参照
   - 新規ページに着手する前に `data/*ledger*.json` と `data/pending_*.csv` を確認
4. **`MIGRATION_CANDIDATES.md` の実行判断（保留可）** — 余力時に判断
<!-- review-handoff:scope:end -->

## 現時点の未確定事項 (unverified)

- `data/reviewed_import.json` と `public/data/reviewed_import.json` の同期手順
  （手動コピーか、ビルド時コピーか、シンボリックリンクか）
- `scripts/run_auto_pipeline.sh` の実行順と現在も使われているか
- `scripts/patch_*.py` 系が履歴用か恒常使用か
- `docs/` 内のどれが stable policy で、どれが一時メモか（`MIGRATION_CANDIDATES.md` で整理予定）

## 避けるべきアクション

- 大規模ファイル移動（本セッションでは意図的に保留）
- `AGENTS.md` の既存 Next.js ブロック削除
- `CLAUDE.md` の書き換え（`@AGENTS.md` import が崩れないよう）
- `subjectId = ''` を温存するような修正
- 根拠不明を理由に `isExcluded` を立てること（`needsSourceCheck` に寄せる）

## 参照先の優先順位

- 判断基準: `AGENTS.md`（本 repo 内）
- ルール / 前提: `context/stable/`
- 現在状況: `context/working/`（本ファイル含む）
- 詳細設計: `docs/`（必要時のみ）
- repo 外 user memory (`~/.claude/projects/.../memory/*.md`): **補助**。
  - 現状 `study_schedule.md` / `data_import_plan.md` / `session_handoff.md` などがあるが、
    **source of truth は本 repo の `context/`**。競合時は repo 内を優先する。
  - memory 側の情報で重要なものは、適宜本ファイルに転記する。
