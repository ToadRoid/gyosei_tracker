#!/usr/bin/env python3
"""
import_optimizer.py — 取り込みデータ言語最適化パッチ
=====================================================
reviewed_import.json に対して、これまでの修正パターンに基づく
自動品質チェックと高信頼度修正を適用する。

使い方:
  python3 scripts/import_optimizer.py                     # dry-run (修正候補のみ表示)
  python3 scripts/import_optimizer.py --apply             # 実際に修正
  python3 scripts/import_optimizer.py --apply --verbose   # 詳細ログ付き

【これまでの修正で判明したパターン】

■ カテゴリA: 解説が問題文と同じ内容を肯定している (正解は○)
   - 解説の後半が「〜できる」「〜しなければならない（条文）」等で終わる
   - 解説文字列と問題文字列の類似度が高い (sim > 0.85)
   - 典型: p135-q05 (sim=0.94), p126-q06, p138-q01

■ カテゴリB: 解説末尾が明示的に否定している (正解は×)
   - 「対象とはならない」「処分性は認められず」「できない」等が末尾にある
   - 典型: p075-q06, p127-q02

■ カテゴリC: 解説に「本肢は正しい/誤り」が明示 (最高信頼度)
   - 「本肢は正しい」→ True、「本肢は誤り」→ False
   - 典型: p138-q05, p141-q04

■ カテゴリD: OCR品質問題 (除外候補)
   - questionText が空または極端に短い (< 15文字) → ghost record
   - questionText に □□□□, 〓〓, ■■ 等 → OCR崩壊
   - explanationText に <省略> タグ → OCR欠損
   - questionText が「。」なしで途中切断 (< 30文字) → 取り込み失敗
   - questionText が穴埋め記述式 (「（　）」「□□」連続) → answerBoolean 管理不可

■ カテゴリE: 解説が問題文と全く無関係な別論点を話している (要確認)
   - 解説のキーワードと問題文のキーワードが一致しない
   - 典型: p147-q01,q03,q04 の旧データ (解説と問題文のミスマッチ)

■ カテゴリF: 解説が問題文と逆の結論を導く (高信頼度修正)
   - 解説の命題部分が問題文の主張と ≥ 0.85 類似 かつ
   - 解説に否定語なし かつ 解説末尾が肯定語 → True
   - これまでの修正20件のうち17件が False→True の誤り

信頼度レベル:
  HIGH (自動修正): カテゴリC (本肢は正しい/誤り の明示)
  MEDIUM (レポート + 確認推奨): カテゴリA,B,F (類似度/末尾パターン)
  LOW (フラグのみ): カテゴリD,E (OCR/品質問題)
"""

import json
import re
import sys
import argparse
from datetime import datetime
from pathlib import Path
from difflib import SequenceMatcher

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "reviewed_import.json"
PUBLIC_PATH = ROOT / "public" / "data" / "reviewed_import.json"
REPORT_PATH = ROOT / "data" / f"import_optimizer_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

# ─────────────────────────────────────────────────────────────
# パターン定義
# ─────────────────────────────────────────────────────────────

# 解説末尾が「正解=True」を示すパターン
TRUE_TAIL_PATTERNS = [
    r'本肢は正しい',           # 「正しく」の後に「ない」が続く可能性があるので「い」で止める
    r'本肢は[○〇]',
    r'正しい記述',
    r'正確な記述',
    r'のとおりであ',                      # 「行政事件訴訟法XX条のとおりである」
    r'ことができる[（(）)]',               # 「〜することができる（条文番号）」で終わる
    r'しなければならない[（(）)]',          # 「〜しなければならない（条文番号）」で終わる
    r'（行政[^\)]{1,30}条[^\)]{0,10}）[。\s]*$',  # 末尾が条文引用で終わる (肯定的文脈)
    r'認められる[。\s]',
    r'[）\)]$',                           # 条文番号の括弧閉じで終わる
]

# 解説末尾が「正解=False」を示すパターン
FALSE_TAIL_PATTERNS = [
    r'本肢は誤',
    r'本肢は[×✕]',
    r'本肢は正しくない',        # 「正しくない」は否定 (「正しい」とは別)
    r'正しい記述ではない',
    r'誤りである[。\s]',
    r'誤った記述',
    r'対象とはならない[。\s]',
    r'処分性は認められず',
    r'抗告訴訟の対象とはなら',
    r'取消訴訟を提起することはできない',
    r'することはできない[。\s]',
    r'認められない[。\s]',
    r'[^ない]ない[。\s]*$',               # 末尾が「〜ない。」（ただし「しなければならない」は除く）
]

# OCR崩壊シグナル
OCR_CORRUPTION_PATTERNS = [
    r'[□■〓]{2,}',                       # 連続した置換文字
    r'[\x00-\x08\x0b\x0c\x0e-\x1f]',    # 制御文字
    r'[a-zA-Z]{3,}.*[ぁ-ん]{3,}.*[a-zA-Z]{3,}',  # 英字と仮名が混在 (OCR混在)
    r'着の準備を調査した場合',             # 意味不明文 (既知: p085-q05 パターン)
    r'筆着の',                            # 既知崩壊パターン
]

# 省略タグ
OMISSION_PATTERNS = [
    r'<省略>',
    r'＜省略＞',
    r'\[省略\]',
    r'【省略】',
]

# 記述式問題シグナル (answerBoolean 管理不可)
DESCRIPTIVE_PATTERNS = [
    r'[（(][　 ]{2,}[）)]',              # （　　）穴埋め
    r'[□]{3,}',                         # □□□□
    r'[＿]{3,}',                        # ＿＿＿
    r'次の文章の空欄に',
    r'（ア）.*（イ）.*（ウ）',            # アイウ穴埋め形式
]

# 解説が別論点を話しているシグナル (セクション不整合)
SECTION_MISMATCH_KEYWORDS = {
    '取消訴訟': ['取消訴訟', '取消しの訴え', '行政事件訴訟法3条2項'],
    '義務付け訴訟': ['義務付け', '行政事件訴訟法37条の'],
    '差止め訴訟': ['差止め', '行政事件訴訟法37条の4'],
    '不作為の違法確認': ['不作為の違法確認', '行政事件訴訟法3条5項'],
    '聴聞': ['聴聞', '行政手続法13条', '行政手続法15条'],
    '弁明': ['弁明', '行政手続法29条'],
    '審査請求': ['審査請求', '行政不服審査法'],
    '執行停止': ['執行停止', '行政事件訴訟法25条'],
}


# ─────────────────────────────────────────────────────────────
# ユーティリティ
# ─────────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    """句読点・空白・括弧を除去して比較用に正規化"""
    return re.sub(r'[\s　。、・「」『』（）()【】\[\]…、，]', '', text)


def similarity(a: str, b: str) -> float:
    """正規化後の文字列類似度 (0〜1)"""
    na, nb = normalize(a), normalize(b)
    if not na or not nb:
        return 0.0
    return SequenceMatcher(None, na, nb).ratio()


def explanation_direction(explanation: str) -> tuple[str, float]:
    """
    解説テキストから正解方向を推定。
    Returns: ('true' | 'false' | 'ambiguous', confidence)
    """
    if not explanation:
        return 'ambiguous', 0.0

    tail = explanation[-120:] if len(explanation) > 120 else explanation
    full = explanation  # 全文スキャン用

    # カテゴリC: 明示的な正誤宣言 — 全文スキャン (最高信頼度)
    # 「本肢は正しい」が「本肢は正しくない」を誤検出しないよう [^く] を使用
    if re.search(r'本肢は正しい[^く]|本肢は正しい$|本肢は[○〇]|正しい記述である', full):
        return 'true', 0.95
    if re.search(r'本肢は誤|本肢は[×✕]|誤りである|誤った記述'
                 r'|本肢は正しくない|正しい記述ではない', full):
        return 'false', 0.95

    # カテゴリA/B: 末尾パターン
    true_score = sum(1 for p in TRUE_TAIL_PATTERNS if re.search(p, tail))
    false_score = sum(1 for p in FALSE_TAIL_PATTERNS if re.search(p, tail))

    # 「〜なければならない」は否定語「ない」を含むが TRUE シグナル (義務規定)
    # → false パターンから差し引く
    if re.search(r'なければならない', tail):
        false_score = max(0, false_score - 2)

    if true_score > false_score:
        conf = min(0.6 + 0.1 * (true_score - false_score), 0.85)
        return 'true', conf
    elif false_score > true_score:
        conf = min(0.6 + 0.1 * (false_score - true_score), 0.85)
        return 'false', conf

    return 'ambiguous', 0.3


def check_ocr_quality(question_text: str, explanation_text: str) -> list[str]:
    """OCR品質問題を検出。問題リストを返す"""
    issues = []

    if not question_text or len(question_text.strip()) == 0:
        issues.append('EMPTY_QUESTION')
        return issues

    if len(question_text.strip()) < 15:
        issues.append('TOO_SHORT_QUESTION')

    for pat in OCR_CORRUPTION_PATTERNS:
        if re.search(pat, question_text):
            issues.append('OCR_CORRUPTION_QUESTION')
            break

    for pat in OMISSION_PATTERNS:
        if re.search(pat, explanation_text):
            issues.append('EXPLANATION_TRUNCATED')
            break

    for pat in DESCRIPTIVE_PATTERNS:
        if re.search(pat, question_text):
            issues.append('DESCRIPTIVE_QUESTION')
            break

    # 途中切断: 問題文が30文字以上あるのに「。」で終わっていない
    # かつ文が完結していない感じ
    if (len(question_text) > 30
            and not question_text.rstrip().endswith('。')
            and not question_text.rstrip().endswith('ない。')
            and question_text.count('。') == 0):
        issues.append('QUESTION_TRUNCATED')

    return issues


def check_mismatch_risk(
    question_text: str,
    explanation_text: str,
    section_title: str,
) -> list[str]:
    """
    解説が別論点を話している疑いを検出。
    Returns: list of risk labels
    """
    risks = []
    if not explanation_text:
        return risks

    # 類似度が極端に低い (解説が問題文と全く違う話をしている)
    sim = similarity(question_text, explanation_text)
    if sim < 0.15 and len(explanation_text) > 30:
        risks.append(f'LOW_SIMILARITY:{sim:.2f}')

    return risks


# ─────────────────────────────────────────────────────────────
# メイン処理
# ─────────────────────────────────────────────────────────────

def run_optimizer(apply: bool = False, verbose: bool = False) -> dict:
    with open(DATA_PATH, encoding='utf-8') as f:
        data = json.load(f)

    total = 0
    auto_fixed = []       # HIGH信頼度: 自動修正済み
    candidates = []       # MEDIUM信頼度: 修正候補 (要確認)
    quality_flags = []    # LOW信頼度: 品質フラグ

    for page in data['pages']:
        src = page.get('sourcePage', '???')
        for br in page.get('branches', []):
            total += 1
            seq = br.get('seqNo', 0)
            pid = f"KB2025-p{str(src).zfill(3)}-q{str(seq).zfill(2)}"
            q_text = br.get('questionText', '')
            e_text = br.get('explanationText', '')
            a_bool = br.get('answerBoolean', None)
            section = br.get('sectionTitle', '')

            # ── OCR品質チェック ──
            ocr_issues = check_ocr_quality(q_text, e_text)
            if ocr_issues:
                quality_flags.append({
                    'problemId': pid,
                    'issues': ocr_issues,
                    'questionSnippet': q_text[:60],
                    'recommendation': _ocr_recommendation(ocr_issues),
                })
                if verbose:
                    print(f'[QUALITY] {pid}: {ocr_issues}')
                continue  # OCR崩壊問題は解説チェックしない

            # ── 解説方向チェック ──
            # OCR崩壊している解説は方向チェックしない
            e_has_corruption = any(
                re.search(p, e_text) for p in OCR_CORRUPTION_PATTERNS + OMISSION_PATTERNS
            )
            if e_has_corruption:
                quality_flags.append({
                    'problemId': pid,
                    'issues': ['OCR_CORRUPTION_EXPLANATION'],
                    'questionSnippet': q_text[:60],
                    'recommendation': 'NEEDS_SOURCE_CHECK',
                })
                continue

            direction, confidence = explanation_direction(e_text)
            sim = similarity(q_text, e_text)

            # カテゴリF: 解説と問題文の高類似度 (sim >= 0.85) → True 推定
            if sim >= 0.85 and direction != 'false':
                direction = 'true'
                confidence = max(confidence, 0.88)

            # 解説方向と格納値が不一致 → 修正候補
            if direction != 'ambiguous' and a_bool is not None:
                expected = direction == 'true'
                if expected != a_bool:
                    entry = {
                        'problemId': pid,
                        'storedAnswer': a_bool,
                        'suggestedAnswer': expected,
                        'confidence': round(confidence, 2),
                        'direction': direction,
                        'similarity': round(sim, 2),
                        'sectionTitle': section,
                        'questionSnippet': q_text[:60],
                        'explanationTail': e_text[-80:],
                    }

                    if confidence >= 0.90:
                        # HIGH: 自動修正
                        if apply:
                            br['answerBoolean'] = expected
                        entry['action'] = 'AUTO_FIXED' if apply else 'WOULD_AUTO_FIX'
                        auto_fixed.append(entry)
                        if verbose:
                            print(f'[AUTO_FIX] {pid}: {a_bool}→{expected} (conf={confidence:.2f})')
                    elif confidence >= 0.60:
                        # MEDIUM: 修正候補
                        entry['action'] = 'REVIEW_SUGGESTED'
                        candidates.append(entry)
                        if verbose:
                            print(f'[CANDIDATE] {pid}: {a_bool}→{expected} (conf={confidence:.2f})')

            # ── 解説-問題文ミスマッチチェック ──
            mismatch = check_mismatch_risk(q_text, e_text, section)
            if mismatch:
                quality_flags.append({
                    'problemId': pid,
                    'issues': mismatch,
                    'questionSnippet': q_text[:60],
                    'recommendation': 'NEEDS_SOURCE_CHECK',
                })

    # 修正を保存
    if apply and auto_fixed:
        with open(DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        with open(PUBLIC_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'[SAVED] {len(auto_fixed)} fixes applied to reviewed_import.json')

    report = {
        'runAt': datetime.now().isoformat(),
        'mode': 'apply' if apply else 'dry_run',
        'totalProblems': total,
        'autoFixed': auto_fixed,
        'reviewCandidates': candidates,
        'qualityFlags': quality_flags,
        'summary': {
            'auto_fixed': len(auto_fixed),
            'review_candidates': len(candidates),
            'quality_flags': len(quality_flags),
        },
    }

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f'[REPORT] Saved to {REPORT_PATH.name}')

    return report


def _ocr_recommendation(issues: list[str]) -> str:
    if 'EMPTY_QUESTION' in issues:
        return 'DISCARD'
    if 'OCR_CORRUPTION_QUESTION' in issues:
        return 'DISCARD'
    if 'DESCRIPTIVE_QUESTION' in issues:
        return 'DISCARD'
    if 'EXPLANATION_TRUNCATED' in issues:
        return 'NEEDS_SOURCE_CHECK'
    if 'QUESTION_TRUNCATED' in issues:
        return 'NEEDS_SOURCE_CHECK'
    if 'TOO_SHORT_QUESTION' in issues:
        return 'NEEDS_SOURCE_CHECK'
    return 'REVIEW'


def print_summary(report: dict):
    s = report['summary']
    mode = report['mode']
    total = report['totalProblems']
    print()
    print('=' * 55)
    print(f'Import Optimizer — {mode.upper()}')
    print(f'対象: {total} 問')
    print('─' * 55)
    print(f'  HIGH  自動修正{"済み" if mode == "apply" else "候補"}: {s["auto_fixed"]} 件')
    print(f'  MED   要確認候補:              {s["review_candidates"]} 件')
    print(f'  LOW   品質フラグ:              {s["quality_flags"]} 件')
    print('=' * 55)

    if report['autoFixed']:
        print()
        print('【自動修正】')
        for e in report['autoFixed']:
            print(f'  {e["problemId"]}: {e["storedAnswer"]}→{e["suggestedAnswer"]}'
                  f'  conf={e["confidence"]}  sim={e["similarity"]}')
            print(f'    解説末尾: …{e["explanationTail"][-50:]}')

    if report['reviewCandidates']:
        print()
        print('【要確認候補】')
        for e in report['reviewCandidates']:
            print(f'  {e["problemId"]}: {e["storedAnswer"]}→{e["suggestedAnswer"]}'
                  f'  conf={e["confidence"]}  sim={e["similarity"]}')
            print(f'    Q: {e["questionSnippet"]}')
            print(f'    E末尾: …{e["explanationTail"][-50:]}')

    if report['qualityFlags']:
        print()
        print('【品質フラグ】')
        discard = [f for f in report['qualityFlags'] if f['recommendation'] == 'DISCARD']
        check   = [f for f in report['qualityFlags'] if f['recommendation'] != 'DISCARD']
        for f in discard:
            print(f'  [DISCARD] {f["problemId"]}: {f["issues"]}')
        for f in check[:10]:  # 多すぎる場合は先頭10件のみ
        	print(f'  [CHECK]   {f["problemId"]}: {f["issues"]}')
        if len(check) > 10:
            print(f'  ... 他 {len(check)-10} 件 (レポートJSON参照)')


# ─────────────────────────────────────────────────────────────
# エントリポイント
# ─────────────────────────────────────────────────────────────

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Import optimizer: 取り込みデータ言語最適化パッチ'
    )
    parser.add_argument('--apply', action='store_true',
                        help='実際に修正を適用 (デフォルト: dry-run)')
    parser.add_argument('--verbose', '-v', action='store_true',
                        help='詳細ログを出力')
    args = parser.parse_args()

    report = run_optimizer(apply=args.apply, verbose=args.verbose)
    print_summary(report)
