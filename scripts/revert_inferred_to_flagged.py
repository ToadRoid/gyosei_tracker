"""
revert_inferred_to_flagged.py
seq013-033 の補完バッチで done/reviewed にしたうち、
「解説から逆推測した問題文」に留まる28件を flagged/draft に戻す。
直接画像から問題文を読み取った3件（032-001, 032-007, 033-001）は維持。
"""
import csv
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV  = ROOT / "data" / "qa_draft.csv"

# 推測補完のため flagged に戻すレコード（28件）
REVERT_IDS = {
    "KB2025-013-001",
    "KB2025-029-002", "KB2025-029-003", "KB2025-029-004", "KB2025-029-005",
    "KB2025-030-001", "KB2025-030-002", "KB2025-030-003", "KB2025-030-004",
    "KB2025-030-005", "KB2025-030-006", "KB2025-030-007", "KB2025-030-008",
    "KB2025-031-001", "KB2025-031-002", "KB2025-031-005",
    "KB2025-031-007", "KB2025-031-008",
    "KB2025-032-002", "KB2025-032-003", "KB2025-032-004",
    "KB2025-032-005", "KB2025-032-006", "KB2025-032-008",
    "KB2025-033-002", "KB2025-033-003", "KB2025-033-004", "KB2025-033-005",
}

# 維持するレコード（既存テキストで直接確認済み）
KEEP_IDS = {
    "KB2025-032-001",  # 公共料金等の引上げの認可 → テキスト既存
    "KB2025-032-007",  # 所得税の決定は「確認」 → テキスト既存
    "KB2025-033-001",  # 特定の事実…公証といい → テキスト既存
}

def main():
    with open(CSV, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    reverted = 0
    for row in rows:
        rid = row["record_id"]
        if rid not in REVERT_IDS:
            continue
        row["human_check_status"] = "flagged"
        row["final_status"]       = "draft"
        row["human_check_note"]   = (
            "推測補完のため flagged 戻し。"
            "原本画像で問題文を直接確認後に done へ変更してください。"
        )
        # issue_flag を 1 に戻す（未解決として残す）
        row["issue_flag"] = "1"
        row["issue_type"] = "読取揺れ"
        reverted += 1

    with open(CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"revert 完了: {reverted} 件 → human_check_status=flagged, final_status=draft")
    print(f"維持 (done/reviewed): {len(KEEP_IDS)} 件 → {', '.join(sorted(KEEP_IDS))}")

if __name__ == "__main__":
    main()
