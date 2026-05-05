# answerBoolean / explanationText 矛盾検知 — summary

## 実行結果

| 項目 | 値 |
|---|---|
| 入力 | data/reviewed_import.json |
| 総ページ | 446 |
| 総肢 | 2,448 |
| 検出候補 | 5件 |
| 検出カテゴリ | explanation_denies_but_answer_true: 5 |
| severity | medium: 5 |
| explicit_phrase_conflict (high) | 0件 |
| regression guards | p222-q01: ok, p224-q01: ok |

## 検出候補一覧

| ID | 問題 | パターン | matchedPhrase |
|---|---|---|---|
| AC-0001 | p275-q03 | denies_but_true | したがって〜損害賠償を請求することはできない。 |
| AC-0002 | p337-q05 | denies_but_true | したがって〜賃貸借契約を解除できない。 |
| AC-0003 | p339-q01 | denies_but_true | したがって〜賃借権の放棄をCに対抗することができない。 |
| AC-0004 | p350-q03 | denies_but_true | したがって〜工事代金の支払いを直接に請求できない。 |
| AC-0005 | p351-q01 | denies_but_true | したがって〜損害賠償を請求できない。 |

## 分析

全5件が同一パターン: 解説が「したがって〜できない。」で結論しており、answerBoolean=true。

これは2つの解釈がありえる:
1. **問題文が「〜できない」命題を問うている** → 命題が正しいので answerBoolean=true は正しい（false positive）
2. **問題文が「〜できる」命題を問うている** → 解説が否定しているのに true は矛盾（true positive）

判別には questionText の確認が必要。スクリプトは read-only のため、human_review を suggestedAction とした。

## precision 評価

- explicit_phrase_conflict: 対象0件（データ内に「本肢は正しい/誤り」表記がほぼない）
- medium パターン: 5件検出。false positive 率は questionText 確認後に判明
- 初回としては high precision 路線で適切

## 今後の拡張候補

- questionText の極性も合わせて判定（「〜できない」を問う肢 → 「できない」結論は一致）
- 「よって○」系の affirm パターン追加（現在は false positive 抑制のため保守的）
- p222/p224 型の手動発見を再現するための broader scan mode
