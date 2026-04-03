#!/usr/bin/env python3
"""
batch_gpt_extract.py

ステータス管理ルール:
  draft            → OCR未処理 / テキスト未取得 (このスクリプトの対象)
  ready_for_review → GPT抽出済み・issue_flag=1 (人確認待ち) ← このスクリプトが設定
  reviewed         → 人またはGPT精査通過・issue_flag=0 確認済み (auto_promote_draft.py が管理)

OCR中間CSV (data/ocr_intermediate.csv) の OCR テキストを使い、
OpenAI GPT API で問題文を復元して qa_draft.csv のプレースホルダーを埋める。

  - final_status='draft' かつ question_text が '[問題文読取困難' で始まるレコードが対象
  - 1回の実行で --batch-size 枚の画像（ページ）を処理する
  - 更新する列: question_text, gpt_check_status, gpt_check_note, final_status
  - final_status は 'draft' → 'ready_for_review' に変更する (reviewed には上げない)
  - 他の列 (answer_boolean, answer_symbol 等) は一切変更しない

セットアップ:
  pip install openai
  export OPENAI_API_KEY=sk-...

使用例:
  python scripts/batch_gpt_extract.py               # 1回 20 ページ処理
  python scripts/batch_gpt_extract.py --batch-size 10 --auto-promote
  python scripts/batch_gpt_extract.py --dry-run     # 対象ページ一覧だけ表示

cron 登録例（毎時実行）:
  0 * * * * cd /path/to/gyosei_tracker && python scripts/batch_gpt_extract.py --batch-size 10 --auto-promote >> /tmp/gpt_extract.log 2>&1
"""

import argparse
import csv
import json
import os
import re
import shutil
import subprocess
import sys
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
CSV_PATH = ROOT / "data" / "qa_draft.csv"
OCR_CSV = ROOT / "data" / "ocr_intermediate.csv"
AUTO_PROMOTE_SCRIPT = ROOT / "scripts" / "auto_promote_draft.py"

PLACEHOLDER_PREFIX = "[問題文読取困難"
GPT_MODEL = "gpt-4o-mini"   # gpt-4o でもよいが mini で十分なことが多い
MAX_RETRIES = 3
RETRY_DELAY = 5.0


# ─── CSV ヘルパー ────────────────────────────────────────────

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


# ─── GPT 問題文抽出 ─────────────────────────────────────────

def extract_questions_with_gpt(
    client,
    page_seq: str,
    ocr_text: str,
    answer_symbols: str,
    records: list[dict],
) -> dict[str, str]:
    """
    GPT に1ページ分の OCR テキストを渡し、各問番号の問題文を返す。
    戻り値: {question_no_str: question_text}
    """
    qnos = [r["question_no"] for r in records]
    n = len(records)

    # 既存プレースホルダーから部分テキストを抽出（ヒントとして渡す）
    partial_hints = []
    for r in records:
        text = r.get("question_text", "")
        m = re.match(r"\[問題文読取困難 - (.+?)\]", text, re.DOTALL)
        if m:
            partial_hints.append(f"Q{r['question_no']}: {m.group(1).strip()}")

    prompt = f"""以下は行政書士試験の肢別問題集の1ページをスキャンしたOCRテキストです。
このページには {n} 問の問題（問番号: {', '.join(qnos)}）が含まれています。

【OCRテキスト（左欄 = 問題文）】
{ocr_text[:3000]}

【正誤記号（参考）】
{answer_symbols or "不明"}

【部分読取ヒント（OCR判定が難しかった問題）】
{chr(10).join(partial_hints) if partial_hints else "なし"}

各問題の正確な日本語問題文を復元してください。
- OCRの誤字・スペースの乱れは訂正してください
- 問題文は完全な1文にしてください
- 元の法律用語・条文番号は正確に保持してください
- 問題文が不明な場合は null を返してください

以下の JSON 形式のみで返答してください（説明文不要）:
{{"questions": [{{"no": "1", "text": "..."}}, ...]}}"""

    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model=GPT_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"},
                timeout=60,
            )
            content = response.choices[0].message.content
            data = json.loads(content)
            result = {}
            for q in data.get("questions", []):
                no = str(q.get("no", "")).strip()
                text = q.get("text")
                if no and text:
                    result[no] = str(text).strip()
            return result
        except Exception as e:
            print(f"    GPT エラー (試行 {attempt+1}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)

    return {}


# ─── メイン ─────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="GPTでOCRテキストから問題文を復元する")
    parser.add_argument("--batch-size", type=int, default=20,
                        help="1回に処理するページ数 (default: 20)")
    parser.add_argument("--dry-run", action="store_true",
                        help="処理対象を表示するだけ（APIを呼ばない）")
    parser.add_argument("--auto-promote", action="store_true",
                        help="処理後に auto_promote_draft.py を実行する")
    parser.add_argument("--model", default=GPT_MODEL,
                        help=f"使用するGPTモデル (default: {GPT_MODEL})")
    args = parser.parse_args()

    # OpenAI クライアント初期化
    if not args.dry_run:
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            print("エラー: OPENAI_API_KEY 環境変数が設定されていません", file=sys.stderr)
            print("  export OPENAI_API_KEY=sk-...", file=sys.stderr)
            sys.exit(1)
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
        except ImportError:
            print("エラー: openai パッケージが見つかりません", file=sys.stderr)
            print("  pip install openai", file=sys.stderr)
            sys.exit(1)
    else:
        client = None

    # データ読み込み
    rows = load_csv(CSV_PATH)
    fieldnames = list(rows[0].keys()) if rows else []

    ocr_rows = load_csv(OCR_CSV)
    # OCR を {source_image_no: row} にマップ (0007.png → "007")
    ocr_map = {}
    for o in ocr_rows:
        img = o.get("source_image", "")
        seq = img.replace(".png", "").replace(".jpg", "").lstrip("0") or "0"
        ocr_map[seq.zfill(3)] = o  # 3桁ゼロパディングでキー

    # 対象レコードを特定: draft + プレースホルダー
    placeholder_records = [
        r for r in rows
        if r.get("final_status") == "draft"
        and r.get("question_text", "").strip().startswith(PLACEHOLDER_PREFIX)
    ]

    # ページ別にグループ化
    by_page = defaultdict(list)
    for r in placeholder_records:
        by_page[r["image_seq"].zfill(3)].append(r)

    total_pages = len(by_page)
    total_records = len(placeholder_records)
    print(f"プレースホルダー対象: {total_records} 問 / {total_pages} ページ")
    print(f"今回処理: 最大 {args.batch_size} ページ")

    if args.dry_run:
        print("\n[dry-run] 処理予定ページ:")
        for seq in sorted(by_page.keys())[:args.batch_size]:
            recs = by_page[seq]
            has_ocr = seq in ocr_map or seq.lstrip("0") in ocr_map
            print(f"  p{seq}: {len(recs)} 問 | OCR: {'あり' if has_ocr else 'なし'}")
        return

    # バックアップ
    backup = backup_csv(CSV_PATH)
    print(f"バックアップ: {backup}\n")

    # record_id → 行インデックス マップ
    row_index = {r["record_id"]: i for i, r in enumerate(rows)}

    updated_count = 0
    processed_pages = 0

    for seq in sorted(by_page.keys()):
        if processed_pages >= args.batch_size:
            break

        recs = sorted(by_page[seq], key=lambda r: int(r.get("question_no", "0") or "0"))

        # OCR テキストを取得
        ocr = ocr_map.get(seq) or ocr_map.get(seq.lstrip("0").zfill(3))
        if not ocr:
            print(f"  p{seq}: OCR データなし → スキップ")
            processed_pages += 1
            continue

        ocr_text = ocr.get("question_ocr_raw", "") or ocr.get("explanation_ocr_raw", "")
        answer_symbols = ocr.get("answer_symbol_candidate", "")

        if not ocr_text.strip():
            print(f"  p{seq}: OCR テキスト空 → スキップ")
            processed_pages += 1
            continue

        print(f"  p{seq}: {len(recs)} 問を処理中...", end="", flush=True)

        extracted = extract_questions_with_gpt(
            client=client,
            page_seq=seq,
            ocr_text=ocr_text,
            answer_symbols=answer_symbols,
            records=recs,
        )

        page_updated = 0
        for r in recs:
            qno = r.get("question_no", "").strip()
            new_text = extracted.get(qno)
            if new_text and len(new_text) > 5:
                idx = row_index.get(r["record_id"])
                if idx is not None:
                    rows[idx]["question_text"] = new_text
                    rows[idx]["gpt_check_status"] = "auto_extracted"
                    rows[idx]["gpt_check_note"] = f"GPT復元 {datetime.now().strftime('%Y-%m-%d')}"
                    # draft → ready_for_review (reviewed には上げない。人確認後に auto_promote で昇格)
                    rows[idx]["final_status"] = "ready_for_review"
                    page_updated += 1
                    updated_count += 1

        print(f" {page_updated}/{len(recs)} 問更新")
        processed_pages += 1

        # API レート制限対策: ページ間に少し待機
        if processed_pages < args.batch_size:
            time.sleep(0.5)

    # CSV 保存
    save_csv(CSV_PATH, rows, fieldnames)
    print(f"\n合計 {updated_count} 問の question_text を更新しました")
    remaining = total_records - updated_count
    print(f"残り: {total_records - processed_pages * (total_records // max(total_pages, 1))} 問以上（目安）")

    if args.auto_promote:
        print("\n--- auto_promote_draft.py を実行 ---")
        result = subprocess.run(
            [sys.executable, str(AUTO_PROMOTE_SCRIPT)],
            capture_output=False,
        )
        if result.returncode != 0:
            print("警告: auto_promote_draft.py が非ゼロ終了しました", file=sys.stderr)
    else:
        print("\n次のステップ: python scripts/auto_promote_draft.py")


if __name__ == "__main__":
    main()
