#!/usr/bin/env python3
"""
fix_critical_duplicates.py

同一問題文テキストを持ちながら正誤が異なるレコード（11グループ23件）を修正する。
Vision APIを使って、各レコードの説明文ヒント・正誤・セクションから正確な問題文を読み取る。

使用例:
  python3 scripts/fix_critical_duplicates.py --dry-run
  python3 scripts/fix_critical_duplicates.py
"""

import argparse
import base64
import csv
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV_PATH = ROOT / "data" / "qa_draft.csv"
IMAGES_DIR = ROOT / "images"

# 修正対象グループ
# 同一問題文・異なる正誤のペア。各グループで「どちらのレコードのテキストが怪しいか」を特定して修正。
# explanation_hintを使ってVisionに正確な問題文を読み取らせる。
FIX_GROUPS = [
    {
        "page": "032",
        "records": [
            {
                "record_id": "KB2025-032-002",
                "q_no": "4",
                "answer": "○（正しい）",
                "section": "行政行為の種類",
                "topic_hint": "認可（私人間の法律行為の効力を補完する行政行為）についての正しい記述",
                "fix_needed": True,
            },
            {
                "record_id": "KB2025-032-003",
                "q_no": "5",
                "answer": "×（誤り）",
                "section": "行政行為の種類",
                "topic_hint": "認可の対象（法律行為に限定されるか否か）についての誤った記述",
                "fix_needed": True,
            },
        ],
    },
    {
        "page": "035",
        "records": [
            {
                "record_id": "KB2025-035-002",
                "q_no": "1",
                "answer": "○（正しい）",
                "section": "行政行為の効力・取消し・撤回",
                "topic_hint": "不可変更力の定義についての正しい記述（不可変更力は特定の行政行為にのみ認められる）",
                "fix_needed": True,
            },
            {
                "record_id": "KB2025-035-005",
                "q_no": "1",
                "answer": "×（誤り）",
                "section": "行政行為の効力・取消し・撤回",
                "topic_hint": "不可変更力がすべての行政行為に認められるとする誤った記述（実際は裁断的行為等に限定）",
                "fix_needed": True,
            },
        ],
    },
    {
        "page": "036",
        "records": [
            {
                "record_id": "KB2025-036-001",
                "q_no": "3",
                "answer": "○（正しい）",
                "section": "行政行為の効力・取消し・撤回",
                "topic_hint": "課税処分の重大な瑕疵があっても明白性がなければ無効とならないことの正しい記述",
                "fix_needed": True,
            },
            {
                "record_id": "KB2025-036-004",
                "q_no": "3",
                "answer": "×（誤り）",
                "section": "行政行為の効力・取消し・撤回",
                "topic_hint": "行政行為の無効・取消しに関する誤った記述（重大明白な瑕疵以外でも無効とするような誤り）",
                "fix_needed": True,
            },
        ],
    },
    {
        "page": "081",
        "records": [
            {
                "record_id": "KB2025-081-005",
                "q_no": "5",
                "answer": "○（正しい）",
                "section": "不利益処分（聴聞）",
                "topic_hint": "聴聞の当事者・参加人の権利（調査結果の閲覧・意見陳述等）についての正しい記述（行政手続法15条等）",
                "fix_needed": True,
            },
            {
                "record_id": "KB2025-081-006",
                "q_no": "6",
                "answer": "×（誤り）",
                "section": "不利益処分（聴聞）",
                "topic_hint": "聴聞の当事者の権利に関する誤った記述（聴聞終結後の閲覧権等の誤り）",
                "fix_needed": True,
            },
        ],
    },
    {
        "page": "084",
        "records": [
            {
                "record_id": "KB2025-084-001",
                "q_no": "19",
                "answer": "○（正しい）",
                "section": "不利益処分（聴聞）",
                "topic_hint": "聴聞の当事者・参加人による調書・報告書の閲覧権についての正しい記述（行政手続法24条等）",
                "fix_needed": True,
            },
            {
                "record_id": "KB2025-084-004",
                "q_no": "22",
                "answer": "×（誤り）",
                "section": "不利益処分（聴聞）",
                "topic_hint": "聴聞の調書・報告書に関する誤った記述（閲覧権が認められないとする誤り、または他の誤り）",
                "fix_needed": True,
            },
        ],
    },
    {
        "page": "095",
        "records": [
            {
                "record_id": "KB2025-095-002",
                "q_no": "2",
                "answer": "○（正しい）",
                "section": "不服申立て（総論）",
                "topic_hint": "他の法律で不服申立て手続が定められている場合の行政不服審査法の適用についての正しい記述",
                "fix_needed": True,
            },
            {
                "record_id": "KB2025-095-004",
                "q_no": "2",
                "answer": "×（誤り）",
                "section": "不服申立て（総論）",
                "topic_hint": "不服申立てができない処分または不作為に関する誤った記述",
                "fix_needed": True,
            },
        ],
    },
    {
        "page": "213",
        "records": [
            {
                "record_id": "KB2025-213-002",
                "q_no": "2",
                "answer": "×（誤り）",
                "section": "権利能力・行為能力",
                "topic_hint": "外国人の私法上の権利享有に関する誤った記述（法令または条約による禁止の例外を誤解している記述）",
                "fix_needed": True,
            },
            {
                "record_id": "KB2025-213-004",
                "q_no": "2",
                "answer": "○（正しい）",
                "section": "権利能力・行為能力",
                "topic_hint": "外国人の私法上の権利享有についての正しい記述（民法3条の2：法令または条約により禁止される場合を除いて享有）",
                "fix_needed": True,
            },
        ],
    },
    {
        "page": "214",
        "records": [
            {
                "record_id": "KB2025-214-002",
                "q_no": "2",
                "answer": "○（正しい）",
                "section": "権利能力・行為能力",
                "topic_hint": "未成年者の処分許可財産についての正しい記述（民法5条3項：目的の範囲内で自由に処分できる）",
                "fix_needed": True,
            },
            {
                "record_id": "KB2025-214-005",
                "q_no": "2",
                "answer": "×（誤り）",
                "section": "権利能力・行為能力",
                "topic_hint": "未成年者の行為能力に関する誤った記述（処分許可財産以外の誤り、または許可の範囲を超える誤り）",
                "fix_needed": True,
            },
        ],
    },
    {
        "page": "220",
        "records": [
            {
                "record_id": "KB2025-220-001",
                "q_no": "1",
                "answer": "×（誤り）",
                "section": "人・法人・物（権利能力なき社団）",
                "topic_hint": "権利能力なき社団の債務が構成員に帰属しないとする誤った記述、または社団財産の扱いに関する誤り",
                "fix_needed": True,
            },
            {
                "record_id": "KB2025-220-004",
                "q_no": "1",
                "answer": "×（誤り）",
                "section": "人・法人・物（権利能力なき社団）",
                "topic_hint": "権利能力なき社団の取引上の債務の帰属に関する誤った記述（社団財産が責任財産になるとする誤り）",
                "fix_needed": True,
            },
            {
                "record_id": "KB2025-220-005",
                "q_no": "1",
                "answer": "○（正しい）",
                "section": "意思表示と瑕疵",
                "topic_hint": "意思表示の効力または意思表示に関する正しい記述（権利能力なき社団とは別トピック）",
                "fix_needed": True,
            },
        ],
    },
    {
        "page": "221",
        "records": [
            {
                "record_id": "KB2025-221-002",
                "q_no": "1",
                "answer": "×（誤り）",
                "section": "意思表示と瑕疵",
                "topic_hint": "通謀虚偽表示に関する誤った記述（民法94条1項）",
                "fix_needed": True,
            },
            {
                "record_id": "KB2025-221-004",
                "q_no": "1",
                "answer": "○（正しい）",
                "section": "意思表示と瑕疵",
                "topic_hint": "通謀虚偽表示についての正しい記述（相手方と通じた虚偽表示は当事者間でも無効、民法94条1項）",
                "fix_needed": True,
            },
        ],
    },
    {
        "page": "227",
        "records": [
            {
                "record_id": "KB2025-227-003",
                "q_no": "1",
                "answer": "×（誤り）",
                "section": "意思表示と瑕疵",
                "topic_hint": "意思表示の相手方が意思能力または行為能力を欠く場合の意思表示の効力に関する誤った記述",
                "fix_needed": True,
            },
            {
                "record_id": "KB2025-227-004",
                "q_no": "1",
                "answer": "○（正しい）",
                "section": "代理",
                "topic_hint": "代理または意思表示に関する正しい記述（意思表示の相手方が意思能力を欠く場合の効力についての正しい記述）",
                "fix_needed": True,
            },
        ],
    },
]


def encode_image(path: Path) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def extract_specific_question(client, image_path: Path, rec: dict, page: str):
    """説明文ヒント・正誤・セクション情報で問題文を特定読取"""
    b64 = encode_image(image_path)

    prompt = f"""これは行政書士試験の肢別過去問集のスキャン画像（ページ{page}）です。

以下の条件に当てはまる問題文を正確に読み取ってください:

【正誤】{rec['answer']}
【セクション/トピック】{rec['section']}
【内容のヒント】{rec['topic_hint']}

注意:
- 問題文（左欄の記述文）のみを抽出
- 正誤記号・解説は不要
- OCRの誤字は法律用語として正確に修正
- 見つからない場合は null

JSON形式のみで返答:
{{"question_text": "問題文..."}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{b64}",
                            "detail": "high"
                        }
                    },
                    {"type": "text", "text": prompt}
                ]
            }],
            temperature=0.1,
            response_format={"type": "json_object"},
            timeout=60,
        )
        data = json.loads(response.choices[0].message.content)
        text = data.get("question_text")
        if text and str(text).lower() != "null":
            return str(text).strip()
        return None
    except Exception as e:
        print(f"    Vision APIエラー: {e}")
        return None


def save_csv(rows, fieldnames):
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    total_records = sum(len(g["records"]) for g in FIX_GROUPS)
    print(f"=== 重要重複修正スクリプト ===")
    print(f"対象: {len(FIX_GROUPS)}グループ / {total_records}件\n")

    for g in FIX_GROUPS:
        img = IMAGES_DIR / f"{g['page'].zfill(4)}.png"
        exists = "✓" if img.exists() else "✗ 画像なし"
        print(f"  p{g['page']} [{exists}]: {len(g['records'])}件")
        for r in g["records"]:
            print(f"    {r['record_id']}: ans={r['answer'][:1]}")

    if args.dry_run:
        return

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        print("\nエラー: OPENAI_API_KEY が未設定", file=sys.stderr)
        sys.exit(1)
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    rows = list(csv.DictReader(open(CSV_PATH, encoding="utf-8-sig")))
    fieldnames = list(rows[0].keys())
    row_index = {r["record_id"]: i for i, r in enumerate(rows)}

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copy2(CSV_PATH, ROOT / "tmp" / f"qa_draft_backup_{ts}.csv")
    print(f"\nバックアップ: qa_draft_backup_{ts}.csv\n")

    fixed = 0
    skipped = 0

    for g in FIX_GROUPS:
        page = g["page"]
        img = IMAGES_DIR / f"{page.zfill(4)}.png"
        if not img.exists():
            print(f"\np{page}: 画像なし → スキップ")
            continue

        print(f"\n=== p{page} ({len(g['records'])}件) ===")

        for rec in g["records"]:
            rid = rec["record_id"]
            idx = row_index.get(rid)
            if idx is None:
                print(f"  {rid}: CSVに存在しない → スキップ")
                continue

            old_text = rows[idx]["question_text"]
            print(f"\n  [{rid}] ans={rec['answer'][:1]}")
            print(f"    旧: {old_text[:65]}")
            print(f"    Vision解析中...", end="", flush=True)

            new_text = extract_specific_question(client, img, rec, page)

            if new_text:
                if new_text == old_text:
                    print(f" 変更なし（同一テキスト）")
                    skipped += 1
                else:
                    print(f" 取得成功")
                    print(f"    新: {new_text[:65]}")
                    rows[idx]["question_text"] = new_text
                    rows[idx]["human_check_note"] = f"重複修正Vision再読取 {datetime.now().strftime('%Y-%m-%d')}"
                    save_csv(rows, fieldnames)
                    fixed += 1
            else:
                print(f" 取得失敗")
                skipped += 1

    print(f"\n\n修正完了: {fixed}件 / スキップ: {skipped}件")
    if fixed > 0:
        print("\n次のステップ:")
        print("  python3 scripts/batch_gpt_explanation.py --rebuild-json")
        print("  → /triage で「取込開始」をクリック")


if __name__ == "__main__":
    main()
