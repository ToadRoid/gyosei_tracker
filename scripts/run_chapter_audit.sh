#!/bin/bash
set -euo pipefail

# ────────────────────────────────────────────────────────
# 章別監査ラッパー
# Usage:
#   bash scripts/run_chapter_audit.sh                     # 全件監査
#   bash scripts/run_chapter_audit.sh "05_取消訴訟の審理"  # 単章監査
# ────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AUDIT_SCRIPT="${SCRIPT_DIR}/audit_legal_consistency.py"

if [ $# -ge 1 ]; then
    CHAPTER="$1"
    echo "━━━ 単章監査: ${CHAPTER} ━━━"
    echo ""
    python3 "${AUDIT_SCRIPT}" --chapter "${CHAPTER}"
    echo ""
    echo "━━━ ゴールデンテスト (${CHAPTER}) ━━━"
    echo ""
    python3 "${AUDIT_SCRIPT}" --golden --chapter "${CHAPTER}"
else
    echo "━━━ 全件監査 ━━━"
    echo ""
    python3 "${AUDIT_SCRIPT}"
fi

echo ""
echo "━━━ 出力ファイル ━━━"
echo ""
ls -la "$(dirname "${SCRIPT_DIR}")/data/"chapter_audit_summary*.csv "$(dirname "${SCRIPT_DIR}")/data/"audit_*.csv "$(dirname "${SCRIPT_DIR}")/data/"legal_audit_report*.csv 2>/dev/null || true
echo ""
echo "完了"
