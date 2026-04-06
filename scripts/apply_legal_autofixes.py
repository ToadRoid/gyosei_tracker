#!/usr/bin/env python3
"""
法学問題データ自動修正スクリプト v3
==================================
legal_autofix_candidates.json を読み、
answerBoolean と explanation の結論文が機械的に不一致なものだけを修正する。

修正対象:
  - 「本肢は正しい」と書いてあるのに answerBoolean=false → true に修正
  - 「本肢は誤り」と書いてあるのに answerBoolean=true → false に修正

修正しないもの:
  - explanation の法的内容が別論点と混同しているもの
  - OCR崩壊で問題文自体が不正なもの
  - 条文の解釈が分かれうるもの

出力:
  - reviewed_import.json を直接修正
  - data/legal_autofix_applied.json に適用ログ
"""

import json
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "public" / "data" / "reviewed_import.json"
SYNC_PATH = ROOT / "data" / "reviewed_import.json"
CANDIDATES_PATH = ROOT / "data" / "legal_autofix_candidates.json"
LOG_PATH = ROOT / "data" / "legal_autofix_applied.json"


def apply_autofixes(dry_run: bool = False):
    with open(CANDIDATES_PATH, "r") as f:
        candidates = json.load(f)

    with open(DATA_PATH, "r") as f:
        data = json.load(f)

    applied = []
    skipped = []

    for candidate in candidates:
        page_no = candidate["page"]
        seq_no = candidate["seqNo"]
        flags = candidate["suspectFlags"]

        # answer_explanation_mismatch のみ自動修正
        if "answer_explanation_mismatch" not in flags:
            skipped.append({
                "problemId": candidate["problemId"],
                "reason": "answer_explanation_mismatch 以外のフラグ",
            })
            continue

        # 該当データを検索
        found = False
        for page_obj in data.get("pages", []):
            if page_obj.get("sourcePage") != page_no:
                continue
            for branch in page_obj.get("branches", []):
                if branch.get("seqNo") != seq_no:
                    continue

                old_answer = branch["answerBoolean"]
                exp = branch.get("explanationText", "")

                # 修正方向を判定
                new_answer = None
                if "本肢は正しい" in exp and old_answer is False:
                    new_answer = True
                elif "本肢は誤り" in exp and old_answer is True:
                    new_answer = False
                elif "本肢は妥当" in exp and old_answer is False:
                    new_answer = True
                elif "本肢は不適切" in exp and old_answer is True:
                    new_answer = False

                if new_answer is None:
                    skipped.append({
                        "problemId": candidate["problemId"],
                        "reason": "修正方向が不明確",
                    })
                    found = True
                    break

                # 安全確認: explanation の内容が具体的な法的根拠を含むか
                # → 「ため」「から」「により」等の理由付けがある場合のみ修正
                has_reasoning = any(w in exp for w in ["ため", "から", "により", "に基づき", "に照らし"])
                if not has_reasoning:
                    skipped.append({
                        "problemId": candidate["problemId"],
                        "reason": "explanation に具体的根拠が不足。人間確認推奨",
                    })
                    found = True
                    break

                record = {
                    "problemId": candidate["problemId"],
                    "page": page_no,
                    "seqNo": seq_no,
                    "oldAnswer": old_answer,
                    "newAnswer": new_answer,
                    "explanationSnippet": exp[:100],
                    "appliedAt": datetime.now().isoformat(),
                }

                if not dry_run:
                    branch["answerBoolean"] = new_answer

                applied.append(record)
                found = True
                break
            if found:
                break

        if not found:
            skipped.append({
                "problemId": candidate["problemId"],
                "reason": "データが見つからない",
            })

    # 保存
    if not dry_run and applied:
        with open(DATA_PATH, "w") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        with open(SYNC_PATH, "w") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")

    # ログ保存
    log = {
        "runAt": datetime.now().isoformat(),
        "dryRun": dry_run,
        "applied": applied,
        "skipped": skipped,
    }
    with open(LOG_PATH, "w") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)

    # 表示
    mode = "DRY RUN" if dry_run else "APPLIED"
    print(f"[{mode}] 自動修正結果:")
    print(f"  修正適用: {len(applied)} 件")
    print(f"  スキップ: {len(skipped)} 件")

    if applied:
        print("\n修正内容:")
        for r in applied:
            print(f"  {r['problemId']}: {r['oldAnswer']} → {r['newAnswer']}")
            print(f"    解説: {r['explanationSnippet']}")

    if skipped:
        print("\nスキップ:")
        for s in skipped:
            print(f"  {s['problemId']}: {s['reason']}")

    return applied, skipped


if __name__ == "__main__":
    import sys
    dry = "--apply" not in sys.argv
    if dry:
        print("※ ドライランです。実際に修正するには --apply を付けてください。\n")
    apply_autofixes(dry_run=dry)
