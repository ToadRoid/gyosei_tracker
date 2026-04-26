# current_status — 現在の作業状況

最終更新: 2026-04-26 (SHA backfill + override script 使い方 5 行メモ = handoff-only PR、🎯 **後半 L2 完走 + override cycle 完了 = 真の pause 状態**、data 変更なし / DATA_VERSION v109 維持)

## 現在地 (confirmed, 2026-04-26 post-PR-87-merge = 🎯 真の pause 状態)

- **latest data merge**: v109 = PR #83 squash `9618259c5ecf56080ad0141590b72fc663b5df4c`（batch 9 = 最終 batch = 23 ページ / 136 肢、book end 到達）
- **後続 handoff-only / docs / scripts PR (post-v109)**:
  - PR #84 = `f01b1de` v109 SHA backfill
  - PR #85 = `5c29bf8` P2/P3 close
  - PR #86 = `f44565c` override 設計メモ (`docs/override_rule_design.md`)
  - PR #87 = `c6a525f` override proposal tool 実装 (`scripts/check_classification.py` + `_test.py`、self-test 18/18 PASS)
- **latest main HEAD at handoff edit time**: `c6a525f1789ed1f82c8328ddddb5a4a6f10243a3`（PR #87 merge commit）
- **DATA_VERSION**: `2026-04-25-audit-v109-batch9-L2-p441-470-import-finalbatch`
- **🎯 最終総ページ**: 423 → **446** (+23) / **🎯 最終総肢**: 2312 → **2448** (+136)
- **L1 本線**: ✅ 実質完了維持
- **L2 本線**: 🎯 **完走確定**（batch 1-9 累計 9 cycle、PR #83 merge 完了、book 末尾 Location 1022/1023 = 問題末尾、p465-p470 = 奥付 + Kindle end UI、後続 batch なし）
- **A レーン = 主取込レーン**: 🎯 **完走**

## batch 9 結果サマリ（最終 batch）

- **対象**: 0441-0470 = 30 枚 = **23 ページ import + 7 legit blank**（= book end 到達）
- **OCR 成功**:
  - main run (flash) = 27/30 OK, 3 失敗 (p446/p460/p462 = 503)
  - retry 1 (flash) = p446/p460 解消
  - retry 2 (flash + 45s sleep) = p462 解消
  - pro fallback 不要
- **legit blank 7 ページ**（原本目視確定）:
  - p453 = 「VII. 情報通信・個人情報保護」主章扉
  - p465 = 書籍末尾 正誤問い合わせ page
  - p466 = 監修者プロフィール + copyright
  - p467 = 電子書籍版 奥付 (ISBN 978-4-8471-5211-5)
  - p468-p470 = Kindle「End of Book」UI × 3 枚 = book 末尾到達確定
- **classification**: kiso-chishiki-gyomu 76 (p441-p452) + kiso-chishiki-joho 60 (p454-p464)
- **chapter 境界**: p454 kiso-chishiki-gyomu → kiso-chishiki-joho（p453 VII章扉 直後）
- **章 context-based override**: **14 ページ 86 肢 = 過去最大**
  - p442-p447/p450-p452 (10 ページ = 9 + p448) = gyosei/gyosei-ippan → kiso-chishiki/kiso-chishiki-gyomu
  - p448 = minpo/minpo-shinzoku → kiso-chishiki/kiso-chishiki-gyomu（戸籍法 content、民法親族誤引き）
  - p455/p461/p463/p464 = gyosei/gyosei-ippan → kiso-chishiki/kiso-chishiki-joho
  - 根拠: Gemini 自身 sectionTitle を正しく認識 + 章 context 明確（sectionTitle-first rule）
- **cross-batch dup 0 件** / **within-batch dup 0 件**
- **polarity suspect 41 件**: 全偽陽性（spot-check 5/41 整合確認 = 公文書管理法10 / 行書法8-2 / 行書法6-2 / 施行規則9 / 施行規則5）
- **欠損率 0/30 = 0%**（blank 7 は「欠損」ではなく「legit」扱い = book end 到達）/ mirror byte-identical / DATA_VERSION bump 済
- **batch 9 成功条件 5/5 通過**（詳細 handoff.md §後半 L2 取込 batch 9 実行ログ）

## 🎯 後半 L2 完走後の状態

- **A 取込 = 主レーン**: 🎯 **完走**（batch 1-9 完了、book 末尾到達、後続 batch なし）
- **B 修正 = 副レーン**: open 上限 = 5。p006 B 群は B2/B3/B5/B6 closed、残 B1/B4 は P2 backlog（高解像度 recrop 待ち）
- **C queue**:
  - **P1 = p255 OCR retry**: ✅ v104 で解消済（pro fallback pattern 確立）
  - **P2 = p050 duplicate 判定**: ✅ **closed（本 PR）= `p051 優先 / 現状維持`**（同 spread 二重 capture 確認、batch 1 auto-scan の判断は正しかった）
  - **P3 = p318 seq1 needsSourceCheck**: ✅ **closed（本 PR）= `書籍 verbatim / OCR 正確 / E 本文修正不要`**（書籍そのものが `…` 印字 = 「前項の」を著者が意図的省略、旧「OCR abbreviation」説は誤り）。flag は informational として維持、次 data 変更 PR で fold して clear 候補
  - follow-up 3 本（P1-1 integration test / P1-2 PreservedAttrs 拡張 / P1-3 CLAUDE.md stale update）並行 open 対象
- **残 follow-up（PR #85/#86/#87 完了後 更新 = 真の pause 状態）**:
  1. ~~P2 = p050 duplicate 判定~~ ✅ closed (PR #85)
  2. ~~P3 = p318 seq1 needsSourceCheck~~ ✅ closed (PR #85、flag は次 data PR で clear 候補)
  3. ~~override ロジックの script 化~~ ✅ closed (PR #86 設計メモ + PR #87 実装、self-test 18/18 PASS)
  4. **p006 B1/B4**（副レーン、高解像度 recrop 到着まで待機、頻度低）
  5. **`context/stable/ingestion_flow.md` v3 → v4 bump**（実運用 1 回後に後ろ倒し、user directive 2026-04-26）

## Source of truth

- 判断基準: `context/stable/ingestion_flow.md`（後半取り込みフロー v3、12 sections + 用語定義）
- 実行ログ: `context/working/handoff.md`
- 問題データ正本: `data/reviewed_import.json` + mirror `public/data/reviewed_import.json`

## 次セッションへの持ち越し

→ `handoff.md` の「override script 使い方」5 行メモ + `docs/override_rule_design.md` を参照。**🎯 真の pause 状態**: A レーン完走 + C queue 全 close + override 設計/実装 cycle 完了 = 次 trigger まで実作業なし。**次の trigger**: (a) 新書投入 (= 次バッチ取込開始) / (b) p006 高解像度 recrop 到着 (= B1/B4 再開) のどちらか。

新書投入時の運用 (5 ステップ):
1. Gemini OCR → `data/parsed_gemini_<ts>.json`
2. `python3 scripts/check_classification.py <input>` で proposal を確認
3. auto_apply は `parsed_gemini_<ts>_final.json` 作成時に適用
4. review_queue は個別判定
5. importParsedBatch で `reviewed_import.json` に取り込み

実運用 1 回後に `context/stable/ingestion_flow.md` を v4 へ正式 bump 予定。
