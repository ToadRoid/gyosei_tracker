#!/usr/bin/env python3
"""
OCR中間CSV出力スクリプト

前処理済み画像に Tesseract OCR をかけ、結果を中間CSVに出力する。
qa_draft.csv には一切触れない。

出力列:
  source_image, question_ocr_raw, explanation_ocr_raw,
  answer_symbol_candidate, ocr_parse_status, ocr_parse_note

使用例:
  python scripts/ocr_to_intermediate.py images_preprocessed/ data/ocr_intermediate.csv
  python scripts/ocr_to_intermediate.py images_preprocessed/ data/ocr_intermediate.csv \
    --csv data/qa_draft.csv --status pending
"""

import argparse
import csv
import re
import subprocess
import sys
import time
from pathlib import Path


TESSERACT_CMD = "/opt/homebrew/bin/tesseract"


def run_tesseract(image_path: Path) -> str:
    """Tesseract OCR を実行し、結果テキストを返す"""
    result = subprocess.run(
        [TESSERACT_CMD, str(image_path), "stdout", "-l", "jpn", "--psm", "6"],
        capture_output=True, text=True, timeout=60,
    )
    return result.stdout


def extract_answer_symbols(text: str) -> list[tuple[str, str]]:
    """テキストからQ番号と○×を抽出する。
    右欄の「番号 ○」「番号 ×」パターンを探す。"""
    patterns = [
        # 「1 ○」「2 ×」「10 ○」など
        re.compile(r'(\d{1,2})\s*([○×〇✕Oo Xx])'),
        # 「1○」「2×」（スペースなし）
        re.compile(r'(\d{1,2})([○×〇✕])'),
    ]
    results = []
    for pat in patterns:
        for m in pat.finditer(text):
            qno = m.group(1)
            raw_sym = m.group(2)
            sym = '○' if raw_sym in ('○', '〇', 'O', 'o') else '×'
            results.append((qno, sym))
    # 重複除去（番号順）
    seen = set()
    unique = []
    for qno, sym in results:
        if qno not in seen:
            seen.add(qno)
            unique.append((qno, sym))
    return unique


def split_left_right(text: str, image_path: Path) -> tuple[str, str]:
    """OCRテキストを左欄（問題文）と右欄（解説）に分割する。
    Kindleスクショは見開きなので、画像を左右に分割してOCRし直す。"""
    try:
        import cv2
        img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
        if img is None:
            return text, ""
        h, w = img.shape[:2]
        mid = w // 2

        # 左半分
        left_path = image_path.parent / f"_tmp_left_{image_path.name}"
        cv2.imwrite(str(left_path), img[:, :mid])
        left_text = run_tesseract(left_path)
        left_path.unlink(missing_ok=True)

        # 右半分
        right_path = image_path.parent / f"_tmp_right_{image_path.name}"
        cv2.imwrite(str(right_path), img[:, mid:])
        right_text = run_tesseract(right_path)
        right_path.unlink(missing_ok=True)

        return left_text.strip(), right_text.strip()
    except ImportError:
        return text, ""


def parse_ocr_result(image_path: Path) -> dict:
    """1枚の画像をOCR→パースし、中間CSV用の辞書を返す"""
    row = {
        "source_image": image_path.name,
        "question_ocr_raw": "",
        "explanation_ocr_raw": "",
        "answer_symbol_candidate": "",
        "ocr_parse_status": "ok",
        "ocr_parse_note": "",
    }

    full_text = run_tesseract(image_path)
    if not full_text.strip():
        row["ocr_parse_status"] = "structure_failed"
        row["ocr_parse_note"] = "OCR結果が空"
        return row

    # 左右分割
    left_text, right_text = split_left_right(full_text, image_path)

    # 問題文（左欄）
    row["question_ocr_raw"] = left_text if left_text else full_text.strip()

    # 解説（右欄）
    row["explanation_ocr_raw"] = right_text

    # answer_symbol 抽出（右欄優先、なければ全文から）
    source = right_text if right_text else full_text
    symbols = extract_answer_symbols(source)

    if symbols:
        row["answer_symbol_candidate"] = "; ".join(
            f"Q{qno}={sym}" for qno, sym in symbols
        )
    else:
        row["answer_symbol_candidate"] = ""

    # ステータス判定
    notes = []
    if not left_text.strip():
        notes.append("question_missing")
    if not right_text.strip():
        notes.append("explanation_missing")
    if not symbols:
        notes.append("answer_symbol_uncertain")

    if notes:
        row["ocr_parse_status"] = notes[0]  # 最も深刻なものを主ステータスに
        row["ocr_parse_note"] = "; ".join(notes)
    else:
        row["ocr_parse_status"] = "ok"

    return row


def main():
    parser = argparse.ArgumentParser(
        description="前処理済み画像にOCRをかけ、中間CSVに出力する")
    parser.add_argument("input_dir", help="前処理済み画像フォルダ")
    parser.add_argument("output_csv", help="中間CSV出力パス")
    parser.add_argument("--csv", type=str, default=None,
                        help="qa_draft.csv のパス。source_image列で対象を絞る")
    parser.add_argument("--status", type=str, default=None,
                        help="--csv と併用。指定したhuman_check_statusの行だけ対象")
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    if not input_dir.is_dir():
        print(f"エラー: フォルダが見つかりません: {input_dir}", file=sys.stderr)
        sys.exit(1)

    # 対象画像の決定
    extensions = {".png", ".jpg", ".jpeg"}

    if args.csv:
        csv_path = Path(args.csv)
        with open(csv_path, encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))
        if args.status:
            rows = [r for r in rows if r.get("human_check_status") == args.status]
        target_names = set(
            r.get("source_image", "").strip()
            for r in rows if r.get("source_image", "").strip()
        )
        files = sorted(
            f for f in input_dir.iterdir()
            if f.name in target_names and f.suffix.lower() in extensions
        )
        print(f"CSV絞り込み: {len(target_names)}ファイル対象"
              + (f" (status={args.status})" if args.status else ""))
    else:
        files = sorted(
            f for f in input_dir.iterdir()
            if f.suffix.lower() in extensions
        )

    if not files:
        print(f"対象画像なし: {input_dir}")
        sys.exit(0)

    # Tesseract の存在確認
    try:
        subprocess.run([TESSERACT_CMD, "--version"], capture_output=True, check=True)
    except FileNotFoundError:
        print(f"エラー: tesseract が見つかりません: {TESSERACT_CMD}", file=sys.stderr)
        print("  brew install tesseract tesseract-lang", file=sys.stderr)
        sys.exit(1)

    print(f"入力: {input_dir} ({len(files)}件)")
    print(f"出力: {args.output_csv}")
    print("-" * 60)

    out_fields = [
        "source_image", "question_ocr_raw", "explanation_ocr_raw",
        "answer_symbol_candidate", "ocr_parse_status", "ocr_parse_note",
    ]

    results = []
    failed = []
    start = time.time()

    for f in files:
        try:
            t0 = time.time()
            row = parse_ocr_result(f)
            elapsed = time.time() - t0
            results.append(row)
            status_mark = "OK" if row["ocr_parse_status"] == "ok" else row["ocr_parse_status"]
            print(f"  {status_mark:.<30s} {f.name} ({elapsed:.1f}s)")
        except Exception as e:
            print(f"  FAIL {f.name}: {e}")
            failed.append((f.name, str(e)))
            results.append({
                "source_image": f.name,
                "question_ocr_raw": "",
                "explanation_ocr_raw": "",
                "answer_symbol_candidate": "",
                "ocr_parse_status": "structure_failed",
                "ocr_parse_note": f"例外: {e}",
            })

    # CSV出力
    output_path = Path(args.output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=out_fields)
        writer.writeheader()
        writer.writerows(results)

    total = time.time() - start
    print("-" * 60)
    print(f"完了: {len(results)}件出力 ({total:.1f}s)")

    # ステータス集計
    from collections import Counter
    status_counts = Counter(r["ocr_parse_status"] for r in results)
    print("\nステータス集計:")
    for s, c in status_counts.most_common():
        print(f"  {s}: {c}")

    if failed:
        print(f"\n例外失敗 ({len(failed)}件):")
        for name, err in failed:
            print(f"  {name}: {err}")


if __name__ == "__main__":
    main()
