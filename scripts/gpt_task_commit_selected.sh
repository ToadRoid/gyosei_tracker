#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "usage: bash scripts/gpt_task_commit_selected.sh <commit-message> -- <file> [file...]"
  exit 2
fi

commit_msg="$1"
shift

if [ "${1:-}" != "--" ]; then
  echo "ERROR: missing -- separator"
  echo "usage: bash scripts/gpt_task_commit_selected.sh <commit-message> -- <file> [file...]"
  exit 2
fi
shift

if [ "$#" -lt 1 ]; then
  echo "ERROR: no files specified"
  exit 2
fi

files=("$@")

root="$(git rev-parse --show-toplevel)"
cd "$root"

if ! git diff --cached --quiet; then
  echo "ERROR: staged changes already exist. Unstage them before using this script."
  git diff --cached --name-status
  exit 1
fi

git diff --check -- "${files[@]}"

git add -- "${files[@]}"

echo "===== staged stat ====="
git diff --cached --stat

echo
echo "===== staged check ====="
git diff --cached --check

echo
echo "===== staged files ====="
git diff --cached --name-status

is_allowed() {
  candidate="$1"
  for allowed in "${files[@]}"; do
    if [ "$candidate" = "$allowed" ]; then
      return 0
    fi
  done
  return 1
}

while IFS= read -r staged_file; do
  if ! is_allowed "$staged_file"; then
    echo "ERROR: unexpected staged file: $staged_file"
    echo "Allowed files:"
    printf '  %s\n' "${files[@]}"
    exit 1
  fi
done < <(git diff --cached --name-only)

if git diff --cached --quiet; then
  echo "ERROR: no staged changes after git add"
  exit 1
fi

git commit -m "$commit_msg"

echo
echo "===== committed ====="
git log --oneline -1
git status -sb --untracked-files=no
