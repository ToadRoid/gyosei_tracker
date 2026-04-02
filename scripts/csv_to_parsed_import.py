#!/usr/bin/env python3
"""
qa_draft.csv の reviewed 行を ParsedImport JSON に変換する。
出力JSONはアプリの既存インポート機能でそのまま取り込める。

使用例:
  python scripts/csv_to_parsed_import.py data/qa_draft.csv data/reviewed_import.json
"""

import csv
import json
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

# qa_draft.csv の subject → master.ts の subjectId
SUBJECT_MAP = {
    "憲法": "kenpo",
    "行政法": "gyosei",
    "民法": "minpo",
    "商法": "shoho",
    "基礎法学": "kiso-hogaku",
    "基礎知識": "kiso-chishiki",
}

# qa_draft.csv の subject_middle → master.ts の chapterId
CHAPTER_MAP = {
    "総論": "kenpo-soron",
    "人権": "kenpo-jinken",
    "統治": "kenpo-tochi",
    "行政法の一般的な法理論": "gyosei-ippan",
    "行政手続法": "gyosei-tetsuzuki",
    "行政不服審査法": "gyosei-fufuku",
    "行政事件訴訟法": "gyosei-jiken",
    "国家賠償法・損失補償": "gyosei-kokubai",
    "地方自治法": "gyosei-chiho",
    "総則": "minpo-sosoku",
    "物権": "minpo-bukken",
    "債権": "minpo-saiken",
    "親族": "minpo-shinzoku",
    "相続": "minpo-sozoku",
    "商法": "shoho-shoho",
    "会社法": "shoho-kaisha",
}


def main():
    if len(sys.argv) < 3:
        print("Usage: python csv_to_parsed_import.py <qa_draft.csv> <output.json>")
        sys.exit(1)

    csv_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2])

    with open(csv_path, encoding="utf-8-sig") as f:
        rows = [r for r in csv.DictReader(f) if r.get("final_status") == "reviewed"]

    print(f"reviewed: {len(rows)}件")

    # image_seq でグループ化（= 1ページ）
    by_page = defaultdict(list)
    for r in rows:
        by_page[r["image_seq"]].append(r)

    pages = []
    total_branches = 0

    for page_seq in sorted(by_page):
        items = by_page[page_seq]
        branches = []
        for i, r in enumerate(items, 1):
            subject_id = SUBJECT_MAP.get(r.get("subject", ""), "")
            chapter_id = CHAPTER_MAP.get(r.get("subject_middle", ""), "")

            answer_bool = None
            ab = r.get("answer_boolean", "").strip().lower()
            if ab == "true":
                answer_bool = True
            elif ab == "false":
                answer_bool = False

            branches.append({
                "seqNo": i,
                "questionText": r.get("question_text", ""),
                "answerBoolean": answer_bool,
                "explanationText": r.get("explanation_text", ""),
                "subjectCandidate": subject_id,
                "chapterCandidate": chapter_id,
                "confidence": 1.0,  # reviewed済みなので最高信頼度
            })
            total_branches += 1

        pages.append({
            "sourcePage": page_seq.zfill(3),
            "originalProblemId": f"KB2025-p{page_seq.zfill(3)}-q01",
            "bookId": "KB2025",
            "batchId": "reviewed-import",
            "branches": branches,
            "parseError": None,
        })

    payload = {
        "type": "parsed",
        "bookId": "KB2025",
        "batchId": "reviewed-import",
        "parsedAt": datetime.now().isoformat(),
        "model": "human-reviewed",
        "totalBranches": total_branches,
        "pages": pages,
        "queuedAt": datetime.now().isoformat(),
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"出力: {out_path}")
    print(f"  ページ数: {len(pages)}")
    print(f"  問題数: {total_branches}")


if __name__ == "__main__":
    main()
