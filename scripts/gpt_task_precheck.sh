#!/usr/bin/env bash
set -euo pipefail

task="${1:-}"
if [ -z "$task" ]; then
  echo "usage: bash scripts/gpt_task_precheck.sh <task-slug>"
  exit 2
fi

root="$(git rev-parse --show-toplevel)"
cd "$root"

git fetch origin

echo "===== repo ====="
echo "$root"

echo
echo "===== task ====="
echo "$task"

echo
echo "===== branch ====="
echo "current: $(git branch --show-current || true)"
echo "HEAD:    $(git rev-parse --short HEAD)"
echo "origin/main: $(git rev-parse --short origin/main)"

echo
echo "===== tracked status ====="
git status -sb --untracked-files=no

echo
echo "===== untracked summary ====="
git status --porcelain | awk '
  /^\?\?/ { count += 1 }
  END { print "untracked_count:", count + 0 }
'

echo
echo "===== worktrees ====="
git worktree list

echo
echo "===== recommendation ====="
echo "Use origin/main as base. Do not switch to local main if it is occupied by another worktree."
echo "Example:"
echo "  git switch -c <task-branch> origin/main"
