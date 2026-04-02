"""
patch_flagged_answer_symbol.py
answer_symbol 誤記疑い 6件を画像右欄の○×で確定し、human_check_note を更新。

画像読み取り結果:
  032-005 : 右欄 × 確認 → DB answer_symbol=× 正しい / E「本肢のとおりである」が誤記
  101-007 : 右欄 × 確認 → DB answer_symbol=× 正しい
  139-005 : 右欄 ○ 確認 → DB answer_symbol=× が誤記 → ○ に修正
  165-002 : 右欄 ○ 確認 → DB answer_symbol=○ 正しい / Q文が逆の推測補完
  177-001 : 右欄 ○ 確認 → DB answer_symbol=○ 正しい / Q文がOCR誤記
  184-004 : 右欄 ○ 確認 → DB answer_symbol=○ 正しい / Q文が推測補完
"""
import csv
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV  = ROOT / "data" / "qa_draft.csv"

# answer_symbol 修正が必要なレコード
SYMBOL_FIXES = {
    'KB2025-139-005': {
        'answer_symbol': '○',
        'answer_boolean': 'True',
    },
}

# human_check_note の更新
NOTE_UPDATES = {
    'KB2025-032-005': (
        "画像0032 section5確認 item2 右欄を直接確認: ×。"
        "DBのanswer_symbol=×は正しい。"
        "Eの「本肢のとおりである」はOCR/推測補完で混入した誤記（Eの修正が必要）。"
        "Q文（確認=既存の事実確定、当選人の決定が例）は法的に概ね正しいが、"
        "原本Qの定義部分が公証に近い表現であるため×とされた可能性がある。"
        "画像0032左欄で原本Q文の正確な表現を確認し、E文を修正してください。"
    ),
    'KB2025-101-007': (
        "画像0101 section2 item2 右欄を直接確認: ×。"
        "DBのanswer_symbol=×は正しい。"
        "Q「処分庁の裁量に属する事項についても上級行政庁に審査請求できる」は×。"
        "行政不服審査法4条の審査請求先要件（上級行政庁の有無・種別）により、"
        "裁量事項への上級行政庁審査請求が一般に認められるわけではない。"
        "E文の法的根拠を整備し、Q文が具体的にどの条件で誤りかを明示してください。"
    ),
    'KB2025-139-005': (
        "画像0139 row5 右欄を直接確認: ○。"
        "DBのanswer_symbol=×は誤記 → ○に修正済み。"
        "Q「事情判決の主文に違法宣言しなければならない」は行訴法31条1項後段のとおり正しい（○）。"
        "Eの「本肢には細部に誤りがある」は誤記（画像の○と矛盾）。"
        "E文を「本肢のとおりである」等に修正してください。"
    ),
    'KB2025-165-002': (
        "画像0165 section4 item1 右欄を直接確認: ○。"
        "DBのanswer_symbol=○は正しい。"
        "ただしDBのQ文「完全補償である必要はない」は○と矛盾する推測補完。"
        "実際の原本Q文は「土地収用法上の損失補償は完全補償を要する」等の正しい記述と推定。"
        "画像0165左欄で原本Q文を確認し、Q文を正確な内容に修正してください。"
    ),
    'KB2025-177-001': (
        "画像0177 row1 右欄を直接確認: ○（右欄item4）。"
        "DBのanswer_symbol=○は正しい。"
        "ただしDBのQ文「議員定数の3分の1以上の議員が出席しないと議決を開くことができる」はOCR誤記。"
        "実際の原本Q文は画像0177左欄の内容と異なる可能性が高い（定足数=半数/地自法113条）。"
        "画像0177左欄row1で原本Q文を直接確認し、Q文を修正してください。"
    ),
    'KB2025-184-004': (
        "画像0184 row4 右欄を直接確認: ○（section4地域自治区 item2）。"
        "DBのanswer_symbol=○は正しい。"
        "ただしDBのQ文「住民が直接選挙するほか」は推測補完で誤り。"
        "地方自治法202条の5第2項は市町村長が選任と定め、直接選挙の規定はない。"
        "原本Q文は地域自治区の別の正しい記述（○が正答の内容）と推定。"
        "画像0184左欄row4で原本Q文を直接確認し、Q文を修正してください。"
    ),
}


def main():
    with open(CSV, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    fix_cnt = note_cnt = 0

    for row in rows:
        rid = row["record_id"]

        if rid in SYMBOL_FIXES:
            for col, val in SYMBOL_FIXES[rid].items():
                row[col] = val
            fix_cnt += 1

        if rid in NOTE_UPDATES:
            row["human_check_note"] = NOTE_UPDATES[rid]
            note_cnt += 1

    with open(CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"answer_symbol 修正: {fix_cnt} 件 (139-005: × → ○)")
    print(f"human_check_note 更新: {note_cnt} 件")


if __name__ == "__main__":
    main()
