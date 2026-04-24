# current_status — 現在の作業状況

最終更新: 2026-04-24 (v105 = 後半 L2 バッチ 5 import = PR #78 squash merged、Claude 自律運用 fifth cycle 完走、batch size 30 枚維持)

## 現在地 (confirmed, 2026-04-24 post-v105-merge)

- **latest data merge**: v105 = PR #78 squash `2c75251d3d834d0a427af65f28cbb4c1e0abe38f`（batch 5 = p322-p350 = 29 ページ / 152 肢、minpo-saiken 契約各論、book 742/743-798/799、章境界なし）
- **前回 data merge**: v104 = PR #76 squash `3e25fb9b83e1cd1b391b92fd81835eb2bbb6e703`（batch 4 = p255 + p293-p320 = 29 ページ / 155 肢）
- **前々回 data merge**: v103 = PR #75 squash `19af812c55dcf045db21a072345e4eaff7299639`（batch 3 = p271-p290 = 20 ページ / 95 肢）
- **PR #77 (v104 SHA backfill handoff-only)**: merged = `2b9e81c1e9a11471cf3fea3bf74eb912eba83cef`
- **DATA_VERSION**: `2026-04-24-audit-v105-batch5-L2-p322-350-import`
- **総ページ**: 309 → 338 (+29) / **総肢**: 1671 → 1823 (+152)
- **L1 本線**: ✅ 実質完了維持
- **後半 L2 取込**: **主レーン稼働中**（batch 5 成功 = 2026-04-24, Claude 自律運用 fifth cycle 完走、batch size 30 枚維持）

## batch 5 結果サマリ

- **対象**: 0321-0350 = 30 枚 capture → 0321 drop → **0322-0350 = 29 ページ / 152 肢**
- **capture 診断（Claude 起点指示ミス由来）**:
  - **0321 = 既存 p320 の二重撮り確定**（verbatim: seq1-5/7 = 100% 一致、seq6 = 2 char OCR variance）
  - **原因**: Claude が「起点 = book p740/741」と user へ誤 directive 発信（正しくは 742/743、p320 = 740/741 済のため）
  - **user 手作業ミスではない**、recapture 不要、drop 確定
- **過去記述訂正**: batch 4 handoff/PR の「0320 = 738/739」は誤り、**正しくは p320 = 740/741**。「Gemini book_page +2 systematic offset」論も誤観測（0291/0292 dup 由来）
- **OCR 成功**:
  - main run (flash) = 25/30 OK, 5 失敗 (p322/p328/p336/p337/p349 = 503)
  - retry 1 (flash) = 5/5 解消、**pro fallback 不要**
- **classification**: 全 152 肢 = minpo-saiken（契約各論・債権以外の債権発生原因）、**章境界なし**
- **override**: p328 seq1 (chap=minpo-bukken → minpo-saiken) + seq2 (chap=minpo-sosoku → minpo-saiken)（売主担保責任 page、Gemini が fact-pattern 基礎概念に引きずられ誤分類、batch 4 p294 と同 pattern）
- **polarity suspect 28 件**: 全偽陽性（Q 否定形 + ans=True pattern、batch 3/4 と同じ、spot-check 5/28 で整合確認）
- **within-batch q_head dup 7 件**: 全 legitimate textbook repeat（同 fact-pattern / 異なる legal issue = 委任/事務管理/賃貸借譲渡/危険負担 etc）
- **欠損率 0/29 = 0% ≤ 10%** / mirror byte-identical / DATA_VERSION bump 済
- **batch 5 成功条件 5/5 通過**（詳細 handoff.md §後半 L2 取込 batch 5 実行ログ）

## batch 6 起点（正しい数字）

- **book page 800/801 先頭**（0351.png から 30 枚 = 書籍 800-858 相当）
- 理由: 0350 = book 798/799、次 = 800/801
- batch size ladder 判定: capture dup 1 枚は **Claude 起点指示ミス由来、user 手作業系統的 miss ではない** + OCR 安定性完全（flash retry 1 で全解消） → **batch 6 も 30 枚維持**（50 枚 bump は見送り、指示起源ミス再発防止優先）

## 再発防止

- 起点 book page を user へ指示する前に、**必ず `data/reviewed_import.json` で直前ページの Q/A book_page を直接確認**する運用に変更
- 従来の「Gemini book_page label +2 offset 補正」ロジックは廃止（観測誤認と判明）

## 主レーン / 副レーン 状態

- **A 取込 = 主レーン**: batch 5 完了。batch 6 は **book p800/801 以降 = screenshot 0351.png から 30 枚の Kindle capture 待ち**（user action 唯一の依頼項目）
- **B 修正 = 副レーン**: open 上限 = 5。p006 B 群は B2/B3/B5/B6 closed、残 B1/B4 は P2 backlog
- **C queue**:
  - **P1 = p255 OCR retry**: ✅ v104 で解消済（pro fallback pattern 確立）
  - **P2 = p050 duplicate 判定**（継続、p051 優先 / p050 preserve / merge の 3 択、user 判断待ち）
  - **P3 = p318 seq1 needsSourceCheck**（継続、現物 `images/0318.png` で verbatim 確認必要、layer 2 escalate しない前提）
  - follow-up 3 本（P1-1 integration test / P1-2 PreservedAttrs 拡張 / P1-3 CLAUDE.md stale update）並行 open 対象

## Source of truth

- 判断基準: [`context/stable/ingestion_flow.md`](ingestion_flow.md への相対リンクは handoff.md 参照)（後半取り込みフロー v3、12 sections + 用語定義）
- 実行ログ: `context/working/handoff.md`
- 問題データ正本: `data/reviewed_import.json` + mirror `public/data/reviewed_import.json`

## 次セッションへの持ち越し

→ `handoff.md` の「次アクション」および `context/stable/ingestion_flow.md` §11 を参照
