# answerBoolean 矛盾候補 5件 human review

## 判定方法

各候補について:
1. questionText の命題極性を確認（肯定命題 or 否定命題）
2. explanationText の結論が���の命題を肯定/否定しているか確認
3. answerBoolean=true の妥当性を判定

## 結果一覧

| ID | 問題 | Q の命題極性 | E の結論 | ans=true 妥当性 | 判定 |
|---|---|---|---|---|---|
| AC-0001 | p275-q03 | 否定（「請求できない」） | 肯定���「請求できない」に同意） | **妥当** | false positive |
| AC-0002 | p337-q05 | 否定（「解除できない」） | 肯定（「解除できない」に同意） | **妥当** | false positive |
| AC-0003 | p339-q01 | 否定（「対抗すること��できない」） | 肯定（「対抗できない」に同意） | **妥当** | false positive |
| AC-0004 | p350-q03 | 否定（「請求することはできない」） | 肯定（「請求できない」��同意） | **妥当** | false positive |
| AC-0005 | p351-q01 | 否定（「請求することができない」） | 肯定（「請求できない」に同意） | **妥当** | false positive |

## 全件 false positive

5件すべてが同一パターン:
- questionText が「〜できない」という**否定命題**を問うている
- explanationText が「したがって〜できない。」でその命題が正しいことを確認している
- answerBoolean=true は「この否定命題は正しい」を意味し、**矛盾なし**

## 分類

| 分類 | 件数 | 対象 |
|---|---|---|
| patch candidate（要修正） | 0 | — |
| no-change candidate（現状正しい） | 5 | p275-q03, p337-q05, p339-q01, p350-q03, p351-q01 |
| source-check-needed | 0 | — |

## 結論

- answerBoolean の修正は不要
- data patch は不要
- 検知スクリプトの precision は 0/5（false positive rate 100%）だが、これは設計通り
  - 否定命題パターンの除外ロジックを追加すれば改善可能
  - ただし「〜できない」が Q にある場合に E の「できない」を自動除外すると、本当の矛盾を見落とすリスクがある
  - 現時点では human review で判別する運用が安全

## スクリプト改善候補（将来）

questionText に「〜できない」「〜ない」が含まれ、かつ E が同じ否定結論の場合に severity を `low` に下げる:

```
if (questionText includes negation conclusion) && (E conclusion matches Q negation)
  → severity: low, kind: likely_false_positive
```

これにより medium/high のみを human review 対象にできる。ただし実装は別タスク。
