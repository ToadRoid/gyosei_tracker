# 法学問題データクリーニング v3

## 概要

法学問題データ（reviewed_import.json）に対して、条文逆転・旧法混入・解説矛盾・正誤不整合を横断的に検出・修正・再発防止するための仕組み。

## 検出カテゴリ

| カテゴリ | 検出内容 | severity |
|---------|---------|----------|
| `answer_explanation_mismatch` | answerBoolean と explanation の結論文が逆転 | critical |
| `conclusion_reversal` | questionText の主張と explanation の結論が文言レベルで矛盾 | critical |
| `outdated_law` | 旧法ベースの数字・制度が混入（例: 出訴期間3か月、審査請求期間60日） | high |
| `text_explanation_conflict` | 義務/任意の混同（「〜しなければならない」vs「〜できるにすぎない」） | high/medium |
| `topic_confusion` | 存在しない条文番号、第三者効と拘束力の混同など | critical/medium |
| `explanation_risk` | 解説が極端に短い、原本照合待ちマーカー残存、誤学習を誘発する記述 | high/low |
| `ocr_broken` | 問題文が短すぎる、助詞の異常連続など OCR 崩壊の疑い | high/medium |

## スクリプト一覧

### `scripts/audit_legal_consistency.py`

全問題データを走査し、suspect を検出してレポートを出力する。

```bash
python3 scripts/audit_legal_consistency.py
```

出力ファイル:
- `data/legal_audit_report.csv` — 全 suspect 一覧
- `data/legal_autofix_candidates.json` — 自動修正候補
- `data/legal_manual_review_queue.csv` — 人間レビュー必須一覧

### `scripts/apply_legal_autofixes.py`

自動修正候補のうち、一義的に修正可能なもののみ適用する。

```bash
# ドライラン（デフォルト）
python3 scripts/apply_legal_autofixes.py

# 実際に適用
python3 scripts/apply_legal_autofixes.py --apply
```

自動修正の条件:
- `answer_explanation_mismatch` フラグのみ
- explanation に具体的な法的根拠（「ため」「から」「により」等）が含まれている
- 修正方向が一義的（「本肢は正しい」+ answerBoolean=false → true）

自動修正しないもの:
- explanation に曖昧な表現（「※要確認」等）が含まれる
- 法改正・判例変更を含むもの
- OCR 崩壊で問題文自体が不正なもの

## IndexedDB クリーンアップ（v3）

`src/lib/db.ts` の `runOneTimeCleanup()` で、問題データ修正に伴う attempt の整合性を維持する。

### 仕組み

```typescript
const PATCHES: CleanupPatch[] = [
  {
    key: 'cleanup_YYYY-MM-DD_vN_description',  // localStorage キー
    deleteLap1: ['KB2025-pXXX-qYY'],           // lap1 削除対象
    recalcCorrect: [                             // isCorrect 再計算対象
      { problemId: 'KB2025-pXXX-qYY', correctAnswer: true },
    ],
  },
];
```

### 新しい修正を追加する手順

1. `PATCHES` 配列に新しいエントリを追加
2. `key` はユニークな文字列（`cleanup_日付_vN_説明`）
3. `deleteLap1`: 問題文が変わった問題の lap1 を消す
4. `recalcCorrect`: answerBoolean が変わった問題の isCorrect を再計算
5. Supabase 側は別途 curl / SQL で修正

### 実行タイミング

- AuthProvider 初期化時に自動実行
- localStorage フラグで各パッチは1回だけ実行

## 新規インポート時の監査

新しい問題データをインポートした後は、以下の手順で監査する:

```bash
# 1. 監査実行
python3 scripts/audit_legal_consistency.py

# 2. critical / high を確認
# 3. 自動修正候補をドライランで確認
python3 scripts/apply_legal_autofixes.py

# 4. 問題なければ適用
python3 scripts/apply_legal_autofixes.py --apply

# 5. 手動レビュー分を確認
# data/legal_manual_review_queue.csv を開いて1件ずつ確認
```

## 初回監査結果（2026-04-05）

| 項目 | 件数 |
|------|------|
| 総問題数 | 1,359 |
| suspect 検出 | 67 |
| critical | 9 |
| high | 2 |
| medium | 43 |
| low | 13 |
| 自動修正候補 | 9（うち安全に適用可能: 0。全件人間レビュー推奨） |

### critical 9件の内訳

| problemId | カテゴリ | 内容 |
|-----------|---------|------|
| p016-q01 | answer_explanation_mismatch | 「本肢は正しい」なのに false |
| p016-q03 | answer_explanation_mismatch + ocr_broken | 同上 + OCR崩壊 |
| p021-q05 | answer_explanation_mismatch | 同上 |
| p023-q01 | answer_explanation_mismatch | 同上 |
| p024-q04 | answer_explanation_mismatch | 同上 |
| p024-q05 | answer_explanation_mismatch | 同上 |
| p026-q01 | answer_explanation_mismatch | 同上 |
| p026-q02 | answer_explanation_mismatch | 同上 |
| p104-q06 | answer_explanation_mismatch | 「本肢は誤り」なのに true |

## 運用閾値

監査レポートの各レイヤーに対して、以下の閾値で運用する。

| レイヤー | 閾値 | 意味 |
|---------|------|------|
| `critical` | **> 0 → 要修正、完了扱い不可** | answerBoolean と explanation の逆転など致命的 |
| `legal_inconsistency` | **> 0 → 法律整合性レビュー未完** | 条文逆転・旧法混入・文言矛盾 |
| `explanation_quality` | **> 0 → 品質改善残あり** | 学習被害の大きさで P1/P2/P3 に分類 |
| `ocr_suspect` | **別レーン管理** | 法律整合性とは独立。原本照合で対応 |

### デプロイ可否の判断基準

| 条件 | デプロイ |
|------|---------|
| critical = 0, legal_inconsistency = 0, golden test ALL PASS | ✓ 可 |
| critical > 0 | ✗ 不可 |
| legal_inconsistency > 0 | ✗ レビュー完了まで不可 |
| explanation_quality P1 > 0 | △ 要判断（誤学習リスクの程度による） |
| explanation_quality P2/P3 のみ | ✓ 可（改善は継続） |
| ocr_suspect のみ | ✓ 可（別レーンで管理） |

### 実行手順

```bash
# 1. 監査 + ゴールデンテスト実行
python3 scripts/audit_legal_consistency.py

# 2. 結果確認
#    - critical > 0 → 即修正
#    - legal_inconsistency > 0 → 1件ずつ確認
#    - ゴールデンテスト FAIL → 既知バグ再発、即修正

# 3. 修正後に再実行して 0 を確認
python3 scripts/audit_legal_consistency.py

# 4. デプロイ
```

### 修正後のデータ反映チェックリスト

修正を行った場合は以下を全て確認する:

- [ ] `public/data/reviewed_import.json` に反映
- [ ] `data/reviewed_import.json` に同期
- [ ] Supabase の attempt テーブル（is_correct の再計算が必要か）
- [ ] `src/lib/db.ts` の PATCHES 配列に cleanup エントリ追加
- [ ] `data/critical_review_ledger.csv` に台帳記録
- [ ] 監査の再実行で 0 確認
- [ ] ゴールデンテスト ALL PASS

## 既知修正一覧（2026-04-05）

| 問題ID | 修正内容 | 根拠 | Supabase | cleanup |
|--------|---------|------|----------|---------|
| p133-q01 | 問題文OCR修正 | 原本p.368 | lap1削除済 | v2 |
| p134-q01〜q07 | 問題文/answer/exp修正 | 原本p.370-371 | lap1削除済 | v2 |
| p135-q06,q07 | answer修正 | 行訴法12条 | lap1削除済 | v2 |
| p136-q02 | exp修正（3ヶ月→6か月明示） | 行訴法14条1項 | — | — |
| p136-q03 | exp修正 | 行訴法8条1項 | lap1削除済 | v2 |
| p138-q02 | answer false→true + exp | 行訴法32条1項・22条 | is_correct修正済 | v3b |
| p138-q05 | answer false→true + exp | 行訴法24条 | is_correct修正済 | v3 |
| p141-q04 | answer false→true + exp | 行訴法34条 | attempt無し | v3c |
| p016-q01,q03 | exp修正 | 憲法94条 | — | — |
| p021-q05 | exp修正 | 最判昭53.6.16 | — | — |
| p023-q01 | exp修正 | 行政法基本理論 | — | — |
| p024-q04,q05 | exp修正 | 補助機関/独禁法27条の2 | — | — |
| p026-q01,q02 | exp修正 | 内閣法6条/内閣府設置法6条 | — | — |
| p104-q06 | exp修正 | 行審法29条5項 | — | — |

## 今後の拡張

### 追加したい検出ルール

- 行政不服審査法の期間系（処分を知った日から3か月 vs 1年）
- 国家賠償法の要件混同（1条 vs 2条）
- 民法の期間計算ルール
- 条文番号の実在性チェック（全条文DBとの照合）

### LLM 活用案

ルールベースでは限界があるため、将来的には:
1. explanation を LLM に渡して「条文と整合するか」を判定
2. suspect を LLM に渡して「修正提案」を生成
3. 人間が最終確認 → 適用
