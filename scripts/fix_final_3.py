#!/usr/bin/env python3
"""
fix_final_3.py: 最後の3件の重複問題文を修正する。
"""
import base64, csv, json, os, shutil, sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV_PATH = ROOT / "data" / "qa_draft.csv"
IMAGES_DIR = ROOT / "images"

TARGETS = [
    {
        "record_id": "KB2025-081-006",
        "image_seq": "081",
        "prompt": """これは行政書士試験の肢別過去問集のスキャン画像です（「2 聴聞」セクション）。

右欄の「6 ×」（6番目の問題、答えは×）に対応する問題文を左欄から読み取ってください。

この問題は「聴聞の当事者および参加人による調書等の閲覧請求」に関して、
閲覧できる時期（「聴聞が終結するまで」ではなく「処分がなされるまで」等の誤った時期）を述べた誤りの記述です。

正しく読み取ったテキストのみをJSONで返してください:
{"question_text": "問題文..."}"""
    },
    {
        "record_id": "KB2025-213-002",
        "image_seq": "213",
        "prompt": """これは行政書士試験の肢別過去問集のスキャン画像です（民法「総則」セクション）。

右欄の「1 ×」または「2 ×」（答えが×の問題）のうち、
「外国人は、法令または条約により禁止される場合を除いて、私法上の権利を享有する」という正しい記述とは
別の問題文を読み取ってください。

この問題は民法の基本原則（信義誠実、権利濫用）または権利能力・行為能力に関する
誤った記述（×答え）です。

見つかった場合はそのテキストをJSONで返してください（見つからない場合はnull）:
{"question_text": "問題文..."}"""
    },
    {
        "record_id": "KB2025-227-004",
        "image_seq": "227",
        "prompt": """これは行政書士試験の肢別過去問集のスキャン画像です。

右欄の「4 代理」セクションで「1 ○」（代理セクションの最初の問題、答えは○）に対応する
問題文を左欄から読み取ってください。

この問題は「代理制度」に関して正しい記述（民法99条等）です。

正しく読み取ったテキストのみをJSONで返してください:
{"question_text": "問題文..."}"""
    },
]


def encode_image(path: Path) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def main():
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        print("エラー: OPENAI_API_KEY が未設定", file=sys.stderr)
        sys.exit(1)
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    rows = list(csv.DictReader(open(CSV_PATH, encoding="utf-8-sig")))
    fieldnames = list(rows[0].keys())
    row_index = {r["record_id"]: i for i, r in enumerate(rows)}

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copy2(CSV_PATH, ROOT / "tmp" / f"qa_draft_backup_{ts}.csv")

    fixed = 0
    for t in TARGETS:
        rid = t["record_id"]
        img = IMAGES_DIR / f"{t['image_seq'].zfill(4)}.png"
        idx = row_index.get(rid)

        if idx is None or not img.exists():
            print(f"{rid}: スキップ")
            continue

        old = rows[idx]["question_text"]
        print(f"\n[{rid}]")
        print(f"  旧: {old[:70]}")
        print(f"  Vision解析中...", end="", flush=True)

        b64 = encode_image(img)
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "high"}},
                        {"type": "text", "text": t["prompt"]}
                    ]
                }],
                temperature=0.1,
                response_format={"type": "json_object"},
                timeout=60,
            )
            data = json.loads(response.choices[0].message.content)
            new_text = data.get("question_text")
            if new_text and str(new_text).lower() != "null":
                new_text = str(new_text).strip()
                if new_text == old:
                    print(f" 変更なし")
                else:
                    print(f" 成功")
                    print(f"  新: {new_text[:70]}")
                    rows[idx]["question_text"] = new_text
                    rows[idx]["human_check_note"] = f"最終Vision修正 {datetime.now().strftime('%Y-%m-%d')}"
                    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
                        w = csv.DictWriter(f, fieldnames=fieldnames)
                        w.writeheader()
                        w.writerows(rows)
                    fixed += 1
            else:
                print(f" null/失敗")
        except Exception as e:
            print(f" エラー: {e}")

    print(f"\n\n修正: {fixed}件")


if __name__ == "__main__":
    main()
