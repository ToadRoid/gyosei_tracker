# known_issues — 既知の未修正事項

CLAUDE.md 第 1-2 節・第 6-7 節の内容を抜き出してトラッキング用に再掲。
原典は CLAUDE.md。ここは作業 TODO のインデックス。

## 1. 分類崩壊バグ (**部分修正済み 2026-04-21, PR #??**, CLAUDE.md 第1節)

**現象**: `DATA_VERSION` が上がった再 import 時、既存の分類 / フラグが消える。

**原因**:

| # | 原因 | 影響 | 状態 |
|---|---|---|---|
| 1 | `importParsedBatch` が `(sourceBook, sourcePage)` 単位で全削除 → 再作成 | 既存の `subjectId` / `chapterId` / `isExcluded` / `needsSourceCheck` がロストする | **解決**（下記 2026-04-21 修正） |
| 2 | `runOneTimeCleanup` の PATCH を localStorage フラグで管理 | problemAttrs 再作成後に cleanup が再実行されない | **未解決**（PATCH 側はそのまま。代わりに importParsedBatch で属性を継承する方針で回避） |
| 3 | `subjectId === ''` を許容する設計 | 科目ツリーから問題が消え、UI 上「存在しない」状態に見える | **未解決**（§3 で別トラック。本修正で空文字上書きの経路は 1 本減） |

**修正内容 (2026-04-21, PR #??)**:

- `src/lib/import-parsed.ts`:
  - `PreservedAttrs` に `subjectId` / `chapterId` を追加（従来は `isExcluded` / `needsSourceCheck` のみ）
  - 既存 `problemAttrs` の読み取り条件を撤廃し、`attr` が存在する限り常に Map に積む
  - 純関数 `inheritClassificationField(newValue, existingValue, fallback='')` を export。優先順 = (1) 新しく確定した値 → (2) 既存値 → (3) fallback
  - INSERT 時の `subjectId` / `chapterId` を当該ヘルパで解決（従来の `branch.subjectCandidate ?? ''` を置換）
  - `isExcluded` / `needsSourceCheck` の継承は挙動変更なし（常に既存値復元）
- `src/components/AuthProvider.tsx`:
  - `prepareLocalDataOnce = async () => { await autoImportIfEmpty(); await refreshProblemDataIfNeeded(); await runOneTimeCleanup(); }` を追加
  - `handleSignIn` と guest モード useEffect で直列化（旧：fire-and-forget で競合）
  - guest モードのローディング UX は現状維持（`void prepareLocalDataOnce(); setLoading(false);`）
- `src/lib/import-parsed.test.ts`（新規）: `inheritClassificationField` の優先順 12 ケースを vitest で回帰防止

**依然として残る制約**（別スコープ）:

- 原因 2（cleanup 再実行条件）: `localStorage` フラグが残る限り PATCH は再走らない。本修正で属性継承が入ったため実害は軽減したが、PATCH の `DATA_VERSION` 連動化は未対応（§6 TODO）
- 原因 3（`subjectId === ''` 許容）: 空文字保存禁止の schema 変更は未着手（§3）
- `needsSourceCheck` の Dexie index 未登録（§2）

**実行順の是正**（AuthProvider 内）:
- `autoImportIfEmpty` → `refreshProblemDataIfNeeded` → `runOneTimeCleanup` を await で直列化
- 旧：`handleSignIn` は `autoImportIfEmpty()` / `runOneTimeCleanup()` を非 await で呼び競合の余地あり
- 旧：guest モードは `refreshProblemDataIfNeeded().then(cleanup)` だが、先行する `autoImportIfEmpty()` が fire-and-forget で並走していた

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

- [x] `importParsedBatch` に分類 / フラグ継承を入れる（2026-04-21, PR #??）
- [x] 継承条件を設計し、無条件上書きを避ける（2026-04-21, 優先順 (1) 新 OCR → (2) 既存 → (3) fallback ''、純関数 `inheritClassificationField` で固定）
- [ ] PATCH / cleanup の再実行条件を `DATA_VERSION` と整合（§1 原因 2、未対応。属性継承が入ったため実害は軽減）
- [ ] `subjectId === ''` を保存しない設計に修正（§3、別トラック）
- [ ] OCR バッチの高速モデル系 API への差し替え（§4）
- [ ] 自動検知ルール追加（§5）
