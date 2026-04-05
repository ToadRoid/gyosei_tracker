# 章別監査ランブック

章追加時に品質を保証するための運用手順書。

## 完了条件

各章について、以下の基準で完了判定する。

| レイヤー | 条件 | 完了に必須 |
|---------|------|----------|
| critical | 0件 | ✅ 必須（1件でも出荷不可） |
| legal_inconsistency | 0件 | ✅ 必須 |
| explanation_quality P1 | 0件 | ✅ 必須 |
| explanation_quality P2/P3 | 件数明示 | △ 別バッチ可 |
| ocr_suspect | 件数明示 | △ 別レーン管理 |

**章完了 =「法律整合性に致命傷がなく、学習被害の大きい解説欠陥も潰れている状態」**

## 実施フロー

### Step 1: 章インポート

新規章データを取り込む。対象ファイル・対象章を明示。

### Step 2: 自動監査

```bash
# 全件監査
bash scripts/run_chapter_audit.sh

# 単章監査（新規追加した章のみ）
bash scripts/run_chapter_audit.sh "05_取消訴訟の審理"
```

### Step 3: 章サマリー確認

`data/chapter_audit_summary.csv` を確認。

- release_status = "OK" → 完了
- release_status = "要レビュー" → Step 4, 5 へ
- release_status = "出荷不可" → Step 4 必須

### Step 4: critical / legal 修正

1. critical を最優先でゼロ化
2. legal_inconsistency をゼロ化
3. 修正内容は `data/critical_review_ledger.csv` に記録
4. 修正後に再監査: `bash scripts/run_chapter_audit.sh`

### Step 5: explanation_quality の優先修正

1. P1 を章完了前に修正
2. P2/P3 は別バッチ化可（章サマリーに残件を明示）

### Step 6: 実アプリ確認（必要時）

既知事故類型や修正件数が多い章で実施。

- 表示上の問題文
- 表示上の正解
- explanation
- cleanup パッチ反映状況

### Step 7: docs / 台帳更新

- 修正内容を ledger に記録
- 新しい誤り類型があれば監査ルール + ゴールデンテストに追加
- 章サマリーを最新化

## 完了報告テンプレート

```markdown
## 章監査完了報告: [章名]

### 1. 章別サマリー
| 章 | 問題数 | critical | legal | P1 | P2 | P3 | OCR | 判定 |
|---|---|---|---|---|---|---|---|---|
| [章名] | XX | 0 | 0 | 0 | X | X | X | OK |

### 2. critical / legal 残件数
- critical: 0件
- legal_inconsistency: 0件

### 3. explanation P1 残件数
- P1: 0件

### 4. OCR件数
- ocr_suspect: X件（別管理）

### 5. 代表修正事例
- [problemId]: [修正内容]

### 6. 実アプリ確認結果
- [確認した場合のみ記載]

### 7. 変更ファイル一覧
- `data/reviewed_import.json`
- `public/data/reviewed_import.json`
- `src/lib/db.ts` (cleanup patch追加)
```

## 監査レイヤー詳細

### 1. critical

| 対象 | 例 |
|------|---|
| answerBoolean と explanation 結論の逆転 | 「本肢は正しい」なのに answerBoolean=false |
| 条文明文と真逆の explanation | 義務を任意と説明 |
| 存在しない条文番号 | 行訴法11条8号（存在しない） |

**1件でも出荷不可。**

### 2. legal_inconsistency

| 対象 | 例 |
|------|---|
| 旧法混入 | 出訴期間を3か月（旧法）としている |
| 条文番号違い | 32条と33条の混同 |
| 制度趣旨の取り違え | 自由選択主義を前置主義と説明 |

**0件になるまで要レビュー。**

### 3. explanation_quality

| 優先度 | 基準 |
|--------|------|
| P1 | 解説15文字未満、誤学習リスク大 |
| P2 | 法的根拠語（ため、条、により等）なし |
| P3 | 軽微な説明不足 |

**P1は章完了前に修正必須。**

### 4. ocr_suspect

| 対象 | 例 |
|------|---|
| 問題文15文字未満 | OCR崩壊の可能性 |
| 助詞の異常連続 | 「のがはをにで」4文字以上連続 |

**法律整合性とは別レーン管理。件数明示のみ。**

## ゴールデンテスト SKIP について

ゴールデンテストが SKIP になる場合、以下の理由が考えられる。

| 理由 | 対応 |
|------|------|
| **未整備章のデータがまだ存在しない** | その章のデータがインポートされれば自動的に PASS/FAIL に変わる。対応不要。 |
| **_find_branch_by_keyword のキーワードが問題文に含まれていない** | ゴールデンテストの check 関数を修正する。 |

現時点(2026-04-05)の SKIP:
- `行手法: 理由提示は書面で行う` — sectionTitle に「理由」を含むデータが未整備のため
- `行審法18条: 審査請求期間は3か月` — sectionTitle に「審査請求期間」を含むデータが未整備のため

いずれも**未整備章データが理由**であり、データインポート後に再実行すれば解消する。

## 章データ品質の残件

監査基盤 v4 導入時点(2026-04-05)の残件:

| 章 | 残件 | 内容 |
|---|---|---|
| `gyosei-ippan` | P1=1 | explanation が15文字未満の問題が1件。要修正。 |

この章は release_status=「要レビュー」のままであり、P1 を解消するまで章完了扱いにしない。

## コマンドリファレンス

```bash
# 全件監査（章サマリー + ゴールデンテスト付き）
bash scripts/run_chapter_audit.sh

# 単章監査
bash scripts/run_chapter_audit.sh "05_取消訴訟の審理"

# ゴールデンテストのみ
python3 scripts/audit_legal_consistency.py --golden

# セクション粒度でサマリー
python3 scripts/audit_legal_consistency.py --summary-granularity section

# 単章 + セクション粒度
python3 scripts/audit_legal_consistency.py --chapter "gyosei-jiken" --summary-granularity section
```

## 出力ファイル一覧

| ファイル | 内容 |
|---------|------|
| `data/chapter_audit_summary.csv` | 章別サマリー（全件） |
| `data/chapter_audit_summary.<slug>.csv` | 章別サマリー（単章） |
| `data/legal_audit_report.csv` | legal層の詳細（OCR除外） |
| `data/audit_ocr_suspect.csv` | OCR層のみ |
| `data/audit_explanation_quality.csv` | 解説品質（P1/P2/P3付き） |
| `data/legal_autofix_candidates.json` | 自動修正候補 |
| `data/legal_manual_review_queue.csv` | 人間レビュー必須 |
