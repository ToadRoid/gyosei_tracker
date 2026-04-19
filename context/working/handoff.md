# handoff — 次セッション引き継ぎ

最終更新: 2026-04-20 (OCR pending queue 明示化)

**本ファイル単体で引き継ぎが成立することを目標にする**。repo 外 memory は補助扱い。

## 現在地（confirmed, 2026-04-19 v78 close 後）

* **main HEAD**: `63d021c0a304dd798cbae01753ea6b2a884e0963`
* **総ページ**: 239 / **総肢**: 1312（不変）
* **DATA_VERSION**: `2026-04-19-audit-v78-p227-seq1-seq3-polarity-seq2-sectionTitle`
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

### post-v76 housekeeping

* leaked-key 由来の ephemeral JSON 削除済み
* 旧 PR branch / tmp branch cleanup 実施済み
* Gemini leaked key 2 本の rotate 完了（2026-04-19）：旧 2 本失効済み / 新 1 本発行済み / 値は未記載

## 次セッション最優先タスク

### 1. 累積 recheck queue 整理（C レーン一括 PR 候補）

C レーン先頭（次に触るべき 1 件）= **OCR pending queue の先頭項目（下記 §2）**

* ~~p214 seq1-3 追跡項目~~ → 2026-04-19 照合済み close（polarity / 条文整合 / ledger `master_correction_ledger.json` の 2026-04-07 fix と整合、修正不要）
* ~~p227 seq1/seq2/seq3 polarity / sectionTitle drift~~ → v78 で close（PR #32）

### 2. OCR pending queue（browser OCR / vision 要）

旧「cosmetic OCR 揺れ ~7 件」を廃止し、明示列挙に置換（2026-04-20）。
CLAUDE.md §5 auto-detection rule で scan した結果、単純 typo-replace で安全に直せる純 cosmetic は 0 件。全件 **substantive OCR 破損 = browser OCR / vision 要**。いずれも未 close。

**運用**:

* 修正は **1 ページずつ別 PR**（バンドル禁止、page-by-page PR 対象）
* browser OCR / vision で正文確定後に着手
* 確定前は polarity / ledger を触らない

**列挙（7 件, 2026-04-20 scan 時点）**:

| # | 対象 | 症状 | 状態 |
| --- | --- | --- | --- |
| 1 | p219-q01 seq3 Q | `結婚の式授挙` （event 破損、`30条2項` 特別失踪 trigger と不整合） | OCR pending / watch（polarity `ans=false` は現状正しい） |
| 2 | p227-q01 seq2 Q | `知ることができる適当先がなかった` （単純 typo ではなく文構造ごと破損疑い、第三者強迫主語も揺れ） | OCR pending |
| 3 | p227-q01 seq3 E | `被補佐人` 周辺（同 E 内に `成年被後見人と成年被後見人` 重複、`13歳2項110号` 不明 garble 併発、単語差し替えで済まない） | OCR pending |
| 4 | p062-q01 seq7 Q | Q 文末欠落疑い（`...` / `…` を含む） | OCR pending |
| 5 | p078-q01 seq4 Q | Q 文末欠落疑い | OCR pending |
| 6 | p119-q01 seq1 Q | Q 文末欠落疑い | OCR pending |
| 7 | p136-q01 seq4 Q | Q 文末欠落疑い | OCR pending |

**件数増減のルール**: 新たな scan hit や user 指摘で 7 件から増減する場合、理由を 1 行ずつ本表末に追記する。

**次アクション**: queue の先頭（`p219-q01 seq3 Q`）を browser OCR で確定 → Q text のみ修正の small PR。

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

1. **累積 recheck queue 整理（最優先）** — OCR pending queue を 1 ページずつ page-by-page PR で消化（上記 §2 の 7 件、先頭は `p219-q01 seq3 Q`）
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
