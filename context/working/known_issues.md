# known_issues — 既知の未修正事項

CLAUDE.md 第 1-2 節・第 6-7 節の内容を抜き出してトラッキング用に再掲。
原典は CLAUDE.md。ここは作業 TODO のインデックス。

## 1. 分類崩壊バグ (confirmed, CLAUDE.md 第1節)

**現象**: `DATA_VERSION` が上がった再 import 時、既存の分類 / フラグが消える。

**原因**:

| # | 原因 | 影響 |
|---|---|---|
| 1 | `importParsedBatch` が `(sourceBook, sourcePage)` 単位で全削除 → 再作成 | 既存の `subjectId` / `chapterId` / `isExcluded` / `needsSourceCheck` がロストする |
| 2 | `runOneTimeCleanup` の PATCH を localStorage フラグで管理 | problemAttrs 再作成後に cleanup が再実行されない |
| 3 | `subjectId === ''` を許容する設計 | 科目ツリーから問題が消え、UI 上「存在しない」状態に見える |

**修正方針** (CLAUDE.md 第2節):

```ts
const existingAttr = await db.problemAttrs
  .where('problemId').equals(problemId).first();

subjectId: branch.subjectCandidate || existingAttr?.subjectId || '',
chapterId: branch.chapterCandidate || existingAttr?.chapterId || '',
isExcluded: existingAttr?.isExcluded ?? false,
needsSourceCheck: existingAttr?.needsSourceCheck ?? false,
```

実行順の修正も必要：
- `autoImportIfEmpty()` 完了後に cleanup
- または import 完了後に補正処理を明示実行

## 2. needsSourceCheck の index 未登録 (confirmed, CLAUDE.md 第6節)

- Dexie スキーマに `needsSourceCheck` の index がない
- オブジェクトとしては保存されるが、フィルタ / クエリが遅い
- 対応: スキーマ更新は migration が発生するため慎重に

## 3. subjectId 空文字の混入経路 (confirmed, CLAUDE.md 第6節)

- `branch.subjectCandidate ?? ''` がそのまま保存される
- `resolveChapter()` を経由していない
- 対応: 空文字保存を禁止 → null か sentinel に寄せる

## 4. OCR パイプラインの API 移行 (未着手, CLAUDE.md 第4節)

- GPT → Claude Code で API 使用量超過
- 現行方針: 実装時点で有効な Flash 系 / 低遅延モデルに差し替え
- 変更対象: `scripts/ocr_batch.*` のみ
- 維持対象: `kindle_capture.sh` / `reviewed_import.json` 形式 / `importParsedBatch`

## 5. データ品質 auto-flag 未実装 (未着手, CLAUDE.md 第5節)

以下を `needsSourceCheck` に自動リストアップするルールが未実装：
- `...` / `…`
- 助詞 / かなの重複
- 文末欠落
- 既知 OCR 誤字
- Q-E 極性矛盾
- broad raw / 空 raw

## 6. TODO 一覧 (from CLAUDE.md 第7節)

- [ ] `importParsedBatch` に分類 / フラグ継承を入れる
- [ ] 継承条件を設計し、無条件上書きを避ける
- [ ] PATCH / cleanup の再実行条件を `DATA_VERSION` と整合
- [ ] `subjectId === ''` を保存しない設計に修正
- [ ] OCR バッチの高速モデル系 API への差し替え
- [ ] 自動検知ルール追加
