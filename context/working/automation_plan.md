# automation_plan — context 自動アップデート / 自動クリーンアップ 設計案

最終更新: 2026-04-18

> **本ファイルは設計案 + Phase M1 実装ログ。stable の source of truth ではない。**
> Phase M1 は 2026-04-18 時点で完了扱い。Phase M2 以降は未着手で凍結中。
> 本ファイルの内容を根拠に stable/ を書き換えないこと。

## 0. Phase M1 完了状況 (2026-04-18)

| 項目 | PR | 状態 |
|---|---|---|
| 設計メモ (本ファイル) + `scripts/context_check.sh` read-only 実装 | [#3](https://github.com/ToadRoid/gyosei_tracker/pull/3) | ✅ merged |
| `context_check.sh` false positive 削減（@-prefix / bare basename） | [#4](https://github.com/ToadRoid/gyosei_tracker/pull/4) | ✅ merged |
| `/update-status` (auto:commits マーカー区間の再生成, `--apply`/`--check`) | [#5](https://github.com/ToadRoid/gyosei_tracker/pull/5) | ✅ merged |
| `/review-handoff` (scope マーカー opt-in、done 候補 report-only) | [#6](https://github.com/ToadRoid/gyosei_tracker/pull/6) | ✅ merged |

M1 で採用した設計原則（thin / safe / revert easy、stable 未接触、書込は opt-in）は M2 以降にも継承する。

## 1. 設計方針

1. **Source of truth は明示固定**。自動化は「派生物の再生成」に限る。stable/ は人手編集のみ。
2. **git log / git status / gh pr で観測できる事実 だけを自動転記対象にする**。意図・判断・優先度は人手。
3. **自動化は全て "提案 → 人間承認 → commit" の 2 段階**。LLM が stable/ を直接書き換えない。
4. **失敗したら何もしないのが正解**（冪等・中止可能）。壊れた自動更新で context が退化するのが最悪シナリオ。
5. **gyosei_tracker 単体で完結**。現時点では他 repo / meta repo に依存しない（`FUTURE_META_REPO.md` はあくまで将来案）。

## 2. 更新対象一覧

| ファイル | 自動化適性 | 理由 |
|---|---|---|
| `context/stable/project_overview.md` | ❌ 不可 | 事業判断・前提の人手記述 |
| `context/stable/data_rules.md` | ❌ 不可 | ルール定義。stable の中核 |
| `context/stable/review_policy.md` | ❌ 不可 | 同上 |
| `context/stable/commands_and_checks.md` | △ 半自動 | `package.json` script との差分検知のみ |
| `context/working/current_status.md` | ✅ 主対象 | "直近の活動" は `git log --oneline -N` と 1:1、worktree も `git worktree list` |
| `context/working/handoff.md` | △ 半自動 | "残件テーブル" の done 化だけ（PR merge 検知）。新規残件追加は人手 |
| `context/working/known_issues.md` | △ 半自動 | resolved 時のチェックのみ。原因分析は人手 |
| `context/MIGRATION_CANDIDATES.md` | △ 半自動 | 参照先の dangling 検知のみ |
| `context/FUTURE_META_REPO.md` | ❌ 不可 | 将来案メモ |
| `context/README.md` | ❌ 不可 | 目次。ファイル追加時のみ人手 |
| `AGENTS.md` / `README.md` | ❌ 不可 | 人手 |
| repo 外 memory (`~/.claude/.../memory/*.md`) | ❌ 自動化対象外 | source of truth ではない |

## 3. cleanup 対象一覧

stale 判定の原則は **「観測可能な完了シグナル」があるもののみ**。推測で消さない。

| 対象 | stale 判定根拠 | 自動 or 人手 |
|---|---|---|
| `handoff.md` 残件テーブルの done 行 | 対応する PR が merged / issue が closed | 自動提案 → 人手承認 |
| `known_issues.md` の resolved 項目 | 修正 commit の grep / CLAUDE.md 該当節削除 | 自動提案 → 人手承認 |
| `current_status.md` の古い "直近の活動" | git log と diff があるとき全置換 | 自動（承認 1 回） |
| `MIGRATION_CANDIDATES.md` の dangling 参照 | 参照先ファイルが存在しない | 自動検知のみ（削除は人手） |
| 各 md の `最終更新: YYYY-MM-DD` | 本文 diff 有 = 更新日も更新 | 自動 |
| repo 外 memory との重複 | `context/` に同旨記述が存在 | **削除しない**（memory 側に "context 優先" 注記のみ） |
| `docs/` 内の一時メモ | `MIGRATION_CANDIDATES.md` の分類完了後 | 人手のみ |

**絶対に自動削除しない**:

- stable/ 配下の行
- `handoff.md` の "避けるべきアクション" セクション
- 根拠不明な "古そうな" 記述
- `CLAUDE.md` / `AGENTS.md` の内容

## 4. トリガ案

| トリガ | 想定アクション | 実装手段候補 |
|---|---|---|
| **セッション開始時** | `handoff.md` 読込、PR merge / commit 差分を表示 | Claude Code の SessionStart hook |
| **commit 直後** | `current_status.md` 再生成プレビュー | post-commit hook（git）/ PostToolUse hook |
| **PR merge 検知** | `handoff.md` done 行の提案、`current_status.md` 更新 | `gh pr list --state merged` 定期ポーリング or GitHub Actions |
| **セッション終了時** | `handoff.md` 追記プロンプト（残件・未確定事項） | Stop hook / SessionEnd |
| **手動** | `/update-context` のような slash command | Claude Code user skill |
| **`package.json` / `scripts/` 変更時** | `commands_and_checks.md` 差分警告 | PostToolUse（Edit/Write 後） |

**推奨トリガ優先度**:

1. 手動 slash command（誤動作被害が最小）
2. セッション開始時読込（書き込まない）
3. commit 直後のプレビュー（書き込みは承認制）
4. その他は将来

## 5. ガードレール

| 種別 | 内容 |
|---|---|
| **書込制限** | stable/ は自動書込禁止。working/ のみ対象 |
| **差分サイズ上限** | 1 回の自動更新で ±20 行超なら中止 → 人手へ |
| **diff プレビュー必須** | 自動コミット禁止。常に `git diff` を提示 |
| **dry-run モード** | 既定は提案のみ。`--apply` で初めて書込 |
| **ロールバック性** | 自動更新は単一 commit で記録、revert しやすい形に |
| **メタデータ保護** | `最終更新:` 以外のヘッダは変更不可 |
| **"unverified" / "inferred" 注記の保護** | 自動で "confirmed" に昇格させない |
| **repo 外 memory は読み取り専用** | 自動書込対象外 |
| **除外パス明示** | `CLAUDE.md`, `AGENTS.md`, `README.md`, `context/stable/**` は自動化スコープ外 |

## 6. 最小導入案（Phase M1 実績）

### Phase M1（完了）

1. **`/update-status` slash command** — ✅ #5 で merged
   - `scripts/update_status.sh` + `.claude/commands/update-status.md`
   - `<!-- auto:commits:begin -->` 〜 `<!-- auto:commits:end -->` の間を `git log --oneline -10 origin/main` で再生成
   - `--apply` 書込、`--check` CI 用、未コミット変更ガード付き

2. **`/review-handoff` slash command** — ✅ #6 で merged
   - `scripts/review_handoff.sh` + `.claude/commands/review-handoff.md`
   - `<!-- review-handoff:scope:begin -->` 〜 `:end` の opt-in 区間だけを走査
   - PR title overlap で done 候補を report-only 提案（書込なし）
   - マーカー欠落時は heading fallback せずに exit 1

3. **セッション開始時の read-only チェックスクリプト** — ✅ #3 / #4 で merged
   - `scripts/context_check.sh`（依存なし bash）
   - `最終更新:` が 7 日以上前の WARNING
   - `MIGRATION_CANDIDATES.md` の dangling 参照検知
   - @-prefix suppress + bare basename は INFO 候補提示

4. **`最終更新:` フィールドの定型統一** — ⏸ 次候補（未着手）
   - 今ある 3 ファイル（current_status / handoff / known_issues）で表記統一
   - 小規模で安全、Phase M1.5 的な位置づけ

### 次候補（小さく安全なもの）

- 上記 #4「`最終更新:` 定型統一」— M1 と同じ thin / safe / revert easy で追加可能
- それ以外は Phase M2 として凍結（下記）

### 将来案として保留（Phase M2+、現時点は凍結）

- PR merge をトリガにした自動更新フロー（GitHub Actions）
- `known_issues.md` の resolved 自動検出（commit message 解析が必要、誤検知リスク）
- `docs/` 分類・`MIGRATION_CANDIDATES.md` 実行（人手判断が濃い）
- repo 外 memory との整合チェッカ（source of truth 混線リスク、メタ repo 化と同時が望ましい）
- commit / PostToolUse hook による自動プレビュー（誤爆時のリカバリコスト高）
- 複数 repo 横断の context 同期（`FUTURE_META_REPO.md` 側）

## 7. 実装着手順（実績）

2026-04-18 時点、Phase M1 の実装履歴:

1. ✅ 本ファイル初版 + `scripts/context_check.sh` read-only 実装 (PR #3)
2. ✅ `context_check.sh` の false positive 削減 (PR #4)
3. ✅ `/update-status` 実装 (PR #5)
4. ✅ `/review-handoff` 実装 (PR #6)
5. ⏸ `最終更新:` 定型統一（次候補、本業優先のため保留可）
6. ⏸ Phase M2（hook / Actions / `known_issues.md` 自動連動 など）は凍結

**現時点の優先順位は automation ではなく本業（原本照合 / v58 系データ修正）。**

---

## 8. PoC 候補（**検討段階 / 未承認 / 着手不可**）

> **重要**: 本節は「検討段階のタスク」であり active 実装修正タスクではない。
> **実装・スクリプト作成・データ修正はまだしない**。
> Phase M2 凍結（§7 末尾）と整合させ、本節も **凍結中の PoC 候補**として隔離記録する。

### 8-1. ローカル AI / Ollama を既存データチェック補助に流用する案（2026-04-27 追加）

#### 状態

- **status**: 検討段階 / 未承認 / PoC 候補
- **着手条件**: 未定（少なくとも Trigger A 完走 + 検証バッチ実績 + user 明示 GO の 3 条件未充足）
- **active task ではない**: 既存の error_reports_queue / classification_audit / ingestion_flow とは独立、それらを置き換えない

#### 背景

参考動画で紹介されていた Ollama 上のローカル AI 分担：

| モデル | 想定役割 |
|---|---|
| llava V1.6 | 画像 OCR・画像理解 |
| DeepSeek R1 | 推論・分類判断 |
| Qwen3 | 日本語の命名・要約・整形 |

**注意点（重要）**: Qwen3 が強いのは **日本語生成・命名・要約** であり、**OCR 本体ではない**。OCR 担当は llava V1.6。Qwen3 を OCR エンジンとして誤用しない。

#### gyosei_tracker で検討したい用途（PoC 候補）

- 既存 OCR 本文と画像 OCR 結果の差分検出
- 意味反転につながる誤読候補の抽出
  - 例: 諾否 / 語否、あり / なく、できる / できない
- 日本語として不自然な問題文・解説文の候補出し
- pending queue / `error_reports_queue.md` に入れる前の補助スクリーニング
- PR 前レビュー用の疑義候補リスト生成

#### 明確な禁止事項（PoC でも遵守）

- ローカル AI 出力を **正本として採用しない**
- AI 判定だけで既存データを修正しない
- 条文・知識から逆算して復元しない
- 原本画像で読めない箇所を AI 推測で補完しない
- 現行の **原本照合 / GPT レビュー / unresolved 維持ルール** を置き換えない

#### 出力制約（将来 PoC 着手時）

- 出力は `candidate_findings.md`（仮称）のような **候補リスト** に限定
- repo 本体データ（`data/reviewed_import.json` / `src/data/master.ts` / `DATA_VERSION` 等）は **変更しない**
- read-only 前提（既存 ingestion_flow §6 handoff-only 4 条件と整合）
- DATA_VERSION bump 不要（候補リストは派生物 = source of truth ではない）

#### 既存運用との関係

- 既存の 3 者分担（Gemini=OCR / Claude=実装 / GPT=レビュー、`feedback_ocr_role_division.md` 参照）を **置き換えない**
- PoC 着手時は「補助スクリーニング」位置付け、既存ルートの上流に **任意の事前 fillter** として挿入する形が自然
- override script (`scripts/check_classification.py`) との併用案: ローカル AI 出力を override script の入力前に補助情報として参照、ただし Hard 条件（v4 draft §4-bis-1）は変えない

#### 着手前に確定すべき項目（TODO）

- 着手条件の正式 trigger（Trigger A / B / C のどれか、新規 Trigger を立てるか）
- llava V1.6 の OCR 精度を Gemini Flash と比較する評価方法
- ローカル実行環境のスペック / 推論時間が実用に耐えるか
- 「補助スクリーニング」の閾値設計（何を AI に投げて何を人手に残すか）
- false positive コスト見積もり（GPT レビュー側の負荷増にならないか）

#### やらないこと（範囲外）

- 本ファイル更新時点での実装
- repo に Ollama 関連 script / config を追加すること
- ローカル AI 環境構築の手順書化
- Gemini OCR 経路の置換
- 検証バッチ protocol（v4 draft）への組み込み
- `context/stable/ingestion_flow.md` への記載（stable は L1 / L2 主要フローのみ）

#### 位置付けまとめ

| 項目 | 値 |
|---|---|
| カテゴリ | PoC 候補 / 検討段階 |
| 承認状態 | 未承認 |
| 着手状態 | 着手不可（trigger 未定） |
| 関連 active task | なし |
| 出典 | user directive 2026-04-27（参考動画の Ollama 分担を踏まえた検討依頼） |
| 優先度 | M2 凍結中、本業（原本照合 / v58 系データ修正）優先の方針を維持 |
