# context/

このディレクトリは AI エージェントと人間レビュワーが **判断基準 / 現状** を短時間で把握するための場所。

## ルール

- `stable/` : 長期で変わりにくい前提、source of truth、ルール、検証基準
- `working/` : current status、known issues、handoff など短期更新情報
- 詳細設計や議事は `docs/` に残す（`context/` には置かない）
- 原本データは `data/`、生成物は `outputs/`（未整備）、一時物は `tmp/`（未整備）に分ける
- **推測で確定しない**。不明点は `confirmed` / `inferred` / `unverified` を明記する

## 読み順

1. `stable/project_overview.md`
2. `stable/data_rules.md` と `stable/review_policy.md`
3. `working/current_status.md` と `working/handoff.md`
4. 必要に応じ `stable/commands_and_checks.md`、`working/known_issues.md`

## 更新頻度の目安

- `stable/` : 月〜四半期単位
- `working/` : セッションごと〜日次
