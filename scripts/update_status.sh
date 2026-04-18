#!/usr/bin/env bash
# update_status.sh — regenerate auto-marker sections in current_status.md.
#
# Target file:   context/working/current_status.md
# Target marker: <!-- auto:commits:begin --> ... <!-- auto:commits:end -->
#
# Modes:
#   (no flag)     dry-run (既定): proposed diff を stdout に表示、書込なし
#   --apply       書込。ただし TARGET に未コミット変更があれば中止（--force で上書き可）
#   --check       差分があれば exit 1、なければ 0。書込なし（CI 用）
#   --commits N   取り込む commit 数（既定 10）
#   --force       --apply 時に未コミット変更ガードを無効化（他の用途には使わない）
#
# Guards:
#   - 既定は dry-run、書込は --apply 明示時のみ
#   - マーカーが欠落 / 複数ある場合は書込せず exit 1
#   - マーカー外部の行は一切書き換えない
#   - 失敗時（git log 失敗・file 不在・マーカー欠落）は書込なしで exit 1
#   - --apply 時に TARGET に uncommitted / staged な変更があれば中止（--force で解除）

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if REPO_ROOT=$(cd "$SCRIPT_DIR" && git rev-parse --show-toplevel 2>/dev/null); then
  :
else
  REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi
cd "$REPO_ROOT"

TARGET="context/working/current_status.md"
MARKER_BEGIN="<!-- auto:commits:begin -->"
MARKER_END="<!-- auto:commits:end -->"

COMMITS=10
APPLY=0
CHECK=0
FORCE=0

die()  { echo "ERROR: $*" >&2; exit 1; }
info() { echo "$*"; }

usage() {
  sed -n '2,15p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply)  APPLY=1 ;;
    --check)  CHECK=1 ;;
    --force)  FORCE=1 ;;
    --commits)
      shift
      [[ $# -gt 0 ]] || die "--commits は数値引数が必要"
      [[ "$1" =~ ^[1-9][0-9]*$ ]] || die "--commits の値が不正: $1"
      COMMITS="$1"
      ;;
    --commits=*)
      COMMITS="${1#--commits=}"
      [[ "$COMMITS" =~ ^[1-9][0-9]*$ ]] || die "--commits の値が不正: $COMMITS"
      ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1 ( --help )" ;;
  esac
  shift
done

if (( APPLY && CHECK )); then
  die "--apply と --check は同時指定できない"
fi

[[ -f "$TARGET" ]] || die "$TARGET が存在しない"

begin_line=$(grep -n -F -x "$MARKER_BEGIN" "$TARGET" | cut -d: -f1)
end_line=$(grep -n -F -x "$MARKER_END" "$TARGET" | cut -d: -f1)

begin_count=$(printf '%s\n' "$begin_line" | grep -c .)
end_count=$(printf '%s\n' "$end_line" | grep -c .)
[[ "$begin_count" == "1" ]] || die "マーカー $MARKER_BEGIN が見つからない or 複数 (count=$begin_count)"
[[ "$end_count" == "1" ]]   || die "マーカー $MARKER_END が見つからない or 複数 (count=$end_count)"
(( begin_line < end_line )) || die "マーカー順序が不正 (begin=$begin_line end=$end_line)"

# Choose the git ref for log. Prefer origin/main (PR merge 後の状態を反映)
# if available; else HEAD.
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  REF="origin/main"
else
  REF="HEAD"
fi

new_block=$(git log --oneline -"$COMMITS" "$REF" 2>/dev/null | sed 's/^/- /')
[[ -n "$new_block" ]] || die "git log が空 (ref=$REF)"

# Build new file: [1..begin_line] + new_block + [end_line..EOF].
# This replaces the content strictly between the marker lines (exclusive of
# the marker lines themselves, which are preserved verbatim).
tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT

{
  head -n "$begin_line" "$TARGET"
  printf '%s\n' "$new_block"
  tail -n +"$end_line" "$TARGET"
} > "$tmpfile"

diff_output=$(diff -u "$TARGET" "$tmpfile" || true)

if [[ -z "$diff_output" ]]; then
  info "no changes (current_status.md is already up to date)"
  exit 0
fi

info "== proposed diff =="
printf '%s\n' "$diff_output"
info ""

if (( CHECK )); then
  info "--check: 差分あり"
  exit 1
fi

if (( APPLY )); then
  if ! (( FORCE )); then
    if ! git ls-files --error-unmatch "$TARGET" >/dev/null 2>&1; then
      die "$TARGET は git で追跡されていない。--force で強制上書きできる。"
    fi
    if ! git diff --quiet HEAD -- "$TARGET" 2>/dev/null; then
      die "$TARGET に未コミットのローカル変更がある。commit するか --force を付けて再実行。"
    fi
  fi
  mv "$tmpfile" "$TARGET"
  trap - EXIT
  info "applied: $TARGET"
  exit 0
fi

info "dry-run: 書込なし。--apply で反映。"
exit 0
