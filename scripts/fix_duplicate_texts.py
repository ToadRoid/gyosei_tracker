#!/usr/bin/env python3
"""
fix_duplicate_texts.py

重複問題文（Vision APIが同一question_noに同一テキストを割り当てた）を
説明文ヒントを使って個別にVision再読取して修正する。

対象レコード（手動指定）:
  KB2025-037-004  section=取消し, q_no=1, ×, 解説ヒント=職権取消し
  KB2025-037-006  section=違法行為の転換, q_no=1, ×, 解説ヒント=違法行為の転換
  KB2025-061-001  section=07_強制執行/直接強制, q_no=1, ×, 解説ヒント=直接強制
  KB2025-061-002  section=07_強制執行/直接強制, q_no=2, ○, 解説ヒント=直接強制(真の記述)
  KB2025-061-004  section=07_強制執行/強制徴収, q_no=1, ×, 解説ヒント=国税徴収法・強制徴収

使用例:
  python3 scripts/fix_duplicate_texts.py --dry-run
  python3 scripts/fix_duplicate_texts.py
"""

import argparse
import base64
import csv
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV_PATH = ROOT / "data" / "qa_draft.csv"
IMAGES_DIR = ROOT / "images"

# 修正対象レコードの詳細（説明文ヒントで問題を特定）
FIX_TARGETS = [
    {
        "record_id": "KB2025-037-004",
        "image_seq": "037",
        "answer": "×（誤り）",
        "topic_hint": "行政庁の職権取消し（取消しうる行政行為に対する職権取消しの要件または制約）",
        "section_hint": "取り消すことのできる行政行為セクション（2番目の大項目）",
        "description": "職権取消しに関する誤った記述（q_no=1, 答え×）",
    },
    {
        "record_id": "KB2025-037-006",
        "image_seq": "037",
        "answer": "×（誤り）",
        "topic_hint": "違法行為の転換（違法な行政行為を別の有効な行政行為として評価できる場合の処理）",
        "section_hint": "違法行為の転換・瑕疵の治癒・理由の差替えセクション（3番目の大項目）",
        "description": "違法行為の転換に関する誤った記述（q_no=1, 答え×）",
    },
    {
        "record_id": "KB2025-061-001",
        "image_seq": "061",
        "answer": "×（誤り）",
        "topic_hint": "直接強制（直接強制が義務の不履行を前提とするかどうか、即時強制との違い）",
        "section_hint": "「4 直接強制」セクション（ページ上部、最初の大項目）の問1",
        "description": "直接強制に関する誤った記述（q_no=1, 答え×）",
    },
    {
        "record_id": "KB2025-061-002",
        "image_seq": "061",
        "answer": "○（正しい）",
        "topic_hint": "直接強制（直接強制の定義・性質の正しい説明）",
        "section_hint": "「4 直接強制」セクションの問2（正しい記述）",
        "description": "直接強制に関する正しい記述（q_no=2, 答え○）",
    },
    {
        "record_id": "KB2025-061-004",
        "image_seq": "061",
        "answer": "×（誤り）",
        "topic_hint": "強制徴収（国税徴収法は地方税等の強制徴収には当然には適用されない）",
        "section_hint": "「5 強制徴収」セクションの問1",
        "description": "強制徴収・国税徴収法に関する誤った記述（q_no=1, 答え×）",
    },
]


def encode_image(path: Path) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def extract_specific_question(client, image_path: Path, target: dict):
    """
    説明文ヒントと正誤記号で特定の問題文を読み取る。
    """
    b64 = encode_image(image_path)

    prompt = f"""これは行政書士試験の肢別過去問集のスキャン画像です。

以下の条件に当てはまる問題文を1つだけ読み取ってください:

【正誤】{target['answer']}
【トピック】{target['topic_hint']}
【場所のヒント】{target['section_hint']}
【補足】{target['description']}

注意:
- 問題文（左欄の記述）のみを抽出してください
- 正誤記号・解説は不要
- OCRの誤字があれば法律用語として正確に修正
- 見つからない場合は null

JSON形式のみで返答:
{{"question_text": "問題文..." }}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{b64}",
                            "detail": "high"
                        }
                    },
                    {"type": "text", "text": prompt}
                ]
            }],
            temperature=0.1,
            response_format={"type": "json_object"},
            timeout=60,
        )
        data = json.loads(response.choices[0].message.content)
        text = data.get("question_text")
        if text and str(text).lower() != "null":
            return str(text).strip()
        return None
    except Exception as e:
        print(f"  Vision APIエラー: {e}")
        return None


def save_csv(rows, fieldnames):
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="対象確認のみ")
    args = parser.parse_args()

    print("=== 重複問題文修正スクリプト ===\n")
    print(f"修正対象: {len(FIX_TARGETS)}件\n")

    for t in FIX_TARGETS:
        img = IMAGES_DIR / f"{t['image_seq'].zfill(4)}.png"
        exists = "✓" if img.exists() else "✗ 画像なし"
        print(f"  [{t['record_id']}] {t['description']} [{exists}]")

    if args.dry_run:
        return

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        print("\nエラー: OPENAI_API_KEY が未設定", file=sys.stderr)
        sys.exit(1)
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    rows = list(csv.DictReader(open(CSV_PATH, encoding="utf-8-sig")))
    fieldnames = list(rows[0].keys())
    row_index = {r["record_id"]: i for i, r in enumerate(rows)}

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copy2(CSV_PATH, ROOT / "tmp" / f"qa_draft_backup_{ts}.csv")
    print(f"\nバックアップ: qa_draft_backup_{ts}.csv\n")

    fixed = 0
    for t in FIX_TARGETS:
        img = IMAGES_DIR / f"{t['image_seq'].zfill(4)}.png"
        if not img.exists():
            print(f"  [{t['record_id']}] 画像なし → スキップ")
            continue

        idx = row_index.get(t["record_id"])
        if idx is None:
            print(f"  [{t['record_id']}] CSVに存在しない → スキップ")
            continue

        old_text = rows[idx]["question_text"]
        print(f"\n  [{t['record_id']}]")
        print(f"    旧テキスト: {old_text[:60]}")
        print(f"    Vision解析中...", end="", flush=True)

        new_text = extract_specific_question(client, img, t)

        if new_text:
            print(f" 取得成功")
            print(f"    新テキスト: {new_text[:80]}")
            rows[idx]["question_text"] = new_text
            rows[idx]["human_check_note"] = f"重複修正Vision再読取 {datetime.now().strftime('%Y-%m-%d')}"
            save_csv(rows, fieldnames)
            fixed += 1
        else:
            print(f" 取得失敗 → スキップ")

    print(f"\n\n修正完了: {fixed}/{len(FIX_TARGETS)}件")
    if fixed > 0:
        print("\n次のステップ:")
        print("  python3 scripts/batch_gpt_explanation.py --rebuild-json")
        print("  → /triage で「取込開始」をクリック")


if __name__ == "__main__":
    main()
