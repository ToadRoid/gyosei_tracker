#!/usr/bin/env bash
set -euo pipefail

title="${1:-}"
body_file="${2:-}"
base="${3:-main}"

if [ -z "$title" ] || [ -z "$body_file" ]; then
  echo "usage: bash scripts/gpt_task_create_pr.sh <title> <body-file> [base]"
  exit 2
fi

if [ ! -f "$body_file" ]; then
  echo "ERROR: body file not found: $body_file"
  exit 1
fi

root="$(git rev-parse --show-toplevel)"
cd "$root"

head="$(git branch --show-current)"
if [ -z "$head" ]; then
  echo "ERROR: current branch is empty"
  exit 1
fi

git push -u origin "$head"

if gh pr view "$head" --json number,state,url,title >/tmp/gpt_task_existing_pr.json 2>/dev/null; then
  echo "PR already exists:"
  cat /tmp/gpt_task_existing_pr.json
else
  gh pr create \
    --base "$base" \
    --head "$head" \
    --title "$title" \
    --body-file "$body_file"
fi

echo
echo "===== PR ====="
gh pr view "$head" --json number,state,mergeStateStatus,headRefName,baseRefName,title,url

echo
echo "===== tracked status ====="
git status -sb --untracked-files=no
