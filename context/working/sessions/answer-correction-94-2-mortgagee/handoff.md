# 民法94条2項 善意抵当権者 answerBoolean 修正 — handoff

## Task

p222-q01 の answerBoolean を false → true に修正。
民法94条2項により、仮装譲受人から善意で抵当権設定を受けた第三者に対して仮装売買の無効を対抗できない。

## Status

- Patch applied: data/reviewed_import.json, public/data/reviewed_import.json
- Review request created
- Commit / push / PR: 未実施（別承認待ち）

## What this does

- p222-q01 の answerBoolean: false → true（1箇所、data + public 各1行）

## What this does NOT do

- questionText / explanationText の変更
- DATA_VERSION bump
- import 実行
- source image 照合（不要：user/GPT legal review に基づく修正）
- 他の record への変更

## Next steps

1. commit 承認
2. push + PR 作成承認
3. GPT review
4. merge 承認
