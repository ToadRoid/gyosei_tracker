#!/usr/bin/env python3
"""
法学問題データ横断監査スクリプト v4 (出荷ゲート統合版)
=====================================================
reviewed_import.json を走査し、4レイヤーで品質監査を行う。

レイヤー:
  1. critical         — 正誤逆転・条文逆転（1件でも出荷不可）
  2. legal_inconsistency — 旧法混入・論点混同（0件まで要レビュー）
  3. explanation_quality — 解説品質（P1は章完了前に修正）
  4. ocr_suspect       — OCR崩壊（別レーン管理）

出力:
  data/legal_audit_report.csv             — legal層の suspect 一覧（OCR除外）
  data/audit_ocr_suspect.csv              — OCR層のみ
  data/audit_explanation_quality.csv      — 解説品質（P1/P2/P3付き）
  data/legal_autofix_candidates.json      — 自動修正候補
  data/legal_manual_review_queue.csv      — 人間レビュー必須
  data/chapter_audit_summary.csv          — 章別サマリー

Usage:
  python3 scripts/audit_legal_consistency.py                        # 全件監査
  python3 scripts/audit_legal_consistency.py --chapter "05_取消訴訟の審理"  # 単章監査
  python3 scripts/audit_legal_consistency.py --golden               # ゴールデンテストのみ
  python3 scripts/audit_legal_consistency.py --golden --chapter "05_取消訴訟の審理"
  python3 scripts/audit_legal_consistency.py --summary-granularity section  # セクション粒度
"""

import json
import csv
import re
import os
import sys
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "public" / "data" / "reviewed_import.json"
OUT_DIR = ROOT / "data"

# ────────────────────────────────────────────────────────
# CLI引数パース
# ────────────────────────────────────────────────────────

def parse_args():
    args = {
        "golden_only": False,
        "chapter": None,
        "summary_granularity": "chapter",  # "chapter" | "section" | "subject"
    }
    argv = sys.argv[1:]
    i = 0
    while i < len(argv):
        if argv[i] == "--golden":
            args["golden_only"] = True
        elif argv[i] == "--chapter" and i + 1 < len(argv):
            i += 1
            args["chapter"] = argv[i]
        elif argv[i] == "--summary-granularity" and i + 1 < len(argv):
            i += 1
            args["summary_granularity"] = argv[i]
        i += 1
    return args


def make_file_suffix(chapter: Optional[str]) -> str:
    """単章監査時のファイル suffix を生成"""
    if not chapter:
        return ""
    slug = re.sub(r'[^\w]', '_', chapter).strip('_')
    return f".{slug}"


# ────────────────────────────────────────────────────────
# データ構造
# ────────────────────────────────────────────────────────

@dataclass
class Suspect:
    page: str
    seqNo: int
    problemId: str
    subject: str
    chapter: str       # chapterCandidate
    section: str       # sectionTitle
    questionText: str
    answerBoolean: bool
    explanationText: str
    suspectFlags: list = field(default_factory=list)
    severity: str = "low"  # critical / high / medium / low
    reasons: list = field(default_factory=list)
    proposedFix: str = ""
    autoFixable: bool = False
    priority: str = ""  # P1/P2/P3 for explanation_quality


# ────────────────────────────────────────────────────────
# 検出ルール
# ────────────────────────────────────────────────────────

def check_answer_explanation_mismatch(b: dict, page: str) -> list[Suspect]:
    """C. answerBoolean と explanation の結論文が逆転"""
    suspects = []
    exp = b.get("explanationText", "")
    ans = b.get("answerBoolean")
    if not exp or ans is None:
        return suspects

    positive_phrases = ["本肢は正しい", "本肢は妥当", "本肢は適切", "本肢は合っている",
                        "本肢は○", "正しい記述である", "本問は正しい"]
    negative_phrases = ["本肢は誤り", "本肢は不適切", "本肢は妥当でない", "本肢は×",
                        "誤った記述である", "本問は誤り", "誤りである"]

    for phrase in positive_phrases:
        if phrase in exp and ans is False:
            s = _make_suspect(b, page)
            s.suspectFlags.append("answer_explanation_mismatch")
            s.severity = "critical"
            s.reasons.append(f'explanation に「{phrase}」があるが answerBoolean=false')
            s.proposedFix = "answerBoolean を true に変更、または explanation を修正"
            s.autoFixable = True
            suspects.append(s)
            break

    for phrase in negative_phrases:
        if phrase in exp and ans is True:
            s = _make_suspect(b, page)
            s.suspectFlags.append("answer_explanation_mismatch")
            s.severity = "critical"
            s.reasons.append(f'explanation に「{phrase}」があるが answerBoolean=true')
            s.proposedFix = "answerBoolean を false に変更、または explanation を修正"
            s.autoFixable = True
            suspects.append(s)
            break

    return suspects


def check_conclusion_reversal(b: dict, page: str) -> list[Suspect]:
    """A. 条文逆転系: questionText の主張と explanation の結論が矛盾"""
    suspects = []
    q = b.get("questionText", "")
    exp = b.get("explanationText", "")
    if not q or not exp:
        return suspects

    reversal_pairs = [
        ("意見をきかなければならない", "意見を聞く必要はない", "職権証拠調べ後の意見聴取義務"),
        ("意見をきかなければならない", "聞く必要がない", "職権証拠調べ後の意見聴取義務"),
        ("第三者に対しても効力を有する", "第三者には及ばない", "取消判決の第三者効"),
        ("第三者に対しても効力を有する", "第三者には効力を持たない", "取消判決の第三者効"),
        ("第三者に対しても効力を有する", "第三者に対しては効力がない", "取消判決の第三者効"),
        ("審査請求を経た後でなければ", "自由選択主義", "審査請求前置主義 vs 自由選択"),
    ]

    for q_phrase, exp_phrase, desc in reversal_pairs:
        if q_phrase in q and exp_phrase in exp:
            s = _make_suspect(b, page)
            s.suspectFlags.append("conclusion_reversal")
            s.severity = "critical"
            s.reasons.append(f'文言逆転: 問題文「{q_phrase}」vs 解説「{exp_phrase}」({desc})')
            suspects.append(s)

    return suspects


def check_outdated_law(b: dict, page: str) -> list[Suspect]:
    """B. 旧法・法改正未反映系"""
    suspects = []
    exp = b.get("explanationText", "")
    q = b.get("questionText", "")
    section = b.get("sectionTitle", "")

    if ("出訴期間" in section or "14条" in exp) and "3か月" in exp:
        s = _make_suspect(b, page)
        s.suspectFlags.append("outdated_law")
        s.severity = "high"
        s.reasons.append('出訴期間を「3か月」としているが、現行法では6か月（行訴法14条1項）')
        suspects.append(s)

    if "3ヶ月以内に提起" in exp and ("取消訴訟" in q or "取消訴訟" in exp):
        s = _make_suspect(b, page)
        s.suspectFlags.append("outdated_law")
        s.severity = "high"
        s.reasons.append('取消訴訟の出訴期間を3ヶ月としているが、現行法では6か月')
        suspects.append(s)

    if "被告適格" in section:
        if "行政庁を被告" in exp and "旧" not in exp and "改正前" not in exp and "従来" not in exp and "11条2項" not in exp and "所属しない" not in exp:
            s = _make_suspect(b, page)
            s.suspectFlags.append("outdated_law")
            s.severity = "medium"
            s.reasons.append('現行法では被告は国/公共団体だが、行政庁を被告とする旧法ベースの記述の可能性')
            suspects.append(s)

    if "審査請求" in section and "60日" in exp:
        s = _make_suspect(b, page)
        s.suspectFlags.append("outdated_law")
        s.severity = "high"
        s.reasons.append('審査請求期間を60日としているが、現行行審法では3か月（18条1項）')
        suspects.append(s)

    return suspects


def check_text_explanation_conflict(b: dict, page: str) -> list[Suspect]:
    """D. questionText と explanation の文言逆転（義務 vs 任意など）"""
    suspects = []
    q = b.get("questionText", "")
    exp = b.get("explanationText", "")
    ans = b.get("answerBoolean")
    if not q or not exp:
        return suspects

    # 否定形チェック: 「〜ない。」は「なければならない。」の末尾にもマッチするため、
    # 義務表現の末尾を除外した上で否定語を検索する
    obligation_pattern = re.search(r'[かさたなまらわ]なければならない', q)
    q_without_obligation = re.sub(r'[かさたなまらわ]なければならない', '', q) if obligation_pattern else q
    has_negation = any(neg in q_without_obligation for neg in ["ではない", "ない。", "できない", "必ずしも"])
    if obligation_pattern and ans is True and not has_negation:
        if "できるにすぎない" in exp or "する必要はない" in exp or "義務ではない" in exp or "聞く必要はない" in exp or "必要がない" in exp:
            s = _make_suspect(b, page)
            s.suspectFlags.append("text_explanation_conflict")
            s.severity = "high"
            s.reasons.append('問題文が義務を主張(○)なのに explanation が任意と説明')
            suspects.append(s)

    if re.search(r'することができる[。」]', q) and ans is True:
        if "しなければならない" in exp and "できる" not in exp and "送付" not in exp:
            s = _make_suspect(b, page)
            s.suspectFlags.append("text_explanation_conflict")
            s.severity = "medium"
            s.reasons.append('問題文が「できる」(任意)と主張なのに explanation が義務的に説明')
            suspects.append(s)

    return suspects


def check_topic_confusion(b: dict, page: str) -> list[Suspect]:
    """E. 類似論点混同系"""
    suspects = []
    exp = b.get("explanationText", "")
    q = b.get("questionText", "")

    bogus_articles = [
        (r"11条\d+号", "行訴法11条に号は存在しない（項のみ）"),
        (r"11条[4-9]号", "行訴法11条に4号以降は存在しない"),
        (r"11条8号", "行訴法11条8号は存在しない"),
    ]
    for pattern, reason in bogus_articles:
        if re.search(pattern, exp) or re.search(pattern, q):
            s = _make_suspect(b, page)
            s.suspectFlags.append("topic_confusion")
            s.severity = "critical"
            s.reasons.append(f'存在しない条文番号: {reason}')
            suspects.append(s)

    if "第三者" in q:
        if "33条" in exp and "32条" not in exp:
            s = _make_suspect(b, page)
            s.suspectFlags.append("topic_confusion")
            s.severity = "medium"
            s.reasons.append('第三者効(32条)の問題に拘束力(33条)を引用している可能性')
            suspects.append(s)

    return suspects


def check_explanation_risk(b: dict, page: str) -> list[Suspect]:
    """F. 解説危険度高"""
    suspects = []
    exp = b.get("explanationText", "")
    if not exp:
        return suspects

    if len(exp) < 30:
        s = _make_suspect(b, page)
        s.suspectFlags.append("explanation_risk")
        s.severity = "low"
        s.reasons.append(f'解説が短すぎる（{len(exp)}文字）。学習者が十分理解できない可能性')
        suspects.append(s)

    if "原本照合待ち" in exp:
        s = _make_suspect(b, page)
        s.suspectFlags.append("explanation_risk")
        s.severity = "high"
        s.reasons.append('「原本照合待ち」マーカーが残っている。未確定データ')
        suspects.append(s)

    if "原則として審査請求前置主義" in exp and "誤り" not in exp:
        s = _make_suspect(b, page)
        s.suspectFlags.append("explanation_risk")
        s.severity = "high"
        s.reasons.append('審査請求前置主義を原則としているが、現行法では自由選択主義が原則（行訴法8条1項）')
        suspects.append(s)

    return suspects


def check_ocr_broken(b: dict, page: str) -> list[Suspect]:
    """OCR崩壊の疑い"""
    suspects = []
    q = b.get("questionText", "")

    if not q or len(q) < 15:
        s = _make_suspect(b, page)
        s.suspectFlags.append("ocr_broken")
        s.severity = "high"
        s.reasons.append(f'問題文が短すぎる（{len(q)}文字）。OCR崩壊の可能性')
        suspects.append(s)

    if q and len(q) > 20:
        if re.search(r'[のがはをにでとも]{4,}', q):
            s = _make_suspect(b, page)
            s.suspectFlags.append("ocr_broken")
            s.severity = "medium"
            s.reasons.append('問題文に助詞の異常連続があり、OCR崩壊の疑い')
            suspects.append(s)

    return suspects


# ────────────────────────────────────────────────────────
# ヘルパー
# ────────────────────────────────────────────────────────

def _make_suspect(b: dict, page: str) -> Suspect:
    return Suspect(
        page=page,
        seqNo=b.get("seqNo", 0),
        problemId=f"KB2025-p{page}-q{b.get('seqNo', 0):02d}",
        subject=b.get("subjectCandidate", ""),
        chapter=b.get("chapterCandidate", ""),
        section=b.get("sectionTitle", ""),
        questionText=b.get("questionText", ""),
        answerBoolean=b.get("answerBoolean", False),
        explanationText=b.get("explanationText", ""),
    )


def merge_suspects(suspects: list[Suspect]) -> list[Suspect]:
    """同一問題の suspect をマージ"""
    merged = {}
    for s in suspects:
        key = f"{s.page}-{s.seqNo}"
        if key not in merged:
            merged[key] = s
        else:
            existing = merged[key]
            existing.suspectFlags.extend(s.suspectFlags)
            existing.reasons.extend(s.reasons)
            severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
            if severity_order.get(s.severity, 3) < severity_order.get(existing.severity, 3):
                existing.severity = s.severity
            if s.autoFixable:
                existing.autoFixable = True
            if s.proposedFix and not existing.proposedFix:
                existing.proposedFix = s.proposedFix
    return list(merged.values())


def classify_explanation_priority(s: Suspect) -> str:
    """explanation_risk を P1/P2/P3 に分類"""
    exp = s.explanationText
    if len(exp) < 15:
        return "P1"
    if not any(w in exp for w in ["ため", "から", "により", "に基づ", "条"]):
        return "P2"
    return "P3"


LEGAL_FLAGS = frozenset([
    "answer_explanation_mismatch", "conclusion_reversal", "outdated_law",
    "text_explanation_conflict", "topic_confusion",
])


def is_legal_suspect(s: Suspect) -> bool:
    return bool(set(s.suspectFlags) & LEGAL_FLAGS)


def is_ocr_suspect(s: Suspect) -> bool:
    return "ocr_broken" in s.suspectFlags


def is_explanation_suspect(s: Suspect) -> bool:
    return "explanation_risk" in s.suspectFlags


def is_structural_suspect(s: Suspect) -> bool:
    return bool(set(s.suspectFlags) & STRUCTURAL_FLAGS)


# ────────────────────────────────────────────────────────
# 構造化監査: 論点ベースのチェック
# ────────────────────────────────────────────────────────

STRUCTURAL_FLAGS = frozenset([
    "topic_missing_required_element",
    "topic_contains_reversed_element",
    "topic_explanation_off_target",
    "topic_wrong_article_reference",
])

_topic_expectations_cache = None

def _load_topic_expectations():
    global _topic_expectations_cache
    if _topic_expectations_cache is not None:
        return _topic_expectations_cache
    path = ROOT / "data" / "topic_expectations.json"
    if not path.exists():
        _topic_expectations_cache = []
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    _topic_expectations_cache = data.get("topics", [])
    return _topic_expectations_cache


def infer_topic_tag(b: dict) -> list[dict]:
    """問題の questionText/explanationText/sectionTitle から該当する論点タグを推定"""
    topics = _load_topic_expectations()
    q = b.get("questionText", "")
    exp = b.get("explanationText", "")
    section = b.get("sectionTitle", "")
    chapter = b.get("chapterCandidate", "")
    combined = q + " " + exp

    matched = []
    for topic in topics:
        # Chapter must match
        if topic["chapter"] != chapter:
            continue

        # Section match (any of the listed sections)
        section_match = any(s in section for s in topic.get("sections", []))

        # Keyword match (any keyword present in question or explanation)
        keyword_match = any(kw in combined for kw in topic.get("match_keywords", []))

        if section_match and keyword_match:
            matched.append(topic)
        elif keyword_match and not topic.get("sections"):
            matched.append(topic)

    return matched


def check_structural(b: dict, page: str) -> list[Suspect]:
    """構造化監査: 論点期待値に基づくチェック"""
    suspects = []
    matched_topics = infer_topic_tag(b)

    if not matched_topics:
        return suspects

    exp = b.get("explanationText", "")
    q = b.get("questionText", "")

    for topic in matched_topics:
        topic_id = topic["id"]
        topic_label = topic["label"]

        # 1. 必須要素チェック
        required = topic.get("required_elements", [])
        missing = [elem for elem in required if elem not in exp]
        if missing:
            s = _make_suspect(b, page)
            s.suspectFlags.append("topic_missing_required_element")
            s.severity = "medium"
            s.reasons.append(
                f'論点[{topic_label}]: explanation に必須要素が欠落: {", ".join(missing)}'
            )
            s.priority = "P1"
            suspects.append(s)

        # 2. 逆転ワードチェック
        reversed_elems = topic.get("reversed_elements", [])
        found_reversed = [elem for elem in reversed_elems if elem in exp]
        if found_reversed:
            s = _make_suspect(b, page)
            s.suspectFlags.append("topic_contains_reversed_element")
            s.severity = "high"
            s.reasons.append(
                f'論点[{topic_label}]: explanation に逆転ワード: {", ".join(found_reversed)}'
            )
            suspects.append(s)

        # 3. 条文番号チェック
        expected_articles = topic.get("expected_articles", [])
        forbidden_articles = topic.get("forbidden_articles", [])

        for art in forbidden_articles:
            if art in exp:
                s = _make_suspect(b, page)
                s.suspectFlags.append("topic_wrong_article_reference")
                s.severity = "high"
                s.reasons.append(
                    f'論点[{topic_label}]: 禁止条文 {art} が explanation に含まれている'
                )
                suspects.append(s)

    return suspects


# ────────────────────────────────────────────────────────
# メイン監査
# ────────────────────────────────────────────────────────

ALL_CHECKS = [
    check_answer_explanation_mismatch,
    check_conclusion_reversal,
    check_outdated_law,
    check_text_explanation_conflict,
    check_topic_confusion,
    check_explanation_risk,
    check_ocr_broken,
    check_structural,
]


def run_audit(chapter_filter: Optional[str] = None, summary_granularity: str = "chapter"):
    with open(DATA_PATH, "r") as f:
        data = json.load(f)

    suffix = make_file_suffix(chapter_filter)

    pages = data.get("pages", [])
    all_suspects = []
    stats = {"total_problems": 0, "total_suspects": 0, "by_severity": {}, "by_flag": {}}

    for page_obj in pages:
        page_no = page_obj.get("sourcePage", "")
        for branch in page_obj.get("branches", []):
            # --chapter フィルタ
            if chapter_filter:
                sec = branch.get("sectionTitle", "")
                ch = branch.get("chapterCandidate", "")
                if chapter_filter not in sec and chapter_filter not in ch:
                    continue

            stats["total_problems"] += 1
            for check_fn in ALL_CHECKS:
                suspects = check_fn(branch, page_no)
                all_suspects.extend(suspects)

    # マージ
    all_suspects = merge_suspects(all_suspects)

    # explanation_quality に priority を付与
    for s in all_suspects:
        if is_explanation_suspect(s):
            s.priority = classify_explanation_priority(s)

    stats["total_suspects"] = len(all_suspects)

    # 集計
    for s in all_suspects:
        stats["by_severity"][s.severity] = stats["by_severity"].get(s.severity, 0) + 1
        for flag in s.suspectFlags:
            stats["by_flag"][flag] = stats["by_flag"].get(flag, 0) + 1

    # ソート
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    all_suspects.sort(key=lambda s: (severity_order.get(s.severity, 3), s.page, s.seqNo))

    os.makedirs(OUT_DIR, exist_ok=True)

    # ── 出力: legal_audit_report.csv（OCR除外）──
    legal_suspects = [s for s in all_suspects if is_legal_suspect(s)]
    report_path = OUT_DIR / f"legal_audit_report{suffix}.csv"
    _write_suspect_csv(report_path, legal_suspects, include_fix=True)

    # ── 出力: audit_ocr_suspect.csv（OCRのみ）──
    ocr_suspects = [s for s in all_suspects if is_ocr_suspect(s)]
    ocr_path = OUT_DIR / f"audit_ocr_suspect{suffix}.csv"
    _write_suspect_csv(ocr_path, ocr_suspects)

    # ── 出力: audit_explanation_quality.csv（priority付き）──
    exp_suspects = [s for s in all_suspects if is_explanation_suspect(s)]
    exp_path = OUT_DIR / f"audit_explanation_quality{suffix}.csv"
    with open(exp_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "page", "seqNo", "problemId", "subject", "chapter", "section",
            "severity", "priority", "suspectFlags", "reasons",
            "questionText", "explanationText",
        ])
        for s in exp_suspects:
            writer.writerow([
                s.page, s.seqNo, s.problemId, s.subject, s.chapter, s.section,
                s.severity, s.priority, "|".join(s.suspectFlags), " / ".join(s.reasons),
                s.questionText[:100], s.explanationText[:150],
            ])

    # ── 出力: audit_structural.csv（構造化監査結果）──
    structural_suspects = [s for s in all_suspects if is_structural_suspect(s)]
    struct_path = OUT_DIR / f"audit_structural{suffix}.csv"
    with open(struct_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "page", "seqNo", "problemId", "subject", "chapter", "section",
            "severity", "priority", "suspectFlags", "reasons",
            "questionText", "explanationText",
        ])
        for s in structural_suspects:
            writer.writerow([
                s.page, s.seqNo, s.problemId, s.subject, s.chapter, s.section,
                s.severity, s.priority, "|".join(s.suspectFlags), " / ".join(s.reasons),
                s.questionText[:100], s.explanationText[:150],
            ])

    # ── 出力: 自動修正候補 JSON ──
    autofix = [asdict(s) for s in all_suspects if s.autoFixable]
    autofix_path = OUT_DIR / f"legal_autofix_candidates{suffix}.json"
    with open(autofix_path, "w", encoding="utf-8") as f:
        json.dump(autofix, f, ensure_ascii=False, indent=2)

    # ── 出力: 人間レビュー CSV ──
    manual = [s for s in all_suspects if not s.autoFixable and is_legal_suspect(s)]
    manual_path = OUT_DIR / f"legal_manual_review_queue{suffix}.csv"
    _write_suspect_csv(manual_path, manual)

    # ── 章別サマリー ──
    summary_rows = build_chapter_summary(data, all_suspects, chapter_filter, summary_granularity, suffix)

    # ── コンソール出力 ──
    _print_audit_summary(stats, legal_suspects, ocr_suspects, exp_suspects, structural_suspects, autofix, manual, suffix)

    return all_suspects, stats, data, summary_rows


def _write_suspect_csv(path: Path, suspects: list[Suspect], include_fix: bool = False):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        cols = [
            "page", "seqNo", "problemId", "subject", "chapter", "section",
            "answerBoolean", "severity", "suspectFlags", "reasons",
        ]
        if include_fix:
            cols += ["proposedFix", "autoFixable"]
        cols += ["questionText", "explanationText"]
        writer.writerow(cols)
        for s in suspects:
            row = [
                s.page, s.seqNo, s.problemId, s.subject, s.chapter, s.section,
                s.answerBoolean, s.severity,
                "|".join(s.suspectFlags), " / ".join(s.reasons),
            ]
            if include_fix:
                row += [s.proposedFix, s.autoFixable]
            row += [s.questionText[:100], s.explanationText[:150]]
            writer.writerow(row)


def _print_audit_summary(stats, legal_suspects, ocr_suspects, exp_suspects, structural_suspects, autofix, manual, suffix):
    scope = "全件" if not suffix else f"対象: {suffix[1:]}"
    print("=" * 60)
    print(f"法学問題データ横断監査レポート v4.1 [{scope}]")
    print("=" * 60)
    print(f"総問題数: {stats['total_problems']}")
    print(f"suspect 検出数: {stats['total_suspects']}")
    print()
    print("■ severity 別:")
    for sev in ["critical", "high", "medium", "low"]:
        count = stats["by_severity"].get(sev, 0)
        if count > 0:
            print(f"  {sev}: {count}")
    print()
    print("■ レイヤー別:")
    print(f"  legal_inconsistency:  {len(legal_suspects)}")
    print(f"  structural_audit:     {len(structural_suspects)}")
    print(f"  explanation_quality:   {len(exp_suspects)}")
    print(f"  ocr_suspect:          {len(ocr_suspects)}")
    print()
    print(f"■ 自動修正候補: {len(autofix)} 件")
    print(f"■ 人間レビュー必須: {len(manual)} 件")

    criticals = [s for s in legal_suspects if s.severity == "critical"]
    if criticals:
        print()
        print("=" * 60)
        print("⚠ CRITICAL suspects:")
        print("=" * 60)
        for s in criticals:
            print(f"  {s.problemId} [{s.section}]")
            for r in s.reasons:
                print(f"    → {r}")
            print()


# ────────────────────────────────────────────────────────
# 章別サマリー
# ────────────────────────────────────────────────────────

def _get_group_key(branch: dict, granularity: str) -> str:
    if granularity == "subject":
        return branch.get("subjectCandidate", "?")
    elif granularity == "section":
        return branch.get("sectionTitle", "?")
    else:  # chapter
        return branch.get("chapterCandidate", "?")


def _get_suspect_group_key(s: Suspect, granularity: str) -> str:
    if granularity == "subject":
        return s.subject
    elif granularity == "section":
        return s.section
    else:
        return s.chapter


def build_chapter_summary(
    data: dict,
    all_suspects: list[Suspect],
    chapter_filter: Optional[str] = None,
    granularity: str = "chapter",
    suffix: str = "",
):
    """章/セクション/科目ごとの品質サマリーを生成"""

    group_counts = defaultdict(lambda: {"total": 0, "subject": "", "chapter": ""})
    for p in data.get("pages", []):
        for b in p.get("branches", []):
            if chapter_filter:
                sec = b.get("sectionTitle", "")
                ch = b.get("chapterCandidate", "")
                if chapter_filter not in sec and chapter_filter not in ch:
                    continue

            key = _get_group_key(b, granularity)
            group_counts[key]["total"] += 1
            group_counts[key]["subject"] = b.get("subjectCandidate", "")
            group_counts[key]["chapter"] = b.get("chapterCandidate", "")

    group_suspects = defaultdict(list)
    for s in all_suspects:
        key = _get_suspect_group_key(s, granularity)
        group_suspects[key].append(s)

    rows = []
    for grp in sorted(group_counts.keys()):
        info = group_counts[grp]
        suspects = group_suspects.get(grp, [])

        critical = sum(1 for s in suspects if s.severity == "critical")
        legal = sum(1 for s in suspects if is_legal_suspect(s))
        ocr = sum(1 for s in suspects if is_ocr_suspect(s))

        quality_suspects = [s for s in suspects if is_explanation_suspect(s)]
        p1 = sum(1 for s in quality_suspects if classify_explanation_priority(s) == "P1")
        p2 = sum(1 for s in quality_suspects if classify_explanation_priority(s) == "P2")
        p3 = sum(1 for s in quality_suspects if classify_explanation_priority(s) == "P3")

        structural = sum(1 for s in suspects if is_structural_suspect(s))
        struct_missing = sum(1 for s in suspects if "topic_missing_required_element" in s.suspectFlags)
        struct_reversed = sum(1 for s in suspects if "topic_contains_reversed_element" in s.suspectFlags)

        # 完了判定（OCRは別レーン → release_statusに影響しない）
        if critical > 0:
            status = "出荷不可"
        elif legal > 0:
            status = "要レビュー"
        elif struct_reversed > 0:
            status = "要レビュー"
        elif p1 > 0:
            status = "要レビュー"
        elif struct_missing > 0:
            status = "要確認"
        else:
            status = "OK"

        rows.append({
            "subject": info["subject"],
            "chapter": info["chapter"],
            "group": grp,
            "total_questions": info["total"],
            "critical_count": critical,
            "legal_inconsistency_count": legal,
            "structural_issue_count": structural,
            "explanation_p1_count": p1,
            "explanation_p2_count": p2,
            "explanation_p3_count": p3,
            "ocr_suspect_count": ocr,
            "release_status": status,
        })

    # CSV 出力
    summary_path = OUT_DIR / f"chapter_audit_summary{suffix}.csv"
    fieldnames = [
        "subject", "chapter", "group", "total_questions",
        "critical_count", "legal_inconsistency_count", "structural_issue_count",
        "explanation_p1_count", "explanation_p2_count", "explanation_p3_count",
        "ocr_suspect_count", "release_status",
    ]
    with open(summary_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # コンソール表示
    label = {"chapter": "章", "section": "セクション", "subject": "科目"}[granularity]
    print()
    print("=" * 100)
    print(f"{label}別サマリー")
    print("=" * 100)
    print(f"{'グループ':42s} {'問題':>4s} {'crit':>4s} {'legal':>5s} {'構造':>4s} {'P1':>3s} {'P2':>3s} {'P3':>3s} {'OCR':>4s} {'判定':>8s}")
    print("-" * 110)

    ok_count = 0
    review_count = 0
    blocked_count = 0
    check_count = 0
    for r in rows:
        status_mark = {"OK": "✓", "要レビュー": "△", "出荷不可": "✗", "要確認": "○"}[r["release_status"]]
        print(f"{r['group']:42s} {r['total_questions']:4d} {r['critical_count']:4d} {r['legal_inconsistency_count']:5d} {r['structural_issue_count']:4d} {r['explanation_p1_count']:3d} {r['explanation_p2_count']:3d} {r['explanation_p3_count']:3d} {r['ocr_suspect_count']:4d} {status_mark} {r['release_status']}")
        if r["release_status"] == "OK":
            ok_count += 1
        elif r["release_status"] == "要確認":
            check_count += 1
        elif r["release_status"] == "要レビュー":
            review_count += 1
        else:
            blocked_count += 1

    print("-" * 110)
    print(f"合計: {len(rows)} {label} | OK: {ok_count} | 要確認: {check_count} | 要レビュー: {review_count} | 出荷不可: {blocked_count}")
    print(f"出力: {summary_path}")

    return rows


# ────────────────────────────────────────────────────────
# ゴールデンテスト: 既知バグの再発防止
# ────────────────────────────────────────────────────────

GOLDEN_TESTS = [
    # ── 行政事件訴訟法 ──
    {
        "name": "行訴法24条: 職権証拠調べ後の意見聴取義務",
        "chapter": "gyosei-jiken",
        "check": lambda data: _find_branch(data, "138", 5),
        "assert_answer": True,
        "assert_exp_contains": "意見をきかなければならない",
        "assert_exp_not_contains": "聞く必要はない",
    },
    {
        "name": "行訴法14条: 取消訴訟の出訴期間は6か月",
        "chapter": "gyosei-jiken",
        "check": lambda data: _find_branch(data, "135", 2),
        "assert_answer": True,
        "assert_exp_contains": "6か月",
        "assert_exp_not_contains": "3か月",
    },
    {
        "name": "行訴法32条: 取消判決の第三者効",
        "chapter": "gyosei-jiken",
        "check": lambda data: _find_branch(data, "138", 2),
        "assert_answer": True,
        "assert_exp_contains": "32条",
        "assert_exp_not_contains": "第三者に対しては効力を持たない",
    },
    # ── 行政手続法 ──
    {
        "name": "行手法: 聴聞は不利益処分のうち重大なもの",
        "chapter": "gyosei-tetsuzuki",
        "check": lambda data: _find_branch_by_keyword(data, "聴聞", "聴聞"),
        "assert_exp_contains": "聴聞",
    },
    {
        "name": "行手法: 理由提示は書面で行う",
        "chapter": "gyosei-tetsuzuki",
        "check": lambda data: _find_branch_by_keyword(data, "理由", "理由"),
        "assert_exp_contains": "理由",
    },
    # ── 行政不服審査法 ──
    {
        "name": "行審法18条: 審査請求期間は3か月",
        "chapter": "gyosei-fufuku",
        "check": lambda data: _find_branch_by_keyword(data, "審査請求", "審査請求期間"),
        "assert_exp_not_contains": "60日",
    },
    {
        "name": "行審法: 教示の効果",
        "chapter": "gyosei-fufuku",
        "check": lambda data: _find_branch_by_keyword(data, "教示", "教示"),
        "assert_exp_contains": "教示",
    },
    # ── 国家賠償法 ──
    {
        "name": "国賠法1条: 公権力の行使",
        "chapter": "gyosei-kokubai",
        "check": lambda data: _find_branch_by_keyword(data, "公権力の行使", "国家賠償"),
        "assert_exp_contains": "公権力",
    },
]


def _find_branch(data: dict, page: str, seq: int):
    for p in data.get("pages", []):
        if p.get("sourcePage") == page:
            for b in p.get("branches", []):
                if b.get("seqNo") == seq:
                    return b
    return None


def _find_branch_by_keyword(data: dict, keyword: str, section: str):
    for p in data.get("pages", []):
        for b in p.get("branches", []):
            if keyword in b.get("questionText", "") and section in b.get("sectionTitle", ""):
                return b
    return None


def run_golden_tests(chapter_filter: Optional[str] = None):
    with open(DATA_PATH, "r") as f:
        data = json.load(f)

    tests = GOLDEN_TESTS
    if chapter_filter:
        tests = [t for t in tests if chapter_filter in t.get("chapter", "") or chapter_filter in t.get("name", "")]

    if not tests:
        print(f"対象章 '{chapter_filter}' に該当するゴールデンテストがありません")
        return True

    print("=" * 60)
    print(f"ゴールデンテスト（既知バグ再発防止）{f' [{chapter_filter}]' if chapter_filter else ''}")
    print("=" * 60)

    passed = 0
    failed = 0
    skipped = 0
    for test in tests:
        branch = test["check"](data)
        errors = []
        if branch is None:
            # データが存在しない章（未整備）はスキップ
            print(f"  - SKIP: {test['name']} (対象データなし)")
            skipped += 1
            continue

        if "assert_answer" in test and branch.get("answerBoolean") != test["assert_answer"]:
            errors.append(f'answerBoolean={branch["answerBoolean"]}、期待={test["assert_answer"]}')
        exp = branch.get("explanationText", "")
        if "assert_exp_contains" in test and test["assert_exp_contains"] not in exp:
            errors.append(f'explanation に「{test["assert_exp_contains"]}」が含まれていない')
        if "assert_exp_not_contains" in test and test["assert_exp_not_contains"] in exp:
            errors.append(f'explanation に危険語「{test["assert_exp_not_contains"]}」が残っている')

        if errors:
            print(f"  ✗ FAIL: {test['name']}")
            for e in errors:
                print(f"      {e}")
            failed += 1
        else:
            print(f"  ✓ PASS: {test['name']}")
            passed += 1

    print()
    print(f"結果: {passed} passed, {failed} failed, {skipped} skipped")
    return failed == 0


# ────────────────────────────────────────────────────────
# エントリポイント
# ────────────────────────────────────────────────────────

if __name__ == "__main__":
    args = parse_args()

    if args["golden_only"]:
        ok = run_golden_tests(chapter_filter=args["chapter"])
        sys.exit(0 if ok else 1)
    else:
        all_suspects, stats, data, summary = run_audit(
            chapter_filter=args["chapter"],
            summary_granularity=args["summary_granularity"],
        )
        print()
        run_golden_tests(chapter_filter=args["chapter"])
