#!/usr/bin/env python3
"""
check_classification.py — sectionTitle-first override proposal tool (v0.1)

Read-only proposal tool for OCR (Gemini) parsed output.

Reads:  data/parsed_gemini_<timestamp>.json (raw OCR result, schema = pages[].branches[])
Writes: NOTHING (stdout report only)

Per docs/override_rule_design.md §4-5:
  - sectionTitle exact match against SECTION_TITLE_MAP (9 entries, batch 1-9 derived)
  - per-page ≥80% threshold on mode sectionTitle
  - patterns A/B/C → auto_apply
  - patterns D/E (within-page outliers, empty sectionTitle) → review_queue
  - never modifies existing reviewed_import.json

Usage:
  python3 scripts/check_classification.py <parsed_gemini.json>
  python3 scripts/check_classification.py <parsed_gemini.json> --json     # JSON output
  python3 scripts/check_classification.py <parsed_gemini.json> --quiet    # counts only
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from typing import Any

# ---------------------------------------------------------------------------
# CONSTANTS
# ---------------------------------------------------------------------------

# Exact-match map: sectionTitle (raw OCR string) → (subject, chapter)
# Source: docs/override_rule_design.md §4-2 (batch 1-9 累計 86 件 auto-apply 実績)
# Edit only when adding new books / new sectionTitle variants.
SECTION_TITLE_MAP: dict[str, tuple[str, str]] = {
    "業務関連諸法令":             ("kiso-chishiki", "kiso-chishiki-gyomu"),
    "行政書士の義務":             ("kiso-chishiki", "kiso-chishiki-gyomu"),
    "行政書士法人":               ("kiso-chishiki", "kiso-chishiki-gyomu"),
    "監督":                       ("kiso-chishiki", "kiso-chishiki-gyomu"),
    "戸籍法":                     ("kiso-chishiki", "kiso-chishiki-gyomu"),
    "住民基本台帳法":             ("kiso-chishiki", "kiso-chishiki-gyomu"),
    "情報通信・個人情報保護":     ("kiso-chishiki", "kiso-chishiki-joho"),
    "1 個人情報保護法 (総論)":    ("kiso-chishiki", "kiso-chishiki-joho"),
    "公文書管理法":               ("kiso-chishiki", "kiso-chishiki-joho"),
}

PAGE_THRESHOLD = 0.8     # ≥80% of branches must share the mode sectionTitle (v0.1)
OUTLIER_FLOOR = 0.5      # mode (subj, chap) must hold ≥50% to flag minorities

# ---------------------------------------------------------------------------
# CORE
# ---------------------------------------------------------------------------


def _branch_class(b: dict) -> tuple[str, str]:
    return (b.get("subjectCandidate", ""), b.get("chapterCandidate", ""))


def analyze_pages(pages: list[dict]) -> dict[str, list[dict]]:
    """
    Apply v0.1 rules to a list of page objects.

    Returns:
        {
          "auto_apply":   [{sourcePage, seqNo, raw, proposed, sectionTitle, reason}, ...],
          "review_queue": [{sourcePage, seqNo, raw, sectionTitle, reason}, ...],
        }
    """
    auto: list[dict] = []
    review: list[dict] = []

    for p in pages:
        if p.get("parseError"):
            continue
        branches = p.get("branches") or []
        if not branches:
            continue

        sp = p.get("sourcePage", "")
        secs = [b.get("sectionTitle", "") for b in branches]
        sec_counts = Counter(secs)
        mode_sec, mode_sec_n = sec_counts.most_common(1)[0]
        sec_pct = mode_sec_n / len(branches)

        # ---- Pattern A/B/C: sectionTitle in MAP & threshold ----
        if mode_sec in SECTION_TITLE_MAP and sec_pct >= PAGE_THRESHOLD:
            target_subj, target_chap = SECTION_TITLE_MAP[mode_sec]
            for b in branches:
                raw_subj, raw_chap = _branch_class(b)
                if (raw_subj, raw_chap) != (target_subj, target_chap):
                    auto.append({
                        "sourcePage":   sp,
                        "seqNo":        b.get("seqNo"),
                        "raw":          {"subject": raw_subj, "chapter": raw_chap},
                        "proposed":     {"subject": target_subj, "chapter": target_chap},
                        "sectionTitle": mode_sec,
                        "reason":       "section_title_match",
                    })
            continue

        # ---- Pattern D/E: within-page outliers ----
        # Detect minority (subj, chap) in pages where the page's own classification
        # has a clear majority but the sectionTitle isn't in the map. Outliers are
        # surfaced for human review (D = sectionTitle present, E = sectionTitle empty).
        chap_counts = Counter(_branch_class(b) for b in branches)
        mode_chap, mode_chap_n = chap_counts.most_common(1)[0]
        if mode_chap_n == len(branches):
            continue  # all branches agree, nothing to flag
        if mode_chap_n / len(branches) < OUTLIER_FLOOR:
            continue  # no clear majority; too noisy for v0.1 to act on

        for b in branches:
            raw = _branch_class(b)
            if raw == mode_chap:
                continue
            sec_val = b.get("sectionTitle", "")
            reason = "section_title_empty" if not sec_val else "within_page_outlier"
            review.append({
                "sourcePage":   sp,
                "seqNo":        b.get("seqNo"),
                "raw":          {"subject": raw[0], "chapter": raw[1]},
                "sectionTitle": sec_val,
                "reason":       reason,
            })

    return {"auto_apply": auto, "review_queue": review}


# ---------------------------------------------------------------------------
# CLI / report
# ---------------------------------------------------------------------------


def _format_report(result: dict[str, list[dict]]) -> str:
    auto = result["auto_apply"]
    review = result["review_queue"]

    out = []
    out.append("=" * 72)
    out.append(f"check_classification v0.1 — proposal report")
    out.append("=" * 72)
    out.append(f"  auto_apply  : {len(auto):4d} branches")
    out.append(f"  review_queue: {len(review):4d} branches")
    out.append(f"  total       : {len(auto) + len(review):4d} branches")
    out.append("")

    if auto:
        out.append("-" * 72)
        out.append("AUTO-APPLY (sectionTitle exact match + ≥80% page threshold)")
        out.append("-" * 72)
        out.append(f"{'page':>5} {'seq':>3} {'raw':>32}  →  {'proposed':32} sectionTitle")
        for e in auto:
            raw = f'{e["raw"]["subject"]}/{e["raw"]["chapter"]}'
            prop = f'{e["proposed"]["subject"]}/{e["proposed"]["chapter"]}'
            out.append(f'{e["sourcePage"]:>5} {e["seqNo"]:>3} {raw:>32}  →  {prop:32} "{e["sectionTitle"]}"')
        out.append("")

    if review:
        out.append("-" * 72)
        out.append("REVIEW QUEUE (within-page outliers; sectionTitle absent or unmapped)")
        out.append("-" * 72)
        out.append(f"{'page':>5} {'seq':>3} {'raw':>32}  reason  sectionTitle")
        for e in review:
            raw = f'{e["raw"]["subject"]}/{e["raw"]["chapter"]}'
            out.append(f'{e["sourcePage"]:>5} {e["seqNo"]:>3} {raw:>32}  {e["reason"]:24}  "{e["sectionTitle"]}"')
        out.append("")

    if not auto and not review:
        out.append("(no proposals — input matched no v0.1 rule)")
        out.append("")

    return "\n".join(out)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        description="sectionTitle-first override proposal tool (v0.1, read-only)"
    )
    ap.add_argument("input", help="parsed Gemini JSON (e.g. data/parsed_gemini_<ts>.json)")
    ap.add_argument("--json", action="store_true", help="emit JSON instead of text report")
    ap.add_argument("--quiet", action="store_true", help="emit counts only")
    args = ap.parse_args(argv)

    with open(args.input, encoding="utf-8") as f:
        data = json.load(f)

    pages = data.get("pages", [])
    result = analyze_pages(pages)

    if args.json:
        json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
        sys.stdout.write("\n")
    elif args.quiet:
        print(f"auto_apply={len(result['auto_apply'])} review_queue={len(result['review_queue'])}")
    else:
        print(_format_report(result))

    return 0


if __name__ == "__main__":
    sys.exit(main())
