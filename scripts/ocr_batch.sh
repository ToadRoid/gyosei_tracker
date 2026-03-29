#!/bin/bash
# ============================================================
# ocr_batch.sh — 連番スクショ一括OCR → バッチフォルダ生成
#
# 使い方:
#   bash ~/Developer/gyosei_tracker/scripts/ocr_batch.sh [画像フォルダ]
#
# 例:
#   bash ~/Developer/gyosei_tracker/scripts/ocr_batch.sh ~/Desktop/kindle_shots
#
# 前提:
#   tesseract をインストール済みであること
#   brew install tesseract tesseract-lang
#
# 出力:
#   ~/Desktop/batch_YYYYMMDD_HHMMSS/
#     images/   … 元画像のコピー
#     ocr_raw/  … OCR結果テキスト（1画像1ファイル）
#     manifest.json … 対応表
# ============================================================

SOURCE_DIR="${1:-$HOME/Desktop/kindle_shots}"
BATCH_ID="batch_$(date +%Y%m%d_%H%M%S)"
OUTPUT_DIR="$HOME/Desktop/$BATCH_ID"

# tesseract の確認
if ! command -v tesseract &>/dev/null; then
  echo "❌ tesseract が見つかりません"
  echo "   brew install tesseract tesseract-lang"
  exit 1
fi

mkdir -p "$OUTPUT_DIR/images"
mkdir -p "$OUTPUT_DIR/ocr_raw"

echo "📁 ソース: $SOURCE_DIR"
echo "📁 出力:   $OUTPUT_DIR"
echo ""

COUNT=0
FAILED=0

for img in $(ls "$SOURCE_DIR"/*.png "$SOURCE_DIR"/*.jpg 2>/dev/null | sort); do
  [ -f "$img" ] || continue
  FILENAME=$(basename "$img")
  BASE="${FILENAME%.*}"

  # 画像をコピー
  cp "$img" "$OUTPUT_DIR/images/$FILENAME"

  # OCR（日本語）
  if tesseract "$img" "$OUTPUT_DIR/ocr_raw/$BASE" -l jpn quiet 2>/dev/null; then
    COUNT=$((COUNT + 1))
    echo "[$COUNT] $BASE ✓"
  else
    FAILED=$((FAILED + 1))
    echo "[$((COUNT + FAILED))] $BASE ✗ OCR失敗"
    # 空ファイルを作成（manifest で欠番を防ぐ）
    touch "$OUTPUT_DIR/ocr_raw/$BASE.txt"
  fi
done

echo ""
echo "OCR完了: 成功 $COUNT 件 / 失敗 $FAILED 件"
echo "manifest.json を生成中..."

# manifest.json を生成
python3 - "$OUTPUT_DIR" "$BATCH_ID" <<'PYEOF'
import sys, os, json
from pathlib import Path
from datetime import datetime

output_dir = Path(sys.argv[1])
batch_id = sys.argv[2]

items = []
for txt_file in sorted((output_dir / "ocr_raw").glob("*.txt")):
    base = txt_file.stem

    # 対応する画像ファイルを探す
    img_file = None
    for ext in [".png", ".jpg", ".jpeg"]:
        candidate = output_dir / "images" / (base + ext)
        if candidate.exists():
            img_file = f"images/{base}{ext}"
            break

    # テキスト読み込み
    try:
        text = txt_file.read_text(encoding="utf-8").strip()
    except Exception:
        text = ""

    items.append({
        "baseName": base,
        "imageFile": img_file,
        "textFile": f"ocr_raw/{txt_file.name}",
        "ocrText": text,
        "isEmpty": len(text) == 0
    })

manifest = {
    "batchId": batch_id,
    "createdAt": datetime.now().isoformat(),
    "totalItems": len(items),
    "emptyItems": sum(1 for i in items if i["isEmpty"]),
    "items": items
}

out_path = output_dir / "manifest.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"✅ manifest.json: {len(items)}件 (空: {manifest['emptyItems']}件)")
PYEOF

echo ""
echo "✅ 完了！"
echo "   出力先: $OUTPUT_DIR"
echo ""
echo "次のステップ:"
echo "  1. http://localhost:3001/import を開く"
echo "  2. 「バッチ取込」→「フォルダを選択」で $OUTPUT_DIR を選択"
echo "  3. 自動でドラフト一括保存されます"
