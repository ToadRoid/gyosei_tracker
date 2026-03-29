"""
make_review_queue.py
────────────────────────────────────────────────────────────────────────────
qa_draft.csv から「要確認」レコードを抽出し、tmp/review_queue.csv を生成する。

【抽出対象】
  - issue_flag = "1"  (読取揺れ / 問題文欠損 / 出典不明)
  - gpt_check_status = "flagged"
  - human_check_status = "flagged"

【review_priority】
  A : 問題文欠損 ─── question_text が空 または issue_type='問題文欠損'
  B : 読取揺れ かつ issue_detail に「読み取れず」を含む（画像必須）
  C : 読取揺れ その他（テキストだけで確認できる可能性あり）
  D : 出典不明 ─── past_exam_refs 補完が必要
  F : gpt_check_status または human_check_status = "flagged"

  ※ 複数条件が重なる場合は最上位を採用（A > F > B > C > D）

【出力列】
  review_priority, review_reason, image_exists,
  record_id, image_seq, source_image, image_path,
  subject, subject_middle, section_title, question_no,
  issue_type, issue_detail,
  question_text, answer_boolean, explanation_text,
  gpt_check_status, gpt_check_note,
  human_check_status, human_check_note, final_status

【apply_review.py で書き戻せる列】
  question_text, answer_boolean, explanation_text,
  issue_flag, issue_type, issue_detail,
  gpt_check_status, gpt_check_note,
  human_check_status, human_check_note, final_status

【画像パス規約】
  image_path  = images/{source_image}  （参照用フルパス）
  image_exists = True/False（images/ フォルダに実ファイルがあるか）
  画像は images/ フォルダに手動配置（.gitignore 除外、ローカル保管）

使い方:
  python3 scripts/make_review_queue.py
  # → tmp/review_queue.csv を出力（全件）

  python3 scripts/make_review_queue.py --priority A B
  # → review_priority A, B のみ出力

  python3 scripts/make_review_queue.py --subject 行政法
  python3 scripts/make_review_queue.py --subject-middle 行政法の一般的な法理論
"""

import csv
import argparse
from collections import Counter
from pathlib import Path

ROOT   = Path(__file__).parent.parent
INPUT  = ROOT / "data" / "qa_draft.csv"
OUTPUT = ROOT / "tmp" / "review_queue.csv"
IMAGES = ROOT / "images"

OUTPUT_COLS = [
    # ── レビュー管理 ──────────────────────────────────────────────────────
    "review_priority",   # A/B/C/D/F
    "review_reason",     # 人間が読める理由
    "image_exists",      # images/{source_image} が存在するか (True/False)
    # ── 識別・参照 ────────────────────────────────────────────────────────
    "record_id", "image_seq", "source_image", "image_path",
    # ── 分類 ──────────────────────────────────────────────────────────────
    "subject", "subject_middle", "section_title", "question_no",
    # ── 問題内容 ──────────────────────────────────────────────────────────
    "issue_flag", "issue_type", "issue_detail",
    "question_text", "answer_boolean", "explanation_text",
    # ── ステータス ────────────────────────────────────────────────────────
    "gpt_check_status", "gpt_check_note",
    "human_check_status", "human_check_note", "final_status",
]

PRIORITY_ORDER = {"A": 0, "F": 1, "B": 2, "C": 3, "D": 4}

PRIORITY_LABELS = {
    "A": "問題文欠損",
    "F": "flagged",
    "B": "読取揺れ(画像必須)",
    "C": "読取揺れ(要確認)",
    "D": "出典不明",
}


def assign_priority_and_reason(row: dict):
    """
    (priority, review_reason) を返す。レビュー不要なら (None, None)。
    """
    is_flagged_gpt   = row["gpt_check_status"]  == "flagged"
    is_flagged_human = row["human_check_status"] == "flagged"
    issue_flag       = row["issue_flag"] == "1"
    issue_type       = row["issue_type"]
    issue_detail     = row["issue_detail"]
    question_text    = row["question_text"].strip()

    if not (issue_flag or is_flagged_gpt or is_flagged_human):
        return None, None

    # A: 問題文欠損
    if issue_type == "問題文欠損" or (issue_flag and question_text in ("", "[問題文読取困難]")):
        reason = "question_text が空または読取困難。画像から本文を補完してください。"
        return "A", reason

    # F: flagged
    if is_flagged_gpt or is_flagged_human:
        who = []
        if is_flagged_gpt:   who.append("gpt_check")
        if is_flagged_human: who.append("human_check")
        reason = f"{'+'.join(who)} で flagged。gpt_check_note / human_check_note を確認してください。"
        return "F", reason

    # B: 読取揺れ + 読み取れず
    if issue_type == "読取揺れ" and "読み取れず" in issue_detail:
        reason = f"読取揺れ(画像必須): {issue_detail}"
        return "B", reason

    # C: 読取揺れ その他
    if issue_type == "読取揺れ":
        reason = f"読取揺れ(要確認): {issue_detail}"
        return "C", reason

    # D: 出典不明
    if issue_type == "出典不明":
        reason = "past_exam_refs が不明。画像から出典を補完してください。"
        return "D", reason

    reason = f"issue_flag=1 ({issue_type}): {issue_detail}"
    return "C", reason


def main():
    parser = argparse.ArgumentParser(description="レビューキューCSVを生成する")
    parser.add_argument(
        "--priority", nargs="+",
        choices=["A", "B", "C", "D", "F"],
        help="出力する review_priority を絞り込む（例: --priority A B）",
    )
    parser.add_argument("--subject",       help="subject でフィルタ（例: 行政法）")
    parser.add_argument("--subject-middle", dest="subject_middle",
                        help="subject_middle でフィルタ")
    args = parser.parse_args()

    with open(INPUT, encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))

    result = []
    for row in rows:
        p, reason = assign_priority_and_reason(row)
        if p is None:
            continue
        if args.priority and p not in args.priority:
            continue
        if args.subject and row["subject"] != args.subject:
            continue
        if args.subject_middle and row["subject_middle"] != args.subject_middle:
            continue

        img_file = row["source_image"]
        img_path = f"images/{img_file}" if img_file else ""
        img_exists = str((IMAGES / img_file).exists()) if img_file else "False"

        out = {col: row.get(col, "") for col in OUTPUT_COLS}
        out["review_priority"] = p
        out["review_reason"]   = reason
        out["image_exists"]    = img_exists
        out["image_path"]      = img_path
        result.append(out)

    result.sort(key=lambda r: (
        PRIORITY_ORDER.get(r["review_priority"], 9),
        int(r["image_seq"]) if r["image_seq"].isdigit() else 9999,
        r["question_no"],
    ))

    OUTPUT.parent.mkdir(exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLS)
        writer.writeheader()
        writer.writerows(result)

    dist = Counter(r["review_priority"] for r in result)
    img_present = sum(1 for r in result if r["image_exists"] == "True")
    print(f"review_queue.csv 生成完了: {len(result)} 件 → {OUTPUT}")
    print(f"  images/ に存在: {img_present} 件 / 不在: {len(result) - img_present} 件")
    print("  優先度別:")
    for p in ["A", "F", "B", "C", "D"]:
        if p in dist:
            print(f"    {p} ({PRIORITY_LABELS[p]}): {dist[p]} 件")


if __name__ == "__main__":
    main()
