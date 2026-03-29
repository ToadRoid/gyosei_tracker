"""
make_review_queue.py
────────────────────────────────────────────────────────────────────────────
qa_draft.csv から「要画像確認」レコードを抽出し、
tmp/review_queue.csv を生成する。

【抽出対象】
  - issue_flag = "1"  (読取揺れ / 問題文欠損 / 出典不明)
  - gpt_check_status = "flagged"
  - human_check_status = "flagged"

【優先度 (priority)】
  A : 問題文欠損 ─── question_text が空、または issue_type='問題文欠損'
  B : 読取揺れ かつ issue_detail に「読み取れず」を含む（画像必須）
  C : 読取揺れ その他（テキストで確認できる可能性あり）
  D : 出典不明 ─── past_exam_refs 補完が必要
  F : gpt_check_status または human_check_status = "flagged"

  ※ 複数条件が重なる場合は最上位 priority を採用（A > F > B > C > D）

【出力列】
  priority, record_id, image_seq, source_image, image_path,
  subject, subject_middle, section_title, question_no,
  issue_type, issue_detail, question_text, answer_boolean,
  explanation_text, gpt_check_status, gpt_check_note,
  human_check_status, human_check_note, final_status

【画像パス規約】
  image_path = images/{source_image}
  画像は images/ フォルダに手動配置（.gitignore 除外、ローカル保管）

使い方:
  python3 scripts/make_review_queue.py
  # → tmp/review_queue.csv を出力

  python3 scripts/make_review_queue.py --priority A B
  # → priority A, B のみ出力

  python3 scripts/make_review_queue.py --subject 行政法
  # → subject フィルタ
"""

import csv
import os
import argparse
from pathlib import Path

ROOT = Path(__file__).parent.parent
INPUT = ROOT / "data" / "qa_draft.csv"
OUTPUT = ROOT / "tmp" / "review_queue.csv"

OUTPUT_COLS = [
    "priority", "record_id", "image_seq", "source_image", "image_path",
    "subject", "subject_middle", "section_title", "question_no",
    "issue_type", "issue_detail",
    "question_text", "answer_boolean", "explanation_text",
    "gpt_check_status", "gpt_check_note",
    "human_check_status", "human_check_note", "final_status",
]


def assign_priority(row: dict):
    """
    対象行の priority を返す。レビュー不要なら None。
    """
    is_flagged_gpt   = row["gpt_check_status"]   == "flagged"
    is_flagged_human = row["human_check_status"]  == "flagged"
    issue_flag       = row["issue_flag"] == "1"
    issue_type       = row["issue_type"]
    issue_detail     = row["issue_detail"]
    question_text    = row["question_text"].strip()

    if not (issue_flag or is_flagged_gpt or is_flagged_human):
        return None  # 対象外

    # A: 問題文欠損
    if issue_type == "問題文欠損" or (issue_flag and question_text == ""):
        return "A"

    # F: flagged (gpt/human)
    if is_flagged_gpt or is_flagged_human:
        return "F"

    # B: 読取揺れ かつ「読み取れず」を含む
    if issue_type == "読取揺れ" and "読み取れず" in issue_detail:
        return "B"

    # C: 読取揺れ その他
    if issue_type == "読取揺れ":
        return "C"

    # D: 出典不明
    if issue_type == "出典不明":
        return "D"

    return "C"  # fallback


PRIORITY_ORDER = {"A": 0, "F": 1, "B": 2, "C": 3, "D": 4}


def main():
    parser = argparse.ArgumentParser(description="レビューキューCSVを生成する")
    parser.add_argument(
        "--priority", nargs="+",
        choices=["A", "B", "C", "D", "F"],
        help="出力する priority を絞り込む（例: --priority A B）"
    )
    parser.add_argument("--subject", help="subject でフィルタ（例: 行政法）")
    parser.add_argument(
        "--subject-middle",
        dest="subject_middle",
        help="subject_middle でフィルタ（例: 行政法の一般的な法理論）"
    )
    args = parser.parse_args()

    # 読み込み
    with open(INPUT, encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))

    # priority 付与 + フィルタ
    result = []
    for row in rows:
        p = assign_priority(row)
        if p is None:
            continue
        if args.priority and p not in args.priority:
            continue
        if args.subject and row["subject"] != args.subject:
            continue
        if args.subject_middle and row["subject_middle"] != args.subject_middle:
            continue

        out = {col: row.get(col, "") for col in OUTPUT_COLS}
        out["priority"] = p
        out["image_path"] = f"images/{row['source_image']}" if row["source_image"] else ""
        result.append(out)

    # priority → image_seq → question_no でソート
    result.sort(key=lambda r: (
        PRIORITY_ORDER.get(r["priority"], 9),
        int(r["image_seq"]) if r["image_seq"].isdigit() else 999,
        r["question_no"],
    ))

    # 出力
    OUTPUT.parent.mkdir(exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLS)
        writer.writeheader()
        writer.writerows(result)

    # サマリー表示
    from collections import Counter
    dist = Counter(r["priority"] for r in result)
    print(f"review_queue.csv 生成完了: {len(result)} 件 → {OUTPUT}")
    print("  優先度別:")
    for p in ["A", "F", "B", "C", "D"]:
        if p in dist:
            labels = {"A": "問題文欠損", "F": "flagged", "B": "読取揺れ(画像必須)", "C": "読取揺れ(要確認)", "D": "出典不明"}
            print(f"    {p} ({labels[p]}): {dist[p]} 件")


if __name__ == "__main__":
    main()
