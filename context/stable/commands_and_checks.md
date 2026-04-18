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
4. **フラグごとの合格条件を個別確認**
   - `subjectId`: 空文字 / null / `undefined` でないこと。`resolveChapter()` で解決された値か既存値の引き継ぎであること
   - `chapterId`: 空文字でないこと。原本の章立てに対応する値であること
   - `isExcluded`: 意図した肢のみ `true`。他肢は既存値を保持していること
   - `needsSourceCheck`: 原本確認済みの肢のみ `false`。未確認は `true` を維持
   - `answerBoolean`: Q / E の極性と一致（review_policy.md §整合確認の実行順序 参照）
5. **テスト / lint 確認**
   - `npm run test`: **全件 pass 必須**
   - `npm run lint`: 既存負債があるため**無条件 pass は期待しない**。本変更起因で**新規の warning / error が追加されていない**ことを確認（差分監視）
6. コミット（`vNN:` プレフィックスと件数明記）

## 2 つの `reviewed_import.json` の同期確認 (必須)

正本は `data/reviewed_import.json`。UI が読むのは `public/data/reviewed_import.json`。
**同期方法が未確認 (unverified)** の間は、以下の差分確認を**必ず**実施する：

1. **正本の明示**: `data/reviewed_import.json` が正本。`public/data/` 側はコピー扱い
2. **主判定 — diff / 件数整合** （必須）
   - `diff data/reviewed_import.json public/data/reviewed_import.json` で差分を確認（差分ゼロが理想）
   - **件数定義**: ここでの「件数」は **問題数（= 肢数, 1 肢 = 1 エントリ）**。ページ数ではない
   - `jq 'length'` 等で両ファイルの**肢数が一致**するか確認
   - 参考として**バイト数**も一致するか確認（JSON 整形差で ±数 byte はあり得るため補助指標）
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
