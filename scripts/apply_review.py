"""
apply_review.py
────────────────────────────────────────────────────────────────────────────
review_queue.csv で編集した内容を record_id キーで qa_draft.csv に安全に反映する。

【書き戻し対象列】  ← review_queue.csv 上でこれらを編集すると qa_draft.csv に反映
  question_text, answer_boolean, explanation_text,
  issue_flag, issue_type, issue_detail,
  gpt_check_status, gpt_check_note,
  human_check_status, human_check_note, final_status

【安全機構】
  1. record_id が qa_draft.csv に存在しない行はスキップ（警告表示）
  2. 書き戻し対象外の列（subject 等）は review_queue を無視し qa_draft 側を保持
  3. ステータス値のバリデーション（不正値は警告 + スキップ）
  4. 書き込み前に tmp/qa_draft_backup_{timestamp}.csv へバックアップ
  5. --dry-run で実際の書き込みなしに差分確認

【ステータス許容値】
  gpt_check_status  : pending / done / flagged / skip
  human_check_status: pending / done / flagged
  final_status      : draft / reviewed / approved / rejected

使い方:
  # 通常実行（tmp/review_queue.csv → data/qa_draft.csv）
  python3 scripts/apply_review.py

  # 差分だけ確認（書き込みなし）
  python3 scripts/apply_review.py --dry-run

  # 入力ファイルを指定
  python3 scripts/apply_review.py --input tmp/review_queue_A.csv

  # バックアップ無効（上書き確認後）
  python3 scripts/apply_review.py --no-backup
"""

import csv
import argparse
import shutil
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT   = Path(__file__).parent.parent
QA     = ROOT / "data" / "qa_draft.csv"
QUEUE  = ROOT / "tmp" / "review_queue.csv"
BACKUP = ROOT / "tmp"

# review_queue.csv の中でこれらの列だけ qa_draft.csv に書き戻す
WRITABLE_COLS = {
    "question_text",
    "answer_boolean",
    "explanation_text",
    "issue_flag",
    "issue_type",
    "issue_detail",
    "gpt_check_status",
    "gpt_check_note",
    "human_check_status",
    "human_check_note",
    "final_status",
}

VALID_VALUES = {
    "gpt_check_status":   {"pending", "done", "flagged", "skip"},
    "human_check_status": {"pending", "done", "flagged"},
    "final_status":       {"draft", "reviewed", "approved", "rejected"},
    "answer_boolean":     {"True", "False", "true", "false", "1", "0", ""},
    "issue_flag":         {"0", "1", ""},
}


def validate(col, val):
    """許容値チェック。問題あれば (False, 理由) を返す。"""
    if col in VALID_VALUES and val not in VALID_VALUES[col]:
        return False, f"{col}={val!r} は不正値 (許容: {sorted(VALID_VALUES[col])})"
    return True, ""


def main():
    parser = argparse.ArgumentParser(description="review_queue.csv の編集を qa_draft.csv に反映する")
    parser.add_argument("--input",     default=str(QUEUE),
                        help=f"入力 review_queue.csv のパス (default: {QUEUE})")
    parser.add_argument("--dry-run",   action="store_true",
                        help="差分表示のみ。qa_draft.csv は変更しない")
    parser.add_argument("--no-backup", action="store_true",
                        help="バックアップを作成しない")
    args = parser.parse_args()

    queue_path = Path(args.input)
    if not queue_path.exists():
        print(f"[ERROR] 入力ファイルが見つかりません: {queue_path}")
        return 1

    # ── review_queue を record_id → {col: val} の辞書で読み込む ──────────
    queue_map = {}       # {record_id: {col: new_val}}
    queue_cols_seen = set()
    with open(queue_path, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        queue_cols_seen = set(reader.fieldnames or [])
        for row in reader:
            rid = row.get("record_id", "").strip()
            if not rid:
                continue
            queue_map[rid] = row

    writable_in_queue = WRITABLE_COLS & queue_cols_seen
    missing = WRITABLE_COLS - queue_cols_seen
    if missing:
        print(f"[INFO] review_queue に以下の書き戻し列がありません（無視）: {sorted(missing)}")

    # ── qa_draft.csv を読み込む ───────────────────────────────────────────
    with open(QA, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        qa_header = list(reader.fieldnames)
        qa_rows = list(reader)

    qa_map = {row["record_id"]: row for row in qa_rows}

    # ── 差分計算 ──────────────────────────────────────────────────────────
    changes    = []   # [(record_id, col, old, new)]
    skipped    = []   # [(record_id, reason)]
    not_found  = []   # [record_id]

    for rid, q_row in queue_map.items():
        if rid not in qa_map:
            not_found.append(rid)
            continue

        qa_row = qa_map[rid]
        for col in writable_in_queue:
            new_val = q_row.get(col, "").strip()
            old_val = qa_row.get(col, "").strip()

            if new_val == old_val:
                continue  # 変更なし

            ok, reason = validate(col, new_val)
            if not ok:
                skipped.append((rid, reason))
                continue

            changes.append((rid, col, old_val, new_val))

    # ── 差分レポート ──────────────────────────────────────────────────────
    print(f"[apply_review] 入力: {queue_path.name}  ({len(queue_map)} 件)")
    print(f"  変更あり: {len(changes)} 件  /  変更なし: -  /  スキップ: {len(skipped)} 件")

    if not_found:
        print(f"\n[WARN] qa_draft.csv に存在しない record_id ({len(not_found)} 件):")
        for rid in not_found[:10]:
            print(f"  {rid}")
        if len(not_found) > 10:
            print(f"  ... 他 {len(not_found)-10} 件")

    if skipped:
        print(f"\n[WARN] バリデーションでスキップ ({len(skipped)} 件):")
        for rid, reason in skipped[:10]:
            print(f"  {rid}: {reason}")

    if not changes:
        print("\n変更対象がありません。qa_draft.csv は更新しません。")
        return 0

    # 変更内容を列ごとにまとめて表示
    from collections import Counter
    col_count = Counter(col for _, col, _, _ in changes)
    print(f"\n変更列サマリー:")
    for col, cnt in sorted(col_count.items()):
        print(f"  {col}: {cnt} 件")

    if args.dry_run:
        print("\n[DRY RUN] 上記の変更を適用します（--dry-run のため実際には書き込みません）")
        print("  先頭10件の差分:")
        for rid, col, old, new in changes[:10]:
            print(f"  {rid}  {col}: {old!r} → {new!r}")
        return 0

    # ── バックアップ ──────────────────────────────────────────────────────
    if not args.no_backup:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = BACKUP / f"qa_draft_backup_{ts}.csv"
        BACKUP.mkdir(exist_ok=True)
        shutil.copy2(QA, backup_path)
        print(f"\nバックアップ: {backup_path.name}")

    # ── 変更を qa_rows に適用 ─────────────────────────────────────────────
    for rid, col, old_val, new_val in changes:
        qa_map[rid][col] = new_val

    # ── qa_draft.csv に書き戻し ───────────────────────────────────────────
    tmp_out = QA.parent / "_qa_draft_tmp.csv"
    with open(tmp_out, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=qa_header)
        writer.writeheader()
        writer.writerows(qa_rows)

    # 検証（行数・列数）
    import io
    raw = tmp_out.read_text(encoding="utf-8")
    verify_rows = list(csv.reader(io.StringIO(raw)))
    assert len(verify_rows) == len(qa_rows) + 1, "行数不一致"
    assert all(len(r) == len(qa_header) for r in verify_rows[1:]), "列数不一致"

    tmp_out.replace(QA)

    print(f"\n[OK] qa_draft.csv を更新しました ({len(changes)} 件の変更を反映)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
