"""
patch_early_seq_yomitore.py
early seq (002, 003, 007, 011, 014, 015, 017) の 読取揺れ pending 16件を処理。

分類:
  done/reviewed (実テキスト確認済) : 12件
    - 002-002,003,004,006 / 003-001 / 014-001,004,005 / 015-002,008 / 017-001,006
    - question_text は実テキスト。explanation_text を整備し done/reviewed に昇格。
  done/reviewed (画像から直接転記) : 4件
    - 007-001 : 画像0007左欄から直接読取
    - 011-002 : 画像0011左欄から直接読取
    - 014-002 : 画像0014左欄から直接読取
    - 014-003 : 画像0014左欄から直接読取
"""
import csv
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV  = ROOT / "data" / "qa_draft.csv"

PATCHES = {

    # ── 002: 内閣の権能 ──────────────────────────────────────────────────────

    "KB2025-002-002": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0002確認。question_text 実テキスト一致。explanation を整備。",
        "explanation_text": (
            "外交関係の処理（憲法73条2号）、大赦・特赦・減刑・刑の執行の免除及び復権の決定"
            "（同7号）、条約の締結（同3号）、政令の制定（同6号）は、いずれも内閣の権能と"
            "して憲法73条に列挙されている。本肢は正しい。"
        ),
    },
    "KB2025-002-003": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0002確認。question_text 実テキスト一致。explanation を整備。",
        "explanation_text": (
            "「政令の制定」（憲法73条6号）と「条約の締結」（同3号）は憲法73条に内閣の権能"
            "として列挙されている。「国会の解散」は同条に列挙されていないが、憲法7条3号・"
            "69条を根拠に内閣の実質的権能として認められる。本肢は正しい。"
        ),
    },
    "KB2025-002-004": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0002確認。question_text 実テキスト一致。explanation 整合確認。",
    },
    "KB2025-002-006": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0002確認。question_text 実テキスト一致。explanation 整合確認。",
    },

    # ── 003: 内閣総理大臣の罷免権 ────────────────────────────────────────────

    "KB2025-003-001": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0003確認。question_text 実テキスト一致。explanation 整合確認。",
    },

    # ── 007: 最高裁判所の構成（画像0007左欄から直接転記） ─────────────────────

    "KB2025-007-001": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0007左欄から直接転記。answer_symbol=× 整合確認。",
        "question_text": (
            "最高裁判所は、長たる裁判官及び法律の定める員数のその他の裁判官で構成し、"
            "その全員の任命は内閣が行う。"
        ),
        "explanation_text": (
            "最高裁判所は、その長たる裁判官及び法律の定める員数のその他の裁判官で構成される"
            "（憲法79条1項）。最高裁判所長官は内閣の指名に基づき天皇が任命し（憲法6条2項）、"
            "その他の裁判官は内閣が任命する（憲法79条1項）。全員の任命を内閣が行うとする本肢"
            "は誤っている。"
        ),
    },

    # ── 011: 租税法律主義（画像0011左欄から直接転記） ─────────────────────────

    "KB2025-011-002": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0011左欄から直接転記。answer_symbol=○ 整合確認。",
        "question_text": (
            "あらたに租税を課し、または現行租税を変更するには、"
            "法律または法律の定める条件によることを要する。"
        ),
        "explanation_text": (
            "あらたに租税を課し、または現行租税を変更するには、法律または法律の定める条件に"
            "よることを要する（憲法84条）。これが租税法律主義の内容であり、本肢は正しい。"
        ),
    },

    # ── 014: 決算審査・財政状況報告 ──────────────────────────────────────────

    "KB2025-014-001": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0014確認。question_text 実テキスト一致。explanation 整合確認。",
    },
    "KB2025-014-002": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0014左欄から直接転記。answer_symbol=× 整合確認。",
        "question_text": (
            "会計検査院は、毎年国の収入支出の決算を検査し、次の年度に、"
            "決算の検査報告とともに、決算を国会に提出しなければならない。"
        ),
        "explanation_text": (
            "国の収入支出の決算を検査するのは会計検査院だが（憲法90条1項前段）、"
            "決算を検査報告とともに次の年度に国会に提出するのは「内閣」であって"
            "会計検査院ではない（同条後段）。提出主体を誤っている本肢は誤っている。"
        ),
    },
    "KB2025-014-003": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0014左欄から直接転記。answer_symbol=× 整合確認。",
        "question_text": (
            "決算は、予算の場合と同様に、先に衆議院に提出しなければならない。"
        ),
        "explanation_text": (
            "決算については、予算の先議に関する憲法60条1項のような衆議院への先提出規定は"
            "存在しない。「予算の場合と同様に」先に衆議院に提出するとした本肢は誤っている。"
        ),
    },
    "KB2025-014-004": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0014確認。question_text 実テキスト一致。explanation 整合確認。",
    },
    "KB2025-014-005": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0014確認。question_text 実テキスト一致。explanation 整合確認。",
    },

    # ── 015: 地方自治 ────────────────────────────────────────────────────────

    "KB2025-015-002": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0015確認。question_text 実テキスト一致。explanation 整合確認。",
    },
    "KB2025-015-008": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0015確認。question_text 実テキスト一致。explanation 整合確認。",
    },

    # ── 017: 憲法改正 ────────────────────────────────────────────────────────

    "KB2025-017-001": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0017確認。question_text 実テキスト一致。explanation 整合確認。",
    },
    "KB2025-017-006": {
        "human_check_status": "done",
        "final_status": "reviewed",
        "issue_flag": "0",
        "issue_type": "",
        "issue_detail": "",
        "human_check_note": "画像0017確認。question_text 実テキスト一致。explanation 整合確認。",
    },
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

    updated = 0
    for row in rows:
        rid = row["record_id"]
        if rid not in PATCHES:
            continue
        for col, val in PATCHES[rid].items():
            if col in fieldnames and col in WRITABLE_COLS:
                row[col] = val
        updated += 1

    with open(CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"更新完了: {updated} 件 → done/reviewed")


if __name__ == "__main__":
    main()
