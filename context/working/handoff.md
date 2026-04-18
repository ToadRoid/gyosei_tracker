# handoff — 次セッション引き継ぎ

最終更新: 2026-04-18 (automation M1 closeout)

**本ファイル単体で引き継ぎが成立することを目標にする**。repo 外 memory は補助扱い。

<!-- review-handoff:scope:begin -->
## 残件の大分類 (confirmed / inferred)

| 領域 | 状態 | 備考 |
|---|---|---|
| 肢別過去問データの原本照合 | 継続中 | 直近 v54-v58 で個別ページ単位の修正 |
| OCR パイプラインのモデル差し替え | 未着手 | `scripts/ocr_batch.*` が対象（CLAUDE.md 第 4 節） |
| `importParsedBatch` の分類継承バグ | 未修正 | `known_issues.md` §1 |
| `subjectId === ''` 保存の禁止設計 | 未修正 | `known_issues.md` §3 |
| `needsSourceCheck` 自動検知ルール | 未実装 | `known_issues.md` §5 |
| context automation Phase M1 | ✅ 完了 | PR #3〜#6 merged、`automation_plan.md` §0 参照。M2 は凍結 |

## 次に触るべき領域 (inferred)

automation は M1 で一旦凍結。本業に戻る方針。優先度順：

1. **原本照合の継続（本業・最優先）** — 直近フェーズが個別ページ単位のため、同じスタイルで続行可能
   - 未処理ページは `data/` 配下の ledger / pending 系 CSV を参照
   - 新規ページに着手する前に `data/*ledger*.json` と `data/pending_*.csv` を確認
2. **`MIGRATION_CANDIDATES.md` の実行判断（保留可）** — 無害な移設（`docs/` の policy 類を `context/stable/` から参照追加）だけ先行するか判断。本業を優先し、余力があれば手を付ける
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