#!/usr/bin/env python3
"""
check_classification_test.py — self-test for check_classification.py (v0.1)

Replays batch 1-9 raw Gemini JSONs (all data/parsed_gemini_2026*.json with
non-suffixed timestamps) and asserts the v0.1 rule reproduces the override
inventory:

  - auto_apply   = 86 branches (patterns A + B + C)
  - review_queue =  5 branches (patterns D 4 + E 1)

Plus structural spot checks:

  - p442 (5 branches) → all auto_apply with target kiso-chishiki/kiso-chishiki-gyomu
  - p455 (7 branches) → all auto_apply with target kiso-chishiki/kiso-chishiki-joho
  - p294 / p328       → outliers (D) land in review_queue with reason within_page_outlier
  - p375 seq1         → review_queue with reason section_title_empty
  - p375 seq2/seq3    → not flagged (already correct vs page mode)

Read-only. Touches nothing on disk.

Usage:
  python3 scripts/check_classification_test.py
"""
from __future__ import annotations

import glob
import json
import os
import sys

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, THIS_DIR)
from check_classification import analyze_pages  # noqa: E402

REPO_ROOT = os.path.dirname(THIS_DIR)


def _load_pages() -> list[dict]:
    """Merge all timestamped Gemini parses; later runs win per sourcePage."""
    pattern = os.path.join(REPO_ROOT, "data", "parsed_gemini_2026*.json")
    files = sorted(glob.glob(pattern))
    if not files:
        raise SystemExit(f"no raw Gemini JSON found at {pattern}")
    by_sp: dict[str, dict] = {}
    for f in files:
        with open(f, encoding="utf-8") as fh:
            d = json.load(fh)
        for p in d.get("pages", []):
            if p.get("parseError"):
                continue
            if not p.get("branches"):
                continue
            sp = p.get("sourcePage")
            if sp:
                by_sp[sp] = p
    return list(by_sp.values())


def _seqs(entries: list[dict], page: str) -> list:
    return sorted(e["seqNo"] for e in entries if e["sourcePage"] == page)


def _check(label: str, got, want) -> int:
    if got == want:
        print(f"  PASS  {label}: {got}")
        return 0
    print(f"  FAIL  {label}: got={got!r} want={want!r}")
    return 1


def main() -> int:
    pages = _load_pages()
    print(f"loaded {len(pages)} unique pages from data/parsed_gemini_2026*.json")
    result = analyze_pages(pages)

    failures = 0

    # --- count assertions ---
    failures += _check("auto_apply count",   len(result["auto_apply"]),   86)
    failures += _check("review_queue count", len(result["review_queue"]),  5)
    failures += _check(
        "auto+review total",
        len(result["auto_apply"]) + len(result["review_queue"]),
        91,
    )

    # --- p442 = 5 branches all auto-applied to kiso-chishiki-gyomu ---
    p442 = [e for e in result["auto_apply"] if e["sourcePage"] == "442"]
    failures += _check("p442 auto count", len(p442), 5)
    failures += _check(
        "p442 proposed",
        all(e["proposed"] == {"subject": "kiso-chishiki", "chapter": "kiso-chishiki-gyomu"} for e in p442),
        True,
    )
    failures += _check(
        "p442 sectionTitle",
        all(e["sectionTitle"] == "業務関連諸法令" for e in p442),
        True,
    )

    # --- p455 = "1 個人情報保護法 (総論)" exact match → kiso-chishiki-joho ---
    p455 = [e for e in result["auto_apply"] if e["sourcePage"] == "455"]
    failures += _check("p455 auto count", len(p455), 7)
    failures += _check(
        "p455 proposed",
        all(e["proposed"] == {"subject": "kiso-chishiki", "chapter": "kiso-chishiki-joho"} for e in p455),
        True,
    )
    failures += _check(
        "p455 sectionTitle exact",
        all(e["sectionTitle"] == "1 個人情報保護法 (総論)" for e in p455),
        True,
    )

    # --- p294 D pattern: seq3, seq4 → review_queue/within_page_outlier ---
    p294_review = [e for e in result["review_queue"] if e["sourcePage"] == "294"]
    failures += _check("p294 review seqs", _seqs(p294_review, "294"), [3, 4])
    failures += _check(
        "p294 reasons",
        sorted({e["reason"] for e in p294_review}),
        ["within_page_outlier"],
    )

    # --- p328 D pattern: seq1, seq2 → review_queue/within_page_outlier ---
    p328_review = [e for e in result["review_queue"] if e["sourcePage"] == "328"]
    failures += _check("p328 review seqs", _seqs(p328_review, "328"), [1, 2])
    failures += _check(
        "p328 reasons",
        sorted({e["reason"] for e in p328_review}),
        ["within_page_outlier"],
    )

    # --- p375 E pattern: seq1 only → review_queue/section_title_empty ---
    p375_review = [e for e in result["review_queue"] if e["sourcePage"] == "375"]
    failures += _check("p375 review seqs", _seqs(p375_review, "375"), [1])
    failures += _check(
        "p375 reasons",
        sorted({e["reason"] for e in p375_review}),
        ["section_title_empty"],
    )

    # --- p375 seq2/seq3 must NOT appear in either bucket ---
    p375_auto = [e for e in result["auto_apply"] if e["sourcePage"] == "375"]
    failures += _check("p375 auto count (must be 0)", len(p375_auto), 0)

    # --- pages where sectionTitle is in MAP but threshold pass with all-correct branches ---
    # (regression guard: those pages must contribute 0 entries, not noise)
    auto_pages = {e["sourcePage"] for e in result["auto_apply"]}
    expected_override_pages = {
        "442", "443", "444", "445", "446", "447", "448",
        "450", "451", "452", "455", "461", "463", "464",
    }
    failures += _check(
        "auto_apply pages == 14 batch9 override pages",
        auto_pages,
        expected_override_pages,
    )

    review_pages = {e["sourcePage"] for e in result["review_queue"]}
    failures += _check(
        "review_queue pages == {p294, p328, p375}",
        review_pages,
        {"294", "328", "375"},
    )

    print()
    if failures:
        print(f"FAILED: {failures} assertion(s)")
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
