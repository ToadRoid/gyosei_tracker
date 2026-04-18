#!/usr/bin/env bash
# context_check.sh — read-only health check for context/ files.
#
# Prints OK / WARNING lines. Never modifies any file.
# Exit code is 0 even when warnings exist (observation mode).
# Exit non-zero only on internal failures (e.g. script itself broken).
#
# Checks:
#   1. context/working/handoff.md         "最終更新:" が 7 日以上前 → WARNING
#   2. context/working/current_status.md  "最終更新:" が 7 日以上前 → WARNING
#   3. context/MIGRATION_CANDIDATES.md    backtick 参照のうち存在しないパス → WARNING

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

WARN_COUNT=0

warn() { echo "WARNING: $*"; WARN_COUNT=$((WARN_COUNT + 1)); }
ok()   { echo "OK: $*"; }

date_to_epoch() {
  local d="$1"
  if date -d "$d" +%s >/dev/null 2>&1; then
    date -d "$d" +%s
  else
    date -j -f "%Y-%m-%d" "$d" +%s 2>/dev/null
  fi
}

check_last_updated() {
  local path="$1"
  local label="$2"
  local stale_days="${3:-7}"

  if [[ ! -f "$path" ]]; then
    warn "$label: file not found ($path)"
    return
  fi

  local line
  line=$(grep -m1 '^最終更新:' "$path" || true)
  if [[ -z "$line" ]]; then
    warn "$label: '最終更新:' 行が見つからない"
    return
  fi

  local date_str
  date_str=$(printf '%s\n' "$line" | sed -E 's/^最終更新:[[:space:]]*([0-9]{4}-[0-9]{2}-[0-9]{2}).*/\1/')
  if [[ ! "$date_str" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    warn "$label: 日付形式をパースできない ('$line')"
    return
  fi

  local e_then e_now diff_days
  e_then=$(date_to_epoch "$date_str")
  if [[ -z "$e_then" ]]; then
    warn "$label: 日付 $date_str を epoch に変換できない"
    return
  fi
  e_now=$(date +%s)
  diff_days=$(( (e_now - e_then) / 86400 ))

  if (( diff_days > stale_days )); then
    warn "$label: 最終更新 $date_str は ${diff_days} 日前 (閾値 ${stale_days} 日)"
  else
    ok "$label: 最終更新 $date_str (${diff_days} 日前)"
  fi
}

is_path_like() {
  local ref="$1"
  # Reject globs and wildcards
  [[ "$ref" == *"*"* ]] && return 1
  [[ "$ref" == *"?"* ]] && return 1
  # Reject entries containing whitespace (prose)
  [[ "$ref" == *" "* ]] && return 1
  # Reject entries that are clearly not paths (backtick code fragments)
  [[ "$ref" == *"("* ]] && return 1
  [[ "$ref" == *")"* ]] && return 1
  [[ "$ref" == *"{"* ]] && return 1
  [[ "$ref" == *"}"* ]] && return 1
  [[ "$ref" == *"="* ]] && return 1
  [[ "$ref" == *"\`"* ]] && return 1
  # Accept if contains '/' or recognized file extension
  if [[ "$ref" == */* ]]; then
    return 0
  fi
  if [[ "$ref" =~ \.(md|json|py|ts|tsx|sh|sql|mjs|yml|yaml|toml|lock|js|css|html)$ ]]; then
    return 0
  fi
  return 1
}

check_migration_paths() {
  local path="context/MIGRATION_CANDIDATES.md"
  if [[ ! -f "$path" ]]; then
    warn "MIGRATION_CANDIDATES.md: file not found ($path)"
    return
  fi

  local refs
  refs=$(grep -oE '`[^`]+`' "$path" | sed 's/^`//; s/`$//' | sort -u)

  local checked=0
  local missing=0
  while IFS= read -r ref; do
    [[ -z "$ref" ]] && continue
    is_path_like "$ref" || continue
    checked=$((checked + 1))

    local target="$ref"
    if [[ "$target" == */ ]]; then
      if [[ ! -d "${target%/}" ]]; then
        warn "MIGRATION_CANDIDATES.md: dangling ref '$ref' (directory not found)"
        missing=$((missing + 1))
      fi
    else
      if [[ ! -e "$target" ]]; then
        warn "MIGRATION_CANDIDATES.md: dangling ref '$ref' (not found)"
        missing=$((missing + 1))
      fi
    fi
  done <<< "$refs"

  ok "MIGRATION_CANDIDATES.md: checked ${checked} backtick path(s), ${missing} missing"
}

echo "== context_check.sh =="
echo "Repo:  $REPO_ROOT"
echo "Today: $(date +%Y-%m-%d)"
echo ""

check_last_updated "context/working/handoff.md"        "handoff.md"
check_last_updated "context/working/current_status.md" "current_status.md"
echo ""

check_migration_paths
echo ""

if (( WARN_COUNT > 0 )); then
  echo "Summary: OK with ${WARN_COUNT} WARNING(s)"
else
  echo "Summary: OK (no warnings)"
fi

exit 0
