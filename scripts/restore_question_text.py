#!/usr/bin/env python3
"""
restore_question_text.py

原本復元待ちレコードの question_text を対話的に入力する。
参考書の該当ページを開きながら1件ずつ入力。

使用例:
  python3 scripts/restore_question_text.py           # 全件対話入力
  python3 scripts/restore_question_text.py --list    # 対象一覧表示のみ
  python3 scripts/restore_question_text.py --id KB2025-115-002  # 1件だけ
"""

import argparse
import csv
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV_PATH = ROOT / "data" / "qa_draft.csv"
OUT_JSON = ROOT / "data" / "reviewed_import.json"
PENDING_JSON = ROOT / "tmp" / "pending_parsed.json"


def save_csv(rows, fieldnames):
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--list", action="store_true", help="一覧表示のみ")
    parser.add_argument("--id", help="特定record_idだけ処理")
    args = parser.parse_args()

    rows = list(csv.DictReader(open(CSV_PATH, encoding="utf-8-sig")))
    fieldnames = list(rows[0].keys())
    row_index = {r["record_id"]: i for i, r in enumerate(rows)}

    targets = [r for r in rows if r.get("issue_type") == "原本復元待ち"]
    if args.id:
        targets = [r for r in targets if r["record_id"] == args.id]

    if not targets:
        print("対象レコードなし")
        return

    print(f"原本復元待ち: {len(targets)}件\n")

    if args.list:
        for r in targets:
            print(f"[{r['record_id']}] p.{r.get('source_page_question','?')} "
                  f"{r.get('subject_middle','')} / {r.get('section_title','')}")
            print(f"  正解: {r.get('answer_symbol','')} ({r.get('answer_boolean','')})")
            print(f"  現状: {r.get('question_text','')[:80]}")
            print()
        return

    # バックアップ
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copy2(CSV_PATH, ROOT / "tmp" / f"qa_draft_backup_{ts}.csv")

    restored = 0
    for r in targets:
        print("=" * 60)
        print(f"[{r['record_id']}]  {r.get('subject_middle','')} / {r.get('section_title','')}")
        print(f"参考書: p.{r.get('source_page_question','?')} (解説: p.{r.get('source_page_answer','?')})")
        print(f"正解: {r.get('answer_symbol','')}  ({r.get('answer_boolean','')})")
        print(f"解説: {r.get('explanation_text','')[:100]}")
        print()
        print(f"現在の問題文: {r.get('question_text','')}")
        print()
        print("参考書の問題文を入力してください（スキップ: Enter / 終了: q）:")

        user_input = input("> ").strip()

        if user_input.lower() == "q":
            print("中断します")
            break
        if not user_input:
            print("スキップ\n")
            continue

        # 更新
        idx = row_index[r["record_id"]]
        rows[idx]["question_text"] = user_input
        rows[idx]["issue_type"] = "原本復元済み"
        rows[idx]["final_status"] = "reviewed"
        rows[idx]["human_check_status"] = "restored"
        rows[idx]["human_check_note"] = f"原本復元 {datetime.now().strftime('%Y-%m-%d')}"

        # 即座に保存
        save_csv(rows, fieldnames)
        restored += 1
        print(f"✓ 保存済み ({restored}件完了)\n")

    print(f"\n復元完了: {restored}件")
    if restored > 0:
        print("→ scripts/batch_gpt_explanation.py --rebuild-json を実行して")
        print("  /triage で取込開始してください")


if __name__ == "__main__":
    main()
