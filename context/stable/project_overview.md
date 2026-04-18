# gyosei_tracker — プロジェクト概要

## 目的 (confirmed)

行政書士試験（肢別過去問）の学習進捗と問題データを管理する個人向け Web アプリ。
問題の出題・正答管理・解説・学習履歴・弱点分析を担う。

## 技術スタック (confirmed, from package.json)

- Next.js 16.2.1（独自の breaking changes あり。`node_modules/next/dist/docs/` を参照すること）
- React 19.2.4
- TypeScript 5
- Dexie 4.4.1（IndexedDB、ローカル永続）
- @supabase/supabase-js 2.101.1（リモート永続）
- Tailwind CSS 4
- vitest 4（`npm run test`）
- OCR 周辺: `openai`, `@google/genai`, `tesseract.js`

## ソース構成 (confirmed)

```
src/
├── app/          # Next.js App Router（account / api / exercise / import / login / questions / review / triage）
├── components/
├── data/
├── lib/
└── types/
```

## データパイプライン (inferred, 要検証)

```
kindle_capture.sh（Kindle スクリーンショット取得）
  → images_preprocessed/
  → scripts/ocr_batch.sh / gemini_parse.js / vision_extract.js 等で OCR
  → data/parsed_*.json / qa_draft_*.json / vision_round2_*.csv
  → レビュー（data/*ledger* / reviewed_import.json.bak_* などで diff 管理）
  → data/reviewed_import.json （source of truth）
  → public/data/reviewed_import.json （アプリ読み込み用）
  → Dexie (importParsedBatch) → UI
```

- `data/reviewed_import.json` と `public/data/reviewed_import.json` の同期タイミング: **unverified**
- OCR パイプラインの完全順序: **unverified**（scripts/ にファイルは 40+ 個あるが run 順は暗黙知）

## 自動振り分け (confirmed, from CLAUDE.md)

CLAUDE.md に定義された Agent 振り分けルールあり：
- 開発 → `dev`
- 学習分析 → `coach`
- 入管業務 → `immigration`
- 市場調査 → `researcher`
- 事業分析 → `analyst`
- 反論 → `critic`
- 広い事業検討 → researcher + analyst + critic 並行

## 非対象 (今回のコンテキスト整理スコープ外)

- `work-tools`、`toadroid`（将来の meta-repo 構想のみ。`context/FUTURE_META_REPO.md` 参照）
