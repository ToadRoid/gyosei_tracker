# current_status — 現在の作業状況

最終更新: 2026-04-25 (v108 = 後半 L2 バッチ 8 import = p411-p440 = 28 ページ / 165 肢追加（legit blank 2 ページ除外 = 基礎法学/業務関連諸法令 章扉）、Claude 自律運用 eighth cycle、既 capture 済運用 2 回目、batch size 30 枚維持、**subject 境界 2 つ = shoho→kiso-hogaku + kiso-hogaku→kiso-chishiki**)

## 現在地 (confirmed, 2026-04-25 post-v108-batch8-import)

- **latest data merge (in-flight)**: v108 = 本 PR = batch 8 = 28 ページ / 165 肢（shoho-kaisha 99 + kiso-hogaku-gairon 32 + kiso-hogaku-funso 10 + kiso-chishiki-gyomu 24、book 920/921-978/979、legit blank 2 ページ除外 = p428/p436 = 基礎法学/業務関連諸法令 主章扉、p437 chap override）
- **前回 data merge**: v107 = PR #81 squash `3513703d0031d02fe5664fe52de150e17ba48e43`（batch 7 = p381-p410 = 27 ページ / 172 肢）
- **前々回 data merge**: v106 = PR #80 squash `6838ccb438dc1a0a03324d97ab7b5a67bfa8e3c9`（batch 6 = p351-p380 = 30 ページ / 152 肢）
- **DATA_VERSION**: `2026-04-25-audit-v108-batch8-L2-p411-440-import`
- **総ページ**: 395 → 423 (+28) / **総肢**: 2147 → 2312 (+165)
- **L1 本線**: ✅ 実質完了維持
- **後半 L2 取込**: **主レーン稼働中**（batch 8 成功 = 2026-04-25, Claude 自律 eighth cycle 完走、OCR 30/30 失敗 0 = 既 capture 済運用の安定性確認）

## batch 8 結果サマリ

- **対象**: 0411-0440 = 30 枚 = **28 ページ import + 2 legit blank**（capture dup なし、capture miss なし、既 capture 済 0411-0470 から抽出）
- **OCR 成功**:
  - main run (flash) = **30/30 OK、失敗 0**（retry 不要、batch 7 より安定）
  - うち 2 枚 (p428/p436) = 0 branches → 原本目視で主章扉確定
- **legit blank 2 ページ**:
  - p428 = 「V. 基礎法学」主章扉
  - p436 = 「VI. 業務関連諸法令」主章扉
  - branches=[] で import 対象外（batch 1/7 と同 pattern）
- **classification**: shoho-kaisha 99 (p411-p427) + kiso-hogaku-gairon 32 (p429-p433) + kiso-hogaku-funso 10 (p434-p435) + kiso-chishiki-gyomu 24 (p437-p440)
- **subject 境界 2 つ**:
  - #1 = p429: shoho → **kiso-hogaku 新 subject 初登場**（`src/data/master.ts:8` で既定義）
  - #2 = p437: kiso-hogaku → **kiso-chishiki 新 subject 初登場**（`src/data/master.ts:9` で既定義）
- **chapter override**: p437 全 6 肢 (gyosei/gyosei-ippan → kiso-chishiki/kiso-chishiki-gyomu)
  - Gemini が行政書士法 content を「行政」keyword で誤分類、章扉直後 context 修正
  - batch 4 p294 / batch 5 p328 / batch 6 p375 と同 pattern
- **cross-batch dup 0 件** / **within-batch dup 0 件**
- **polarity suspect 34 件**: 全偽陽性（spot-check 5/34 で整合確認 = 会社法304 / 423-424 / 罪刑法定主義 / 家事257 / 行書法17）
- **欠損率 0/30 = 0%**（blank 2 は「欠損」ではなく「legit」扱い）/ mirror byte-identical / DATA_VERSION bump 済
- **batch 8 成功条件 5/5 通過**（詳細 handoff.md §後半 L2 取込 batch 8 実行ログ）

## batch 9 = 最終 batch（capture 追加不要）

- **0441-0470 = 30 枚既 capture 済**（book 末尾 Location 1034/1034 到達予定）
- **batch 9**: 0441-0470 = 30 枚 = book 980/981-1034 相当、Claude 自律 ninth cycle（user action 不要）
- book 末尾到達 = batch 9 で後半 L2 完走予定、dup drop 可能性あり

## 主レーン / 副レーン 状態

- **A 取込 = 主レーン**: batch 8 完了。batch 9 = 最終 batch、既 capture 済 0441-0470 から Claude 自律再開可能（user action 不要）
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
