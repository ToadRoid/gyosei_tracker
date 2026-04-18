# automation_plan — context 自動アップデート / 自動クリーンアップ 設計案

最終更新: 2026-04-18

> **本ファイルは設計案であり、未実装。stable の source of truth ではない。**
> 運用ルールとして固定する段階ではなく、以後の議論の基準点とするための草案。
> 本ファイルの内容を根拠に stable/ を書き換えないこと。

## 1. 設計方針

1. **Source of truth は明示固定**。自動化は「派生物の再生成」に限る。stable/ は人手編集のみ。
2. **git log / git status / gh pr で観測できる事実 だけを自動転記対象にする**。意図・判断・優先度は人手。
3. **自動化は全て "提案 → 人間承認 → commit" の 2 段階**。LLM が stable/ を直接書き換えない。
4. **失敗したら何もしないのが正解**（冪等・中止可能）。壊れた自動更新で context が退化するのが最悪シナリオ。
5. **gyosei_tracker 単体で完結**。現時点では他 repo / meta repo に依存しない（`FUTURE_META_REPO.md` はあくまで将来案）。

## 2. 更新対象一覧

| ファイル | 自動化適性 | 理由 |
|---|---|---|
| `context/stable/project_overview.md` | ❌ 不可 | 事業判断・前提の人手記述 |
| `context/stable/data_rules.md` | ❌ 不可 | ルール定義。stable の中核 |
| `context/stable/review_policy.md` | ❌ 不可 | 同上 |
| `context/stable/commands_and_checks.md` | △ 半自動 | `package.json` script との差分検知のみ |
| `context/working/current_status.md` | ✅ 主対象 | "直近の活動" は `git log --oneline -N` と 1:1、worktree も `git worktree list` |
| `context/working/handoff.md` | △ 半自動 | "残件テーブル" の done 化だけ（PR merge 検知）。新規残件追加は人手 |
| `context/working/known_issues.md` | △ 半自動 | resolved 時のチェックのみ。原因分析は人手 |
| `context/MIGRATION_CANDIDATES.md` | △ 半自動 | 参照先の dangling 検知のみ |
| `context/FUTURE_META_REPO.md` | ❌ 不可 | 将来案メモ |
| `context/README.md` | ❌ 不可 | 目次。ファイル追加時のみ人手 |
| `AGENTS.md` / `README.md` | ❌ 不可 | 人手 |
| repo 外 memory (`~/.claude/.../memory/*.md`) | ❌ 自動化対象外 | source of truth ではない |

## 3. cleanup 対象一覧

stale 判定の原則は **「観測可能な完了シグナル」があるもののみ**。推測で消さない。

| 対象 | stale 判定根拠 | 自動 or 人手 |
|---|---|---|
| `handoff.md` 残件テーブルの done 行 | 対応する PR が merged / issue が closed | 自動提案 → 人手承認 |
| `known_issues.md` の resolved 項目 | 修正 commit の grep / CLAUDE.md 該当節削除 | 自動提案 → 人手承認 |
| `current_status.md` の古い "直近の活動" | git log と diff があるとき全置換 | 自動（承認 1 回） |
| `MIGRATION_CANDIDATES.md` の dangling 参照 | 参照先ファイルが存在しない | 自動検知のみ（削除は人手） |
| 各 md の `最終更新: YYYY-MM-DD` | 本文 diff 有 = 更新日も更新 | 自動 |
| repo 外 memory との重複 | `context/` に同旨記述が存在 | **削除しない**（memory 側に "context 優先" 注記のみ） |
| `docs/` 内の一時メモ | `MIGRATION_CANDIDATES.md` の分類完了後 | 人手のみ |

**絶対に自動削除しない**:

- stable/ 配下の行
- `handoff.md` の "避けるべきアクション" セクション
- 根拠不明な "古そうな" 記述
- `CLAUDE.md` / `AGENTS.md` の内容

## 4. トリガ案

| トリガ | 想定アクション | 実装手段候補 |
|---|---|---|
| **セッション開始時** | `handoff.md` 読込、PR merge / commit 差分を表示 | Claude Code の SessionStart hook |
| **commit 直後** | `current_status.md` 再生成プレビュー | post-commit hook（git）/ PostToolUse hook |
| **PR merge 検知** | `handoff.md` done 行の提案、`current_status.md` 更新 | `gh pr list --state merged` 定期ポーリング or GitHub Actions |
| **セッション終了時** | `handoff.md` 追記プロンプト（残件・未確定事項） | Stop hook / SessionEnd |
| **手動** | `/update-context` のような slash command | Claude Code user skill |
| **`package.json` / `scripts/` 変更時** | `commands_and_checks.md` 差分警告 | PostToolUse（Edit/Write 後） |

**推奨トリガ優先度**:

1. 手動 slash command（誤動作被害が最小）
2. セッション開始時読込（書き込まない）
3. commit 直後のプレビュー（書き込みは承認制）
4. その他は将来

## 5. ガードレール

| 種別 | 内容 |
|---|---|
| **書込制限** | stable/ は自動書込禁止。working/ のみ対象 |
| **差分サイズ上限** | 1 回の自動更新で ±20 行超なら中止 → 人手へ |
| **diff プレビュー必須** | 自動コミット禁止。常に `git diff` を提示 |
| **dry-run モード** | 既定は提案のみ。`--apply` で初めて書込 |
| **ロールバック性** | 自動更新は単一 commit で記録、revert しやすい形に |
| **メタデータ保護** | `最終更新:` 以外のヘッダは変更不可 |
| **"unverified" / "inferred" 注記の保護** | 自動で "confirmed" に昇格させない |
| **repo 外 memory は読み取り専用** | 自動書込対象外 |
| **除外パス明示** | `CLAUDE.md`, `AGENTS.md`, `README.md`, `context/stable/**` は自動化スコープ外 |

## 6. 最小導入案（いま入れてよいもの）

### Phase M1（実装コスト小 / 副作用小）

1. **`/update-status` slash command**
   - `git log --oneline -10` を `current_status.md` の "直近の活動" に整形投入
   - diff を表示するだけ、commit はしない
   - 実装: `.claude/commands/update-status.md` に skill 定義

2. **`/review-handoff` slash command**
   - `gh pr list --state merged --limit 5` と `handoff.md` 残件テーブルを突き合わせ、done 候補を提示
   - 削除は人手編集で

3. **セッション開始時の read-only チェックスクリプト**
   - `scripts/context_check.sh`（新規、依存なし bash）
   - `handoff.md` の "最終更新" 日付が 7 日以上古ければ warning
   - `MIGRATION_CANDIDATES.md` の参照先で欠損しているものを一覧

4. **`最終更新:` フィールドの定型**
   - 今ある 3 ファイル（current_status / handoff / known_issues）で表記統一
   - 将来 grep で検出しやすくするための整備のみ、自動化は後

この 4 つはいずれも **新規ファイル追加 or 1 行定型調整** のみで、既存ファイル移動・削除は発生しない。

### 将来案として保留

- PR merge をトリガにした自動更新フロー（GitHub Actions）
- `known_issues.md` の resolved 自動検出（commit message 解析が必要、誤検知リスク）
- `docs/` 分類・`MIGRATION_CANDIDATES.md` 実行（人手判断が濃い）
- repo 外 memory との整合チェッカ（source of truth 混線リスク、メタ repo 化と同時が望ましい）
- commit / PostToolUse hook による自動プレビュー（誤爆時のリカバリコスト高）
- 複数 repo 横断の context 同期（`FUTURE_META_REPO.md` 側）

## 7. 実装着手順

現時点で確定している着手順（2026-04-18 時点）:

1. **本ファイルの保存**（完了予定：本コミット）
2. **`scripts/context_check.sh`** の read-only 実装（Phase M1-3 の一部）
3. それ以降は未確定。Phase M1 の他 3 項目は個別に判断する。
