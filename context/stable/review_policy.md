# レビュー / 原本照合ポリシー

## 完了判定の原則 (confirmed)

- **`data/reviewed_import.json` への反映**がされて初めて「完了」と見なす
- `qa_draft_*.json` や `parsed_*.json` 段階は中間物であり未完了
- OCR 抽出のみ通った状態も未完了（Q と E の極性・答の整合が取れていない可能性）

## 原本照合が必要なケース (confirmed, from CLAUDE.md)

以下は `needsSourceCheck: true` として扱う（直さずに保留するのが原則）：

1. Q / E が `...` / `…` / 欠落 / OCR 崩れを含む
2. Q と E の極性が矛盾している（E が「時効にかかる」なのに `answerBoolean: true` 等）
3. `subjectCandidate` / `chapterCandidate` が broad raw（空 / 総則 / 行政法 / 不明）
4. 出題停止相当（法改正により問題が成立しない等）は `isExcluded: true` に切り替え

## 出題停止 (`isExcluded`) と要確認 (`needsSourceCheck`) の違い (inferred)

- `isExcluded`: UI の出題対象から**恒久的に外す**
  - 法改正等により**出題不適切と確認できた**もの
  - 出題停止方針が**明確**なもの（廃止論点、制度変更が確認済）
- `needsSourceCheck`: 一時的に**確認待ち**。原本確認後に解除する
  - OCR 崩れ、表現の誤り
  - **根拠不明 / 判断がつかないもの**はここに寄せる（即除外しない）

> **重要**: 「根拠不明」だけを理由に `isExcluded` にしないこと。確認できていないものは `needsSourceCheck` で保留する。

## 整合確認の実行順序 (inferred, 実務手順)

データ変更を反映する前に、以下の順で整合を確認する：

1. **原本を参照**（Kindle / 問題集現物 / `images_preprocessed/` 内のスクショ）
2. **現行 `data/reviewed_import.json`** の既存エントリを読む（差分ベースで考える）
3. **関連メモを確認**
   - `docs/p229_hold.md` など hold 系メモ
   - `data/*ledger*` / `data/correction_ledger_v15.json` 等の補正履歴
4. **フィールド整合を順に確認**
   1. Q（問題文）: 原本との一致
   2. E（解説文）: Q と矛盾しないか
   3. `answerBoolean`: Q と E の極性と一致するか
   4. `chapterCandidate` / `chapter`: 原本章立てに合うか
   5. `subjectCandidate` / `subject`: broad raw（空 / 総則 / 不明）でないか
   6. `isExcluded` / `needsSourceCheck` のフラグが意図通りか
5. **反映後の画面確認**
   - `public/data/reviewed_import.json` と同期（手順は `commands_and_checks.md` 参照）
   - dev server で該当問題を表示し、科目ツリー / 出題可否 / 正誤判定を確認
6. **コミット**（`vNN:` プレフィックスと件数明示）

## Git 運用 (confirmed, from git log)

直近コミットの慣習：
```
v58: p047/p146 をGemini読取で追加（p146 chapter修正、p229保留・p018除外）
v57: p063-q01 E をGemini読取+手修正で途切れ解消（1肢のみ）
v56: p062-q06/q08 Q/E をGemini読取で途切れ解消（限定反映2肢のみ）
v55: p171-q05 answerBoolean False→True（条例違反→無効は正しい）
v54: p165 Q/E をGemini読取で復元 + needsSourceCheck解除（出題復帰）
```

規則（inferred）：
- `vNN: <ページ>-q<番号> <対象フィールド> を<手段>で<処理>`
- 反映件数は**明示**する（「限定反映2肢のみ」「1肢のみ」等）
- 保留 / 除外 / 復帰の別を書く

## 禁止事項 (confirmed, from CLAUDE.md)

- 原本未確認のまま Q/E 本文を書き換えない
- `subjectId === ''` のまま保存しない
- PATCH / cleanup を DATA_VERSION 不整合のまま走らせない
