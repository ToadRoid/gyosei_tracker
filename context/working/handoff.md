# handoff — 次セッション引き継ぎ

最終更新: 2026-04-19 (v76 close reflection)

**本ファイル単体で引き継ぎが成立することを目標にする**。repo 外 memory は補助扱い。

## 現在地（confirmed, 2026-04-19 v76 close 後）

* **main HEAD**: `fec03720314951e32e9d105ba1116fa7904f47a3`
* **総ページ**: 239 / **総肢**: 1312（不変）
* **DATA_VERSION**: `2026-04-19-audit-v76-polarity-p238-q1-q2-2flips`
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

### C レーン残件（新規追加）

* ~~p238-q2 explanation 132条2項 → 131条2項~~ → PR #31 で close

### post-v76 housekeeping

* leaked-key 由来の ephemeral JSON 削除済み
* 旧 PR branch / tmp branch cleanup 実施済み
* Gemini leaked key 2 本の rotate 完了（2026-04-19）：旧 2 本失効済み / 新 1 本発行済み / 値は未記載

## 次セッション最優先タスク

### 1. 累積 recheck queue 整理（C レーン一括 PR 候補）

C レーン先頭（次に触るべき 1 件）= **p214 seq1-3 追跡項目**

* p214 seq1-3 追跡項目
* p219-q3 substantive 差
* p227 seq1/seq2/seq3 polarity / sectionTitle drift
* cosmetic OCR 揺れ ~7 件

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

1. **累積 recheck queue 整理（最優先）** — C レーン一括 PR 候補を束ねる（p238-q2 E 誤記、p214 seq1-3 追跡、p219-q3 substantive 差、p227 seq1/seq2/seq3 polarity / sectionTitle drift、cosmetic OCR 揺れ ~7 件）
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
