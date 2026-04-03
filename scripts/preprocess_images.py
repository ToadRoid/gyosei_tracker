#!/usr/bin/env python3
"""
OCR前処理スクリプト — 日本語印刷文字向け
画像を一括で前処理し、OCR精度を向上させる。

処理順序:
1. 2倍拡大（解像度不足の補完）
2. グレースケール化
3. 軽いノイズ低減（メディアンフィルタ）
4. コントラスト改善（CLAHE）
5. 二値化（大津の方法）
6. 傾き補正（Hough変換ベース）
7. 余白除去（控えめ）
8. シャープ化
"""

import argparse
import csv
import sys
import time
from pathlib import Path

import cv2
import numpy as np


def upscale(img: np.ndarray, factor: int = 2) -> np.ndarray:
    """1. 拡大 — 小さい文字の輪郭を保持するため INTER_CUBIC を使用"""
    h, w = img.shape[:2]
    return cv2.resize(img, (w * factor, h * factor), interpolation=cv2.INTER_CUBIC)


def to_grayscale(img: np.ndarray) -> np.ndarray:
    """2. グレースケール化"""
    if len(img.shape) == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img


def denoise(img: np.ndarray, ksize: int = 3) -> np.ndarray:
    """3. ノイズ低減 — メディアンフィルタ（エッジを保持しつつノイズ除去）"""
    return cv2.medianBlur(img, ksize)


def enhance_contrast(img: np.ndarray, clip_limit: float = 2.0, tile_size: int = 8) -> np.ndarray:
    """4. コントラスト改善 — CLAHE（局所的コントラスト強調）"""
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_size, tile_size))
    return clahe.apply(img)


def binarize(img: np.ndarray) -> np.ndarray:
    """5. 二値化 — 大津の方法（印刷文字に最適な自動閾値）"""
    _, binary = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binary


def correct_skew(img: np.ndarray, max_angle: float = 5.0) -> np.ndarray:
    """6. 傾き補正 — Hough変換で主要な直線の角度を検出し回転補正
    max_angle を超える傾きは無視（誤検出防止）"""
    edges = cv2.Canny(img, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100,
                            minLineLength=img.shape[1] // 4, maxLineGap=10)
    if lines is None:
        return img

    angles = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        dx = x2 - x1
        dy = y2 - y1
        if abs(dx) < 1:
            continue
        angle = np.degrees(np.arctan2(dy, dx))
        if abs(angle) <= max_angle:
            angles.append(angle)

    if not angles:
        return img

    median_angle = np.median(angles)
    if abs(median_angle) < 0.1:
        return img

    h, w = img.shape[:2]
    center = (w // 2, h // 2)
    matrix = cv2.getRotationMatrix2D(center, median_angle, 1.0)
    rotated = cv2.warpAffine(img, matrix, (w, h),
                             flags=cv2.INTER_CUBIC,
                             borderMode=cv2.BORDER_REPLICATE)
    return rotated


def trim_margins(img: np.ndarray, padding: int = 20) -> np.ndarray:
    """7. 余白除去 — 控えめに実施（padding で余裕を残す）"""
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
    coords = cv2.findNonZero(thresh)
    if coords is None:
        return img

    x, y, w, h = cv2.boundingRect(coords)
    img_h, img_w = img.shape[:2]
    x1 = max(0, x - padding)
    y1 = max(0, y - padding)
    x2 = min(img_w, x + w + padding)
    y2 = min(img_h, y + h + padding)
    return img[y1:y2, x1:x2]


def sharpen(img: np.ndarray, strength: float = 0.3) -> np.ndarray:
    """8. シャープ化 — 軽めのアンシャープマスク"""
    blurred = cv2.GaussianBlur(img, (0, 0), sigmaX=2)
    return cv2.addWeighted(img, 1.0 + strength, blurred, -strength, 0)


def process_image(input_path: Path, output_path: Path,
                  scale: int = 2,
                  denoise_ksize: int = 3,
                  clahe_clip: float = 2.0,
                  clahe_tile: int = 8,
                  max_skew: float = 5.0,
                  margin_padding: int = 20,
                  sharpen_strength: float = 0.3) -> None:
    """1枚の画像に対し全前処理を順に実行"""
    img = cv2.imread(str(input_path))
    if img is None:
        raise ValueError(f"画像を読み込めません: {input_path}")

    img = upscale(img, scale)
    img = to_grayscale(img)
    img = denoise(img, denoise_ksize)
    img = enhance_contrast(img, clahe_clip, clahe_tile)
    img = binarize(img)
    img = correct_skew(img, max_skew)
    img = trim_margins(img, margin_padding)
    img = sharpen(img, sharpen_strength)

    cv2.imwrite(str(output_path), img)


def main():
    parser = argparse.ArgumentParser(
        description="OCR前処理: 画像フォルダを一括処理して別フォルダへ出力")
    parser.add_argument("input_dir", help="入力画像フォルダ")
    parser.add_argument("output_dir", help="出力先フォルダ（なければ作成）")
    parser.add_argument("--scale", type=int, default=2, help="拡大倍率 (default: 2)")
    parser.add_argument("--denoise-ksize", type=int, default=3,
                        help="メディアンフィルタのカーネルサイズ (default: 3, 奇数)")
    parser.add_argument("--clahe-clip", type=float, default=2.0,
                        help="CLAHEのclipLimit (default: 2.0)")
    parser.add_argument("--clahe-tile", type=int, default=8,
                        help="CLAHEのタイルサイズ (default: 8)")
    parser.add_argument("--max-skew", type=float, default=5.0,
                        help="傾き補正の最大角度 (default: 5.0)")
    parser.add_argument("--margin-padding", type=int, default=20,
                        help="余白除去時の余裕ピクセル (default: 20)")
    parser.add_argument("--sharpen", type=float, default=0.3,
                        help="シャープ化の強さ (default: 0.3)")
    parser.add_argument("--csv", type=str, default=None,
                        help="qa_draft.csv のパス。指定するとsource_image列の画像だけ処理")
    parser.add_argument("--status", type=str, default=None,
                        help="--csv と併用。指定したhuman_check_statusの行だけ対象 (例: pending)")
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)

    if not input_dir.is_dir():
        print(f"エラー: 入力フォルダが見つかりません: {input_dir}", file=sys.stderr)
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    extensions = {".png", ".jpg", ".jpeg"}

    if args.csv:
        csv_path = Path(args.csv)
        if not csv_path.is_file():
            print(f"エラー: CSVが見つかりません: {csv_path}", file=sys.stderr)
            sys.exit(1)
        with open(csv_path, encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))
        if args.status:
            rows = [r for r in rows if r.get("human_check_status") == args.status]
        target_names = set(r.get("source_image", "").strip() for r in rows if r.get("source_image", "").strip())
        files = sorted(f for f in input_dir.iterdir()
                       if f.name in target_names and f.suffix.lower() in extensions)
        print(f"CSV絞り込み: {len(target_names)}ファイル対象"
              + (f" (status={args.status})" if args.status else ""))
    else:
        files = sorted(f for f in input_dir.iterdir()
                       if f.suffix.lower() in extensions)

    if not files:
        print(f"対象画像なし: {input_dir}")
        sys.exit(0)

    print(f"入力: {input_dir} ({len(files)}件)")
    print(f"出力: {output_dir}")
    print(f"設定: scale={args.scale}, denoise={args.denoise_ksize}, "
          f"clahe={args.clahe_clip}/{args.clahe_tile}, "
          f"max_skew={args.max_skew}°, padding={args.margin_padding}, "
          f"sharpen={args.sharpen}")
    print("-" * 60)

    succeeded = 0
    failed = []
    start_all = time.time()

    for f in files:
        out_path = output_dir / f.name
        try:
            t0 = time.time()
            process_image(
                f, out_path,
                scale=args.scale,
                denoise_ksize=args.denoise_ksize,
                clahe_clip=args.clahe_clip,
                clahe_tile=args.clahe_tile,
                max_skew=args.max_skew,
                margin_padding=args.margin_padding,
                sharpen_strength=args.sharpen,
            )
            elapsed = time.time() - t0
            print(f"  OK  {f.name} ({elapsed:.1f}s)")
            succeeded += 1
        except Exception as e:
            print(f"  NG  {f.name}: {e}")
            failed.append((f.name, str(e)))

    total_time = time.time() - start_all
    print("-" * 60)
    print(f"完了: {succeeded}/{len(files)}件成功 ({total_time:.1f}s)")

    if failed:
        print(f"\n失敗一覧 ({len(failed)}件):")
        for name, err in failed:
            print(f"  {name}: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
