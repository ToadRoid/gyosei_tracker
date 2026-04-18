# コマンド / 確認手順

## npm スクリプト (confirmed, from package.json)

| コマンド | 用途 |
|---|---|
| `npm run dev` | Next.js dev server 起動 |
| `npm run build` | プロダクションビルド |
| `npm run start` | ビルド後起動 |
| `npm run lint` | ESLint |
| `npm run test` | vitest 単発 |
| `npm run test:watch` | vitest watch |

## プレビュー運用 (confirmed, from .claude/launch.json)

- dev server は Claude Preview MCP (`preview_start`) 経由で起動
- Bash で `npm run dev` を長時間稼働させない（MCP 前提）

## OCR / データパイプライン (inferred, 要検証)

ファイル名から推定した起動順（**未検証**。実行前に `scripts/` 内のコメント / shebang / help を確認すること）：

```
scripts/kindle_capture.sh       # Kindle スクショ（実機 iPad 想定）
scripts/preprocess_images.py    # images_preprocessed/ 生成
scripts/ocr_batch.sh            # OCR 実行（モデル差し替え対象）
scripts/ocr_to_intermediate.py  # parsed_*.json 生成
scripts/make_review_queue.py    # qa_draft_*.csv 生成
scripts/apply_review.py         # reviewed_import.json 反映
scripts/stage_import.js         # Dexie への取り込み用 staging
```

補助スクリプト（用途は名前からの推測のみ。**unverified**）:
- `audit_legal_consistency.py` / `run_chapter_audit.sh` — 整合監査
- `verify_and_promote_rfr.py` / `auto_promote_draft.py` — 昇格処理
- `patch_*.py` — 個別肢の手当て（履歴用、恒常使用ではない可能性）

## データ変更後の確認 (推奨手順, inferred)

1. `data/reviewed_import.json` を更新（正本）
2. `public/data/reviewed_import.json` と同期（下記「同期確認」を必須）
3. `npm run dev` でアプリを起動し、該当ページ / 問題 ID を画面確認
4. `subjectId === ''` / `isExcluded` / `needsSourceCheck` が意図通りか確認
5. `npm run test` と `npm run lint`
6. コミット（`vNN:` プレフィックスと件数明記）

## 2 つの `reviewed_import.json` の同期確認 (必須)

正本は `data/reviewed_import.json`。UI が読むのは `public/data/reviewed_import.json`。
**同期方法が未確認 (unverified)** の間は、以下の差分確認を**必ず**実施する：

1. **正本の明示**: `data/reviewed_import.json` が正本。`public/data/` 側はコピー扱い
2. **主判定 — diff / 件数整合** （必須）
   - `diff data/reviewed_import.json public/data/reviewed_import.json` で差分を確認
   - `jq 'length'` 等で含まれる問題数（肢数）が一致するか確認
   - バイト数が一致するか確認
3. **補助指標 — 更新時刻**
   - `ls -l data/reviewed_import.json public/data/reviewed_import.json` で mtime 順を確認
   - ただし mtime は**補助指標**。touch や VCS チェックアウトで前後することがあるため、これだけで同期判定しない
4. **片方だけ更新された形跡**があれば、`data/` 側を source として上書き方向を決める
5. 同期後、dev server で対象問題を開き、意図した内容が表示されているかを画面確認

> 同期スクリプトが確定したら、本節と `data_rules.md` を更新する。現時点では**手動同期を前提**に差分確認だけは省略しない。

## 未検証事項 (unverified)

- `public/data/reviewed_import.json` の同期手順（手動コピーか、ビルド時コピーか、シンボリックリンクか）
- `scripts/run_auto_pipeline.sh` の実際の構成
- `data/golden_test_cases.json` を使う test runner の場所
