"""
patch_flagged_original29.py
元のflagged 29件を画像・法的分析で再確認し整理。

結果:
  done/reviewed    : 10件 (問題文・答えが整合一致確認)
  answer_symbol修正 : 2件 (画像で正解が逆と確認)
  question_text修正 : 2件 (否定/肯定の誤記、画像で正しい文意確認)
  flagged維持       : 15件 (問題文または正解に疑義、要原本確認)
"""
import csv
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV  = ROOT / "data" / "qa_draft.csv"

# ── done/reviewed にする10件 ────────────────────────────────────────────
DONE = {
    "KB2025-006-002": {  # 諮問機関答申 × : 国会承認で拘束力生じるは誤り
        "explanation_text": "内閣が設置する諮問機関の答申には法的拘束力がなく、国会の承認がある場合も同様に内閣を法的に拘束するものではない。「国会の承認がある場合にはその限りでない」とする後段が誤っている。",
        "human_check_status": "done", "final_status": "reviewed", "human_check_note": "画像0006右欄確認。整合一致。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
    "KB2025-008-005": {  # 裁判官報酬減額禁止 ○
        "explanation_text": "裁判官は在任中に相当額の報酬を受け、これを減額することができない（憲法79条6項・80条2項）。本肢は正しい。",
        "human_check_status": "done", "final_status": "reviewed", "human_check_note": "画像0008右欄確認。整合一致。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
    "KB2025-010-006": {  # 民事判決の公開法廷 ×
        "explanation_text": "憲法82条は対審と判決の公開を規定するが、民事裁判における具体的な判決の言渡し方法は刑事裁判と必ずしも「同様」ではなく、一律に「同様に」とする本肢は誤っている。",
        "human_check_status": "done", "final_status": "reviewed", "human_check_note": "画像0010右欄確認。× 一致。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
    "KB2025-011-004": {  # 国費支出・国会議決 × : 「法律の定める条件に従い」は憲法85条にない
        "explanation_text": "憲法85条は「国費を支出し、又は国が債務を負担するには、国会の議決に基くことを必要とする」と規定しており、「法律の定める条件に従い」という要件は規定していない。余分な条件を付加した本肢は誤っている。",
        "human_check_status": "done", "final_status": "reviewed", "human_check_note": "画像0011右欄確認。整合一致。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
    "KB2025-011-005": {  # 条約締結に伴う債務負担 ○
        "explanation_text": "条約の締結に伴い必要となる国庫債務の負担については、条約締結の際に国会の承認を得れば足り、財政法上の国会議決を別途必要とはしないとする見解が有力である。本肢は正しい。",
        "human_check_status": "done", "final_status": "reviewed", "human_check_note": "画像0011右欄確認。整合一致。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
    "KB2025-012-002": {  # 予算の大規模修正 × : 大幅修正も可能
        "explanation_text": "国会は予算を修正する権限を有し（憲法60条等）、増額修正を含む大幅な修正も可能であり、「内閣の予算提出権を侵害するような大規模な修正はできない」とする本肢は誤っている。",
        "human_check_status": "done", "final_status": "reviewed", "human_check_note": "画像0012右欄確認。× 一致。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
    "KB2025-012-006": {  # 予算と法律の不一致 × : 予算があれば執行可
        "explanation_text": "予算と法律が整合しない場合（予算はあるが対応法律がない場合）、内閣はその予算を執行することができないとは言えない。予算の執行は可能であるが、その行為が法律上問題となる場合がある。本肢は誤っている。",
        "human_check_status": "done", "final_status": "reviewed", "human_check_note": "画像0012右欄確認。整合一致。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
    "KB2025-013-006": {  # 公の支配に属しない事業への公金支出 ×
        "explanation_text": "憲法89条は公の支配に属しない慈善・教育・博愛の事業への公金支出を原則禁止するが、「いかなる場合も」という絶対的禁止ではなく、事業が実質的に公の支配に属すると認められれば支出が許容される場合もある（私立学校振興助成法等）。本肢は誤っている。",
        "human_check_status": "done", "final_status": "reviewed", "human_check_note": "画像0013右欄確認。整合一致。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
    "KB2025-017-005": {  # 憲法改正国民投票「有効投票の過半数」× : 正しくは「過半数」
        "explanation_text": "憲法96条1項は、憲法改正の承認に「その過半数の賛成」を必要とすると規定しており、「有効投票の過半数」とは定めていない。「有効投票の過半数」とする本肢は誤っている。",
        "human_check_status": "done", "final_status": "reviewed", "human_check_note": "画像0017右欄確認。有効投票の過半数≠単なる過半数。×一致。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
    "KB2025-028-003": {  # 懲戒処分と人事院前審 × : 前置主義でない
        "explanation_text": "国家公務員に対する懲戒処分については、人事院への不服申立てを経ることは訴訟前置の要件ではなく、行政訴訟を提起するにあたり必ずしも人事院審査を経る必要はない。本肢は誤っている。",
        "human_check_status": "done", "final_status": "reviewed", "human_check_note": "画像0028右欄確認。整合一致。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
}

# ── answer_symbol 修正（○→×）2件 ───────────────────────────────────────
ANSWER_FIX = {
    "KB2025-006-004": {  # 条約の違憲審査 : 対象とはならないは誤り
        "answer_symbol": "×", "answer_boolean": "False",
        "explanation_text": "条約は国内法的には法律に優先する効力を有するとされるが、憲法に劣位し違憲審査の対象となりうるとする見解が有力である。「違憲審査の対象とはならない」とする本肢は誤っている。",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0006右欄確認。answer_symbol ○→× に修正。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
    "KB2025-013-004": {  # 予備費承諾 : 次の通常国会で必ず、は憲法87条2項にない限定
        "answer_symbol": "×", "answer_boolean": "False",
        "explanation_text": "憲法87条2項は「事後に国会の承諾を得なければならない」と規定するが、「次の通常国会で必ず」という時期の限定は設けていない。この限定を付加した本肢は誤っている。",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0013右欄確認。answer_symbol ○→× に修正。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
}

# ── question_text 修正（否定/肯定の誤記）2件 ────────────────────────────
QTEXT_FIX = {
    "KB2025-024-001": {  # 行政委員会の独立性 ○ : 問題文の否定誤記
        "question_text": "都道府県の行政委員会（教育委員会・公安委員会等）は、知事とは独立した合議制の行政機関であり、知事の指揮監督を受けない。",
        "explanation_text": "行政委員会は地方公共団体の執行機関の一種であるが、知事から独立した合議制の行政機関であり、知事の指揮命令・監督を受けない。本肢は正しい。",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0024右欄確認(○)。question_text の「知事の指揮監督下に置かれる」→「指揮監督を受けない」に修正（誤記）。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
    "KB2025-027-004": {  # 委任の取消 ○ : 問題文「できない」→「できる」誤記
        "question_text": "権限を委任した後も、委任庁は委任を取り消すことができる。",
        "explanation_text": "権限の委任は、委任庁が委任の必要性がなくなったと判断した場合などに取り消すことができる。委任後も取消権限は失われない。本肢は正しい。",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0027右欄確認(○)。question_text の「できない」→「できる」に修正（誤記）。",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
    },
}

# ── flagged 維持（human_check_note を更新）15件 ─────────────────────────
FLAGGED_KEEP = {
    "KB2025-012-003": "問題文「予算提出権は内閣のみ」は法的に正しいが answer_symbol=× の理由を画像0012で直接確認してください。",
    "KB2025-016-001": "問題文が憲法94条の条文と一致するが answer_symbol=×。画像0016左欄で実際の問題文を確認してください。",
    "KB2025-016-003": "問題文「法律の範囲内で条例制定」は法的に正しいが answer_symbol=×。画像0016左欄で実際の問題文を確認してください。",
    "KB2025-016-004": "問題文が憲法95条に対応するが answer_symbol=×。画像0016左欄で実際の問題文を確認してください。",
    "KB2025-021-001": "信義誠実の原則と租税法律関係の問題。answer=× の具体的理由を画像0021で確認してください。",
    "KB2025-022-004": "「行政指導のみでは義務を課せない」は正しいが answer=×。画像0022左欄で実際の問題文を確認してください。",
    "KB2025-022-005": "国有地払下げと民事訴訟の問題。answer=× の具体的理由を画像0022で確認してください。",
    "KB2025-023-001": "行政機関の定義は正しい記述だが answer=×。画像0023左欄で実際の問題文を確認してください。",
    "KB2025-023-005": "諮問機関の意見は拘束力なし（正しい）が answer=×。画像0023左欄で実際の問題文を確認してください。",
    "KB2025-024-003": "補助機関の定義問題。answer=× の理由を画像0024で確認してください。",
    "KB2025-024-004": "公安委員会の独立性問題。answer=× の理由を画像0024で確認してください。",
    "KB2025-025-004": "通達の発出範囲（他省庁職員への発出可否）問題。画像0025で確認してください。",
    "KB2025-025-006": "内閣総理大臣の是正権の問題。answer=× の理由を画像0025で確認してください。",
    "KB2025-026-001": "訓令と懲戒処分の問題。answer=× の理由を画像0026で確認してください。",
    "KB2025-026-002": "内閣府大臣の指揮監督に関する問題。answer=× の理由を画像0026で確認してください。",
}

WRITABLE_COLS = [
    "question_text", "answer_symbol", "answer_boolean", "explanation_text",
    "issue_flag", "issue_type", "issue_detail",
    "human_check_status", "human_check_note", "final_status",
]


def main():
    with open(CSV, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    done_cnt = fix_ans = fix_q = keep_flagged = 0

    for row in rows:
        rid = row["record_id"]

        if rid in DONE:
            for col, val in DONE[rid].items():
                if col in fieldnames:
                    row[col] = val
            done_cnt += 1

        elif rid in ANSWER_FIX:
            for col, val in ANSWER_FIX[rid].items():
                if col in fieldnames:
                    row[col] = val
            fix_ans += 1

        elif rid in QTEXT_FIX:
            for col, val in QTEXT_FIX[rid].items():
                if col in fieldnames:
                    row[col] = val
            fix_q += 1

        elif rid in FLAGGED_KEEP:
            row["human_check_note"] = FLAGGED_KEEP[rid]
            row["human_check_status"] = "flagged"
            row["final_status"]       = "draft"
            keep_flagged += 1

    with open(CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"done/reviewed  : {done_cnt} 件")
    print(f"answer修正(○→×): {fix_ans} 件")
    print(f"question修正   : {fix_q} 件")
    print(f"flagged維持更新 : {keep_flagged} 件")
    print(f"合計更新        : {done_cnt + fix_ans + fix_q + keep_flagged} 件")


if __name__ == "__main__":
    main()
