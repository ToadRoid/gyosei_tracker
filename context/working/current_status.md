# current_status — 現在の作業状況

最終更新: 2026-04-25 (v106 = 後半 L2 バッチ 6 import = p351-p380 = 30 ページ / 152 肢追加、Claude 自律運用 sixth cycle、batch size 30 枚維持、120 枚一括 capture 試験 OK)

## 現在地 (confirmed, 2026-04-25 post-v106-batch6-import)

- **latest data merge (in-flight)**: v106 = 本 PR = batch 6 = 30 ページ / 152 肢（saiken 51 + shinzoku 74 + sozoku 27、book 800/801-858/859、章境界 2 つ）
- **前回 data merge**: v105 = PR #78 squash `2c75251d3d834d0a427af65f28cbb4c1e0abe38f`（batch 5 = p322-p350 = 29 ページ / 152 肢）
- **前々回 data merge**: v104 = PR #76 squash `3e25fb9b83e1cd1b391b92fd81835eb2bbb6e703`（batch 4 = 29 ページ / 155 肢）
- **PR #79 (v105 SHA backfill handoff-only)**: merged = `725866148cb8f6ec2368c7fad867360466c90380`
- **DATA_VERSION**: `2026-04-25-audit-v106-batch6-L2-p351-380-import`
- **総ページ**: 338 → 368 (+30) / **総肢**: 1823 → 1975 (+152)
- **L1 本線**: ✅ 実質完了維持
- **後半 L2 取込**: **主レーン稼働中**（batch 6 成功 = 2026-04-25, Claude 自律運用 sixth cycle 完走、120 枚一括 capture 試験 OK）

## batch 6 結果サマリ

- **対象**: 0351-0380 = 30 枚 = **30 ページ / 152 肢**（capture dup なし、capture miss なし）
- **一括 capture 試験 OK**: user は 0351-0470 = 120 枚を一度に capture（「スクショだけ全部」試験運用）、focus 保持成功、残り book 末尾 Location 1034/1034 まで含む全量を取得済
- **OCR 成功**:
  - main run (flash) = 22/30 OK, 8 失敗 (p352/p353/p356/p360/p362/p363/p364/p367 = 503)
  - retry 1 (flash) = 6/8 解消（p352/p353 残）
  - retry 2 (flash + 30s sleep) = 2/2 解消、**pro fallback 不要**
- **classification**: saiken 51 + shinzoku 74 + sozoku 27、**章境界 2 つ**: p363 saiken → shinzoku 親族編 / p376 shinzoku → sozoku 相続編
- **override**: p375 seq1 (sosoku → shinzoku)（補助制度 Q、textbook context = 親族編、batch 4 p294 / batch 5 p328 と同 pattern）
- **cross-batch dup 2 件**: p351 seq1 (vs p350) / p354 seq2 (vs p330) = 両方 textbook repeat（book_page 異なる + 後半 legal issue 異なる）→ retain
- **within-batch dup 6 件**: 全 legitimate textbook repeat（不倫関係贈与 / 幼児責任能力 / 居住建物贈与）→ retain
- **polarity suspect 27 件**: 全偽陽性（Q 否定形 + ans=True pattern、batch 3/4/5 と同じ、spot-check 5/27 で整合確認）
- **欠損率 0/30 = 0% ≤ 10%** / mirror byte-identical / DATA_VERSION bump 済
- **batch 6 成功条件 5/5 通過**（詳細 handoff.md §後半 L2 取込 batch 6 実行ログ）

## batch 7 以降（capture 追加不要）

- **0381-0470 = 90 枚既 capture 済**（book 末尾 Location 1034/1034 まで含む）
- **batch 7**: 0381-0410 = 30 枚 = book 860/861-918/919 相当、Claude 自律 seventh cycle（user action 不要）
- **batch 8**: 0411-0440 = 30 枚
- **batch 9**: 0441-0468 前後 = 28-30 枚（末尾調整 + dup drop 可能性）
- book 末尾到達予定 = batch 9

## 主レーン / 副レーン 状態

- **A 取込 = 主レーン**: batch 6 完了。batch 7 は **user action 不要**、既 capture 済 0381-0410 から Claude 自律再開可能
- **B 修正 = 副レーン**: open 上限 = 5。p006 B 群は B2/B3/B5/B6 closed、残 B1/B4 は P2 backlog
- **C queue**:
  - **P1 = p255 OCR retry**: ✅ v104 で解消済（pro fallback pattern 確立）
  - **P2 = p050 duplicate 判定**（継続、p051 優先 / p050 preserve / merge の 3 択、user 判断待ち）
  - **P3 = p318 seq1 needsSourceCheck**（継続、現物 `images/0318.png` で verbatim 確認必要、layer 2 escalate しない前提）
  - follow-up 3 本（P1-1 integration test / P1-2 PreservedAttrs 拡張 / P1-3 CLAUDE.md stale update）並行 open 対象

## Source of truth

- 判断基準: `context/stable/ingestion_flow.md`（後半取り込みフロー v3、12 sections + 用語定義）
- 実行ログ: `context/working/handoff.md`
- 問題データ正本: `data/reviewed_import.json` + mirror `public/data/reviewed_import.json`

## 次セッションへの持ち越し

→ `handoff.md` の「次アクション」および `context/stable/ingestion_flow.md` §11 を参照
