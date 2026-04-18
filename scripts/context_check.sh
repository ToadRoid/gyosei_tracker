#!/usr/bin/env bash
# context_check.sh — read-only health check for context/ files.
#
# Prints OK / INFO / WARNING lines. Never modifies any file.
# Exit code is 0 even when warnings exist (observation mode).
# Exit non-zero only on internal failures (e.g. script itself broken).
#
# Checks:
#   1. context/working/handoff.md         "最終更新:" が 7 日以上前 → WARNING
#   2. context/working/current_status.md  "最終更新:" が 7 日以上前 → WARNING
#   3. context/MIGRATION_CANDIDATES.md    backtick 参照のうち存在しないパス → WARNING
#                                         ただし bare basename が repo 内で一意に
#                                         見つかる場合は INFO として候補提示、
#                                         @-prefix 参照は suppress
#
# Categories:
#   OK        = explicit existence confirmed
#   INFO      = not at literal path, but exactly one candidate found in repo
#   WARNING   = truly missing / ambiguous / stale
#   suppressed = @-prefix (AI directive notation, not a filesystem path)

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Prefer `git rev-parse --show-toplevel` (run from script dir for reliable
# repo detection); fall back to parent-of-scripts relative inference.
if REPO_ROOT=$(cd "$SCRIPT_DIR" && git rev-parse --show-toplevel 2>/dev/null); then
  :
else
  REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi
cd "$REPO_ROOT"

WARN_COUNT=0
INFO_COUNT=0
SUPPRESS_COUNT=0

warn() { echo "WARNING: $*"; WARN_COUNT=$((WARN_COUNT + 1)); }
info() { echo "INFO: $*";    INFO_COUNT=$((INFO_COUNT + 1)); }
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

# Look up a bare basename in tracked files. Prints matching paths, one per line.
# Uses bash-native basename (`${f##*/}`) for speed. Returns empty on no match.
lookup_basename() {
  local name="$1"
  git ls-files 2>/dev/null | while IFS= read -r f; do
    [[ "${f##*/}" == "$name" ]] && printf '%s\n' "$f"
  done
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

    # @-prefix references are AI directive notation (e.g. CLAUDE.md's
    # `@AGENTS.md` import), not filesystem paths. Suppress silently.
    if [[ "$ref" == @* ]]; then
      SUPPRESS_COUNT=$((SUPPRESS_COUNT + 1))
      continue
    fi

    is_path_like "$ref" || continue
    checked=$((checked + 1))

    local target="$ref"
    if [[ "$target" == */ ]]; then
      # Directory reference (trailing slash)
      if [[ ! -d "${target%/}" ]]; then
        warn "MIGRATION_CANDIDATES.md: dangling ref '$ref' (directory not found)"
        missing=$((missing + 1))
      fi
    elif [[ "$target" != */* ]]; then
      # Bare basename (no slash). Try literal first, then basename lookup.
      if [[ -e "$target" ]]; then
        :  # OK at repo root, treat as found
      else
        local hits hit_count
        hits=$(lookup_basename "$target")
        hit_count=$(printf '%s' "$hits" | grep -c . || true)
        if [[ "$hit_count" == "1" ]]; then
          info "MIGRATION_CANDIDATES.md: bare basename '$ref' → candidate at '$hits'"
        elif (( hit_count >= 2 )); then
          warn "MIGRATION_CANDIDATES.md: bare basename '$ref' is ambiguous (${hit_count} candidates)"
          missing=$((missing + 1))
        else
          warn "MIGRATION_CANDIDATES.md: dangling ref '$ref' (not found, no basename match)"
          missing=$((missing + 1))
        fi
      fi
    else
      # Path with slash (but not directory)
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

summary_parts=()
(( WARN_COUNT > 0 ))     && summary_parts+=("${WARN_COUNT} WARNING(s)")
(( INFO_COUNT > 0 ))     && summary_parts+=("${INFO_COUNT} INFO(s)")
(( SUPPRESS_COUNT > 0 )) && summary_parts+=("${SUPPRESS_COUNT} suppressed (@-prefix)")

if (( ${#summary_parts[@]} > 0 )); then
  joined="${summary_parts[0]}"
  for ((i = 1; i < ${#summary_parts[@]}; i++)); do
    joined="${joined}, ${summary_parts[i]}"
  done
  echo "Summary: OK with ${joined}"
else
  echo "Summary: OK (no warnings)"
fi

exit 0
