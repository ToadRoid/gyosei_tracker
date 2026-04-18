---
name: update-status
description: "current_status.md の auto マーカー領域を git log から再生成する。既定は dry-run。"
---

# /update-status

`context/working/current_status.md` の `<!-- auto:commits:begin -->` 〜 `<!-- auto:commits:end -->` で囲まれた領域を、`git log --oneline -10 origin/main` ベースで再生成するための thin wrapper。

## 実行ルール

引数 `$ARGUMENTS` を次の規則で解釈して `scripts/update_status.sh` を呼ぶ。

- `apply` が含まれていたら `--apply` を付ける
- `check` が含まれていたら `--check` を付ける（`apply` と同時指定しない）
- `force` が含まれていたら `--force` を付ける（`--apply` と併用時のみ意味を持つ）
- `commits=N` が含まれていたら `--commits N` に渡す（N は正整数）
- それ以外の場合は引数なしの dry-run で実行

## 判断してよい範囲

- 引数の解釈
- 結果出力の要約（何が変わったか / exit code / 書込有無）

## 判断してはいけない範囲

- スクリプト本体の挙動を変える書き換え
- マーカー外の current_status.md を触る
- `--apply` を勝手に付ける（ユーザーが `apply` と書いたとき以外）
- `--force` を勝手に付ける（未コミット変更を検知しても、ユーザーの明示指示がない限り `--force` は付けない。ユーザーに確認する）

## 実行手順

1. `scripts/update_status.sh` を上記ルールに従って起動する
2. 出力（diff、結果メッセージ、exit code）をそのままユーザーに提示する
3. `--apply` で書込が発生した場合は、後続で `git diff --stat context/working/current_status.md` を実行し、変更規模を添える
4. 未コミット変更ガードで中止した場合は、その旨をユーザーに報告し `--force` の要否を確認する

## context_check.sh との違い

- `context_check.sh`: **read-only** のヘルスチェック。書込なし
- `update_status.sh`: **編集補助**。既定は dry-run、`--apply` 明示時のみ書込

両者は独立のツールで、役割は交差しない。
