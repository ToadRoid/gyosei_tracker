# gyosei_tracker

行政書士試験（肢別過去問）の学習進捗と問題データを管理する Next.js アプリ。

## ドキュメントの読み方

| 目的 | 参照先 |
|---|---|
| AI エージェントとして作業する | [AGENTS.md](AGENTS.md) と [CLAUDE.md](CLAUDE.md) |
| プロジェクト全体像を掴む | [context/stable/project_overview.md](context/stable/project_overview.md) |
| データ構造 / import ルール | [context/stable/data_rules.md](context/stable/data_rules.md) |
| 原本照合 / レビュー規則 | [context/stable/review_policy.md](context/stable/review_policy.md) |
| コマンドと確認手順 | [context/stable/commands_and_checks.md](context/stable/commands_and_checks.md) |
| 現在の作業状況 | [context/working/current_status.md](context/working/current_status.md) |
| 既知の未修正事項 | [context/working/known_issues.md](context/working/known_issues.md) |
| 次セッション引き継ぎ | [context/working/handoff.md](context/working/handoff.md) |
| 詳細設計・ランブック | [docs/](docs/) |

## 技術スタック

Next.js 16 / React 19 / TypeScript / Tailwind v4 / Dexie (IndexedDB) / Supabase / vitest / OCR (OpenAI + Gemini + tesseract.js)

## 関連（スコープ外）

将来の meta-repo 化構想は [context/FUTURE_META_REPO.md](context/FUTURE_META_REPO.md)（メモのみ、実変更なし）。

---

## Next.js 基本操作

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
