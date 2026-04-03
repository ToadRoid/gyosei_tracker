#!/usr/bin/env python3
"""
add_missing_p051.py

欠番だったp051（行政契約）をGPT-4o Visionで読み取り、
reviewed_import.jsonに追加する。
"""

import base64
import json
import os
from pathlib import Path

ROOT = Path(__file__).parent.parent
IMAGE_PATH = ROOT / "images" / "0051.png"
JSON_PATH = ROOT / "data" / "reviewed_import.json"

def encode_image(path: Path) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def call_vision(image_b64: str) -> list[dict]:
    from openai import OpenAI
    client = OpenAI()

    prompt = """この画像は行政書士試験の肢別過去問集のページです。
左ページに問題文（肢）、右ページに答え（○か×）と解説があります。

各肢について以下のJSON配列で返してください（seqNoは1から順番）:
[
  {
    "seqNo": 1,
    "questionText": "問題文をそのまま正確に転記",
    "answerBoolean": true または false,  // ○=true, ×=false
    "explanationText": "解説文をそのまま正確に転記",
    "sectionTitle": "行政契約"
  },
  ...
]

注意:
- 問題文・解説文は画像の文字をそのまま転記（要約・改変しない）
- answerBooleanは右ページの○×記号から直接判定
- 解説文は参照条文・判例番号も含めて転記

JSON配列のみ返してください。"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_b64}",
                            "detail": "high",
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        max_tokens=2000,
    )

    raw = response.choices[0].message.content.strip()
    # JSONブロックを抽出
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


def main():
    print(f"画像読み取り: {IMAGE_PATH}")
    image_b64 = encode_image(IMAGE_PATH)

    print("GPT-4o Visionで解析中...")
    branches = call_vision(image_b64)
    print(f"  → {len(branches)}件取得")
    for b in branches:
        ans = "○" if b["answerBoolean"] else "×"
        print(f"  [{ans}] {b['questionText'][:40]}...")

    # reviewed_import.jsonに追加
    with open(JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)

    # p051のエントリを作成
    new_page = {
        "sourcePage": "051",
        "originalProblemId": "KB2025-p051-q01",
        "bookId": "KB2025",
        "batchId": "reviewed-import",
        "branches": [
            {
                "seqNo": b["seqNo"],
                "questionText": b["questionText"],
                "answerBoolean": b["answerBoolean"],
                "explanationText": b.get("explanationText", ""),
                "sectionTitle": b.get("sectionTitle", "行政契約"),
                "subjectCandidate": "gyosei",
                "chapterCandidate": "gyosei_keiyaku",
            }
            for b in branches
        ],
    }

    # ページ順に挿入（sourcePage=050の次）
    pages = data.get("pages", [])
    insert_idx = next(
        (i + 1 for i, p in enumerate(pages) if p.get("sourcePage") == "050"),
        len(pages),
    )
    pages.insert(insert_idx, new_page)
    data["pages"] = pages
    data["totalBranches"] = sum(len(p.get("branches", [])) for p in pages)

    # バックアップ
    backup = JSON_PATH.with_suffix(".json.bak_p051")
    import shutil
    shutil.copy(JSON_PATH, backup)
    print(f"バックアップ: {backup}")

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"完了: totalBranches={data['totalBranches']}")
    print("\n--- 取得内容 ---")
    for b in branches:
        ans = "○" if b["answerBoolean"] else "×"
        print(f"\n[{ans}] {b['questionText']}")
        print(f"  解説: {b.get('explanationText', '')[:80]}...")


if __name__ == "__main__":
    main()
