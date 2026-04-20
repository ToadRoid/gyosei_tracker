# handoff — 次セッション引き継ぎ

最終更新: 2026-04-20 (v84：p062-q01 seq7 Q+E 原本復元、polarity 非影響、実作業先頭を p078 へ)

**本ファイル単体で引き継ぎが成立することを目標にする**。repo 外 memory は補助扱い。

## 現在地（confirmed, 2026-04-20 v84 反映後）

* **main HEAD**: `08e31b1d847dd7b53108137e059e0e247e703d54`（v84 squash merge, PR #39）
* **総ページ**: 239 / **総肢**: 1312（不変）
* **DATA_VERSION**: `2026-04-20-audit-v84-p062-q01-seq7-q-and-e-restore`
* **L1 本線**: ✅ 実質完了維持

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

### 2. OCR pending queue（browser OCR / vision 要）

旧「cosmetic OCR 揺れ ~7 件」を廃止し、明示列挙に置換（2026-04-20）。
CLAUDE.md §5 auto-detection rule で scan した結果、単純 typo-replace で安全に直せる純 cosmetic は 0 件。全件 **substantive OCR 破損 = browser OCR / vision 要**。いずれも未 close。

**運用**:

* 修正は **1 ページずつ別 PR**（バンドル禁止、page-by-page PR 対象）
* browser OCR / vision で正文確定後に着手
* 確定前は polarity / ledger を触らない

**列挙（4 件, 2026-04-20 v84 反映後）**:

| # | 対象 | 症状 | 状態 |
| --- | --- | --- | --- |
| — | p227-q01 seq3 E 条文引用 | `13歳2項110号` の digit garble。画像単独では digit 確定不能（`13条1項10号` は OCR 誤字パターンとしては自然だが legal fit 弱く、推定復元を repo に入れるべきでないと判断）。polarity / 出題ロジック 非影響 | **requires user browser OCR or book reference**（実作業キューから除外、外部確認入り次第再開） |
| 1 | p078-q01 seq4 Q | Q 文末欠落疑い | OCR pending |
| 2 | p119-q01 seq1 Q | Q 文末欠落疑い | OCR pending |
| 3 | p136-q01 seq4 Q | Q 文末欠落疑い | OCR pending |

※ 上表の `#` は **実作業キューの順序**。`p227-q01 seq3 E 条文引用` は外部確認待ちで実作業キューから外したため `—` とし、残存は明示する。

**件数増減のルール**: 新たな scan hit や user 指摘で件数が増減する場合、理由を 1 行ずつ本表末に追記する。

- 2026-04-20: v81 反映で `p219-q01 seq3 Q` を close（-1 → 6 件）
- 2026-04-20: v82 反映で `p227-q01 seq2 Q` を close（substantive restore：Q + E + polarity 束ねて修正）（-1 → 5 件）
- 2026-04-20: v83 反映で `p227-q01 seq3 E` 高信頼4箇所を close、条文引用 `13歳2項110号`（低信頼）を新規 #1 に差し替え（±0 → 5 件）
- 2026-04-20: handoff-only 更新。`p227-q01 seq3 E 条文引用` を `requires user browser OCR or book reference` に降格し実作業キューから除外（±0 → 5 件、実作業は 4 件）。理由：画像 digit 断定不能、legal fit 弱く、推定復元は repo に入れない方針。close しない。
- 2026-04-20: v84 反映で `p062-q01 seq7 Q+E` を close（Q OCR 誤字 + Q/E 文末欠落を原本復元、行政代執行法2条 整合、polarity 非影響）（-1 → 4 件、実作業は 3 件）

**次アクション**: 実作業キューの先頭（`p078-q01 seq4 Q`）を原本読取（0078.png）で確定 → Q text のみ small PR。条文引用（p227 seq3 E）は外部確認（browser OCR or 書籍現物）入り次第に再開し、その時点で別 PR。

<!-- review-handoff:scope:begin -->
## 残件の大分類 (confirmed / inferred)

| 領域 | 状態 | 備考 |
|---|---|---|
| 肢別過去問データの原本照合 | 継続中。p238-q1/q2 は v76 で close 済み | 直近 v75-v76 で個別ページ単位の修正 |
| OCR パイプラインのモデル差し替え | 未着手 | `scripts/ocr_batch.*` が対象（CLAUDE.md 第 4 節） |
| `importParsedBatch` の分類継承バグ | 未修正 | `known_issues.md` §1 |
| `subjectId === ''` 保存の禁止設計 | 未修正 | `known_issues.md` §3 |
| `needsSourceCheck` 自動検知ルール | 未実装 | `known_issues.md` §5 |
| context automation Phase M1 | ✅ 完了 | PR #3〜#6 merged、`automation_plan.md` §0 参照。M2 は凍結 |

## 次に触るべき領域 (inferred)

automation は M1 で一旦凍結。本業に戻る方針。優先度順：

1. **累積 recheck queue 整理（最優先）** — OCR pending queue を 1 ページずつ page-by-page PR で消化（上記 §2 の実作業 3 件、先頭は `p078-q01 seq4 Q`）。`p227-q01 seq3 E 条文引用` は外部確認待ちで別扱い
2. **原本照合の継続** — 未処理ページが残る場合、直近フェーズと同じスタイルで続行可能
   - 未処理ページは `data/` 配下の ledger / pending 系 CSV を参照
   - 新規ページに着手する前に `data/*ledger*.json` と `data/pending_*.csv` を確認
3. **`MIGRATION_CANDIDATES.md` の実行判断（保留可）** — 余力時に判断
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
