#!/bin/bash
# ============================================================
# kindle_capture.sh — Kindle for Mac 自動スクショスクリプト
#
# 使い方（どれでも同じ）:
#   bash scripts/kindle_capture.sh 200          # 引数で枚数指定（推奨）
#   PAGES=200 bash scripts/kindle_capture.sh    # 環境変数でも可
#   bash scripts/kindle_capture.sh              # デフォルト50枚
#
# その他のオプション（環境変数）:
#   DELAY=2     bash ...   # ページ送り後の待機秒数（デフォルト: 1.5）
#   START=51    bash ...   # 開始番号を強制指定（通常は自動検出）
#   OUTDIR=/path bash ...  # 保存先（デフォルト: ~/Desktop/kindle_shots）
# ============================================================

OUTPUT_DIR="${OUTDIR:-$HOME/Desktop/kindle_shots}"
DELAY="${DELAY:-1.5}"
mkdir -p "$OUTPUT_DIR"

# ── 撮影枚数: 引数 $1 > 環境変数 $PAGES > デフォルト 50 ──────
if [ -n "$1" ] && [[ "$1" =~ ^[0-9]+$ ]]; then
  PAGES=$1
elif [ -n "$PAGES" ] && [[ "$PAGES" =~ ^[0-9]+$ ]]; then
  PAGES=$PAGES
else
  PAGES=50
fi

# ── 開始番号を決定（START 指定 or 既存の続き）─────────────────
if [ -n "$START" ] && [[ "$START" =~ ^[0-9]+$ ]]; then
  START_NUM=$START
else
  LAST=$(ls "$OUTPUT_DIR"/*.png 2>/dev/null \
    | sed 's/.*\///' | sed 's/\.png//' \
    | sort -n | tail -1)
  if [ -z "$LAST" ]; then
    START_NUM=1
  else
    START_NUM=$((10#$LAST + 1))
  fi
fi

END_NUM=$((START_NUM + PAGES - 1))

# ══════════════════════════════════════════
#  確認バナー（実行前に必ず表示）
# ══════════════════════════════════════════
echo ""
echo "┌─────────────────────────────────────┐"
echo "│  📚  Kindle 自動スクショ             │"
echo "├─────────────────────────────────────┤"
printf "│  開始番号  : %04d                    │\n" $START_NUM
printf "│  終了番号  : %04d                    │\n" $END_NUM
printf "│  総枚数    : %d 枚                    │\n" $PAGES
echo "│  保存先    : $OUTPUT_DIR"
echo "├─────────────────────────────────────┤"
echo "│  Kindle を目的ページに開いてください  │"
echo "└─────────────────────────────────────┘"
echo ""
printf "続けますか？ [Y/n] "
read -r CONFIRM
case "$CONFIRM" in
  [nN]*)
    echo "中止しました。"
    exit 0
    ;;
esac

echo ""
echo "⏳ 5秒後に開始します。Kindleウィンドウをクリックしてください..."
sleep 5

# Kindleをアクティブにする
osascript -e 'tell application "Amazon Kindle" to activate'
sleep 1

for i in $(seq $START_NUM $END_NUM); do
  FILENAME=$(printf "%04d.png" $i)
  FILEPATH="$OUTPUT_DIR/$FILENAME"
  IDX=$((i - START_NUM + 1))

  osascript <<APPLESCRIPT
    tell application "System Events"
      tell process "Amazon Kindle"
        set frontWindow to window 1
        set {x, y} to position of frontWindow
        set {w, h} to size of frontWindow
        do shell script "screencapture -R " & x & "," & y & "," & w & "," & h & " -x '$FILEPATH'"
      end tell
    end tell
APPLESCRIPT

  echo "[$IDX/$PAGES] $FILENAME を保存"

  if [ $i -lt $END_NUM ]; then
    osascript -e 'tell application "System Events" to key code 124'  # →
    sleep $DELAY
  fi
done

echo ""
echo "✅ 完了！"
printf "   %04d 〜 %04d  (%d枚)  →  %s\n" $START_NUM $END_NUM $PAGES "$OUTPUT_DIR"
echo ""
echo "次のステップ:"
echo "   bash ~/Developer/gyosei_tracker/scripts/ocr_batch.sh"
