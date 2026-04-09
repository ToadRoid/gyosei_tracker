# sectionTitle / displaySectionTitle 運用方針

> 策定: 2026-04-10  
> 背景: v37 で sectionTitle を直接上書きして原本リンクを破壊したため、v40 で二層構造に変更。

---

## フィールドの役割

| フィールド | 保存場所 | 役割 | 変更 |
|---|---|---|---|
| `sectionTitle` | `ProblemAttr` | **原本の章見出し**（OCR生テキスト） | **禁止** |
| `sourcePageQuestion` | `ProblemAttr` | 問題の書籍ページ番号 | 禁止 |
| `sourcePageAnswer` | `ProblemAttr` | 解説の書籍ページ番号 | 禁止 |
| `displaySectionTitle` | `ProblemAttr` | **UI表示用の正規化ラベル** | 自由 |

---

## 分類を変えたいとき

**`sectionTitle` は触らない。`displaySectionTitle` で吸収する。**

```
reviewed_import.json の sectionTitle → 変更禁止（原本リンク）
src/data/sectionNormalization.ts    → ここだけ編集する
```

### 手順

1. `src/data/sectionNormalization.ts` の `EXACT_MAPPING` または `PAGE_SPLIT_RULES` を編集
2. `npm test` を実行してテストが通ることを確認
3. `DATA_VERSION` をインクリメント（例: v42 → v43）
4. commit & push → 次回ログイン時に全端末で自動再インポート

---

## sectionNormalization.ts の構造

```ts
// 1. 1対1マッピング（同一 chapter 内で raw title が一意に決まる場合）
EXACT_MAPPING[chapterId][rawSectionTitle] → displaySectionTitle

// 2. ページ分岐（同一 chapter 内で同じ raw title が複数セクションに分散する場合）
PAGE_SPLIT_RULES[chapterId][rawSectionTitle][n].pageRange → displaySectionTitle
```

### PAGE_SPLIT_RULES の注意点（v40→v41 バグの教訓）

- `pageRange` は **ファイルページ番号**（`problemId` の `pXXX` 部分）で判定する
- `sourcePageQuestion` は**書籍ページ番号**（例: p.412, p.422）であり、ファイルページとは異なる
- resolver は `problemId.match(/[^-]+-p(\d+)-q/)` でファイルページを抽出する

現時点で PAGE_SPLIT_RULES が必要なのは `gyosei-kokubai` の `損失補償` のみ:

| ファイルページ | displaySectionTitle |
|---|---|
| p155–156 | `02_国家賠償法1条（外形標準説・判例）` |
| p160–161 | `05_国家賠償法2条（営造物責任）` |
| p164–165 | `09_損失補償（憲法29条）` |

---

## テスト

```bash
npm test
# または
npm run test:watch
```

`src/data/sectionNormalization.test.ts` に17本の回帰テストがある。  
マッピングを変更したら必ずテストを更新・追加すること。

---

## exercise 画面でのグルーピング

`exercise/page.tsx` は `displaySectionTitle ?? sectionTitle` でセクションをグルーピングする。  
`displaySectionTitle` が未設定の問題（他 chapter、旧データ等）は `sectionTitle`（raw）にフォールバックするため、未マッピングの問題が消えることはない。
