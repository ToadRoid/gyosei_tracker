"""
patch_pending_real_text.py
explanation_text が実文の pending 65件を done/reviewed へ昇格。

画像右欄の answer_symbol を直接確認済み：
  seq001 (001-001〜009): 内閣の権限各論
  seq002 (002-001,005): 参議院緊急集会・内閣総理大臣
  seq004 (004-004): 裁判所（終審禁止）
  seq047 (047-003): 行政立法（通達の拘束力）
  seq054 (054-001): 行政調査
  seq055 (055-001,005): 行政上の強制措置全像
  seq056 (056-005): 代執行（適用範囲）
  seq058 (058-005): 代執行（司法手続不要）
  seq061 (061-001,002,005,006): 直接強制・即時強制
  seq062 (062-001,002,006): 即時強制
  seq064 (064-005): 行政罰（罪刑法定主義）
  seq065 (065-006): 行政上の秩序罰（条例）
  seq066 (066-001,002,006): 過料
  seq068 (068-002,003): 行政手続法総則・目的
  seq069 (069-001,003): 行政手続法上の「法令」「申請」
  seq071 (071-004): 審査基準
  seq072 (072-002): 適用除外（公務員懲戒）
  seq074 (074-001): 地方公共団体と行政手続法
  seq075 (075-002,005): 申請に対する処分
  seq078 (078-005): 不利益処分（聴聞・弁明の区分）
  seq079 (079-001,007): 不利益処分（聴聞・理由提示）
  seq081 (081-002): 聴聞通知
  seq082 (082-006): 聴聞（代理人・閲覧）
  seq083 (083-001): 聴聞（書面閲覧）
  seq084 (084-001,003): 聴聞調書・参酌義務
  seq085 (085-002): 聴聞委任禁止
  seq086 (086-003,006): 弁明の機会（準用条文）
  seq087 (087-005): 行政指導（申請取下げ）
  seq089 (089-003,004,005): 行政指導（複数者・法令違反・中止要求）
  seq090 (090-005): 届出（到達主義）
  seq091 (091-001,004): 命令等制定手続
  seq092 (092-003,005): 意見公募（未実施・資料公示）
  seq093 (093-001,002,004): 意見公募（採用義務・不制定・意見配慮）
  seq097 (097-003,007): 行政不服審査法（適用除外・申立種類）
  seq171 (171-004): 地方公共団体の事務（無効）
"""
import csv
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV  = ROOT / "data" / "qa_draft.csv"

DONE_NOTE = (
    "画像右欄の answer_symbol を直接確認済み。"
    "explanation_text は原本右欄 OCR から転記済みで内容整合確認。done/reviewed に昇格。"
)

# 004-004 は解説後半が読取困難のため別注記
NOTE_004_004 = (
    "画像0004右欄で answer_symbol=○ を直接確認済み（行政機関の終審禁止・憲法76条2項）。"
    "explanation_text は前半のみ転記済み（後半読取困難）。answer_symbol 確定済みのため done/reviewed に昇格。"
)

DONE_RIDS = {
    # seq001
    'KB2025-001-001', 'KB2025-001-002', 'KB2025-001-003',
    'KB2025-001-004', 'KB2025-001-005', 'KB2025-001-006',
    'KB2025-001-007', 'KB2025-001-008', 'KB2025-001-009',
    # seq002
    'KB2025-002-001', 'KB2025-002-005',
    # seq004
    'KB2025-004-004',
    # seq047
    'KB2025-047-003',
    # seq054
    'KB2025-054-001',
    # seq055
    'KB2025-055-001', 'KB2025-055-005',
    # seq056
    'KB2025-056-005',
    # seq058
    'KB2025-058-005',
    # seq061
    'KB2025-061-001', 'KB2025-061-002', 'KB2025-061-005', 'KB2025-061-006',
    # seq062
    'KB2025-062-001', 'KB2025-062-002', 'KB2025-062-006',
    # seq064
    'KB2025-064-005',
    # seq065
    'KB2025-065-006',
    # seq066
    'KB2025-066-001', 'KB2025-066-002', 'KB2025-066-006',
    # seq068
    'KB2025-068-002', 'KB2025-068-003',
    # seq069
    'KB2025-069-001', 'KB2025-069-003',
    # seq071
    'KB2025-071-004',
    # seq072
    'KB2025-072-002',
    # seq074
    'KB2025-074-001',
    # seq075
    'KB2025-075-002', 'KB2025-075-005',
    # seq078
    'KB2025-078-005',
    # seq079
    'KB2025-079-001', 'KB2025-079-007',
    # seq081
    'KB2025-081-002',
    # seq082
    'KB2025-082-006',
    # seq083
    'KB2025-083-001',
    # seq084
    'KB2025-084-001', 'KB2025-084-003',
    # seq085
    'KB2025-085-002',
    # seq086
    'KB2025-086-003', 'KB2025-086-006',
    # seq087
    'KB2025-087-005',
    # seq089
    'KB2025-089-003', 'KB2025-089-004', 'KB2025-089-005',
    # seq090
    'KB2025-090-005',
    # seq091
    'KB2025-091-001', 'KB2025-091-004',
    # seq092
    'KB2025-092-003', 'KB2025-092-005',
    # seq093
    'KB2025-093-001', 'KB2025-093-002', 'KB2025-093-004',
    # seq097
    'KB2025-097-003', 'KB2025-097-007',
    # seq171
    'KB2025-171-004',
}


def main():
    with open(CSV, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    done_cnt = 0

    for row in rows:
        rid = row["record_id"]
        if rid not in DONE_RIDS:
            continue

        row["human_check_status"] = "done"
        row["final_status"] = "reviewed"
        row["issue_flag"] = "0"
        row["issue_type"] = ""
        row["issue_detail"] = ""

        if rid == 'KB2025-004-004':
            row["human_check_note"] = NOTE_004_004
        else:
            row["human_check_note"] = DONE_NOTE

        done_cnt += 1

    with open(CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # 件数サマリー
    from collections import Counter
    status_cnt = Counter(r["human_check_status"] for r in rows)
    final_cnt  = Counter(r["final_status"] for r in rows)
    print(f"done/reviewed へ昇格: {done_cnt} 件")
    print(f"human_check_status 分布: {dict(status_cnt)}")
    print(f"final_status 分布       : {dict(final_cnt)}")


if __name__ == "__main__":
    main()
