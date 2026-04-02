"""
patch_p3_batch02.py
Priority 3 バッチ02 — seq034〜046 の 73 件を flagged へ

確認内容:
  answer_symbol: 各画像の右欄 ○/× マークを直接読み取り、DB 値と一致を確認
  question_text: 全件プレースホルダー。左欄テキストは小さく完全に読み取れないため flagged
  → 「answer_symbol 確認済み・Q 文は要原本転記」として flagged に変更

画像ごとの確認結果:
  0034 (034-001〜005): ×,×,×,○,×
  0035 (035-001〜006): ×,○,×,×,×,×
  0036 (036-001〜005): ○,×,○,×,×
  0037 (037-001〜006): ×,○,×,×,×,×
  0038 (038-001〜006): ×,×,×,○,○,×
  0039 (039-001〜006): ×,○,×,×,×,×
  0040 (040-001〜006): ×,○,×,×,×,×
  0041 (041-001〜007): ×,○,×,×,○,○,×
  0042 (042-001,002,004,005,006): ×,×,○,×,○
  0043 (043-002,003,004,005,007,008,009): ×,×,×,×,○,○,×
  0044 (044-001〜005): ×,○,×,○,×
  0045 (045-001〜005): ○,○,×,○,○
  0046 (046-001〜004): ○,×,×,×
"""
import csv
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV  = ROOT / "data" / "qa_draft.csv"

FLAG_NOTE = (
    "画像右欄の answer_symbol を直接確認済み（DB 値と一致）。"
    "Q 文は現在プレースホルダーのため、原本画像左欄から直接転記が必要。"
    "answer_symbol 確認済み・Q/E 文要転記のため flagged に設定。"
)

FLAG_RIDS = {
    # seq034
    'KB2025-034-001', 'KB2025-034-002', 'KB2025-034-003',
    'KB2025-034-004', 'KB2025-034-005',
    # seq035
    'KB2025-035-001', 'KB2025-035-002', 'KB2025-035-003',
    'KB2025-035-004', 'KB2025-035-005', 'KB2025-035-006',
    # seq036
    'KB2025-036-001', 'KB2025-036-002', 'KB2025-036-003',
    'KB2025-036-004', 'KB2025-036-005',
    # seq037
    'KB2025-037-001', 'KB2025-037-002', 'KB2025-037-003',
    'KB2025-037-004', 'KB2025-037-005', 'KB2025-037-006',
    # seq038
    'KB2025-038-001', 'KB2025-038-002', 'KB2025-038-003',
    'KB2025-038-004', 'KB2025-038-005', 'KB2025-038-006',
    # seq039
    'KB2025-039-001', 'KB2025-039-002', 'KB2025-039-003',
    'KB2025-039-004', 'KB2025-039-005', 'KB2025-039-006',
    # seq040
    'KB2025-040-001', 'KB2025-040-002', 'KB2025-040-003',
    'KB2025-040-004', 'KB2025-040-005', 'KB2025-040-006',
    # seq041
    'KB2025-041-001', 'KB2025-041-002', 'KB2025-041-003',
    'KB2025-041-004', 'KB2025-041-005', 'KB2025-041-006',
    'KB2025-041-007',
    # seq042 (row3は除外 = 既存done)
    'KB2025-042-001', 'KB2025-042-002',
    'KB2025-042-004', 'KB2025-042-005', 'KB2025-042-006',
    # seq043 (row1,6は除外 = 既存done)
    'KB2025-043-002', 'KB2025-043-003', 'KB2025-043-004',
    'KB2025-043-005',
    'KB2025-043-007', 'KB2025-043-008', 'KB2025-043-009',
    # seq044
    'KB2025-044-001', 'KB2025-044-002', 'KB2025-044-003',
    'KB2025-044-004', 'KB2025-044-005',
    # seq045
    'KB2025-045-001', 'KB2025-045-002', 'KB2025-045-003',
    'KB2025-045-004', 'KB2025-045-005',
    # seq046
    'KB2025-046-001', 'KB2025-046-002',
    'KB2025-046-003', 'KB2025-046-004',
}


def main():
    with open(CSV, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    flagged_cnt = skipped = 0

    for row in rows:
        rid = row["record_id"]
        if rid not in FLAG_RIDS:
            continue
        if row["human_check_status"] != "pending":
            skipped += 1
            continue

        row["human_check_status"] = "flagged"
        row["issue_flag"]         = "1"
        row["issue_type"]         = "q_text_placeholder"
        row["issue_detail"]       = "answer_symbol画像確認済み。Q文プレースホルダー要転記。"
        row["human_check_note"]   = FLAG_NOTE
        flagged_cnt += 1

    with open(CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    from collections import Counter
    sc = Counter(r["human_check_status"] for r in rows)
    print(f"pending → flagged: {flagged_cnt} 件 (スキップ: {skipped} 件)")
    print(f"human_check_status: {dict(sc)}")


if __name__ == "__main__":
    main()
