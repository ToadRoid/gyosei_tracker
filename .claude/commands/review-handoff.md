---
name: review-handoff
description: "handoff.md の scope マーカー区間と直近 merged PR を照合し done 候補を提案する。read-only。"
---

# /review-handoff

`context/working/handoff.md` の `<!-- review-handoff:scope:begin -->` 〜 `<!-- review-handoff:scope:end -->` で囲まれた区間を走査し、直近 merged PR の title との単語 overlap を見て **done 候補を提案** する thin wrapper。

## 実行ルール

引数 `$ARGUMENTS` を次の規則で解釈して `scripts/review_handoff.sh` を呼ぶ。

- `limit=N` が含まれていたら `--limit N` に渡す（N は正整数）
- それ以外は引数なしで実行

## 判断してよい範囲

- 引数の解釈
- 結果レポートの要約（高 / 低 / unmatched の件数 / 主な候補）

## 判断してはいけない範囲

- `handoff.md` の書き換え
- scope マーカーの勝手な挿入・移動・拡張
- done 確定 / 削除 / 打ち消しの提案を超えた反映
- `known_issues.md` や他の `context/` ファイルへの連動更新

## 前提

- `gh` が auth 済みであること
- `context/working/handoff.md` に scope マーカー対が挿入されていること

マーカーがない場合、script は exit 1 で「先に scope マーカーを手動挿入してください」と返す。スキル側で勝手に挿入しないこと（heading fallback は M1 では行わない）。

## 実行手順

1. `scripts/review_handoff.sh` を上記ルールに従って起動する
2. 出力（report、exit code）をそのままユーザーに提示する
3. done 判定は人手である旨を明示して締める

## /update-status との違い

- `/update-status`: 事実の**再生成**。`--apply` で書込。
- `/review-handoff`: 判断の**提案**のみ。**書込なし**（report-only）。
- 両者は独立のツールで、役割は交差しない。
