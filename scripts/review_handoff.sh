#!/usr/bin/env bash
# review_handoff.sh — read-only done-candidate report for handoff.md.
#
# Reads:
#   context/working/handoff.md       (read-only, scope マーカー対が必須)
#   gh pr list --state merged --base main  (merged PR)
#
# Writes: nothing. Report to stdout only.
# Exit: 0 on success, 1 on failure.
#
# Scope は opt-in。次のマーカー対の**内側だけ**を走査する:
#   <!-- review-handoff:scope:begin -->
#   <!-- review-handoff:scope:end -->
# マーカー対が欠落 / 複数ある場合は fallback せずに exit 1 で停止する。
#
# Matching:
#   - 主 matching 対象は PR title
#   - PR body は高 confidence 候補の補助証拠として抜粋表示のみ
#   - 一致語（overlap tokens）を必ず併記する
#   - overlap >= 2 → 高 confidence, overlap == 1 → 低 confidence, 0 → unmatched
#
# Options:
#   --limit N   取り込む merged PR 件数（既定 10）

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if REPO_ROOT=$(cd "$SCRIPT_DIR" && git rev-parse --show-toplevel 2>/dev/null); then
  :
else
  REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi
cd "$REPO_ROOT"

TARGET="context/working/handoff.md"
MARKER_BEGIN="<!-- review-handoff:scope:begin -->"
MARKER_END="<!-- review-handoff:scope:end -->"

LIMIT=10

die()  { echo "ERROR: $*" >&2; exit 1; }
info() { echo "$*"; }

usage() {
  sed -n '2,22p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --limit)
      shift
      [[ $# -gt 0 ]] || die "--limit は数値引数が必要"
      [[ "$1" =~ ^[1-9][0-9]*$ ]] || die "--limit の値が不正: $1"
      LIMIT="$1"
      ;;
    --limit=*)
      LIMIT="${1#--limit=}"
      [[ "$LIMIT" =~ ^[1-9][0-9]*$ ]] || die "--limit の値が不正: $LIMIT"
      ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1 ( --help )" ;;
  esac
  shift
done

[[ -f "$TARGET" ]] || die "$TARGET が存在しない"

# Scope markers — require exactly one pair. No heading fallback (M1).
begin_line=$(grep -n -F -x "$MARKER_BEGIN" "$TARGET" | cut -d: -f1)
end_line=$(grep -n -F -x "$MARKER_END" "$TARGET" | cut -d: -f1)
begin_count=$(printf '%s\n' "$begin_line" | grep -c .)
end_count=$(printf '%s\n' "$end_line" | grep -c .)

if [[ "$begin_count" != "1" || "$end_count" != "1" ]]; then
  {
    echo "ERROR: $TARGET に scope マーカー対が見つかりません (begin=$begin_count, end=$end_count)。"
    echo "先に scope マーカーを手動挿入してください。走査対象にしたい見出し範囲を次の対で囲みます:"
    echo "  $MARKER_BEGIN"
    echo "  ...（走査対象の箇条書き / table）..."
    echo "  $MARKER_END"
    echo ""
    echo "M1 は heading fallback を行いません。マーカーがない場合は停止します。"
  } >&2
  exit 1
fi
(( begin_line < end_line )) || die "マーカー順序が不正 (begin=$begin_line end=$end_line)"

# handoff.md の 最終更新: 日付 (ISO) を since フィルタに使う（任意）
last_updated=$(grep -m1 '^最終更新:' "$TARGET" | sed -E 's/^最終更新:[[:space:]]*([0-9]{4}-[0-9]{2}-[0-9]{2}).*/\1/' || true)
if [[ ! "$last_updated" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  last_updated=""
fi

# Scope の中身（marker 行を除く）
scope_text=$(sed -n "$((begin_line + 1)),$((end_line - 1))p" "$TARGET")
[[ -n "$scope_text" ]] || die "scope 区間が空"

# gh 疎通
command -v gh >/dev/null 2>&1 || die "gh コマンドが見つからない"
if ! gh auth status >/dev/null 2>&1; then
  die "gh が認証されていない（gh auth login を確認）"
fi

pr_json=$(gh pr list --state merged --base main --limit "$LIMIT" --json number,title,body,mergedAt,url 2>/dev/null) \
  || die "gh pr list が失敗"

command -v python3 >/dev/null 2>&1 || die "python3 が見つからない"

export SCOPE_TEXT="$scope_text"
export PR_JSON="$pr_json"
export LAST_UPDATED="$last_updated"

python3 - <<'PY'
import json, os, re

pr_json = os.environ["PR_JSON"]
scope_text = os.environ["SCOPE_TEXT"]
last_updated = os.environ.get("LAST_UPDATED", "")

try:
    prs = json.loads(pr_json) if pr_json.strip() else []
except json.JSONDecodeError as e:
    print(f"ERROR: gh の JSON をパースできない: {e}")
    raise SystemExit(1)

if last_updated:
    prs = [p for p in prs if (p.get("mergedAt") or "")[:10] >= last_updated]

CJK = r"[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+"
ASCII_WORD = r"[a-z0-9]+"
TOKEN_RE = re.compile(f"{ASCII_WORD}|{CJK}")

def tokens(text):
    text = (text or "").lower()
    raw = TOKEN_RE.findall(text)
    toks = set()
    for w in raw:
        if re.match(r"^[a-z0-9]+$", w):
            if len(w) >= 4:
                toks.add(w)
        else:
            for i in range(len(w) - 1):
                toks.add(w[i:i+2])
    return toks

scope_toks = tokens(scope_text)

high, low, unmatched = [], [], []
for pr in prs:
    title_toks = tokens(pr.get("title", ""))
    overlap = sorted(title_toks & scope_toks)
    n = len(overlap)
    entry = (pr, overlap, n)
    if n >= 2:
        high.append(entry)
    elif n == 1:
        low.append(entry)
    else:
        unmatched.append(entry)

def fmt_basic(pr):
    return f"- #{pr['number']} {pr['title']} ({(pr.get('mergedAt') or '')[:10]})"

def fmt_with_overlap(pr, overlap):
    s = fmt_basic(pr)
    s += f"\n    matched (title): {', '.join(overlap)}"
    return s

def fmt_with_body(pr, overlap):
    s = fmt_with_overlap(pr, overlap)
    body = (pr.get("body") or "").strip()
    if body:
        lines = [l.strip() for l in body.splitlines() if l.strip()][:3]
        if lines:
            excerpt = " / ".join(lines)
            if len(excerpt) > 180:
                excerpt = excerpt[:180] + "…"
            s += f"\n    body excerpt: {excerpt}"
    return s

print("== /review-handoff report ==")
print(f"handoff.md 最終更新: {last_updated or '(unknown)'}")
print(f"PR 件数: {len(prs)} (since {last_updated or 'all'})")
print()

print("## 高 confidence 候補 (overlap >= 2)")
if high:
    for pr, ov, _ in high:
        print(fmt_with_body(pr, ov))
else:
    print("(なし)")
print()

print("## 低 confidence 候補 (overlap == 1)")
if low:
    for pr, ov, _ in low:
        print(fmt_with_overlap(pr, ov))
else:
    print("(なし)")
print()

print("## unmatched PRs")
if unmatched:
    for pr, _, _ in unmatched:
        print(fmt_basic(pr))
else:
    print("(なし)")
print()

print("※ done 判定は人手。本 report は提案のみで、handoff.md は書き換えません。")
PY
