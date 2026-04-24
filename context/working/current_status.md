# current_status — 現在の作業状況

最終更新: 2026-04-24 (v104 = 後半 L2 バッチ 4 import = p255 + p293-p320 = 29 ページ / 155 肢追加、Claude 自律運用 fourth cycle、batch size 20 → 30 ladder bump)

## 現在地 (confirmed, 2026-04-24 post-v104-batch4-import)

- **latest data merge (in-flight)**: v104 = 本 PR = batch 4 = 29 ページ / 155 肢（p255 = minpo-bukken 占有権 612/613 + p293-p320 = minpo-saiken 債権 684/685-738/739）
- **前回 data merge**: v103 = PR #75 squash `19af812c55dcf045db21a072345e4eaff7299639`（batch 3 = p271-p290 = 20 ページ / 95 肢）
- **前々回 data merge**: v102 = PR #73 squash `6695b7be671075eec9ebc5dced143a686e4f94c1`（batch 2 = p250 + p251-p270 excl. p255 = 20 ページ / 104 肢）
- **DATA_VERSION**: `2026-04-24-audit-v104-batch4-L2-p255-p293-320-import`
- **総ページ**: 280 → 309 (+29) / **総肢**: 1516 → 1671 (+155)
- **L1 本線**: ✅ 実質完了維持
- **後半 L2 取込**: **主レーン稼働中**（batch 4 成功 = 2026-04-24, Claude 自律運用 fourth cycle 完走、batch size 30 ladder 試験 OK）

## batch 4 結果サマリ

- **対象**: p255 retry（batch 2/3 carryover）+ 0291-0320（30 枚 capture）
- **capture 診断**: 0291 + 0292 = 既存 p290 の**二重撮り**検出（Kindle advance 失敗）→ **drop 確定**
  - 0291 seq2-5 = 既存 p290 と完全一致、seq1 micro OCR diff のみ（"当該家屋を" 脱落 1 箇所）
  - 0292 = 0291 と同 image
  - 初動 user 報告「0292 dup のみ」 → 後続調査で 0291 も dup 判明 → **同じ drop 原理の延長で 0291 も drop**（user 判断 GO 取得済）
- **OCR 成功**:
  - p255 = gemini-2.5-flash で 3 セッション連続失敗（503 → JSON truncation → fetch failed）→ **gemini-2.5-pro fallback で 7 肢回収**（batch 2/3 carryover P1 解消）
  - p308 = flash 初回 503 → retry で 5 肢回収
  - その他 27 pages = flash 初回成功
- **classification**: p255 = minpo-bukken 物権総論（占有権）/ p293-p320 = minpo-saiken 債権総論・契約各論
- **override**: p294 seq3 (chap=minpo-sozoku → minpo-saiken) + seq4 (chap=minpo-shinzoku → minpo-saiken)（sectionTitle「責任財産の保全 債権者代位権」で Gemini が代位行使対象で誤分類 → 債権者代位権の問題として修正）
- **needsSourceCheck**: p318 seq1（民法523条2項引用の `…` が `前項の` を省略している OCR artifact、layer 2 = ERROR_UNREADABLE_SOURCE までは escalate しない）
- **polarity suspect 8 件**: 全偽陽性（Q 否定形 + ans=True pattern、batch 3 と同じ、spot-check で整合確認）
- **欠損率 0/29 = 0% ≤ 10%** / duplicate 0 / mirror byte-identical / DATA_VERSION bump 済
- **batch 4 成功条件 5/5 通過**（詳細 handoff.md §後半 L2 取込 batch 4 実行ログ）

## batch 5 起点（補正後）

- **book page 740/741 先頭**（初動想定の 742/743 から修正）
- 理由: 0291+0292 dup で 2 spread 空撮り、Gemini の book_page label は全体 +2 systematic offset で誤り、実態 0320 = 738/739
- batch size ladder 判定: batch 4 の capture miss 条件を「dup 2 枚 = user 手作業 fail の範囲内」と判断、ただし OCR 安定性は OK → **batch 5 も 30 枚維持**（50 枚 bump は見送り）

## 主レーン / 副レーン 状態

- **A 取込 = 主レーン**: batch 4 完了。batch 5 は **book p740/741 以降 = screenshot 0291-0320 の次 (0321-) の Kindle capture 待ち**（30 枚、user action 唯一の依頼項目）
- **B 修正 = 副レーン**: open 上限 = 5。p006 B 群は B2/B3/B5/B6 closed、残 B1/B4 は P2 backlog
- **C queue**:
  - **P1 = p255 OCR retry**: ✅ **解消**（gemini-2.5-pro fallback、本 PR で import）。今後 flash persistent fail は pro fallback 確立運用
  - **P2 = p050 duplicate 判定**（継続、p051 優先 / p050 preserve / merge の 3 択、user 判断待ち）
  - **P3 (new) = p318 seq1 needsSourceCheck**: `…` が OCR abbreviation 由来と判明、現物 0318.png で seq1 E の verbatim 確認が必要（layer 2 escalate しない前提）
  - follow-up 3 本（P1-1 integration test / P1-2 PreservedAttrs 拡張 / P1-3 CLAUDE.md stale update）並行 open 対象

## Source of truth

- 判断基準: [`context/stable/ingestion_flow.md`](ingestion_flow.md への相対リンクは handoff.md 参照)（後半取り込みフロー v3、12 sections + 用語定義）
- 実行ログ: `context/working/handoff.md`
- 問題データ正本: `data/reviewed_import.json` + mirror `public/data/reviewed_import.json`

## 次セッションへの持ち越し

→ `handoff.md` の「次アクション」および `context/stable/ingestion_flow.md` §11 を参照
