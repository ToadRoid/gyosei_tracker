"""
patch_flagged_46.py
flagged 46件の再確認結果を tmp/review_queue.csv に書き込む。
  - 確定 17件 → human_check_status=done, final_status=reviewed, human_check_note=""
  - 継続 29件 → human_check_status=flagged のまま, human_check_note を更新
"""
import csv
from pathlib import Path

ROOT  = Path(__file__).parent.parent
QUEUE = ROOT / "tmp" / "review_queue.csv"

# ── 確定 17件 ──────────────────────────────────────────────────────────────
DONE_PATCHES = {
    "KB2025-004-003": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "question_text": "司法権が最高裁判所及び下級裁判所に属するとされているが、行政機関も法律に根拠があれば、終審として裁判を行うことができる。",
        "explanation_text": "憲法76条2項は行政機関が終審として裁判を行うことを禁じている。法律の根拠があっても終審行政裁判は許されない。本肢は誤っている。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-005-005": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "explanation_text": "統治行為に対しても司法審査が及ばないとは言い切れない。高度に政治的な問題であっても、一切審査が及ばないとする見解は判例上も採られていない。「司法審査は及ばない」とする本肢は誤っている。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-007-002": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "question_text": "最高裁判所のすべての裁判官（長官及びその他の裁判官）は、天皇がこれを任命する。",
        "explanation_text": "最高裁判所長官は内閣の指名に基づき天皇が任命する（憲法6条2項）が、その他の裁判官は内閣が任命する（憲法79条1項）。すべてを天皇が任命するとする本肢は誤っている。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-007-007": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "explanation_text": "最高裁判所の裁判官は、任命後初めて行われる衆議院議員総選挙の際に国民審査を受け、その後も10年ごとに審査を受ける（憲法79条2項・3項）。本肢は正しい。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-012-001": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "explanation_text": "行政立法（法規命令・行政規則）は行政行為の一種ではなく、行政機関が定める抽象的・一般的な定めである。行政行為は具体的・個別的な公権力行使を指す。本肢は誤っている。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-012-004": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "explanation_text": "会計年度開始までに予算が成立しない場合、自動的に失効するのではなく、暫定予算等の措置が講じられる（財政法30条）。自動的に失効するとする本肢は誤っている。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-017-004": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "explanation_text": "憲法改正の発議権は国会にあり（憲法96条1項）、天皇には憲法改正の提案権はない。天皇が提案するとする本肢は誤っている。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-021-003": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "explanation_text": "農地の売買は農地法3条・5条による許可が必要であり、無許可の売買契約は原則無効となる（農地法3条6項）。民法の規定のみにより効力を判断するとする本肢は誤っている。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-022-003": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "explanation_text": "制限行為能力者が詐術を用いて行為能力者であると信じさせた場合、その行為を取り消すことができない（民法21条）。本肢は正しい。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-024-002": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "explanation_text": "行政機関には様々な種類があり、「実力をもって執行する機関」という限定的な定義は行政機関全体に当てはまらない。本肢は誤っている。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-024-005": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "explanation_text": "人事院は独立性が高い機関だが、内閣から完全に独立した機関ではなく、国家公務員法3条に基づき内閣の所轄の下に置かれる。本肢は誤っている。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-024-006": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "explanation_text": "内閣総理大臣は、各大臣を任免する権限を有する（憲法68条）。本肢は正しい。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-025-001": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "explanation_text": "行政規則（通達・訓令等）は法規の性質を有さず、行政機関内部を拘束するにとどまり、国民を直接拘束しない。本肢は正しい。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-026-003": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "explanation_text": "告示の法的性質は多様であり、法規の性質を有する告示（法規命令的告示）も存在すれば、行政規則的な告示も存在する。すべての告示が法規の性質を有するとはいえない。本肢は誤っている。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-026-004": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "explanation_text": "公正取引委員会は内閣府の外局（独占禁止法27条）、公害等調整委員会は総務省の外局である。本肢の記述は誤っている。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-026-005": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "explanation_text": "国家行政組織法上、各省大臣は主任の行政事務について省令を発することができる（国家行政組織法12条1項）。本肢は正しい。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
    "KB2025-028-006": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "human_check_note": "",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "explanation_text": "行政手続法は申請に対する処分について標準処理期間の設定・公表を努力義務とする（行政手続法6条）。本肢は正しい。",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
    },
}

# ── 継続 flagged 29件 ────────────────────────────────────────────────────
FLAGGED_NOTES = {
    "KB2025-006-002": "問題文と画像の内容が不一致の可能性あり。画像0006で問題文・正解・解説を直接確認してください。",
    "KB2025-006-004": "問題文と画像の内容が不一致の可能性あり。画像0006で問題文・正解・解説を直接確認してください。",
    "KB2025-008-005": "問題文または解説の読み取り不確実。画像0008で正確な内容を確認してください。",
    "KB2025-010-006": "問題文または解説の読み取り不確実。画像0010で正確な内容を確認してください。",
    "KB2025-011-004": "問題文または解説の読み取り不確実。画像0011で正確な内容を確認してください。",
    "KB2025-011-005": "問題文または解説の読み取り不確実。画像0011で正確な内容を確認してください。",
    "KB2025-012-002": "問題文と正解の整合性要確認。画像0012で正確な内容を確認してください。",
    "KB2025-012-003": "問題文と正解の整合性要確認。画像0012で正確な内容を確認してください。",
    "KB2025-012-006": "問題文と正解の整合性要確認。画像0012で正確な内容を確認してください。",
    "KB2025-013-004": "問題文または解説の読み取り不確実。画像0013で正確な内容を確認してください。",
    "KB2025-013-006": "問題文または解説の読み取り不確実。画像0013で正確な内容を確認してください。",
    "KB2025-016-001": "問題文と正解の整合性要確認。画像0016で正確な内容を確認してください。",
    "KB2025-016-003": "問題文と正解の整合性要確認。画像0016で正確な内容を確認してください。",
    "KB2025-016-004": "問題文と正解の整合性要確認。画像0016で正確な内容を確認してください。",
    "KB2025-017-005": "問題文と正解の整合性要確認。画像0017で正確な内容を確認してください。",
    "KB2025-021-001": "問題文と正解の整合性要確認。画像0021で正確な内容を確認してください。",
    "KB2025-022-004": "問題文と正解の整合性要確認。画像0022で正確な内容を確認してください。",
    "KB2025-022-005": "問題文と正解の整合性要確認。画像0022で正確な内容を確認してください。",
    "KB2025-023-001": "問題文と正解の整合性要確認。画像0023で正確な内容を確認してください。",
    "KB2025-023-005": "問題文と正解の整合性要確認。画像0023で正確な内容を確認してください。",
    "KB2025-024-001": "問題文と正解の整合性要確認。画像0024で正確な内容を確認してください。",
    "KB2025-024-003": "問題文と正解の整合性要確認。画像0024で正確な内容を確認してください。",
    "KB2025-024-004": "問題文と正解の整合性要確認。画像0024で正確な内容を確認してください。",
    "KB2025-025-004": "問題文と正解の整合性要確認。画像0025で正確な内容を確認してください。",
    "KB2025-025-006": "問題文と正解の整合性要確認。画像0025で正確な内容を確認してください。",
    "KB2025-026-001": "問題文と正解の整合性要確認。画像0026で正確な内容を確認してください。",
    "KB2025-026-002": "問題文と正解の整合性要確認。画像0026で正確な内容を確認してください。",
    "KB2025-027-004": "問題文と正解の整合性要確認。画像0027で正確な内容を確認してください。",
    "KB2025-028-003": "問題文と正解の整合性要確認。画像0028で正確な内容を確認してください。",
}


def main():
    with open(QUEUE, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    updated = 0
    for row in rows:
        rid = row["record_id"]

        if rid in DONE_PATCHES:
            for col, val in DONE_PATCHES[rid].items():
                if col in fieldnames:
                    row[col] = val
            updated += 1

        elif rid in FLAGGED_NOTES:
            row["human_check_note"] = FLAGGED_NOTES[rid]
            updated += 1

    with open(QUEUE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"patch 完了: {updated} 件更新 → {QUEUE}")
    done_cnt = len(DONE_PATCHES)
    flag_cnt = len(FLAGGED_NOTES)
    print(f"  done設定: {done_cnt} 件 / flagged継続: {flag_cnt} 件")


if __name__ == "__main__":
    main()
