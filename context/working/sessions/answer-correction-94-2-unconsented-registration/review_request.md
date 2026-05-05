# 民法94条2項類推適用 不実登記・善意転得者D answerBoolean 修正 — review request

## 対象

| 項目 | 値 |
|---|---|
| sourcePage | 224 |
| seqNo | 1 |
| problemId | KB2025-p224-q01 |
| subject | minpo (民法) |
| chapter | minpo-sosoku (民法総則) |
| section | 02_意思表示と瑕疵 |

## 変更内容

`answerBoolean`: `false` → `true`

## 変更対象ファイル

- `data/reviewed_import.json` (L15762)
- `public/data/reviewed_import.json` (L15762)

## 変更理由

- Aの意思によるB名義の不実登記 → 民法94条2項類推適用（最判昭45.7.24）
- 94条2項の善意第三者には転得者も含まれる
- 直接取得者Cが悪意でも、転得者Dが善意であれば保護される
- 問題文「DはAとの関係では善意の第三者として保護され、所有権を取得する」は正しい
- E テキストも同一結論を述べており、answerBoolean=false と矛盾
- source role: user/GPT legal review

## 変更しなかったもの

- questionText: 変更なし
- explanationText: 変更なし
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
