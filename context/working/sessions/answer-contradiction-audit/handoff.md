# answerBoolean / explanationText 矛盾検知 — handoff

## Task

data/reviewed_import.json 内の answerBoolean と explanationText の極性矛盾を検知し、review packet を生成する。

## Status

- Script implemented: scripts/build_answer_contradiction_review_packet.mjs
- Packet generated: 5 candidates (all medium severity)
- Regression guards: p222-q01 ok, p224-q01 ok
- Commit / push / PR: 未実施（別承認待ち）

## What this does

- read-only scan of data/reviewed_import.json
- Detects conclusion patterns in explanationText that contradict answerBoolean
- Outputs review packet JSON + summary markdown
- Never mutates data

## What this does NOT do

- answerBoolean の自動変更
- explanationText の修正
- source image 照合
- public/data の変更
- DATA_VERSION bump

## Next steps

1. commit 承認
2. push + PR 作成承認
3. 5件の human review（questionText 確認で true/false positive を判別）
4. true positive 発見時は別タスクで answerBoolean correction
