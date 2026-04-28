# task-runner-tools handoff

## Task

gyosei_tracker の GPT主導・User手動実行フローを簡略化するため、補助スクリプトを追加した。

## Background

直前の review-syllabus-tab タスクでは、以下が手動負荷になった。

- 長い複数コマンド貼り付け
- zsh の制御文字混入
- 未追跡 data ファイルの大量ノイズ
- local main が Claude worktree に掴まれている問題
- commit対象確認 / PR作成 / handoff記録の反復

## Implemented

以下の補助スクリプトを追加した。

- `scripts/gpt_task_precheck.sh`
  - repo / branch / origin/main / tracked status / untracked count / worktree 状況を確認する。
- `scripts/gpt_task_new_branch.sh`
  - local main に切り替えず、`origin/main` から作業ブランチを作成する。
- `scripts/gpt_task_commit_selected.sh`
  - 明示ファイルだけを stage し、`diff --check` と対象外stage混入チェック後に commit する。
- `scripts/gpt_task_create_pr.sh`
  - current branch を push し、PRを作成または既存PRを表示する。
- `scripts/gpt_task_record_handoff.sh`
  - session別 handoff.md の雛形を作成する。

## Usage pattern

基本フロー:

```bash
bash scripts/gpt_task_precheck.sh <task-slug>
bash scripts/gpt_task_new_branch.sh <branch-name>
bash scripts/gpt_task_commit_selected.sh "<commit message>" -- <file1> <file2>
bash scripts/gpt_task_create_pr.sh "<PR title>" <body-file> main
bash scripts/gpt_task_record_handoff.sh <session-id> "<title>"
Scope

This is tooling/docs only.

No application feature logic, data, DATA_VERSION, OCR, section normalization, or quiz content is changed.

Current status

This branch adds the helper scripts and this handoff only.

Next step is PR review and merge.
