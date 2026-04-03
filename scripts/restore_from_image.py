#!/usr/bin/env python3
"""
restore_from_image.py

原本復元待ちレコードの画像をGPT-4o Visionで読み取り、
question_text を自動復元する。

使用例:
  python3 scripts/restore_from_image.py --dry-run
  python3 scripts/restore_from_image.py


使用例:
  python3 scripts/restore_from_image.py --dry-run           # 原本復元待ち14件
  python3 scripts/restore_from_image.py --a-problems --dry-run  # A問題113件
  python3 scripts/restore_from_image.py --a-problems        # A問題を実行
"""

import argparse
import base64
import csv
import json
import os
import shutil
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV_PATH = ROOT / "data" / "qa_draft.csv"
IMAGES_DIR = ROOT / "images"
OUT_JSON = ROOT / "data" / "reviewed_import.json"
PENDING_JSON = ROOT / "tmp" / "pending_parsed.json"

BOOK_ID = "KB2025"
BATCH_ID = "reviewed-import"

SUBJECT_MAP = {
    "憲法": "kenpo", "行政法": "gyosei", "民法": "minpo",
    "商法": "shoho", "基礎法学": "kiso-hogaku", "基礎知識": "kiso-chishiki",
}
CHAPTER_MAP = {
    "総論": "kenpo-soron", "人権": "kenpo-jinken", "統治": "kenpo-tochi",
    "行政法の一般的な法理論": "gyosei-ippan", "行政手続法": "gyosei-tetsuzuki",
    "行政不服審査法": "gyosei-fufuku", "行政事件訴訟法": "gyosei-jiken",
    "国家賠償法・損失補償": "gyosei-kokubai", "地方自治法": "gyosei-chiho",
    "総則": "minpo-sosoku", "物権": "minpo-bukken", "物権総論": "minpo-bukken",
    "債権": "minpo-saiken", "親族": "minpo-shinzoku", "相続": "minpo-sozoku",
    "商法": "shoho-shoho", "会社法": "shoho-kaisha",
}


def encode_image(path: Path) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def extract_questions_from_image(client, image_path: Path, records: list[dict]) -> dict[str, str]:
    """
    画像1枚から複数問の question_text を抽出する。
    records: 同一ページの原本復元待ちレコード群
    戻り値: {record_id: question_text}
    """
    b64 = encode_image(image_path)

    qnos = [r.get("question_no", "") for r in records]
    hints = []
    for r in records:
        hints.append(
            f"問{r.get('question_no','?')}: 正解={r.get('answer_symbol','')} "
            f"解説ヒント={r.get('explanation_text','')[:60]}"
        )

    prompt = f"""これは行政書士試験の肢別過去問集のスキャン画像です。
左欄に問題文、右欄に正誤記号と解説が記載されています。

以下の問番号の問題文を正確に読み取ってください: {', '.join(qnos)}

参考情報（正解と解説の一部）:
{chr(10).join(hints)}

注意:
- 問題文のみを抽出（正誤記号・解説は不要）
- OCRの誤字は訂正してください
- 法律用語・条文番号は正確に
- 読み取れない場合は null

JSON形式のみで返答してください:
{{"questions": [{{"no": "1", "text": "問題文..."}}]}}"""

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
        result = {}
        for q in data.get("questions", []):
            no = str(q.get("no", "")).strip()
            text = q.get("text")
            if text:
                # question_no でレコードを特定
                for r in records:
                    if r.get("question_no", "").strip() == no:
                        result[r["record_id"]] = str(text).strip()
        return result
    except Exception as e:
        print(f"  Vision APIエラー: {e}")
        return {}


def save_csv(rows, fieldnames):
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def rebuild_json(rows):
    reviewed = [r for r in rows if r.get("final_status") == "reviewed"]
    by_page = defaultdict(list)
    for r in reviewed:
        by_page[r["image_seq"]].append(r)

    pages = []
    total_branches = 0
    for page_seq in sorted(by_page.keys()):
        items = sorted(by_page[page_seq], key=lambda r: int(r.get("question_no", "0") or "0"))
        branches = []
        for i, r in enumerate(items, 1):
            ans_str = r.get("answer_boolean", "").strip().lower()
            ans_bool = True if ans_str == "true" else False if ans_str == "false" else None
            exp = r.get("explanation_text", "").strip()
            if exp.startswith("[解説読取困難"):
                exp = ""
            branches.append({
                "seqNo": i,
                "questionText": r.get("question_text", ""),
                "answerBoolean": ans_bool,
                "explanationText": exp,
                "subjectCandidate": SUBJECT_MAP.get(r.get("subject", ""), ""),
                "chapterCandidate": CHAPTER_MAP.get(r.get("subject_middle", ""), ""),
                "confidence": 1.0,
                "sectionTitle": r.get("section_title", ""),
                "sourcePageQuestion": r.get("source_page_question", ""),
                "sourcePageAnswer": r.get("source_page_answer", ""),
            })
            total_branches += 1
        pages.append({
            "sourcePage": page_seq.zfill(3),
            "originalProblemId": f"{BOOK_ID}-p{page_seq.zfill(3)}-q01",
            "bookId": BOOK_ID,
            "batchId": BATCH_ID,
            "branches": branches,
            "parseError": None,
        })

    payload = {
        "type": "parsed", "bookId": BOOK_ID, "batchId": BATCH_ID,
        "parsedAt": datetime.now().isoformat(), "model": "gpt-4o-vision-restored",
        "totalBranches": total_branches, "pages": pages,
        "queuedAt": datetime.now().isoformat(),
    }
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    PENDING_JSON.parent.mkdir(exist_ok=True)
    shutil.copy2(OUT_JSON, PENDING_JSON)
    print(f"JSON再生成: {total_branches}問 / {len(pages)}ページ")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--a-problems", action="store_true",
                        help="A問題（読取揺れ・原本照合必須）を対象にする")
    args = parser.parse_args()

    rows = list(csv.DictReader(open(CSV_PATH, encoding="utf-8-sig")))
    fieldnames = list(rows[0].keys())
    row_index = {r["record_id"]: i for i, r in enumerate(rows)}

    if args.a_problems:
        targets = [r for r in rows
                   if r.get("issue_type") == "読取揺れ"
                   and "原本照合必須" in r.get("issue_detail", "")]
        done_flag = "vision_verified"
        done_issue_type = "読取揺れ（照合済み）"
        promote_to_reviewed = True
    else:
        targets = [r for r in rows if r.get("issue_type") == "原本復元待ち"]
        done_flag = "vision_restored"
        done_issue_type = "原本復元済み"
        promote_to_reviewed = True
    print(f"対象: {len(targets)}件")

    # ページ（image_seq）ごとにグループ化
    by_page = defaultdict(list)
    for r in targets:
        by_page[r["image_seq"]].append(r)

    print(f"対象ページ数: {len(by_page)}ページ")
    for seq, recs in sorted(by_page.items()):
        img = IMAGES_DIR / f"{seq.zfill(4)}.png"
        exists = "✓" if img.exists() else "✗ 画像なし"
        print(f"  p{seq}: {len(recs)}件 [{exists}]")
        for r in recs:
            print(f"    問{r.get('question_no','')} {r.get('question_text','')[:50]}")

    if args.dry_run:
        return

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        print("エラー: OPENAI_API_KEY が未設定", file=sys.stderr)
        sys.exit(1)
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copy2(CSV_PATH, ROOT / "tmp" / f"qa_draft_backup_{ts}.csv")

    restored = 0
    for seq, recs in sorted(by_page.items()):
        img = IMAGES_DIR / f"{seq.zfill(4)}.png"
        if not img.exists():
            print(f"  p{seq}: 画像なし → スキップ")
            continue

        print(f"  p{seq}: {len(recs)}件 Vision解析中...", end="", flush=True)
        results = extract_questions_from_image(client, img, recs)

        for rid, text in results.items():
            idx = row_index.get(rid)
            if idx is not None:
                rows[idx]["question_text"] = text
                rows[idx]["issue_type"] = done_issue_type
                rows[idx]["final_status"] = "reviewed"
                rows[idx]["human_check_status"] = done_flag
                rows[idx]["human_check_note"] = f"Vision照合 {datetime.now().strftime('%Y-%m-%d')}"
                restored += 1

        save_csv(rows, fieldnames)
        print(f" {len(results)}/{len(recs)}件復元")

    print(f"\n復元完了: {restored}件")
    if restored > 0:
        print("\nJSON再生成中...")
        rebuild_json(rows)
        print("→ /triage で「取込開始」をクリックしてください")


if __name__ == "__main__":
    main()
