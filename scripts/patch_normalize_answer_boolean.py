"""
patch_normalize_answer_boolean.py
answer_boolean の表記揺れを統一する。
  True  → true
  False → false
  （小文字 true/false はそのまま）
"""
import csv
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV  = ROOT / "data" / "qa_draft.csv"


def main():
    with open(CSV, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    fixed = 0
    for row in rows:
        v = row["answer_boolean"]
        if v == "True":
            row["answer_boolean"] = "true"
            fixed += 1
        elif v == "False":
            row["answer_boolean"] = "false"
            fixed += 1

    with open(CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    from collections import Counter
    vals = Counter(r["answer_boolean"] for r in rows)
    print(f"修正件数: {fixed} 件 (True/False → true/false)")
    print(f"正規化後の分布: {dict(vals)}")


if __name__ == "__main__":
    main()
