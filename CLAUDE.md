@AGENTS.md

# 自動振り分けルール

ユーザーからの指示は、内容に応じて自動的に適切なエージェント（スキル）に振り分けること。
ユーザーが `/スキル名` で直接呼び出した場合はそのスキルを実行する。
それ以外の場合、以下のルールで判断して Agent ツールで起動する。
複数領域にまたがる場合は関連エージェントを並行起動する。

| 指示の内容 | 振り先 | スキル名 |
|---|---|---|
| アプリの機能追加・バグ修正・UI改善 | 開発者 | dev |
| 学習データ分析・弱点特定・学習アドバイス | 受験コーチ | coach |
| 入管法・ビザ制度・入管業務の調査 | 入管リサーチャー | immigration |
| 市場調査・業界リサーチ | リサーチャー | researcher |
| ビジネスモデル・収益構造の分析 | アナリスト | analyst |
| プランの検証・反論・穴探し | Devil's Advocate | critic |
| 事業検討（広い問い） | researcher + analyst + critic を同時起動 | — |

振り分け後、結果をまとめてユーザーに報告すること。

---

## gyosei_tracker 技術メモ（2026-04-14）

GPTによるコード照合レビュー済み（第2回：2026-04-14）

### 1. ⚠️ 分類崩壊の既知バグ（未修正）

**原因1: importParsedBatch が (sourceBook, sourcePage) 単位で全削除→再作成する**

- `refreshProblemDataIfNeeded` → `importParsedBatch` の流れで、対象ページの problems と problemAttrs を全削除してから再INSERT
- 消えるのは属性だけでなく、今回の import items に含まれていない問題自体も削除される（ページ単位の再構築）
- reviewed_import.json の subjectCandidate / chapterCandidate が未解決の場合、`importParsedBatch` が `branch.subjectCandidate ?? ''` をそのまま保存するため subjectId === '' になりうる（resolveChapter() 経由ではない）
- answerBoolean（judgement）も既存DBから引き継いでいるのではなく、import元JSONの値を再投入しているだけ
- DATA_VERSION が上がるたびに発生リスクあり

**原因2: PATCHの除外フラグが再作成後に復元されない（＋フラグ管理の問題）**

- `runOneTimeCleanup` の PATCHES は localStorage でフラグ管理
- `importParsedBatch` が problemAttrs を消しても localStorage キーが残るため再実行されない
- isExcluded / needsSourceCheck フラグが消えたまま放置される
- AuthProvider の実行順：未ログイン時は `autoImportIfEmpty()` → cleanup、ログイン時は refresh → cleanup。ただし localStorage フラグが import 後も残るため、どちらの順でも problemAttrs 再作成後に cleanup が再実行されない

**原因3: subjectId === '' の問題は「フィルタ死角」より深刻**

- 分類が空の問題は科目フィルタの死角になるだけでなく、演習画面の科目ツリー自体から問題が落ちる
- UI上では「その問題が存在しない」状態に見えるため、気づきにくい
- 空文字ではなく null か sentinel 値で管理すべき

---

### 2. 修正方針（未実装）

```ts
// importParsedBatch 内で既存の分類・フラグを引き継ぐ
const existingAttr = await db.problemAttrs
  .where('problemId').equals(problemId).first();

subjectId: branch.subjectCandidate || existingAttr?.subjectId || '',
chapterId: branch.chapterCandidate || existingAttr?.chapterId || '',
isExcluded: existingAttr?.isExcluded ?? false,
needsSourceCheck: existingAttr?.needsSourceCheck ?? false,
```

根本対策として cleanup の実行順も修正が必要：
- `autoImportIfEmpty()` の完了後に cleanup を走らせる
- または import 完了後に補正処理を明示実行する

---

### 3. OCR・データ処理の経緯

- GPT API → 精度に問題
- Claude Code → OCR＋分類同時処理でAPI使用量オーバーフロー
- → 現行モデルの高速系APIへの移行を検討中

---

### 4. OCR・データ処理の API 移行方針

#### 4-1. 基本方針

OCR＋分類の生成処理は、既存の reviewed_import.json 形式を維持したまま差し替え可能にする。

#### 4-2. モデル選定方針

- 特定モデル名を CLAUDE.md に固定しない
- 実装時点の公式ドキュメント上で有効な Flash 系 / 低遅延モデルを採用する
- 速度・コスト・OCR 精度・JSON 安定出力を比較して決める

#### 4-3. 変更対象

変更対象は OCR バッチ処理スクリプトのみ（scripts/ocr_batch.sh または対応 Python スクリプト）

#### 4-4. 維持するもの

- kindle_capture.sh は原則変更しない
- 下流の reviewed_import.json 形式は変えない
- importParsedBatch / UI / DB 側の取り込み仕様も原則維持する

#### 4-5. 想定フロー

```
kindle_capture.sh（変更なし）
  ↓
ocr_batch.*（API 呼び出し実装を差し替え）
  ↓
OCR + subjectCandidate + chapterCandidate を JSON 出力
  ↓
reviewed_import.json（既存形式を維持）
  ↓
importParsedBatch
```

---

### 5. データ品質の自動検知（導入候補）

以下は needsSourceCheck 候補として自動検知する価値が高い。

- `...` / `…` を含む問題文・解説文
- 助詞やかなの重複（例: にに）
- 文末の不自然な欠落（例: 生命、 / 時効ない。）
- OCR 誤字の疑いが強い既知語（例: 余償 / 大火責任法）
- Q と E の極性矛盾（例: E が「時効にかかる」と述べているのに ans が True）
- broad raw / 空 raw（例: (空) / 不明 / 総則 / 行政法）

---

### 6. 実装上の注意点（GPTレビュー追記）

- needsSourceCheck は Dexie スキーマのインデックスに登録されていない（オブジェクトとして保存はされるが index なし）
- subjectId === '' は空文字のまま保存しない設計に寄せる（null または sentinel 値推奨）
- subjectCandidate が未解決の場合、`importParsedBatch` が `branch.subjectCandidate ?? ''` をそのまま保存するため subjectId === '' になりうる（resolveChapter() 経由ではない。断定はできないが、コード上はありうる）

---

### 7. TODO

- [ ] importParsedBatch の再取込時に isExcluded / needsSourceCheck を安全に継承する
- [ ] 分類継承の条件を設計し、subjectId / chapterId の無条件継承を避ける
- [ ] PATCH / cleanup の再実行条件を DATA_VERSION と整合させる（実行順も修正）
- [ ] subjectId === '' を保存しない設計に修正する
- [ ] OCR バッチを現行の有効な高速モデル系 API に差し替える
- [ ] `...` / 重複文字 / broad raw / Q-E 矛盾の自動検知ルールを追加する
