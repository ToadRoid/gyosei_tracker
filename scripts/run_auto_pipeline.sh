#!/bin/bash
# run_auto_pipeline.sh
#
# ドラフトレコードの自動処理パイプライン
#   1. GPTで問題文を復元 (batch_gpt_extract.py)
#   2. 実テキスト済みレコードを reviewed に昇格 (auto_promote_draft.py)
#   3. reviewed_import.json + tmp/pending_parsed.json を再生成
#
# ─── セットアップ ───────────────────────────────────────────
# 1. OpenAI APIキーを設定:
#      export OPENAI_API_KEY=sk-...
# 2. openai パッケージをインストール:
#      pip install openai
# 3. 初回実行テスト (3ページ, dry-run):
#      bash scripts/run_auto_pipeline.sh --dry-run --batch-size 3
# 4. 本番実行:
#      bash scripts/run_auto_pipeline.sh
#
# ─── cron 登録例 (毎時10分に20ページ処理) ──────────────────
# crontab -e で以下を追加:
#   10 * * * * export OPENAI_API_KEY=sk-...; cd /path/to/gyosei_tracker && bash scripts/run_auto_pipeline.sh --batch-size 20 >> /tmp/gyosei_pipeline.log 2>&1
#
# ─── 変数 ───────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BATCH_SIZE=20
DRY_RUN=false

# 引数パース
while [[ $# -gt 0 ]]; do
  case "$1" in
    --batch-size) BATCH_SIZE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    *) echo "不明なオプション: $1"; exit 1 ;;
  esac
done

cd "$PROJECT_DIR" || exit 1

echo "=============================="
echo "gyosei tracker 自動処理パイプライン"
echo "$(date '+%Y-%m-%d %H:%M:%S')"
echo "バッチサイズ: $BATCH_SIZE ページ"
echo "=============================="

# ─── ステップ 1: GPT 問題文抽出 ─────────────────────────────
echo ""
echo "[Step 1] GPT 問題文抽出..."

GPT_ARGS="--batch-size $BATCH_SIZE"
if $DRY_RUN; then
  GPT_ARGS="$GPT_ARGS --dry-run"
fi

python3 scripts/batch_gpt_extract.py $GPT_ARGS
GPT_EXIT=$?

if [ $GPT_EXIT -ne 0 ]; then
  echo "警告: batch_gpt_extract.py が終了コード $GPT_EXIT で終了"
fi

# ─── ステップ 2: 実テキスト済みレコードを昇格 ────────────────
echo ""
echo "[Step 2] 実テキスト済みレコードを昇格..."

PROMOTE_ARGS=""
if $DRY_RUN; then
  PROMOTE_ARGS="--dry-run"
fi

python3 scripts/auto_promote_draft.py $PROMOTE_ARGS
PROMOTE_EXIT=$?

if [ $PROMOTE_EXIT -ne 0 ]; then
  echo "警告: auto_promote_draft.py が終了コード $PROMOTE_EXIT で終了"
fi

echo ""
echo "=============================="
echo "パイプライン完了: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================="
echo ""
echo "→ アプリの /triage ページを開いて「取込開始」をクリックしてください"
