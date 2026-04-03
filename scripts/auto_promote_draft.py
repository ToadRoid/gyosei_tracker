#!/usr/bin/env python3
"""
auto_promote_draft.py

ステータス管理ルール:
  draft          → OCR未処理 / テキスト未取得
  ready_for_review → テキストあり・issue_flag=1 または GPT抽出済み (人確認待ち)
  reviewed       → 人またはGPT精査通過・issue_flag=0 の確認済み (アプリ取込対象)

このスクリプトの動作:
  ① ready_for_review → reviewed 昇格
      全条件 AND で通過したものだけ reviewed にする（以下参照）
  ② reviewed_import.json + tmp/pending_parsed.json を再生成

自動昇格の条件 (AND):
  1. final_status == 'ready_for_review'
  2. question_text が '[問題文読取困難' で始まらない
  3. question_text が 30文字以上
  4. answer_boolean が 'true' または 'false'
  5. answer_symbol が '○' または '×'
  6. explanation_text が空でない
  7. issue_flag == '0'  ← issue_flag=1 は自動昇格しない

使用例:
  python scripts/auto_promote_draft.py           # 昇格実行
  python scripts/auto_promote_draft.py --dry-run # 昇格予定を確認するだけ
  python scripts/auto_promote_draft.py --no-json # CSV更新のみ (JSON再生成なし)
"""

import argparse
import csv
import json
import shutil
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV_PATH = ROOT / "data" / "qa_draft.csv"
OUT_JSON = ROOT / "data" / "reviewed_import.json"
PENDING_JSON = ROOT / "tmp" / "pending_parsed.json"
BOOK_ID = "KB2025"
BATCH_ID = "reviewed-import"

SUBJECT_MAP = {
    "憲法": "kenpo",
    "行政法": "gyosei",
    "民法": "minpo",
    "商法": "shoho",
    "基礎法学": "kiso-hogaku",
    "基礎知識": "kiso-chishiki",
}

CHAPTER_MAP = {
    # 憲法
    "総論": "kenpo-soron",
    "人権": "kenpo-jinken",
    "統治": "kenpo-tochi",
    # 行政法
    "行政法の一般的な法理論": "gyosei-ippan",
    "行政手続法": "gyosei-tetsuzuki",
    "行政不服審査法": "gyosei-fufuku",
    "行政事件訴訟法": "gyosei-jiken",
    "国家賠償法・損失補償": "gyosei-kokubai",
    "地方自治法": "gyosei-chiho",
    # 民法
    "総則": "minpo-sosoku",
    "物権": "minpo-bukken",
    "物権総論": "minpo-bukken",
    "債権": "minpo-saiken",
    "親族": "minpo-shinzoku",
    "相続": "minpo-sozoku",
    # 商法
    "商法": "shoho-shoho",
    "会社法": "shoho-kaisha",
}

PLACEHOLDER_PREFIX = "[問題文読取困難"
VALID_ANSWER_SYMBOLS = {"○", "×"}
VALID_ANSWER_BOOLEANS = {"true", "false"}
MIN_QUESTION_LEN = 30


def passes_strict_conditions(r: dict) -> tuple[bool, list[str]]:
    """
    自動昇格条件を全チェックする。
    戻り値: (通過したか, 失敗した条件のリスト)
    """
    failures = []

    if r.get("final_status") != "ready_for_review":
        failures.append("final_status != ready_for_review")

    q = r.get("question_text", "").strip()
    if q.startswith(PLACEHOLDER_PREFIX):
        failures.append("question_text がプレースホルダー")
    elif len(q) < MIN_QUESTION_LEN:
        failures.append(f"question_text が {MIN_QUESTION_LEN}文字未満 ({len(q)}文字)")

    if r.get("answer_boolean", "").strip().lower() not in VALID_ANSWER_BOOLEANS:
        failures.append(f"answer_boolean 無効: {repr(r.get('answer_boolean',''))}")

    if r.get("answer_symbol", "").strip() not in VALID_ANSWER_SYMBOLS:
        failures.append(f"answer_symbol 無効: {repr(r.get('answer_symbol',''))}")

    if not r.get("explanation_text", "").strip():
        failures.append("explanation_text が空")

    if r.get("issue_flag", "") != "0":
        failures.append(f"issue_flag != 0 (値: {repr(r.get('issue_flag',''))})")

    return len(failures) == 0, failures


def load_csv(path: Path) -> list[dict]:
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def save_csv(path: Path, rows: list[dict], fieldnames: list[str]):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def backup_csv(path: Path) -> Path:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = ROOT / "tmp" / f"qa_draft_backup_{ts}.csv"
    shutil.copy2(path, backup)
    return backup


def build_import_json(rows: list[dict]) -> dict:
    """reviewed のみを対象に ParsedImport JSON を生成する"""
    reviewed = [r for r in rows if r.get("final_status") == "reviewed"]
    by_page = defaultdict(list)
    for r in reviewed:
        by_page[r["image_seq"]].append(r)

    pages = []
    total_branches = 0

    for page_seq in sorted(by_page.keys()):
        items = sorted(by_page[page_seq], key=lambda r: int(r.get("question_no", "0") or "0"))
        branches = []
        for i, r in enumerate(items, 1):
            ans_str = r.get("answer_boolean", "").strip().lower()
            ans_bool = True if ans_str == "true" else False if ans_str == "false" else None
            branches.append({
                "seqNo": i,
                "questionText": r.get("question_text", ""),
                "answerBoolean": ans_bool,
                "explanationText": r.get("explanation_text", ""),
                "subjectCandidate": SUBJECT_MAP.get(r.get("subject", ""), ""),
                "chapterCandidate": CHAPTER_MAP.get(r.get("subject_middle", ""), ""),
                "confidence": 1.0,
                "sectionTitle": r.get("section_title", ""),
                "sourcePageQuestion": r.get("source_page_question", ""),
                "sourcePageAnswer": r.get("source_page_answer", ""),
            })
            total_branches += 1

        pages.append({
            "sourcePage": page_seq.zfill(3),
            "originalProblemId": f"{BOOK_ID}-p{page_seq.zfill(3)}-q01",
            "bookId": BOOK_ID,
            "batchId": BATCH_ID,
            "branches": branches,
            "parseError": None,
        })

    return {
        "type": "parsed",
        "bookId": BOOK_ID,
        "batchId": BATCH_ID,
        "parsedAt": datetime.now().isoformat(),
        "model": "human-reviewed",
        "totalBranches": total_branches,
        "pages": pages,
        "queuedAt": datetime.now().isoformat(),
    }


def main():
    parser = argparse.ArgumentParser(
        description="ready_for_review → reviewed 昇格スクリプト（厳格条件）"
    )
    parser.add_argument("--dry-run", action="store_true",
                        help="変更なし。昇格可能数と失敗理由を表示するだけ")
    parser.add_argument("--no-json", action="store_true",
                        help="CSV更新のみ。JSON再生成をスキップ")
    parser.add_argument("--show-failures", action="store_true",
                        help="条件不通過レコードの理由を詳細表示")
    args = parser.parse_args()

    rows = load_csv(CSV_PATH)
    fieldnames = list(rows[0].keys()) if rows else []

    # ステータス集計
    from collections import Counter
    status_dist = Counter(r.get("final_status", "") for r in rows)

    print("現在の状態:")
    print(f"  reviewed:          {status_dist.get('reviewed', 0):>4} 件  ← アプリ取込対象")
    print(f"  ready_for_review:  {status_dist.get('ready_for_review', 0):>4} 件  ← 人確認待ち")
    print(f"  draft:             {status_dist.get('draft', 0):>4} 件  ← OCR/抽出待ち")
    print()

    # 昇格候補: ready_for_review 全件に対して条件チェック
    candidates = [r for r in rows if r.get("final_status") == "ready_for_review"]
    passable = []
    non_passable = []

    for r in candidates:
        ok, failures = passes_strict_conditions(r)
        if ok:
            passable.append(r)
        else:
            non_passable.append((r, failures))

    print(f"ready_for_review {len(candidates)}件のうち:")
    print(f"  昇格可能 (全条件クリア): {len(passable)} 件 → reviewed へ")
    print(f"  昇格不可 (条件不足):    {len(non_passable)} 件 → ready_for_review に留まる")

    if args.show_failures and non_passable:
        print()
        print("【条件不通過の詳細】")
        failure_reasons = Counter()
        for r, failures in non_passable:
            for f in failures:
                failure_reasons[f] += 1
        for reason, cnt in failure_reasons.most_common():
            print(f"  {reason}: {cnt}件")

    if not passable:
        print()
        print("昇格対象なし。reviewed=395 を維持します。")
        if non_passable and not args.show_failures:
            print("(不通過理由を見るには --show-failures)")
        return

    if args.dry_run:
        print()
        print("[dry-run] 昇格予定レコード:")
        for r in passable[:10]:
            print(f"  {r['record_id']} | {r['subject']} {r['subject_middle']} | {repr(r.get('question_text','')[:50])}")
        if len(passable) > 10:
            print(f"  ... 他 {len(passable) - 10} 件")
        return

    # バックアップ → 昇格実行
    backup = backup_csv(CSV_PATH)
    print(f"\nバックアップ: {backup.name}")

    passable_ids = {r["record_id"] for r in passable}
    for r in rows:
        if r["record_id"] in passable_ids:
            r["final_status"] = "reviewed"

    save_csv(CSV_PATH, rows, fieldnames)

    new_reviewed = sum(1 for r in rows if r.get("final_status") == "reviewed")
    print(f"qa_draft.csv 更新: reviewed {status_dist.get('reviewed',0)} → {new_reviewed} 件")

    if args.no_json:
        print("--no-json のため JSON 生成をスキップ")
        return

    # JSON 再生成 (reviewed のみ)
    print()
    print("reviewed_import.json を再生成中...")
    payload = build_import_json(rows)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"  {OUT_JSON.name}: {payload['totalBranches']}問 / {len(payload['pages'])}ページ")

    PENDING_JSON.parent.mkdir(exist_ok=True)
    shutil.copy2(OUT_JSON, PENDING_JSON)
    print(f"  tmp/pending_parsed.json: コピー完了")
    print()
    print("→ アプリの /triage ページを開いて「取込開始」をクリックしてください。")


if __name__ == "__main__":
    main()
