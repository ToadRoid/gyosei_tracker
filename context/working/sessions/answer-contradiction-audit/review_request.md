# answerBoolean / explanationText 矛盾検知 — review request

## 対象

5件の矛盾候補。すべて `explanation_denies_but_answer_true` パターン。

## 検知ロジック

- explanationText が「したがって〜できない。」等の否定的結論で終わる
- answerBoolean が true
- 文末「。」確認済み（mid-sentence false positive を排除）
- negation guard で「ではない」「わけではない」等の二重否定を除外

## 判別が必要な点

各候補について:
1. questionText が「〜できない」命題を問うているか確認
2. もし問題文が否定命題 → 解説の否定結論は命題を肯定 → answerBoolean=true は正しい（false positive）
3. もし問題文が肯定命題 → 解説の否定結論は命題を否定 → answerBoolean=true は矛盾（true positive → correction 必要）

## suggestedAction

- human_review: questionText を確認し、極性を判定
- source_check 不要（explanationText 自体が結論を明示しているため）

## policy

- dataMutation: false
- autoAnswerChange: false
- proposedAnswerBoolean: always null
