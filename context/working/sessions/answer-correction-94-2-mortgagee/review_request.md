# 民法94条2項 善意抵当権者 answerBoolean 修正 — review request

## 対象

| 項目 | 値 |
|---|---|
| sourcePage | 222 |
| seqNo | 1 |
| problemId | KB2025-p222-q01 |
| subject | minpo (民法) |
| chapter | minpo-sosoku (民法総則) |
| section | 02_意思表示と瑕疵 |

## 変更内容

`answerBoolean`: `false` → `true`

## 変更対象ファイル

- `data/reviewed_import.json` (L15626)
- `public/data/reviewed_import.json` (L15626)

## 変更理由

- 民法94条1項: A・B間の仮装売買は当事者間では無効
- 民法94条2項: その無効は善意の第三者に対抗できない
- 仮装譲受人Bから抵当権設定を受けた善意のEは第三者に当たる
- 問題文「Aは、善意のEに対して、A・B間の売買の無効を対抗することができない」は正しい
- E テキストも「善意の第三者に対抗することができない」と説明しており、answerBoolean=false と矛盾
- source role: user/GPT legal review

## 変更しなかったもの

- questionText: 変更なし
- explanationText: 変更なし（E テキストは既に正しい説明）
- sourceCheckReason / needsSourceCheck: 触れていない
- DATA_VERSION: bump なし
- import: 実行なし

## 検証

- JSON parse: OK
- 対象 record: exactly 1件
- answerBoolean: true に変更済み
- questionText / explanationText: 意図せず変更なし
- data と public/data の差分: 同一（各1行のみ）
- git diff --stat: `2 files changed, 2 insertions(+), 2 deletions(-)`
- git diff --check: OK
