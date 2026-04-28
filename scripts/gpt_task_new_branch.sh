#!/usr/bin/env bash
set -euo pipefail

branch="${1:-}"
if [ -z "$branch" ]; then
  echo "usage: bash scripts/gpt_task_new_branch.sh <branch-name>"
  exit 2
fi

root="$(git rev-parse --show-toplevel)"
cd "$root"

git fetch origin

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "ERROR: tracked working tree is dirty. Stop."
  git status -sb --untracked-files=no
  exit 1
fi

git switch -c "$branch" origin/main

echo "created branch from origin/main:"
git status -sb --untracked-files=no
git log --oneline -3
