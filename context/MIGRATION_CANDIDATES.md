# 移設候補一覧（実行せず提案のみ）

本ファイルは **提案リスト**。実ファイル移動は行っていない。
採用可否は個別判断。**すぐ移すべきもの** と **後回しでよいもの** を分けて記す。

## A. すぐ移しても低リスク（ほぼ pure 追加・参照のみ）

| 現在位置 | 移設候補 | 理由 | 種別 |
|---|---|---|---|
| (新規) | `context/stable/*.md` | 本セッションで新設済み | done |
| (新規) | `context/working/*.md` | 本セッションで新設済み | done |

## B. 参照追加 or symlink で済む（移動は保留）

| 対象 | 提案 | 理由 |
|---|---|---|
| `docs/` 配下の OCR policy 類 | `context/stable/data_rules.md` からリンク | OCR 方針は stable 扱いだが、詳細は `docs/` のまま保持 |
| `docs/` 配下の section / title policy 類 | `context/stable/review_policy.md` からリンク | 章立て規則の根拠ドキュメント |
| `docs/` 配下の audit runbook 類 | `context/stable/commands_and_checks.md` からリンク | 実行手順として参照 |
| `docs/` 配下の legal / data cleanup 類 | `context/working/known_issues.md` からリンク | 現在進行中の cleanup 方針 |
| `docs/` 配下の hold memo 類 | `context/working/known_issues.md` からリンク | 個別保留メモ（inferred） |
| `docs/` 配下の audit coverage 記述類 | `context/working/known_issues.md` からリンク | 未カバー領域の記述（inferred） |
| `docs/` 配下の structured audit design 類 | `context/stable/commands_and_checks.md` からリンク | 設計側なので stable 寄せ |

> 個別ファイル名は **Phase 2 実行時**に `docs/` の当時の実在ファイルを確認して確定する。本一覧はカテゴリ単位の提案。

方針: **`docs/` は動かさず、`context/` から path を参照する**。
理由: `docs/` は既にコミット履歴が積み上がっており、path 変更 = git log 追跡コスト。

## C. 判断保留（後回し）

| 対象 | 現状 | 検討事項 |
|---|---|---|
| `data/BASELINE_V15.md` | `data/` 配下 | policy 系 md だが `data/` にある。`docs/` か `context/stable/` に寄せる価値あり。ただし関連 JSON（`final_consistency_report_v15.json` 等）が近くにある利点を失う（unverified） |
| `data/qa_draft_*.csv` / `data/qa_draft_*.json` | `data/` 配下 | 生成物っぽい。将来 `outputs/` を作るなら移設候補 |
| `data/vision_round2_*.csv` / `data/vision_round2_*.txt` | `data/` 配下 | 同上 |
| `data/parsed_*.json` | `data/` 配下 | 中間生成物。`outputs/intermediate/` が適切 |
| `data/reviewed_import.json.bak_p051` | `data/` 配下 | バックアップ。`archive/` を新設して退避可能 |
| `scripts/fix_final_3.py` / `patch_flagged_original29.py` 等の patch 系 | `scripts/` 配下 | 1 回使い捨ての可能性。`scripts/archive/` や `scripts/patches/` に分類したい（unverified） |

**判断基準** (inferred):
- スクリプトが「再現性のあるパイプライン」の一部 → `scripts/` 直下
- 「1 回限りの手当て（patch_p3_batch01.py 等）」 → 別ディレクトリ（`scripts/patches/` 提案）
- 中間生成物 → `outputs/` 新設（今回は作らない）

## D. 絶対動かしてはいけないもの (confirmed)

- `AGENTS.md`（`CLAUDE.md` が `@AGENTS.md` import）
- `CLAUDE.md`（auto memory / 振り分けルールの本体）
- `public/data/reviewed_import.json`（Next.js が public 直下を前提に配信）
- `src/**`（Next.js App Router 前提）
- `.claude/`（settings / skills / launch.json）
- `package.json` / `package-lock.json` / `next.config.ts` / `eslint.config.mjs` / `postcss.config.mjs` / `tsconfig.json` / `vitest.config.ts`
- `supabase_setup.sql`（参照 path が他にある可能性、unverified）
- `images_preprocessed/`（OCR パイプライン前提 path）

## E. 今は作らないが名前だけ予約しておきたい (提案)

現段階では空ディレクトリを作らない。必要になったら新設：

- `outputs/`（生成物置き場）
- `tmp/`（一時物）
- `archive/`（旧版退避）
- `inbox/`（所属不明ファイル一時置き）

---

## 実行フェーズ分け

- **今回（Phase 1）**: `context/` 新設と本一覧作成のみ。既存ファイルは動かさない
- **Phase 2（別セッション）**: B の参照追加（リンク挿入のみ、移動はしない）
- **Phase 3（別セッション）**: C の検討結果に基づいて `scripts/patches/` 等の新設
- **Phase 4（将来）**: `outputs/` / `archive/` の運用開始
