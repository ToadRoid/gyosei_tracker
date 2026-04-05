# 構造化監査 設計ドキュメント

## なぜ人間レビュー前提を避けたいのか

人間レビューには以下の限界がある:
- スケールしない（1,359問 × 人間確認 = 非現実的）
- 章追加のたびに同じ確認作業が発生する
- レビュアーの知識・集中力に依存する
- 結果が属人的で再現性がない

したがって、**機械的に止められる範囲を最大化**し、人間確認は「機械で止められない類型」に限定する。

## どこまで自動保証を狙うか

### 自動で止められること（現行 v4.1）

| 類型 | 手法 | 信頼性 |
|------|------|--------|
| answerBoolean と結論フレーズの矛盾 | フレーズマッチ | 高 |
| 旧法混入（出訴期間/審査請求期間/被告適格） | キーワード+セクション | 高 |
| 義務/任意の逆転 | 動詞活用パターンマッチ | 中 |
| 存在しない条文番号 | 正規表現 | 限定的 |
| 短すぎる解説（文字数） | 数値比較 | 高 |
| OCR崩壊 | 文字数+助詞パターン | 中 |
| **NEW: 論点ごとの必須要素欠落** | 論点タグ推定+期待値照合 | 中〜高 |
| **NEW: 逆転ワード混入** | 論点別禁止ワード照合 | 高 |

### まだ自動で止められないこと

| 類型 | 理由 | 対応方針 |
|------|------|---------|
| explanation の法的正確性 | 内容理解が必要 | LLM二段目審査（将来） |
| 論点のすり替え（正しそうだが別の話） | 論点推定の精度限界 | 期待値テーブル拡充 |
| 判例の趣旨取り違え | 法学知識が必要 | LLM二段目審査（将来） |
| 未登録の旧法改正 | ルール追加が必要 | 新法改正情報の継続収集 |
| 原本との不一致 | テキストだけでは検証不能 | OCR再確認 |

## 構造化監査のアーキテクチャ

```
問題データ (reviewed_import.json)
    ↓
[1] 既存ルールベース監査（v4）
    ├─ critical: 正誤逆転、条文逆転
    ├─ legal: 旧法混入、義務/任意逆転
    ├─ explanation: 文字数、マーカー残存
    └─ ocr: 文字数、助詞パターン
    ↓
[2] 構造化監査（v4.1 NEW）
    ├─ topic_tag 推定（sectionTitle + keyword マッチ）
    ├─ 必須要素チェック（topic_expectations.json）
    ├─ 逆転ワードチェック
    └─ 条文番号チェック
    ↓
[3] LLM二段目審査（将来）
    ├─ 入力: 構造化監査で高リスク判定された問題
    ├─ 検証: 論点妥当性、answerBoolean妥当性、explanation妥当性
    └─ 出力: approve / flag / reject
    ↓
章別サマリー → release_status 判定
```

## 論点期待値テーブル（topic_expectations.json）

### 構造

```json
{
  "id": "jiken_filing_period",
  "label": "取消訴訟の出訴期間",
  "chapter": "gyosei-jiken",
  "sections": ["04_被告適格・管轄・出訴期間"],
  "match_keywords": ["出訴期間", "14条"],
  "required_elements": ["6か月"],
  "reversed_elements": ["3か月", "3ヶ月"],
  "expected_articles": ["14条"],
  "forbidden_articles": []
}
```

### 推定ロジック

1. `chapterCandidate` が一致
2. `sectionTitle` が `sections` のいずれかに部分一致
3. `questionText + explanationText` に `match_keywords` のいずれかが含まれる
4. 2 AND 3 が同時に成立 → 論点タグを付与

### 現在のカバレッジ

| 章 | 論点数 | カバー範囲 |
|---|---|---|
| 行政事件訴訟法 | 10 | 出訴期間、職権証拠調べ、第三者効、拘束力、自由選択主義、原告適格、処分性、被告適格、執行停止、訴訟参加 |
| 行政不服審査法 | 5 | 審査請求期間、不作為審査請求、教示制度、審理員、執行停止 |
| 行政手続法 | 4 | 聴聞/弁明、理由提示、不利益処分、行政指導 |
| **合計** | **19論点** | 優先3章の主要論点をカバー |

## release_status 判定基準

| 条件 | ステータス |
|------|----------|
| critical > 0 | 出荷不可 |
| legal_inconsistency > 0 | 要レビュー |
| topic_contains_reversed_element > 0 | 要レビュー |
| explanation P1 > 0 | 要レビュー |
| topic_missing_required_element > 0 | 要確認 |
| それ以外 | OK |

「要確認」は「要レビュー」より軽い。必須要素欠落は explanation が短いだけの可能性もあるため、即座にブロックはしないが可視化する。

## LLM二段目審査の入力仕様（将来用）

構造化監査で high-risk 判定になった問題を LLM に渡す際の入力フォーマット:

```json
{
  "problemId": "KB2025-p135-q02",
  "questionText": "...",
  "answerBoolean": true,
  "explanationText": "...",
  "topic_tag": "jiken_filing_period",
  "expected_elements": ["6か月"],
  "missing_elements": [],
  "reversed_elements_found": [],
  "audit_flags": ["topic_missing_required_element"],
  "request": "この問題のanswerBoolean、explanationの法的正確性、論点の一致性を検証してください"
}
```

この仕様に沿って `check_fn` の出力を整形すれば、LLM を差し込める。
