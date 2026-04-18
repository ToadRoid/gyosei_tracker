# 将来の meta-repo 化構想（実変更なし・メモのみ）

本ドキュメントは **設計メモ**。本 repo (`gyosei_tracker`) への実 filesystem 変更は伴わない。

## 位置づけ

- いつか複数プロジェクト（`gyosei_tracker`、`work-tools`、他）を同一 meta-repo `toadroid` に束ねる可能性がある
- しかし**現時点では各 repo を独立運用**する
- 本セッションでは `toadroid` の新規作成は行わない（`/Users/tanakayoshhiro/Developer/` 直下への新規ディレクトリは作らない）

## 想定レイアウト (未確定, inferred)

```
toadroid/                    ← 仮称
├── README.md
├── AGENTS.md                ← 共通ルール
├── shared/                  ← 複数 project で共有する md / snippets
├── inbox/                   ← 所属不明ファイル一時置き
├── archive/                 ← 旧版
├── gyosei-tracker/          ← 現 gyosei_tracker を寄せる
│   ├── README.md
│   ├── AGENTS.md
│   ├── context/stable/
│   ├── context/working/
│   ├── docs/
│   ├── scripts/
│   ├── data/
│   ├── outputs/
│   └── tmp/
└── work-tools/              ← 現 work-tools を寄せる
    └── (同じ構造)
```

## 移行時の注意

- **git 履歴の扱い**: サブツリー統合 (`git subtree add`) か `git filter-repo` で履歴を保つ前提
- **Next.js の path 前提**: `src/`・`public/`・`package.json` の相対位置が変わらないこと
- **`.claude/worktrees/` の扱い**: 現 worktree を meta-repo に取り込むかは要検討
- **`data/reviewed_import.json` の参照**: アプリが `public/data/reviewed_import.json` に依存しているため、移設後も同じ相対 path を保つこと

## gyosei_tracker 側で守るべき不変条件

meta-repo 化の有無に関わらず、以下は常に守る：

- `AGENTS.md` / `CLAUDE.md` の Next.js ガードレールを壊さない
- `context/stable/` と `context/working/` の区別は維持（meta-repo 側でも同構造）
- `docs/` は設計・議事の詳細、`context/` は判断基準と現状に限定

## 本セッションでやらないこと

- `toadroid` の作成
- `gyosei_tracker` → `gyosei-tracker` へのリネーム
- `work-tools` に関する判断
- meta-repo での `shared/` ルール策定
