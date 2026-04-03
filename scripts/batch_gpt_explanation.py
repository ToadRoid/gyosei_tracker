#!/usr/bin/env python3
"""
batch_gpt_explanation.py

解説が空または [解説読取困難...] のレコードに対して、
GPTで解説文を自動生成してCSVに書き戻す。

対象: reviewed かつ explanation_text が空 or プレースホルダー
      かつ human_check_status != 'gpt_explanation'（生成済み除外）
処理: 問題文・正解・科目を渡してGPTに解説を生成させる
出力: CSV の explanation_text を更新 → reviewed_import.json + pending_parsed.json を再生成

フラグ:
  human_check_status = 'gpt_explanation' → 生成済みマーク（再実行でスキップ）

使用例:
  python3 scripts/batch_gpt_explanation.py --dry-run
  python3 scripts/batch_gpt_explanation.py --batch-size 50
  python3 scripts/batch_gpt_explanation.py --batch-size 711  # 全件
"""

import argparse
import csv
import json
import os
import shutil
import sys
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV_PATH = ROOT / "data" / "qa_draft.csv"
OUT_JSON = ROOT / "data" / "reviewed_import.json"
PENDING_JSON = ROOT / "tmp" / "pending_parsed.json"

BOOK_ID = "KB2025"
BATCH_ID = "reviewed-import"
GPT_MODEL = "gpt-4o-mini"
PLACEHOLDER_PREFIX = "[解説読取困難"
GPT_EXPLANATION_FLAG = "gpt_explanation"
MAX_RETRIES = 3
RETRY_DELAY = 5.0
CHUNK_SIZE = 10  # 1回のAPIコールで処理する問題数

SUBJECT_MAP = {
    "憲法": "kenpo", "行政法": "gyosei", "民法": "minpo",
    "商法": "shoho", "基礎法学": "kiso-hogaku", "基礎知識": "kiso-chishiki",
}
CHAPTER_MAP = {
    "総論": "kenpo-soron", "人権": "kenpo-jinken", "統治": "kenpo-tochi",
    "行政法の一般的な法理論": "gyosei-ippan", "行政手続法": "gyosei-tetsuzuki",
    "行政不服審査法": "gyosei-fufuku", "行政事件訴訟法": "gyosei-jiken",
    "国家賠償法・損失補償": "gyosei-kokubai", "地方自治法": "gyosei-chiho",
    "総則": "minpo-sosoku", "物権": "minpo-bukken", "物権総論": "minpo-bukken",
    "債権": "minpo-saiken", "親族": "minpo-shinzoku", "相続": "minpo-sozoku",
    "商法": "shoho-shoho", "会社法": "shoho-kaisha",
}


def needs_explanation(r: dict) -> bool:
    """生成が必要か判定: プレースホルダー or 空 かつ 未生成"""
    if r.get("human_check_status", "").strip() == GPT_EXPLANATION_FLAG:
        return False  # 生成済みはスキップ
    exp = r.get("explanation_text", "").strip()
    return not exp or exp.startswith(PLACEHOLDER_PREFIX)


def save_csv(rows: list[dict], fieldnames: list[str]):
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def build_prompt(records: list[dict]) -> str:
    import re
    lines = []
    for i, r in enumerate(records, 1):
        qt = r.get("question_text", "").strip()
        ans = "正しい（○）" if r.get("answer_boolean", "").strip().lower() == "true" else "誤り（×）"
        subj = r.get("subject", "")
        chapter = r.get("subject_middle", "")
        raw_exp = r.get("explanation_text", "").strip()
        hint = ""
        if raw_exp.startswith(PLACEHOLDER_PREFIX):
            m = re.match(r"\[解説読取困難 - (.+?)\]", raw_exp, re.DOTALL)
            if m:
                hint = f"（ヒント: {m.group(1).strip()[:100]}）"
        lines.append(
            f"{i}. 【科目】{subj} {chapter}\n"
            f"   【問題文】{qt}\n"
            f"   【正解】{ans} {hint}"
        )

    return f"""あなたは行政書士試験の専門家です。以下の問題について、なぜその答えになるかを日本語で簡潔に解説してください。

各問題の解説は2〜4文で、法律的に正確な内容にしてください。
条文番号・判例があれば積極的に記載してください。
不正確な内容を書くくらいなら短くてもよいです。

{chr(10).join(lines)}

以下のJSON形式のみで返答してください（説明文不要）:
{{"explanations": [{{"no": 1, "text": "解説文..."}}, ...]}}"""


def generate_explanations(client, records: list[dict]) -> dict[str, str]:
    prompt = build_prompt(records)
    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model=GPT_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                response_format={"type": "json_object"},
                timeout=90,
            )
            content = response.choices[0].message.content
            data = json.loads(content)
            result = {}
            for item in data.get("explanations", []):
                no = int(item.get("no", 0)) - 1
                text = item.get("text", "").strip()
                if 0 <= no < len(records) and text:
                    result[records[no]["record_id"]] = text
            return result
        except Exception as e:
            print(f"    GPTエラー (試行 {attempt+1}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
    return {}


def rebuild_json(rows: list[dict]):
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
            exp = r.get("explanation_text", "").strip()
            if exp.startswith(PLACEHOLDER_PREFIX):
                exp = ""
            branches.append({
                "seqNo": i,
                "questionText": r.get("question_text", ""),
                "answerBoolean": ans_bool,
                "explanationText": exp,
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

    payload = {
        "type": "parsed",
        "bookId": BOOK_ID,
        "batchId": BATCH_ID,
        "parsedAt": datetime.now().isoformat(),
        "model": "gpt-generated-explanation",
        "totalBranches": total_branches,
        "pages": pages,
        "queuedAt": datetime.now().isoformat(),
    }
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    PENDING_JSON.parent.mkdir(exist_ok=True)
    shutil.copy2(OUT_JSON, PENDING_JSON)
    print(f"JSON再生成: {total_branches}問 / {len(pages)}ページ")


def main():
    parser = argparse.ArgumentParser(description="GPTで解説文を自動生成する")
    parser.add_argument("--batch-size", type=int, default=100,
                        help="1回に処理するレコード数 (default: 100)")
    parser.add_argument("--dry-run", action="store_true",
                        help="対象件数を表示するだけ")
    parser.add_argument("--rebuild-json", action="store_true",
                        help="生成なし・JSON再生成のみ")
    parser.add_argument("--model", default=GPT_MODEL,
                        help=f"GPTモデル (default: {GPT_MODEL})")
    args = parser.parse_args()

    rows = list(csv.DictReader(open(CSV_PATH, encoding="utf-8-sig")))
    fieldnames = list(rows[0].keys())

    targets = [r for r in rows
               if r.get("final_status") == "reviewed"
               and needs_explanation(r)]

    already_done = sum(1 for r in rows
                       if r.get("final_status") == "reviewed"
                       and r.get("human_check_status", "") == GPT_EXPLANATION_FLAG)

    print(f"解説生成対象: {len(targets)}件 / 生成済み: {already_done}件 / reviewed全体: {sum(1 for r in rows if r.get('final_status')=='reviewed')}件")
    print(f"今回処理: 最大 {args.batch_size}件")

    if args.dry_run:
        from collections import Counter
        subj = Counter(r.get("subject", "") for r in targets)
        print("\n科目別内訳（未生成）:")
        for k, v in subj.most_common():
            print(f"  {k}: {v}件")
        avg_tokens = 200
        cost_usd = len(targets) * avg_tokens / 1_000_000 * 0.6
        print(f"\n概算コスト: ${cost_usd:.3f} (約{cost_usd*150:.0f}円)")
        return

    if args.rebuild_json:
        print("JSON再生成のみ実行...")
        rebuild_json(rows)
        print("→ /triage で「取込開始」をクリックしてください")
        return

    # OpenAI初期化
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        print("エラー: OPENAI_API_KEY が設定されていません", file=sys.stderr)
        sys.exit(1)
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
    except ImportError:
        print("エラー: pip install openai", file=sys.stderr)
        sys.exit(1)

    # バックアップ（初回のみ）
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = ROOT / "tmp" / f"qa_draft_backup_{ts}.csv"
    shutil.copy2(CSV_PATH, backup)
    print(f"バックアップ: {backup.name}\n")

    row_index = {r["record_id"]: i for i, r in enumerate(rows)}
    batch = targets[:args.batch_size]
    updated = 0

    for start in range(0, len(batch), CHUNK_SIZE):
        chunk = batch[start:start + CHUNK_SIZE]
        print(f"  [{start+1}-{start+len(chunk)}/{len(batch)}] GPT生成中...", end="", flush=True)

        results = generate_explanations(client, chunk)

        # 結果をrowsに即反映
        chunk_updated = 0
        for rid, exp_text in results.items():
            idx = row_index.get(rid)
            if idx is not None:
                rows[idx]["explanation_text"] = exp_text
                rows[idx]["human_check_status"] = GPT_EXPLANATION_FLAG  # 生成済みフラグ
                rows[idx]["human_check_note"] = f"GPT生成 {datetime.now().strftime('%Y-%m-%d')}"
                chunk_updated += 1
                updated += 1

        # チャンクごとにCSV即書き込み（中断しても損失はこのチャンク分のみ）
        save_csv(rows, fieldnames)
        print(f" {chunk_updated}/{len(chunk)}件完了 (累計: {updated}件)")
        time.sleep(0.3)

    print(f"\n解説生成完了: {updated}件")
    remaining = len(targets) - updated
    if remaining > 0:
        print(f"残り: {remaining}件（--batch-size を増やして再実行してください）")

    # JSON再生成
    print("\nJSON再生成中...")
    rebuild_json(rows)
    print("→ /triage で「取込開始」をクリックしてください")


if __name__ == "__main__":
    main()
