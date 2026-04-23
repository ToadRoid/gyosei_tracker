# current_status — 現在の作業状況

最終更新: 2026-04-23 (v100 = PR #68 merged + PR #69 historical catchup merged + 後半取り込みフロー v3 source of truth 反映)

## 現在地 (confirmed, 2026-04-23)

- **latest data merge**: v100 = PR #68 squash `c763007808af7c2b0747578981f10da49541fc08`（B3 p006-q01 seq3 Q/E 層 1 restore + ans False→True polarity flip）
- **historical catchup merged**: PR #69 squash `a33657428be9f5006091c83f8db10c2ec42b4fd7`（v76/v78/v82/v86/v98 の recalcCorrect 漏れ 7 problemIds 一括回収）
- **DATA_VERSION**: `2026-04-22-audit-v100-p006-q01-seq3-qe-restore-polarity-flip`
- **総ページ**: 239 / **総肢**: 1312（不変）
- **L1 本線**: ✅ 実質完了維持
- **後半 L2 取込**: **主レーン shift 確定**（2026-04-23, v3 flow 採用）

## 主レーン / 副レーン 状態

- **A 取込 = 主レーン**: 後半 L2 バッチ 1 を次起票予定（screenshot → OCR → auto scan → import PR）
- **B 修正 = 副レーン**: open 上限 = 5。p006 B 群は B2/B3/B5/B6 closed、残 B1/B4 は **P2 backlog**（主レーンを止めない）
- **C queue**: follow-up 3 本（P1-1 integration test / P1-2 PreservedAttrs 拡張 / P1-3 CLAUDE.md stale update）並行 open 対象、エラー報告 #1-#3 は P2/P3

## Source of truth

- 判断基準: [`context/stable/ingestion_flow.md`](ingestion_flow.md への相対リンクは handoff.md 参照)（後半取り込みフロー v3、12 sections + 用語定義）
- 実行ログ: `context/working/handoff.md`
- 問題データ正本: `data/reviewed_import.json` + mirror `public/data/reviewed_import.json`

## 次セッションへの持ち越し

→ `handoff.md` の「次アクション」および `context/stable/ingestion_flow.md` §11 を参照
