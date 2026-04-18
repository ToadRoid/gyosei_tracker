<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:gyosei-tracker-agent-rules -->
# gyosei_tracker — エージェント運用ルール

このリポジトリは行政書士試験学習アプリ `gyosei_tracker`。AI エージェントが作業する前に必ず以下を読むこと。

## 読む順番

1. `context/stable/project_overview.md` — 全体像
2. `context/stable/data_rules.md` — データ規則（source of truth）
3. `context/stable/review_policy.md` — 原本照合・needsSourceCheck 方針
4. `context/working/current_status.md` — 現在の作業状況
5. `context/working/known_issues.md` — 未修正事項
6. 必要に応じ `context/working/handoff.md` / `context/stable/commands_and_checks.md`

詳細設計や議事録は `docs/`。本 AGENTS.md は判断基準のみ。

## 参照の優先順位（競合時の裁定）

複数の文書で記述が食い違った場合、以下の順で優先する：

1. `context/stable/` — 長期前提・ルール・検証基準
2. `context/working/` — 現在状況・未修正事項
3. `CLAUDE.md` — 自動振り分けと技術メモ（`@AGENTS.md` import 元）
4. `docs/` — **必要時のみ参照**。詳細設計 / runbook / 議事メモが混在するため広く読み始めない
5. repo 外（user memory 等）— 補助のみ。source of truth には置かない

不整合を見つけた場合は直ちに修正せず、`confirmed / inferred / unverified` を付けて `context/working/known_issues.md` または `handoff.md` に記録する。

## スコープ

- **作業対象**: 本リポジトリ `gyosei_tracker` のみ
- **対象外**: `work-tools` / `toadroid`（将来構想。`context/FUTURE_META_REPO.md` 参照）

## 守る不変条件

- `AGENTS.md` の `<!-- BEGIN:nextjs-agent-rules -->` ブロックを**削除・改変しない**
- `CLAUDE.md` は `@AGENTS.md` を import している。AGENTS.md の path / 冒頭構造を壊さない
- `public/data/reviewed_import.json` の path は Next.js が前提とするため動かさない
- `src/**` は Next.js App Router 前提。`node_modules/next/dist/docs/` を必ず参照
- 問題データの正本は `data/reviewed_import.json`。**反映前は「未完了」扱い**

## 判断の分岐

| 指示内容 | 振り先 |
|---|---|
| アプリの機能追加・バグ修正・UI 改善 | `dev` skill |
| 学習データ分析・弱点特定 | `coach` skill |
| 入管法・ビザ制度 | `immigration` skill |
| 市場・業界リサーチ | `researcher` skill |
| ビジネスモデル・収益分析 | `analyst` skill |
| プラン検証・反論 | `critic` skill |
| 広い事業検討 | researcher + analyst + critic 並行 |

※ 詳細は `CLAUDE.md` の自動振り分け表と、`.claude/skills/` 配下の各 skill md。

## 出力の確実性表記

推測で断定しない。`confirmed` / `inferred` / `unverified` を区別して書く。
特に `scripts/` / `data/` / パイプライン順序については `unverified` を明記する。

## 破壊的操作の禁止

- `data/reviewed_import.json` の**全体書き換え**は原則行わない（ページ単位 / 肢単位 patch）
- `subjectId = ''` を保存しない（null か sentinel 値）
- 大規模リネームや大量ファイル移動を、事前合意なしに行わない
- `importParsedBatch` の分類 / フラグ消失は既知バグ（`context/working/known_issues.md` §1）。再 import 時は継承を必ず意識する

## コミット規約 (inferred, from git log)

- `vNN: <page>-q<num> <field> を<手段>で<処理>`
- 反映件数を明示（「限定反映 2 肢のみ」等）
- 保留 / 除外 / 復帰を区別して記す
<!-- END:gyosei-tracker-agent-rules -->
