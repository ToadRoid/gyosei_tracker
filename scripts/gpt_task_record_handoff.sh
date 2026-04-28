#!/usr/bin/env bash
set -euo pipefail

session="${1:-}"
title="${2:-}"

if [ -z "$session" ]; then
  echo "usage: bash scripts/gpt_task_record_handoff.sh <session-id> [title]"
  exit 2
fi

if [ -z "$title" ]; then
  title="$session handoff"
fi

root="$(git rev-parse --show-toplevel)"
cd "$root"

dir="context/working/sessions/$session"
file="$dir/handoff.md"

mkdir -p "$dir"

cat > "$file" <<HANDOFF
# $title

## Task

TBD.

## Source of truth

- repo: \`$(basename "$root")\`
- branch at creation: \`$(git branch --show-current || true)\`
- HEAD at creation: \`$(git rev-parse --short HEAD)\`
- origin/main at creation: \`$(git rev-parse --short origin/main 2>/dev/null || echo unknown)\`

## Status

TBD.

## Completed

- TBD.

## Verification

- TBD.

## Not changed / Out of scope

- TBD.

## Open questions

- TBD.

## Next actions

- TBD.

## Local residuals

Record untracked or intentionally ignored local files here if relevant.

HANDOFF

echo "created: $file"
sed -n '1,220p' "$file"
