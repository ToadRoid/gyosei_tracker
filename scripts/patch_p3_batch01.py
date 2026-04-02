"""
patch_p3_batch01.py
Priority 3 バッチ01 — placeholder 805件のうち画像直接確認できた分

確認基準:
  - Q文 と answer_symbol の両方を原画像から直接読み取り確認
  - 隣接行の位置関係のみによる推定は不使用
  - 解説・法知識からの逆算は不使用

今回の確認画像と結果:
  0004 row2 (004-002): Q「司法権とは民事・刑事にとどまらず行政事件の裁判権も含む」  右欄○ → DB Q文は既に正文、答○確認
  0009 row2 (009-002): Q「最高裁判所は規則の制定を下級裁判所に委任できる」         右欄○ → Q文をプレースホルダーから実文に更新
  0023 row3 (023-003): Q「行政庁とは行政主体の意思を決定し外部に表示する機関をいう」右欄○ → Q文をプレースホルダーから実文に更新
  0027 row1 (027-001): Q「権限が委任された場合、委任庁はその権限を失い受任庁の権限となる」右欄○ → Q文をプレースホルダーから実文に更新

pending 維持（Q文または answer_symbol が画像から直接確認できず）:
  008-002, 009-005, 025-003, 028-004
"""
import csv
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV  = ROOT / "data" / "qa_draft.csv"

DONE_NOTE_TMPL = "画像{seq}右欄の answer_symbol と左欄 Q 文を直接確認済み。done/reviewed に昇格。"

UPDATES = {
    'KB2025-004-002': {
        # Q文は DB に既に正文あり、answer_symbol=○ を画像0004 row2 右欄で直接確認
        'question_text': None,  # 変更なし
        'human_check_note': DONE_NOTE_TMPL.format(seq="0004"),
    },
    'KB2025-009-002': {
        'question_text': (
            "最高裁判所は、訴訟に関する手続等に関する規則の制定を"
            "下級裁判所に委任することができる。"
        ),
        'human_check_note': DONE_NOTE_TMPL.format(seq="0009"),
    },
    'KB2025-023-003': {
        'question_text': (
            "行政庁とは、行政主体の意思を決定し、"
            "これを外部に表示することができる機関をいう。"
        ),
        'human_check_note': DONE_NOTE_TMPL.format(seq="0023"),
    },
    'KB2025-027-001': {
        'question_text': (
            "行政庁の権限が委任された場合には、"
            "委任した行政庁はその権限を失い受任行政庁の権限となる。"
        ),
        'human_check_note': DONE_NOTE_TMPL.format(seq="0027"),
    },
}


def main():
    with open(CSV, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    done_cnt = 0

    for row in rows:
        rid = row["record_id"]
        if rid not in UPDATES:
            continue

        upd = UPDATES[rid]
        if upd['question_text'] is not None:
            row["question_text"] = upd['question_text']

        row["human_check_status"] = "done"
        row["final_status"]        = "reviewed"
        row["issue_flag"]          = "0"
        row["issue_type"]          = ""
        row["issue_detail"]        = ""
        row["human_check_note"]    = upd['human_check_note']
        done_cnt += 1

    with open(CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    from collections import Counter
    sc = Counter(r["human_check_status"] for r in rows)
    print(f"done/reviewed へ昇格: {done_cnt} 件")
    print(f"human_check_status: {dict(sc)}")


if __name__ == "__main__":
    main()
