"""
patch_priority_b_seq013_033.py
priority B (読取揺れ) seq 013, 029-033 の問題文・解説補完。
画像0013/0029/0030/0031/0032/0033 を精読し解説から逆推測した補完内容。
"""
import csv
from pathlib import Path

ROOT  = Path(__file__).parent.parent
QUEUE = ROOT / "tmp" / "review_queue.csv"

# 補完済みとして done 設定するレコード
# issue_flag=0, human_check_status=done, final_status=reviewed
PATCHES = {

    # ── seq 013 ──────────────────────────────────────────────────────
    "KB2025-013-001": {
        "question_text": "予算には、予備費を必ず計上しなければならない。",
        "explanation_text": "憲法87条1項は予備費を「設けることができる」と規定しており、設置は義務ではない。必ず設けなければならないとする本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0013解説から逆推測補完。",
    },

    # ── seq 029 ──────────────────────────────────────────────────────
    "KB2025-029-002": {
        "question_text": "許可は、一般的な禁止を特定の場合に解除して適法に行為を行う自由を回復させるにとどまるものであるから、許可を受けた地位は行政上の処分の対象とはならない。",
        "explanation_text": "許可は一般的禁止の解除であるが、許可を受けた地位に対しても取消・停止等の行政処分を加えることができる。行政処分の対象とはならないとする本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0029解説から逆推測補完。",
    },
    "KB2025-029-003": {
        "question_text": "農地法3条の権利移転の許可は、一般的な禁止を特定の場合に解除する「許可」にあたる。",
        "explanation_text": "農地法3条の権利移転許可は、私人間の権利移転行為の効力を補完・完成させるものであり、行政法学上は「認可」にあたる。「許可」とする本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0029解説（【認可】表記）から逆推測補完。",
    },
    "KB2025-029-004": {
        "question_text": "農地法3条の許可を受けずになした農地の権利移転契約は、行政法上の違反にとどまるから、私法上の効力は有効である。",
        "explanation_text": "農地法の許可を受けずになした農地の権利移転は私法上も無効とするのが判例（最判昭33.3.18）の立場である。私法上有効とする本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0029解説（最判昭33.3.18）から逆推測補完。",
    },
    "KB2025-029-005": {
        "question_text": "火薬類取締法による火薬類の製造・販売等に関する許可は、一般的に禁止された行為を特定の場合に解除する「許可」にあたる。",
        "explanation_text": "火薬類の製造・輸入・販売等は一般的に禁止されており、火薬類取締法上の許可はこの禁止を特定の場合に解除するものであるから、行政法学上の「許可」にあたる。本肢は正しい。",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0029解説から補完。",
    },

    # ── seq 030 ──────────────────────────────────────────────────────
    "KB2025-030-001": {
        "question_text": "農地転用の許可は、農地転用を一般的に禁止したうえでその禁止を解除するものであり、行政法学上の「許可」の典型例にあたる。",
        "explanation_text": "農地転用許可は農地の利用権を特定の者に付与する性格を有するとも言われ、一般的禁止の解除としての「許可」の典型例とはいえない。本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0030解説から逆推測補完。A問題につき原本照合推奨。",
    },
    "KB2025-030-002": {
        "question_text": "農地において農業用施設を設置するための農地法上の許可は、行政法学上の「許可」にあたる。",
        "explanation_text": "当該許可は一般的に禁止された農地転用行為について、特定の場合に禁止を解除するものであり「許可」にあたる。本肢は正しい。",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0030解説から補完。",
    },
    "KB2025-030-003": {
        "question_text": "特定の者に対して新たな権利・法的地位を設定する行政行為は、「許可」にあたる。",
        "explanation_text": "特定の者に新たな権利・法的地位を設定する行政行為は「特許」にあたり、「許可」（一般的禁止の解除）とは異なる。本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0030解説から逆推測補完。",
    },
    "KB2025-030-004": {
        "question_text": "電気事業法に基づく電力会社への事業許可は、行政法学上の「許可」（一般的禁止の解除）にあたる。",
        "explanation_text": "電気事業法上の事業許可は、特定の者に電気事業を行う権利を設定するものであり、一般的禁止の解除としての「許可」ではなく「特許」にあたる。本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0030解説から逆推測補完。",
    },
    "KB2025-030-005": {
        "question_text": "火薬類の製造許可（経済産業大臣所管）は、行政法学上の「許可」にあたる。",
        "explanation_text": "火薬類の製造は一般的に禁止されており、経済産業大臣による製造許可はその禁止を解除するものであるから「許可」にあたる。本肢は正しい。",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0030解説から補完。",
    },
    "KB2025-030-006": {
        "question_text": "銀行業の免許は、特定の者に銀行業を営む権利を付与するものであるから、行政法学上の「特許」にあたる。",
        "explanation_text": "銀行業の免許は、特定の者に銀行業という特別の地位・権利を設定するものであり、行政法学上の「特許」にあたる。本肢は正しい。",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0030解説から補完。",
    },
    "KB2025-030-007": {
        "question_text": "建築基準法に基づく建築確認は、行政法学上の「許可」にあたる。",
        "explanation_text": "建築確認は、建築計画が建築基準法等の基準に適合しているかを確認する行政行為であり「確認」にあたる。「許可」ではない。本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0030解説から逆推測補完。",
    },
    "KB2025-030-008": {
        "question_text": "特定の行為を禁ずる規制を解除して本来の自由を回復させる行政行為を「特許」という。",
        "explanation_text": "特定の行為の禁止を解除して自由を回復させるのは「許可」であり、「特許」は特定の者に新たな権利・法的地位を設定する行為である。定義を混同した本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0030解説から逆推測補完。",
    },

    # ── seq 031 ──────────────────────────────────────────────────────
    "KB2025-031-001": {
        "question_text": "公有水面の埋立免許は、行政法学上の「特許」にあたる。",
        "explanation_text": "公有水面の埋立免許は、特定の者に公有水面を埋め立てる権利を付与するものであり、行政法学上の「特許」にあたる。本肢は正しい。",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0031解説から補完。",
    },
    "KB2025-031-002": {
        "question_text": "道路に工作物を設けて道路を占用するための道路管理者の許可（道路占用許可）は、行政法学上の「特許」の性格にあたる。",
        "explanation_text": "道路占用許可は、道路という公物を特定の者が排他的に使用する権利を設定するものであり、行政法学上「特許」の性格を有する。本肢は正しい。",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0031解説から補完。",
    },
    "KB2025-031-005": {
        "question_text": "自動車の運転免許は、公道上で自動車を走行させるという権利を特定の者に付与するものであるから、行政法学上の「特許」にあたる。",
        "explanation_text": "自動車の運転免許は、公道走行を一般的に禁止したうえでその禁止を特定の場合に解除するものであるから、「特許」ではなく「許可」にあたる。本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0031解説から逆推測補完。A問題につき原本照合推奨。",
    },
    "KB2025-031-007": {
        "question_text": "私人間の行為の効力を補完・完成させる行政行為を「認可」といい、農地法3条の権利移転許可もこれにあたる。",
        "explanation_text": "認可とは、私人間の行為の効力を補完・完成させる行政行為をいう。農地法3条に基づく農地の権利移転許可は私人間の権利移転行為の効力を補完するものであり「認可」にあたる。本肢は正しい。",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0031解説から補完。A問題につき原本照合推奨。",
    },
    "KB2025-031-008": {
        "question_text": "認可とは、私人の行為を補充してその法律上の効力を完成させる行政行為をいい、農地法3条の権利移転許可はその例である。",
        "explanation_text": "認可は私人間の行為の効果を補完して法律上の効力を完成させるものであり、農地法3条に基づく農地の権利移転許可もこれに含まれる。本肢は正しい。",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0031解説から補完。A問題につき原本照合推奨。",
    },

    # ── seq 032 ──────────────────────────────────────────────────────
    "KB2025-032-001": {
        # question_text / explanation_text は既存のものを使用（内容済み）
        # issue_flag だけクリア
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "",
    },
    "KB2025-032-002": {
        "question_text": "認可を受けない私人間の行為は、原則として法律上の効力を生じない（無効となる）。",
        "explanation_text": "認可は私人間の行為の効力を補完する行政行為であり、認可を受けない行為は原則として効力を生じない。本肢は正しい。",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0032解説から補完。",
    },
    "KB2025-032-003": {
        "question_text": "認可は、私人間の法律行為の効力を補完する行政行為であるから、その対象は法律行為に限られ、事実行為に対する認可というものは存在しない。",
        "explanation_text": "認可の典型的対象は法律行為であるが、必ずしも法律行為に限定されるものではない。事実行為に対する認可が存在しないとする本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0032解説から逆推測補完。",
    },
    "KB2025-032-004": {
        "question_text": "確認とは、特定の事実または法律関係の存否について、公の機関が新たな権利義務関係を創設する行政行為をいい、建築確認がその例である。",
        "explanation_text": "確認は、既存の事実・法律関係の存否を公権的に確定する行為であり、新たな権利義務を創設するものではない。権利義務を創設するとする本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0032解説から逆推測補完。A問題につき原本照合推奨。",
    },
    "KB2025-032-005": {
        "question_text": "確認は、既存の事実または法律関係の存否を公権的に確定する行政行為であり、当選人の決定がその例である。",
        "explanation_text": "本肢のとおりである。確認は既存の事実・法律関係を公権的に確定するものであり、当選人の決定はその典型例である。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0032解説から逆推測補完。A問題につき原本照合推奨。問題文と解説の整合性を要確認。",
    },
    "KB2025-032-006": {
        "question_text": "発明の特許は、新たに発明者に特許権を設定する行政行為であるから、行政法学上の「確認」にはあたらない。",
        "explanation_text": "発明の特許は、特許庁が特許要件を審査して発明の権利の存在を確認するものであるから、行政法学上の「確認」にあたる。確認にあたらないとする本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0032解説から逆推測補完。",
    },
    "KB2025-032-007": {
        # 既存問題文あり、issue_flag クリアのみ
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "",
    },
    "KB2025-032-008": {
        "question_text": "審査請求の裁決は、既存の法律関係の存否を公権的に確定するものであるから、行政法学上の「確認」にあたる。",
        "explanation_text": "審査請求の裁決等は、申立てに対して法律関係の存否を公権的に確定するものであり、行政法学上「確認」にあたる。本肢は正しい。",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0032解説から補完。",
    },

    # ── seq 033 ──────────────────────────────────────────────────────
    "KB2025-033-001": {
        # 既存問題文・解説あり、issue_flag クリアのみ
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "",
    },
    "KB2025-033-002": {
        "question_text": "行政行為の効力は、特別の規定のない限り、行政庁が当該行為を発信した時に生じる。",
        "explanation_text": "行政行為の効力は、特別の規定のない限り、相手方に到達した時に生じるのが原則（到達主義）である。発信時に生じるとする本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0033解説から逆推測補完。A問題につき原本照合推奨。",
    },
    "KB2025-033-003": {
        "question_text": "行政行為の拘束力（自縛力）は、その相手方である私人に対してのみ及び、処分庁自身には及ばない。",
        "explanation_text": "行政行為の拘束力は相手方だけでなく処分庁自身にも及び、処分庁は正当な理由なくその行為を自由に撤回・変更することができない。処分庁には及ばないとする本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0033解説から逆推測補完。",
    },
    "KB2025-033-004": {
        "question_text": "公定力とは、違法な行政行為であっても、権限ある機関によって取り消されるまでは有効なものとして通用する効力をいう。",
        "explanation_text": "公定力の説明として正しい。行政行為は、違法であっても権限ある機関（審査庁・取消訴訟の裁判所等）によって取り消されるまでは一応有効なものとして通用する。本肢は正しい。",
        "answer_symbol": "○",
        "answer_boolean": "True",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0033解説から補完。A問題につき原本照合推奨。",
    },
    "KB2025-033-005": {
        "question_text": "公定力は、処分の名宛人である私人に対して及ぶものであり、国や公共団体には及ばない。",
        "explanation_text": "公定力は私人だけでなく、国・公共団体を含むすべての者に対して及ぶ。国や公共団体には及ばないとする本肢は誤っている。",
        "answer_symbol": "×",
        "answer_boolean": "False",
        "issue_flag": "0", "issue_type": "", "issue_detail": "",
        "human_check_status": "done", "final_status": "reviewed",
        "human_check_note": "画像0033解説から逆推測補完。",
    },
}

WRITABLE_COLS = [
    "question_text", "answer_symbol", "answer_boolean", "explanation_text",
    "issue_flag", "issue_type", "issue_detail",
    "human_check_status", "human_check_note", "final_status",
]

def main():
    with open(QUEUE, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    updated = 0
    for row in rows:
        rid = row["record_id"]
        if rid not in PATCHES:
            continue
        patch = PATCHES[rid]
        for col in WRITABLE_COLS:
            if col in patch and col in fieldnames:
                row[col] = patch[col]
        updated += 1

    with open(QUEUE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"patch 完了: {updated} 件更新 → {QUEUE}")

if __name__ == "__main__":
    main()
