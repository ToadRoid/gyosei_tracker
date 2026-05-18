# Session change history summary — PR #152〜#162

date: 2026-05-18
base: origin/main `ba1e26b`（PR #162 merged）
期間: 2026-05-15 〜 2026-05-18

---

## 1. 背景

本セッションは、`gyosei_tracker` リポジトリにおける以下 4 系統の作業を一連で実施した記録である。

- **OCR / source-confirmed 系**: AI Deep Dive が指摘した OCR / 解説品質 / answerBoolean 矛盾候補を、書籍原本画像と照合して修正
- **data patch 系**: source-confirmed な textual replacement と answerBoolean 修正を data/reviewed_import.json / public/data/reviewed_import.json に反映
- **UI 修正系（参考書順 sort）**: /exercise のセクション一覧が sectionTitle 文字列順で並び、参考書順とずれていた問題を修正
- **UI 修正系（/review padding density）**: セッション初期から保留していた stash@{0} の余白調整を専用 PR で再現

期間中の PR は **#152 〜 #162 の 11 件**。すべて squash merge で main へ取り込み済み。

---

## 2. 期間・対象PR

| PR | merge commit | title | merged at |
|---|---|---|---|
| #152 | `883a6fd` | docs: record p0 source check for proxy ocr findings | 2026-05-15 15:15Z |
| #153 | `0e2c34e` | docs: map cancellation ocr findings | 2026-05-15 15:20Z |
| #154 | `916b6cc` | docs: record p0 source check for cancellation ocr findings | 2026-05-16 07:45Z |
| #155 | `643f0f1` | docs: map prescription ocr findings | 2026-05-17 14:42Z |
| #156 | `1d62f69` | docs: record p0 source check for prescription findings | 2026-05-17 14:55Z |
| #157 | `aa51799` | docs: design p0 textual patch batch | 2026-05-17 15:21Z |
| #158 | `a1439b9` | fix: restore p0 source-confirmed text | 2026-05-18 10:52Z |
| #159 | `ec2e009` | fix: correct p0 prescription answer | 2026-05-18 11:34Z |
| #160 | `80fe916` | fix: restore source-confirmed prescription text | 2026-05-18 11:43Z |
| #161 | `b29a8f4` | fix: sort sections by reference order | 2026-05-18 13:59Z |
| #162 | `ba1e26b` | fix: tighten review spacing | 2026-05-18 14:26Z |

---

## 3. 全体サマリー

| 観点 | 内容 |
|---|---|
| docs PR 数 | 7 件（#152, #153, #154, #155, #156, #157, #162 の docs 部） |
| data patch PR 数 | 3 件（#158, #159, #160） |
| UI fix PR 数 | 2 件（#161, #162） |
| answerBoolean 修正 | 1 件（時効 #17, false → true） |
| source-confirmed Q/E patch 対象 | 6 problems（A1 5 件 + 時効 #5） |
| DATA_VERSION bump 回数 | 3 回 |
| 触ったセクション | 民法・総則 `03_代理` / `04_無効・取消し・条件・期限` / `06_時効` |
| /exercise 全章 sort 改善 | 19 chapters すべて |
| stash@{0} | 引き続き残存（履歴として保管） |

---

## 4. PR 別変更履歴テーブル

| PR | 種別 | 変更ファイル | 主な内容 |
|---|---|---|---|
| #152 | docs | `p0_source_check_03_dairi_ai_deep_dive.md` | 03_代理 #15 / #30 の書籍原本照合ログ |
| #153 | docs | `ai_deep_dive_muko_torikeshi_problem_mapping_audit.md` | 無効・取消し 8 問の AI Deep Dive 指摘 mapping audit |
| #154 | docs | `p0_source_check_muko_torikeshi_ai_deep_dive.md` | 無効・取消し #2 / #8 の書籍原本照合ログ |
| #155 | docs | `ai_deep_dive_jikou_problem_mapping_audit.md` | 時効 25 問の AI Deep Dive 指摘 mapping audit |
| #156 | docs | `p0_source_check_jikou_ai_deep_dive.md` | 時効 #5 / #17 / #21 の書籍原本照合ログ（#17 で answerBoolean 矛盾 confirmed） |
| #157 | docs | `p0_textual_patch_design_6_problems.md` | A1 5 件 batch / A2 時効 #5 caveat / #17 単独 PR の patch design |
| #158 | data | `data/reviewed_import.json`, `public/data/reviewed_import.json`, `src/lib/db.ts` | A1 5 件 textual-only patch + DATA_VERSION bump |
| #159 | data | 同上 | 時効 #17 answerBoolean `false → true` + Q/E text + DATA_VERSION bump |
| #160 | data + docs | 上記 + `p0_source_recheck_jikou_05.md` | 時効 #5 caveat 解消 + Q/E text + DATA_VERSION bump |
| #161 | UI | `src/app/exercise/page.tsx` | /exercise セクション sort を sourcePageQuestion/sourcePage/seqNo ベースに変更 |
| #162 | UI + docs | `src/app/review/page.tsx`, `review-padding-density/change_history_20260518.{md,html}` | /review padding density fix + 変更履歴 MD/HTML |

---

## 5. OCR / source-confirmed 系の流れ

### サブセッション 1: 03_代理（民法・総則・代理）

- audit doc は前セッション PR #151（範囲外）で merge 済み
- 本セッション開始時に source-check doc を **PR #152** で固定
- 対象 problemId:
  - `KB2025-p230-q01` seq=6（書籍 p.586 #21、ab=×）
  - `KB2025-p233-q01` seq=3（書籍 p.568 #15、ab=○）
- source 確認方法: `images_preprocessed/0230.png`, `0233.png` 高解像度読込
- 結論: answerBoolean は両者とも書籍と一致して正しい。Q（と #15 の E）のみ OCR/parser hallucination 起因の崩れを書籍原文で置換する

### サブセッション 2: 無効・取消し・条件・期限

- AI Deep Dive 指摘 8 問の mapping audit を **PR #153** で固定
- 対象 P0 problemId:
  - `KB2025-p236-q01` seq=1（書籍 p.574 #8、ab=×、E 整形）
  - `KB2025-p237-q01` seq=1（書籍 p.576 #14、ab=○、「畏怖の状態が続いたので」など）
- source-check doc を **PR #154** で固定
- audit 段階で「#2 の E は法的に誤説明」と推定したが、書籍 E 自体が同じ記述だったため OCR崩れ部分のみ修正する方針に補正

### サブセッション 3: 時効

- AI Deep Dive 指摘 25 問の mapping audit を **PR #155** で固定
- 対象 P0 problemId:
  - `KB2025-p242-q01` seq=4（書籍 p.586 #4、**ab=○ ← 現状 false と矛盾**）
  - `KB2025-p240-q01` seq=5（書籍 p.582 #9、ab=×、Q+E parser hallucination + 判例主体逆転）
  - `KB2025-p244-q01` seq=2（書籍 p.590 #3、ab=×、Q+E 全文崩壊）
- source-check doc を **PR #156** で固定
- **#17 は本セッション初の confirmed answerBoolean 修正案件**（民法152条2項の被保佐人承認）
- #5 は当初 caveated だったが、本セッション後半で `images/0240.png`（raw）を高解像度で再読込し caveat 解消

---

## 6. data patch 系の流れ

A: textual-only patch のグループ → 1 つの batch にまとめ
B: answerBoolean 変更を含むもの → 単独 PR

### #157: 統合 patch design

- A1（exact source-confirmed 5 件）: `KB2025-p230-q01/6`, `KB2025-p233-q01/3`, `KB2025-p236-q01/1`, `KB2025-p237-q01/1`, `KB2025-p244-q01/2`
- A2（caveated）: 時効 #5（後の追加 source 確認で解消）
- B（answerBoolean 変更あり）: 時効 #17

### #158: A1 batch 実装

- 5 件すべて Q/E のみ修正、answerBoolean は不変
- DATA_VERSION: `2026-05-06-question-type-descriptive` → `2026-05-18-p0-textual-fix-a1`
- 全体 answerBoolean count 不変（true: 1134 / false: 1314）

### #159: 時効 #17 単独 PR

- `KB2025-p242-q01` seq=4 の answerBoolean を `false → true` に修正、Q/E も書籍原文に置換
- DATA_VERSION: `2026-05-18-p0-textual-fix-a1` → `2026-05-18-p0-answer-fix-b1`
- 全体 answerBoolean count: true `1134 → 1135` / false `1314 → 1313`（+1 / -1）

### #160: 時効 #5 caveat 解消 + patch

- 当初 caveated として A1 batch から除外していたが、本セッション内で `images/0240.png` 高解像度版で再読込
- Q「これを建物賃借人Cに賃貸している場合に」/ E「直接利益を受けるのは『建物の所有者』」を exact confirmed
- answerBoolean は不変（false）、Q/E のみ書籍原文に置換
- DATA_VERSION: `2026-05-18-p0-answer-fix-b1` → `2026-05-18-p0-textual-fix-a2`

---

## 7. DATA_VERSION 変遷

| 時点 | DATA_VERSION | bump 理由 |
|---|---|---|
| セッション開始時 | `2026-05-06-question-type-descriptive` | — |
| #158 merge 後 | `2026-05-18-p0-textual-fix-a1` | A1 batch（5 件 Q/E）反映のため既存ユーザー再 import |
| #159 merge 後 | `2026-05-18-p0-answer-fix-b1` | 時効 #17 answerBoolean 修正反映のため |
| #160 merge 後 | `2026-05-18-p0-textual-fix-a2` | 時効 #5 Q/E 反映のため |
| #161 merge 後 | （変更なし） | UI sort 修正のみ、データ更新なし |
| #162 merge 後 | （変更なし） | UI padding 修正のみ、データ更新なし |

→ 既存ユーザーが次回ログインすると `refreshProblemDataIfNeeded` が走り、`a2` までの全更新が一括取り込まれる。

---

## 8. answerBoolean 変更の有無

| PR | answerBoolean 変更 | 件数 |
|---|---|---|
| #152〜#157 | なし | 0 |
| #158 | なし | 0（A1 5 件すべて ab 不変） |
| **#159** | **あり** | **1（時効 #17、false → true）** |
| #160 | なし | 0（時効 #5 ab 不変） |
| #161, #162 | なし | 0（UI 修正のみ） |

**本セッション中の answerBoolean 修正は #159 の 1 件のみ**。全体カウント: `true: 1134 → 1135`, `false: 1314 → 1313`。

---

## 9. UI 修正系の流れ

### #161: /exercise 参考書順 section sort

- 問題: `src/app/exercise/page.tsx` の `loadCurriculumData` で section sort が `sectionTitle.localeCompare('ja-JP')` を主キーにしており、参考書順と一致しない
- 例: 民法・物権で `02_物権変動と登記` が最初、`不動産物権変動` が末尾近くに来てしまう
- 修正: `sourcePageQuestion → sourcePage → seqNo → sectionTitle` の優先順位で sort
- 全 19 chapters で pageRef 単調増加を確認

### #162: /review padding density

- 問題: セッション初期に user が「間かくなりすぎ」と指摘した余白
- 当時 stash で保留していた変更を本セッション末で再現
- 変更箇所: 8 種類 / 15 ヶ所（root container, stats card, refresh button, tab button, TopicCard header）
- stash@{0} は read-only で内容確認のみ、apply/drop は実行せず

---

## 10. 参考書順ソート修正の内容（#161 詳細）

| sort 優先度 | 内容 | fallback |
|---|---|---|
| 1 | min sourcePageQuestion（参考書ページ番号） | `UNKNOWN_ORDER = 999999` |
| 2 | min sourcePage（Kindle キャプチャ番号） | 同上 |
| 3 | min seqNo（problemId の `-qNN` から抽出） | 同上 |
| 4 | sectionTitle.localeCompare('ja-JP') | tiebreaker |

**before / after 例（民法・物権 top 5）:**

Before（sectionTitle 文字列順）:
1. `02_物権変動と登記`（pageRef 596）
2. `3 所有権 1) 所有権の限界 (相隣関係)`（pageRef 614）
3. `4 用益物権`（pageRef 626）
4. `その他`（pageRef 626）
5. `一括競売`（pageRef 660）

After（参考書順）:
1. `不動産物権変動`（pageRef 592）
2. `物権的請求権`（pageRef 592）
3. `物権総論`（pageRef 594）
4. `02_物権変動と登記`（pageRef 596）
5. `登記を対抗要件とする物権変動`（pageRef 598）

---

## 11. /review padding density fix の内容（#162 詳細）

stash@{0}（base `9c3793d`）を read-only で確認し、内容を current main `b29a8f4` に手動再現。

| 対象 | before | after |
|---|---|---|
| TopicCard header | `p-4 space-y-1.5` | `px-3 py-2.5 space-y-1` |
| ページ root | `pt-6 space-y-6` | `pt-4 space-y-3` |
| Stats grid | `grid grid-cols-3 gap-3` | `grid grid-cols-3 gap-2` |
| Stats card × 3 | `rounded-xl ... p-3` | `rounded-lg ... px-2 py-1.5` |
| Stats 数値 × 3 | `text-2xl` | `text-xl` |
| Stats ラベル × 3 | `text-xs text-slate-400` | `text-[10px] text-slate-400` |
| Refresh button | `rounded-xl py-3` | `rounded-lg py-2 text-sm` |
| Tab × 2 | `py-2` | `py-1.5` |

Diff stat: **15 insertions / 15 deletions**（stash@{0} と完全一致）。

---

## 12. 変更したファイル分類

| 分類 | ファイル | PR |
|---|---|---|
| data（書籍原本由来の textual fix + ab fix） | `data/reviewed_import.json` | #158, #159, #160 |
| public data（同上、同期） | `public/data/reviewed_import.json` | #158, #159, #160 |
| DATA_VERSION 管理 | `src/lib/db.ts` | #158, #159, #160 |
| UI sort logic | `src/app/exercise/page.tsx` | #161 |
| UI padding | `src/app/review/page.tsx` | #162 |
| audit / source-check docs | `context/working/sessions/ocr-text-quality-source-check/*.md` | #152〜#157, #160 |
| UI change history docs | `context/working/sessions/review-padding-density/*.{md,html}` | #162 |

---

## 13. 変更しなかったもの

- **builder / type / 他ライブラリ**: `src/lib/review-pack-builder.ts`, `src/lib/review-syllabus-builder.ts`, `src/types/**` — 本セッションで一切触らず
- **taxonomy 系**: subjectCandidate / chapterCandidate / sectionTitle / questionType — 全 patch で不変
- **sourcePage 系**: sourcePage / sourcePageQuestion / sourcePageAnswer — 全 patch で不変
- **他 problem の Q/E/ab**: A1 5 件 + #17 + #5 以外は一切触らず
- **stash@{0}**: 履歴として残存。apply/drop なし
- **他 PR の OPEN 状態**: セッション中常に OPEN PR = 0（merge 完了まで次の PR を作らない）

---

## 14. 検証結果サマリー

各 patch PR で確認した代表的検証項目:

| 検証 | #158 | #159 | #160 | #161 | #162 |
|---|---|---|---|---|---|
| JSON parse | OK | OK | OK | — | — |
| data/public sync | OK | OK | OK | — | — |
| branch count = 2448 | OK | OK | OK | — | — |
| answerBoolean total 期待値 | OK | OK | OK | — | — |
| 対象外 ab 不変 | OK | OK | OK | — | — |
| src diff = DATA_VERSION 線 のみ | OK | OK | OK | — | — |
| `git diff --check` | clean | clean | clean | clean | clean |
| `tsc --noEmit` | pass | pass | pass | pass | pass |
| `npm run build` | pass | pass | pass | pass | pass |
| stash@{0} 残存 | OK | OK | OK | OK | OK |

---

## 15. 残タスク

### 短期（実機 user 確認）

- ログイン済みブラウザで `/exercise` を開き、民法 > 物権の先頭が `不動産物権変動` / `物権的請求権` / `物権総論` から始まることを確認
- ログイン済みブラウザで `/review` を開き、密度が改善されたことを確認
- ログイン済みブラウザで P0 5 件（#15, #30, #2, #8, #21）+ #17 + #5 の演習画面で Q/E と正誤判定が新テキスト・新 ab で出ることを確認

### 中期（mapping audit から派生）

- 03_代理 audit で P1 とした #17(audit番号), #23, #24, #29, #31 の source-check / patch
- 無効・取消し audit で P1 とした #5(audit番号), #7 の source-check / patch
- 時効 audit で P1 とした #1, #2(audit番号), #8, #19 の source-check / patch
- 時効 audit で P3 とした `「しないとは」→「しないときは」` 系統的 OCR 崩れの一括 patch（#22-#25）

### 長期

- parser / OCR 改善: 「漢字 → 英単語 hallucination」「E と ab の論理矛盾」検知ルール追加
- 民法 > 物権以外の chapter での参考書順 sort の user 実機確認
- stash@{0} の最終処分（履歴として保管継続 or drop）

---

## 16. stash@{0} の扱い

```
stash@{0}: WIP on main: 9c3793d docs: record descriptive ui re-qa (#141)
```

- セッション中、すべての作業前後で残存を確認
- #162 で stash 内容を read-only で参照し手動再現したが、stash 本体は touch せず
- 引き続き履歴として保管。今後の処理方針:
  - **継続保管（現方針）**: 派生 PR の origin として参照可能性を残す
  - drop: PR #162 と内容一致のため必要なら drop 可能、ただし急がない

---

## 17. 今後の運用ルール

- **PR 作成までは一気に進めてよい**
  - 実装 → tsc/build → diff 検証 → branch → commit → push → PR 作成 を 1 タスクで実行
- **エラー・検証 NG・想定外差分が出たら即停止**
  - 自己判断で修正して続行しない
  - retry しない（read-only 確認コマンドは可）
  - 停止時は: どの step / 実行コマンド / エラー内容 / git status / staged/unstaged/untracked / HEAD/origin/main / stash 状態 / 触ったファイルを報告
- **merge は必ず承認待ち**
  - pre-merge verification（mergeable / mergeStateStatus / Vercel SUCCESS）を確認した後、user の明示 merge 指示を待つ
  - merge 後は origin/main fast-forward と OPEN PR = 0 を再確認

---

## 注意事項

本 doc は MD を source of truth とする。HTML 版は閲覧用 snapshot であり、直接編集してはならない。
