# handoff — 次セッション引き継ぎ

最終更新: 2026-04-24 (**post-v105-merge SHA backfill = handoff-only PR**, data 変更なし / DATA_VERSION v105 維持 / Q/E/ans 無変更): PR #78 (v105 batch 5 import) **squash merge 完了 = `2c75251d3d834d0a427af65f28cbb4c1e0abe38f`**（rebase 前 `mergeable: CONFLICTING` = local `b05be93` (v104 SHA backfill 手元 commit) が origin/main `2b9e81c` (PR #77 squash merge) と同内容で衝突 → `git rebase origin/main` で local 側 skip = conflict 0 件で解消、force-push 後 `MERGEABLE` 復帰して squash merge）。本 PR scope = handoff.md + current_status.md の SHA backfill のみ（`data/` / `public/data/` / `src/` / DATA_VERSION は一切触らない、PR #53 で確立した new policy 準拠）。**batch 6 計画確定**: 30 枚維持、起点 **book p800/801**（正しい数字、0351.png 以降）。user action = Kindle を book p800 に開いて `bash scripts/kindle_capture.sh 30` = 0351-0380 の 30 枚 capture。**再発防止**: 起点 book page を user に指示する前に `data/reviewed_import.json` で直前ページの Q/A book_page を直接確認する運用に変更、「Gemini book_page label +2 systematic offset」論は廃止（観測誤認と判明）。

旧: 2026-04-24 (**v105 = 後半 L2 バッチ 5 import = p322-p350 = 29 ページ / 152 肢追加**, data 変更あり / DATA_VERSION v104 → v105 bump / Claude 自律運用 fifth cycle / batch size 30 枚維持）: PR #77 (v104 SHA backfill) merge 完了後 user が **0321-0350 = 30 枚 capture** → Claude 自律再開。**capture 診断**: **0321 = 既存 p320 の二重撮り確定**（book 740/741 verbatim: seq1-5/7 = 100% 一致、seq6 = 2 char OCR variance「場台/場合」「賃借人/賃貸人」= 同 image 再 OCR 時 micro variance）→ **drop**。**原因 = Claude の起点指示ミス（user 手作業由来ではない）**: batch 4 handoff/PR で `0320 = 738/739` と記述したが、**実態は `p320 = 740/741`**（既存 reviewed_import.json 確認済）。この誤認を基に「batch 5 起点 = book p740/741」と user へ directive 発信 → 0321 が既存 p320 と同 spread を capture。**正しくは「起点 = book p742/743」= 0321 が 742/743 に当たるべき**だった。**過去記述訂正**: batch 4 handoff/PR の「Gemini book_page label は +2 systematic offset = 実態 0320 = 738/739 / batch 5 起点 = 740/741」は **誤り**。正しくは「0320 = 740/741、batch 5 起点 = 742/743」= **Gemini book_page label は正しかった**（+2 offset 論は 0291/0292 dup 由来の観測誤認だった可能性）。**OCR 成功**: main run 25/30 OK + 503 失敗 5（p322/p328/p336/p337/p349）→ flash retry 1 で 5/5 解消、pro fallback 不要。auto scan 結果: (i) **legitimate new content = 29 ページ / 152 肢**（全て minpo-saiken = 契約各論・債権以外の債権発生原因、book 742/743-798/799、**章境界なし**）→ **本 PR で import**。(ii) **override**: p328 seq1 (bukken → saiken) + seq2 (sosoku → saiken) = 売主担保責任 page で Gemini が基礎概念に引きずられ誤分類、batch 4 の p294 override と同 pattern。(iii) **polarity suspect 28 件**: 全偽陽性（Q 否定形 + ans=True = 正当な legal statement、spot-check 5/28 確認、batch 3/4 と同 pattern）。(iv) **within-batch q_head dup 7 件**: 全て legitimate textbook repeat（同 fact-pattern opening + 異なる legal issue = 委任/事務管理/賃貸借譲渡など）。**成果**: 実質 import +29 ページ / +152 肢。**総ページ 309 → 338 / 総肢 1671 → 1823**。mirror byte-identical 確認済、DATA_VERSION v104 → `2026-04-24-audit-v105-batch5-L2-p322-350-import`。**v3 flow §12 成功条件**: 対象 29 明示 / mirror byte-identical / DATA_VERSION bump / 欠損率 0/29 = 0% ≤ 10%（0321 drop は指示ミス由来で「欠損」ではなく「dup 削除」扱い）/ polarity gate 全通過 = **5/5 通過 = batch 5 成功**。**batch 6 起点**: **book p800/801**（正しい数字、0351.png 以降 30 枚 = 書籍 800-858 相当）。**batch size ladder 判定**: capture dup 1 枚は Claude 指示ミス由来で user 手作業系統的 miss ではない + OCR 安定性 OK（flash retry 1 で解消） → **batch 6 は 30 枚維持**（50 枚 bump は見送り、指示起源ミス再発防止優先）。**追加 user 依頼事項**: 次 batch 6 のため **book p800/801 以降の Kindle screenshot 捕捉**（30 枚 = 0351.png から、Kindle は book p800 を開いて開始）。

旧: 2026-04-24 (**post-v104-merge SHA backfill = handoff-only PR**, data 変更なし / DATA_VERSION v104 維持 / Q/E/ans 無変更): PR #76 (v104 batch 4 import) **squash merge 完了 = `3e25fb9b83e1cd1b391b92fd81835eb2bbb6e703`**。PR #74 (v102 SHA backfill handoff-only) は v104 本文に吸収済 = **close 確定**（mergeしない判定、old handoff を重ねるだけになるため obsolete）。本 PR scope = handoff.md + current_status.md の SHA backfill のみ（`data/` / `public/data/` / `src/` / DATA_VERSION は一切触らない、PR #53 で確立した new policy 準拠）。**batch 5 計画維持**: 30 枚、起点 book p740/741、user capture = 0321.png 以降 30 枚。**（注: 後続 v105 で「起点 p740/741」は誤りと判明、正しくは p742/743 だった）**

旧: 2026-04-24 (**v104 = 後半 L2 バッチ 4 import = p255 + p293-p320 = 29 ページ / 155 肢追加**, data 変更あり / DATA_VERSION v103 → v104 bump / Claude 自律運用 fourth cycle / batch size 20 → 30 ladder bump 試験 OK）: PR #75 (v103 batch 3) merge 完了 + `feedback_batch_autonomy.md` directive 継続適用で batch 4 を自律実行。範囲 = **p255 retry（batch 2/3 carryover）+ 0291-0320（30 枚 capture）**。**capture 診断**: 0291 + 0292 = 既存 p290 の**二重撮り**確定（0291 seq2-5 = 既存 p290 と 100% 完全一致、seq1 は micro OCR diff のみ = "当該家屋を" 脱落 1 箇所；0292 は 0291 と同 image）→ **両方 drop**（初動報告「0292 のみ dup」→ 後続調査で 0291 も dup 判明 → 同 drop 原理の延長で user GO 取得）。**OCR 成功**: p255 = flash 3 セッション連続失敗（503 → JSON truncation → fetch failed）→ **gemini-2.5-pro fallback で 7 肢回収** = P1 carryover 解消 / p308 = flash 初回 503 → retry で 5 肢回収 / その他 27 pages = flash 初回成功。auto scan 結果: (i) **legitimate new content = 29 ページ / 155 肢**（p255 = minpo-bukken 物権総論 占有権、book 612/613 + p293-p320 = minpo-saiken 債権総論・契約各論、book 684/685-738/739、**Gemini book_page label は +2 systematic offset = 0291/0292 空撮り由来**）→ **本 PR で import**。(ii) **override**: p294 seq3 (sozoku → saiken) + seq4 (shinzoku → saiken) = sectionTitle「責任財産の保全 債権者代位権」で Gemini が代位行使対象により誤分類、代位権の問題として修正。(iii) **needsSourceCheck**: p318 seq1 = 民法523条2項引用の `…` が `前項の` を省略している OCR abbreviation、layer 2 = ERROR_UNREADABLE_SOURCE までは escalate せず。(iv) **polarity suspect 8 件**: 全偽陽性（Q 否定形 + ans=True pattern、batch 3 同様）。**成果**: 実質 import +29 ページ / +155 肢。**総ページ 280 → 309 / 総肢 1516 → 1671**。mirror byte-identical 確認済、DATA_VERSION v103 → `2026-04-24-audit-v104-batch4-L2-p255-p293-320-import`。**v3 flow §12 成功条件**: 対象 29 明示 / mirror byte-identical / DATA_VERSION bump / 欠損率 0/29 = 0% ≤ 10% / polarity gate 全通過 = **5/5 通過 = batch 4 成功**。詳細 batch log は下記「後半 L2 取込 batch 4 実行ログ」セクション参照。**batch 5 起点**: book p740/741（初動想定の 742/743 から補正）。**batch size ladder 判定**: capture miss = user 手作業由来範囲内 + OCR 安定性 OK だが dup 2 枚検出あり → **batch 5 も 30 枚維持**（50 枚 bump は見送り）。**追加 user 依頼事項**: **次 batch 5 のため book p740/741 以降の Kindle screenshot 捕捉**（30 枚 = 0321.png から）。

旧: 2026-04-24 (**v103 = 後半 L2 バッチ 3 import = p271-p290 = 20 ページ / 95 肢追加**, data 変更あり / DATA_VERSION v102 → v103 bump / Claude 自律運用 third cycle）: user 依頼 (p271-p290 screenshot 捕捉) 完了後、`feedback_batch_autonomy.md` directive に従い batch 3 を自律実行。範囲 = **0271-0290 (新捕捉) = 計 20 ページ**（連続 20 ページ = v3 flow 条件達成）。Gemini 2.5 Flash OCR（2 run = main + retry1）結果: ✅ **20/20 pages OCR 成功** / ❌ 0 失敗（p275/p276 main 503 → retry1 で解消）。**p255 retry（batch 2 carryover）**: 24h 経過時点で再度 503 持続 → sub-lane P1 継続、batch 4 冒頭で再試行。auto scan 結果: (i) **legitimate new content = 20 ページ / 95 肢** (minpo-bukken 70 肢 p271-p285 = 担保物権・抵当権の効力・法定地上権・物上代位 + minpo-saiken 25 肢 p286-p290 = 債権総論冒頭、**p286 で chapter transition**、confidence 0.9-0.95、duplicate なし / `...` なし / empty subject なし / polarity spot-check 5 件全偽陽性 = Q 否定形 + ans=True 正当) → **本 PR で import**。(ii) **defer retry = 0**（batch 3 内で全解消）。**成果**: 実質 import +20 ページ / +95 肢。**総ページ 260 → 280 / 総肢 1421 → 1516**。mirror byte-identical 確認済、DATA_VERSION v102 → `2026-04-24-audit-v103-batch3-L2-p271-290-import`。**v3 flow §12 成功条件**: 対象 20 明示 / mirror byte-identical / DATA_VERSION bump / 欠損率 0/20 = 0% ≤ 10% / polarity gate 全通過 = **5/5 通過 = batch 3 成功**。詳細 batch log は下記「後半 L2 取込 batch 3 実行ログ」セクション参照。**追加 user 依頼事項**: **次 batch 4 のため p291 以降の Kindle screenshot 捕捉**（batch 3 で再び coverage 末尾 p290 に到達したため）。

旧: 2026-04-23 (**v102 = 後半 L2 バッチ 2 import = p250 + p251-p270 (excl. p255) = 20 ページ / 104 肢追加**, data 変更あり / DATA_VERSION v101 → v102 bump / Claude 自律運用 second cycle）: user 依頼 (p251-p270 screenshot 捕捉) 完了後、`feedback_batch_autonomy.md` directive に従い batch 2 を自律実行。範囲 = **p250 (batch 1 defer 分) + 0251-0270 (新捕捉) = 計 21 ページ**（連続 21 ページ、従来の 20 ページ条件達成）。Gemini 2.5 Flash OCR（3 run = main + retry1 + 単独 retry × 3）結果: ✅ **20/21 pages OCR 成功** / ❌ **p255 のみ 4 連続 503** で batch 1 の p250 同様 persistent 503 判定 → **sub-lane P1**（次セッション retry）。auto scan 結果: (i) **legitimate new content = 20 ページ / 104 肢** (全 minpo-bukken / 物権各論 = 物権総論・動産物権変動・即時取得・占有権・抵当権・混同・登記対抗要件、confidence 0.95 uniform、duplicate なし / `...` なし / empty subject なし / polarity spot-check 異常なし) → **本 PR で import**。(ii) **defer retry = 1 ページ** (p255 = 持続 503) → sub-lane P1 (次セッション先頭)。**成果**: 実質 import +20 ページ / +104 肢。**総ページ 240 → 260 / 総肢 1317 → 1421**。mirror byte-identical 確認済、DATA_VERSION v101 → `2026-04-23-audit-v102-batch2-L2-p250-270-import`。**v3 flow §12 成功条件**: 対象 21 明示 / mirror byte-identical / DATA_VERSION bump / 欠損率 1/21 = 4.8% ≤ 10% / polarity gate 全通過 = **5/5 通過 = batch 2 成功**。詳細 batch log は下記「後半 L2 取込 batch 2 実行ログ」セクション参照。**追加 user 依頼事項**: **次 batch 3 のため p271 以降の Kindle screenshot 捕捉**（batch 2 で再び coverage 末尾に到達したため）。

旧: 2026-04-23 (**v101 = 後半 L2 バッチ 1 import = p248 物権変動 5 肢追加**, data 変更あり / DATA_VERSION v100 → v101 bump / Claude 自律運用 first cycle）: PR #70 (`ddbeb049c5b03d903f3b97180ad27f659be49de8`, v3 flow source of truth) merge 完了後、`feedback_batch_autonomy.md` directive に従い Claude が **バッチ範囲決定 + Gemini OCR ローカル実行 + auto scan + import PR 起票** まで自律実行。バッチ範囲決定過程: `data/reviewed_import.json` の既存 problemId 網羅状態を scan し、p001-p249 の gap を列挙 → 10 gap [018, 019, 050, 067, 094, 121, 153, 166, 212, 248] + 未取込 p250 = 計 11 ページ。連続 20 ページ条件は **`images_preprocessed/` screenshot coverage が p250 で stop している**ため達成不可 → 既存 coverage 内の **全 gap + p250 = 11 ページ** を batch 1 として確定。Gemini 2.5 Flash OCR（`scripts/gemini_parse.js`）6 run 累計結果: ✅ 10/11 pages OCR 成功（p250 のみ 5 回連続 503 high demand で defer）。auto scan classification: (i) **legitimate new content = 1 ページ** (p248 = 物権変動, minpo-bukken, Q598/A599, 5 肢, confidence 0.95, `...` / broad raw / polarity mismatch なし) → **本 PR で import**。(ii) **duplicate suspected = 1 ページ** (p050 = 行政契約, gyosei-ippan, Q204/A205 — p051 と **Q/A page 番号 + 5 肢内容が完全重複** = Kindle 二重 capture 疑い) → **sub-lane P2 backlog**（user 判断待ち = p051 優先 / p050 preserve / merge 候補の 3 択）。(iii) **legitimately blank/index = 8 ページ** (p018/p019/p067/p094/p121/p153/p166/p212 = Gemini 返却 branches [] + parseError null、章扉 / 目次 / 白ページ / section 区切り扱い、original import 時も skip された設計意図一致) → handoff 記録のみ。(iv) **defer retry = 1 ページ** (p250 = 持続的 503、file size 2.8MB で capacity に抵触している可能性) → **sub-lane P1** (次セッション先頭 retry)。**成果**: 実質 import +1 ページ / +5 肢 (物権変動 sectionTitle 登記を対抗要件とする物権変動)。**総ページ 239 → 240 / 総肢 1312 → 1317**。mirror byte-identical 確認済、DATA_VERSION v100 → `2026-04-23-audit-v101-batch1-L2-p248-import`。**追加 user 依頼事項**: p250 以降の Kindle screenshot 捕捉 (batch 2 範囲確保のため後半 L2 続き画像が必要、キャプチャ p251-p270 程度)。詳細 batch log と分類は下記「後半 L2 取込 batch 1 実行ログ」セクション参照。

旧: 2026-04-23 (**後半取り込みフロー v3 運用文書反映 = 主レーン shift**, data 変更なし / DATA_VERSION v100 維持 / Q/E/ans 無変更): v100 (PR #68 squash = `c763007808af7c2b0747578981f10da49541fc08`) + **PR #69 historical catchup** (squash = `a33657428be9f5006091c83f8db10c2ec42b4fd7`, v76/v78/v82/v86/v98 polarity flip の `recalcCorrect` 漏れ 7 problemIds 一括回収) **merge 完了**。本 PR の scope は **`context/stable/ingestion_flow.md` 新規 = 後半取り込みフロー v3 を source of truth 化** + handoff-only 更新。**主レーン shift 確定**: v100 merge 完了時点で p006 B 群 (B2/B3/B5/B6) は closed to limit of source quality、**後半 L2 取込 = 主レーン**、**p006 B1 / B4 = P2 backlog**（主レーン停止理由にしない、次バッチ境界で再判定）。follow-up 3 本（P1-1 importParsedBatch integration test / P1-2 PreservedAttrs 拡張 / P1-3 CLAUDE.md + known_issues stale update）は副レーンで並行 open（上限 = 5 枠内）。詳細は [`context/stable/ingestion_flow.md`](../stable/ingestion_flow.md) 参照（判断基準の source of truth、本 handoff は実行ログ）。

旧: 2026-04-22 (**v100 = B3 p006-q01 seq3 Q/E verbatim restore + ans False→True polarity flip 束ね**, data 変更あり、DATA_VERSION v99 → v100 bump、1 seq / 1 PR、v82/v86 precedent = Q+E+ans bundled 束ねパターン): PR #67 sufficiency check 結論 `restore 可（B5/B6/B2 precedent = 二層運用、+ ans polarity flip 束ね候補）` を受けて層 1 = substantive restore + ans polarity flip を実施。(i) ans False → True flip（row 14 marker `○` + 苫米地判例整合）、(ii) E 冒頭「統治行為論の問題であり、判例は」→「いわゆる統治行為の問題である。判例（**最大判**昭35.6.8：苫米地事件）は、」（判例名補足 + 語尾 + 句点）、(iii) E 中盤 `...` → 3 段 concrete text restore（直接国家統治 / 法律上の争訟 / 裁判所の審査の対象）、(iv) E 末尾「判**断**している」→「判**示**している」（動詞 1 char 正字化）。**Q は無変更**（画像 row 14 左と現 DB Q が verbatim 一致と judge）。**二層表現採用**：層 1 = substantive risk mitigated + polarity flip（本 PR）／ 層 2 = image-quality-limited fragment（助詞 / 句読点 / subject 語句 marginal）は restore E 本文中に `...` literal を保持し **ERROR_UNREADABLE_SOURCE** として維持（B5 `0090.png` 中盤 / B6 `0118.png` 84条繋ぎ末尾 / B2 seq2 と同一運用）。PR #67 squash = `59cf4a1d2de1134a3e29095b8fdee045ac21ac1c` を backfill 同梱。他 seq (1/2/4) / 他ページ hash 変化なし、mirror byte-identical。) / 旧: 2026-04-22 (**B3 read-only sufficiency check = handoff-only 更新 + v99 merge SHA backfill + エラー報告 queue 記録**, PR #67 squash = `59cf4a1d2de1134a3e29095b8fdee045ac21ac1c` merged, data 変更なし / DATA_VERSION bump なし / v99 維持 / Q/E/ans 無変更): PR #66 squash = `ed924f247ee6c780f5185b4921d06728fead65be`（v99 = B2 Q/E 層 1 restore）着地後、`images_preprocessed/0006.png` で p006-q01 seq3（統治行為論, row 14）の Q / E / ans について **read-only で判読可否を判定**。**本 PR scope = handoff.md のみ**（`data/` / `public/data/` / Q / E / ans / DATA_VERSION は一切触らない）。**結論（binary）: `restore 可（B5/B6/B2 precedent = 二層運用、+ ans False→True polarity flip 同 PR 内束ね候補）`**。骨格・判例特定・polarity marker（画像 row 14 右列 `○`）は judge 十分、character-level verbatim の marginal fragment は restore PR 作業中に `...` literal 保持 = ERROR_UNREADABLE_SOURCE 扱い（B5/B6/B2 と同運用）。**PR #66 SHA backfill** を `latest data merge` / `latest main HEAD at handoff edit time` / 直近 data merge 履歴 の 3 箇所に反映。**エラー報告 queue 記録**（p194-q06 正誤の誤り / p197-q01 その他 / p198-q05 その他）を 別領域 / 未判定 / B 群後候補 として追加。次 PR = v100 = B3 seq3 Q/E + ans polarity flip verbatim restore（B 群継続 vs エラー報告 #1 = p194-q06 差し込みは B3 restore 完了後に再判定）。) / 旧: 2026-04-22 (**v99 = B2 p006-q01 seq2 Q/E verbatim restore**, PR #66 squash = `ed924f247ee6c780f5185b4921d06728fead65be` merged：PR #65 sufficiency check 結論 `restore 可（B5/B6 precedent = 二層運用）` を受けて層 1 = substantive restore を実施。E 冒頭「最判昭35.6.8」→「**最大判**昭35.6.8」1 char 補正 + E 中盤 `...` → 3 段構造 concrete text restore + E 末尾「〜という**本肢は誤っている**。」評価句 restore。ans=False 維持、DATA_VERSION v98 → v99 bump、PR #64 / PR #65 SHA backfill 同梱。) / 旧: 2026-04-22 (**v98 polarity hotfix**：`p006-q01 seq2` の `answerBoolean` を True → False に単独 flip。現 DB が Q「留保あり、司法審査は及ばない」/ E「留保は付されていない」で自己矛盾していたため、polarity のみ先行修正。**Q / E は未修正維持**。理由：p006 原本画像（`images/0006.png` / `images_preprocessed/0006.png`）が repo 内に未存在で、Q/E の verbatim restore は「推測禁止 / repo 実状態優先」ルールに抵触するため保留。**二層表現採用**：層 1 = polarity hotfix（ans flip 完了）／ 層 2 = Q/E verbatim restore 保留（原本画像到着待ち）。他 seq (1/3/4) 完全不変、他 seq の hash 変化なし確認済。DATA_VERSION v97 → v98 bump。)

post-merge 追加更新: 2026-04-22 (**handoff-only 更新 = v98 merge SHA backfill + p006 source 存在ログ**, data 変更なし / DATA_VERSION bump なし / v98 維持): v98 squash merge SHA = `671eb79f622bb797ec78b2c97788edba9ebe7b54`（PR #62）を `latest data merge` / `latest main HEAD at handoff edit time` / 直近 data merge 履歴の 3 箇所に backfill。同時に **p006 source 存在ログ**を追加：`~/Desktop/kindle_shots/0006.png`（kindle_capture.sh の OUTDIR デフォルト）に DB `p006` 対応の書籍見開き（書籍 p.116-117「裁判所」section の統治行為小項目）が scan されていることを確認（画像左ページ A 2段目 = seq2 Q 冒頭「内閣による衆議院の解散は、高度の政治性を有する国家行為であるから」が一致、右ページ 12 番が苫米地事件 E の原本）。**ただし現物は低解像度の見開き 1 枚**ゆえ「source existence の確認には使えるが、verbatim restore の根拠としては不十分」(user directive 2026-04-22)。**方針（固定）**: local-only 運用ではなく repo に source を残す。ただし **低解像度 0006.png のみを根拠に本文修正はしない**。**B1-B4 frozen 解除条件を「原本画像 repo 追加」→「高解像度 recrop 収載」に更新**。優先順 `B2 → B3 → B1 → B4` は維持、p006 は高解像度 source 収載まで frozen 扱い。

post-merge 追加更新 #2: 2026-04-22 (**p006 tracked preprocessed source derived from low-res raw を収載**, data 変更なし / DATA_VERSION bump なし / v98 維持): Claude 自力で `images_preprocessed/0006.png` を収載（6048x3536, 390KB, 既存 B5 `0090.png` / B6 `0118.png` と同仕様）。**出自（重要）**: 既存 low-res local raw `~/Desktop/kindle_shots/0006.png`（3024x1768）を `scripts/preprocess_images.py` に通して生成した **preprocessed 派生物**であり、**新しい高解像度 recrop そのものではない**。2x upscale + grayscale + CLAHE + 二値化 + 傾き補正 + 余白除去 + シャープ化は OCR 前処理 pipeline（既存 tracked と同一手順）。**user 手作業不要**（ユーザー directive 2026-04-22 「Claude 側で自力実行を試す」に応答）。**帰結（保守的評価, 2026-04-22 review 反映）**: `images_preprocessed/0006.png` の収載自体は完了だが、**resolution 起因の unreadable risk は未解消**。B1-B4 は **`pending / preprocessed source available, sufficiency unverified`** に状態変更（frozen 解除は保留）。次の実作業は **先に `images_preprocessed/0006.png` で B2 read-only sufficiency check** → 不十分なら **真の high-res recrop が引き続き必要**。優先順 `B2 → B3 → B1 → B4` は維持。**v98 polarity hotfix との整合**: 画像で苫米地事件（行 13）解説末尾に「『一見極めて明白に違憲無効と認められる場合を除き』という留保は付されていないという本肢は誤っている」と判読可能、v98 の ans=False polarity は維持で整合。**Q / E の verbatim restore は本 PR では行わない**（scope = image addition + handoff 更新のみ）。

post-merge 追加更新 #3: 2026-04-22 (**B2 seq2 read-only sufficiency check 実施 / 本 PR = handoff-only 更新のみ**, data 変更なし / DATA_VERSION bump なし / v98 維持 / Q/E/ans 無変更): PR #64 squash = `4c19f0843f874d93a07811c6d010d7694610411e` 着地後、`images_preprocessed/0006.png` で p006-q01 seq2（苫米地事件, row 13）の Q / E について **read-only で判読可否を判定**。**本 PR の scope は handoff.md の sufficiency ログ追加のみ**（`data/` / `public/data/` / Q / E / ans / DATA_VERSION は一切触らない）。**結論（binary）: `restore 可（B5/B6 precedent 準拠 = 二層運用）`**。骨格・結論句・polarity は judge 十分、character-level verbatim の marginal fragment は v99 作業中に `ERROR_UNREADABLE_SOURCE` 扱い（B5 `0090.png` 中盤 / B6 `0118.png` 84条末尾と同一運用）。詳細は下記「原本照合 / needsSourceCheck」セクション 2026-04-22 sufficiency ログ参照。**次 PR = v99 = B2 seq2 Q/E verbatim restore**（ans=False 維持、v99 PR 内で本 PR = sufficiency check PR の squash merge SHA を `latest main HEAD at handoff edit time` / 直近 merge 履歴に backfill。PR #64 squash SHA `4c19f08...` の backfill も v99 で同時実施予定）。

直前: v97 (B 群 active #2 = B6 `p118-q01 seq1 E` closed to limit of source quality、B 群 active 完走、二層表現採用、`7171dac` PR #58 + SHA backfill `424fbc5` PR #59) → **別領域移行 #1 = `importParsedBatch` 分類継承バグ部分修正**（PR #60、data 変更なし / v97 維持）→ **v98 polarity hotfix**（PR #62, `671eb79`）→ **本 handoff-only 更新**（post-v98-merge SHA backfill + p006 source 存在ログ, data 変更なし / v98 維持）。

**本ファイル単体で引き継ぎが成立することを目標にする**。repo 外 memory は補助扱い。

## 現在地（confirmed, 2026-04-24 post-v105-merge + **後半 L2 主レーン稼働 fifth cycle**）

* **latest data merge**: v105 = PR #78 squash = `2c75251d3d834d0a427af65f28cbb4c1e0abe38f`（後半 L2 バッチ 5 = p322-p350 = 29 ページ / 152 肢、全て minpo-saiken = 契約各論・債権以外の債権発生原因、book 742/743-798/799、章境界なし、0321 = 既存 p320 dup で drop（Claude 起点指示ミス由来）、p328 seq1/2 chap override）
* **前回 data merge**: v104 = PR #76 squash = `3e25fb9b83e1cd1b391b92fd81835eb2bbb6e703`（後半 L2 バッチ 4 = p255 + p293-p320 = 29 ページ / 155 肢、0291+0292 二重撮りで drop、p255 = gemini-2.5-pro fallback 回収）
* **前々回 data merge**: v103 = PR #75 squash = `19af812c55dcf045db21a072345e4eaff7299639`（後半 L2 バッチ 3 = p271-p290 = 20 ページ / 95 肢）
* **前々々回 data merge**: v102 = PR #73 squash = `6695b7be671075eec9ebc5dced143a686e4f94c1`（後半 L2 バッチ 2 = p250 + p251-p270 excl. p255 = 20 ページ / 104 肢）
* **v101 data merge**: PR #71 squash = `77b2c14a8d136436c60226e94a53fce8ca7d08ea`（後半 L2 バッチ 1 = p248 物権変動 5 肢）
* **v100 data merge**: PR #68 squash = `c763007808af7c2b0747578981f10da49541fc08`（B3 p006-q01 seq3 Q/E restore + polarity flip）
* **historical catchup merged**: PR #69 squash = `a33657428be9f5006091c83f8db10c2ec42b4fd7`
* **v3 flow source of truth PR**: PR #70 squash = `ddbeb049c5b03d903f3b97180ad27f659be49de8`
* **PR #74 (v102 SHA backfill handoff-only)**: **close 済**（v104 本文に吸収済、mergeしない判定 = old handoff を重ねるだけで obsolete）
* **PR #77 (v104 SHA backfill handoff-only)**: merged = `2b9e81c1e9a11471cf3fea3bf74eb912eba83cef`
* **PR #78 (v105 batch 5 import)**: merged = `2c75251d3d834d0a427af65f28cbb4c1e0abe38f`（rebase で conflict 解消後 squash merge、remote branch `claude/v105-batch5-import` は delete 済）
* **latest main HEAD at handoff edit time**: `2c75251d3d834d0a427af65f28cbb4c1e0abe38f`（PR #78 = v105 batch 5 import merge commit、本 PR = claude/v105-sha-backfill = handoff-only）
* **総ページ**: 338（v104 末 309 → v105 merge 後 +29 = 338）/ **総肢**: 1823（v104 末 1671 → v105 merge 後 +152 = 1823）
* **DATA_VERSION**: `2026-04-24-audit-v105-batch5-L2-p322-350-import`（v105 で bump 済、本 PR では触らない）
* **L1 本線**: ✅ 実質完了維持
* **直近 data merge 履歴**: … → v99 (PR #66, `ed924f2`) → v100 (PR #68, `c763007`) → v101 (PR #71, `77b2c14`, 後半 L2 batch 1) → v102 (PR #73, `6695b7b`, 後半 L2 batch 2) → v103 (PR #75, `19af812`, 後半 L2 batch 3) → v104 (PR #76, `3e25fb9`, 後半 L2 batch 4 = p255 + p293-p320) → v105 (PR #78, `2c75251`, 後半 L2 batch 5 = p322-p350 = +29 ページ / +152 肢, 全て minpo-saiken 契約各論・債権以外の債権発生原因, **0321 = 既存 p320 dup で drop（Claude 起点指示ミス由来）**, **p328 seq1/2 chap override**)
* **⚠️ 訂正（過去記述）**: batch 4 handoff/PR の「`0320 = book 738/739` / batch 5 起点 = `740/741`」は **誤り**。正しくは **`p320 = 740/741` / batch 5 起点 = `742/743`**。この誤指示により 0321 が既存 p320 と同 spread を capture し dup 発生。**batch 6 起点は book `p800/801`**（0351- = 800-858 相当）。
* **v100 PR 内 SHA backfill**: PR #67 squash = `59cf4a1d2de1134a3e29095b8fdee045ac21ac1c`（B3 read-only sufficiency check + v99 SHA backfill + エラー報告 queue 記録）を本 PR に同梱 backfill（new policy PR #53 準拠、sync-only PR なし）
* **付随 sync PR**: PR #46 (`8b8c3b0`) / PR #48 (`a2b2611`) / PR #50 (`8286ebb`) / PR #52 (`d161966`) — 旧「都度 mainHEAD sync」運用の痕跡（PR #53 で廃止、v94 以降は新方針で運用）
* **運用（2026-04-20 PR #53 で確立、v94 = PR #54 で初適用、本 PR で 2 サイクル目）**:
  - `latest data merge` = **最新の v## restore PR の squash merge commit**（data 到達点。SHA 確定は merge 後で、**本 PR のように進行中は PR # で参照し SHA は次 handoff 編集で補完**。次の v## restore までは stable）
  - `latest main HEAD at handoff edit time` = **handoff 編集時点の repo 先端**の snapshot（merge 後 stale 化するが意図的に許容）
  - **sync PR は起票しない**。v## restore PR 1 本で両フィールドを更新し、commit 時点の snapshot として閉じる

## 後半 L2 取込 batch 5 実行ログ（2026-04-24, Claude 自律 fifth cycle, batch size 30 枚維持）

**contextual directive**: `feedback_batch_autonomy.md` 継続適用、PR #77 (v104 SHA backfill) merge 完了 → user が `0321-0350.png` 30 枚 capture → Claude 自律再開

### バッチ範囲（Claude 自動、起点指示ミスあり）

- **coverage 確認**: `~/Desktop/kindle_shots/` に `0321-0350.png` 新規追加確認（30 枚）
- **Claude → user directive（誤り）**: 「batch 5 起点 = book p740/741」
- **正しい起点**: book **p742/743**（既存 p320 = 740/741 済のため）
- **原因**: batch 4 handoff/PR で「0320 = 738/739」と誤記述（+2 offset 論で 2 pages 引いた）、実態は 740/741
- 採用範囲（事後補正）: **0322-0350 = 29 ページ**（0321 = dup drop）

### OCR 実行（2 run 累計）

- **main run** (30 pages, flash): ✅ 25 成功 / ❌ 5 失敗 (p322/p328/p336/p337/p349 全て 503)
- **retry 1** (5 pages, flash): ✅ 5/5 解消
- **pro fallback**: 不要（batch 4 precedent の activation 条件 = flash 3 session 持続 503 には該当せず）
- **最終**: 30/30 OK

### capture dup 検出（0321 = 既存 p320 dup 確定）

| phase | finding |
|---|---|
| auto scan | 既存 q_head と 10 件 match（p321 seq1-5/7、p322 seq3/4 + p323 seq1、p337 seq3）|
| 深掘り verbatim | **p321 vs existing p320 = 7 branches 全部 verbatim match**（seq1-5/7 = 100% 一致、seq6 = 2 char OCR variance「場台/場合」「賃借人/賃貸人」= 同 image 再 OCR 時の micro variance）|
| book_page 確認 | 既存 p320 = `('740', '741')`、batch5 p321 = `('740', '741')` = **同 book spread** |
| 原因 | **Claude の起点指示ミス（user 手作業ミスではない）**: 「起点 = book p740/741」= 既存 p320 と同 page を指定してしまった |
| 結論 | **0321 drop、recapture せず、batch 5 は 29 pages / 152 branches で確定** |
| batch 5 内他 dup | p322 seq3/4 & p323 seq1 / p337 seq3 = textbook repeat（異なる legal issue、既存と legitimate 重複）→ retain |

### chapter override（programmatic, p328 seq1/2）

- **sectionTitle**: 「契約」（売買の担保責任 area, book 754/755）
- **Gemini raw 出力**: seq1 `minpo-bukken`（取得時効引用 → bukken 誤分類）/ seq2 `minpo-sosoku`（追認概念 → sozoku 誤分類）
- **修正**: 両 seq とも `chapterCandidate` を **`minpo-saiken`** へ programmatic override（売主担保責任 = 契約 = 債権 = saiken 正、batch 4 の p294 override と同 pattern）

### within-batch dup 7 件 = 全て legitimate textbook repeat

| q_head opening | 分布 | 判定 |
|---|---|---|
| A・B間で建物の売買契約... | p322 seq3/4 + p323 seq1 | 契約成立後の建物焼失 fact-pattern、各 seq 異なる legal issue（危険負担 / 相殺 / 損害賠償）|
| AがBに対して自己所有の土地を売却... | p323 seq3/4/5 | 第三者のためにする契約 fact-pattern、各 seq 異なる論点 |
| Aは、Bとの間でA所有の甲建物の賃貸借契約... | p336 seq1/2 | 賃貸人地位移転 fact-pattern |
| A所有の甲土地をBに対して建物所有の目的... | p338 seq1 + p340 seq2/4 | 賃貸借・敷金承継 fact-pattern |
| 出張先の大阪で交通事故... | p344 seq1/2 + p345 seq1/5 | 委任契約の fact-pattern |
| AがBのために行った事務処理... | p349 seq1/2/3/5 + p350 seq2 | 事務管理 vs 委任の対比 fact-pattern |
| Aが不在の間に台風が襲来... | p349 seq4 + p350 seq3/5 | 事務管理 fact-pattern |

全て**同 fact-pattern opening + 異なる legal issue** = 肢別過去問での典型的 pattern 問題、capture dup ではない。retain。

### polarity suspect 28 件（全偽陽性）

- Q 否定形（「...できない」「...及ばない」「...負わない」「認められない」等）+ ans=True 整合 = rule-based detection の false positive
- 例: p321 seq5「売買契約の買主は、売主から履行の提供があっても、その提供が継続されない限り、同時履行の抗弁権を失わない」 = 法的に正しい → ans=True 整合
- spot-check 5/28 判決・条文との整合確認、batch 3/4 と同 pattern
- **layer 2 へは escalate しない**

### auto scan 結果（29 ページ / 152 肢）

| field | value |
|---|---|
| 対象 pages | 29 (p322-p350) |
| drop | 1 (p321 = 既存 p320 dup) |
| OCR 成功 | 30/30（pro fallback 不要、flash retry 1 で解消）|
| 抽出肢数 | 152 |
| duplicate (sourcePage) | 0 |
| duplicate (q_head 50char, vs existing) | 3（textbook repeat、retain）|
| within-batch q_head dup | 7（全 legitimate textbook repeat）|
| ellipsis `...` / `…` | 0 |
| empty subject/chapter | 0 |
| chapter override | 2 (p328 seq1/2: bukken/sosoku → saiken) |
| polarity suspect | 28（全偽陽性）|
| chapter distribution | minpo-saiken 152（章境界なし）|
| confidence | 0.9-1.0（0.95 主流、0.98 が 26、1.0 が 6）|

### import

- `data/reviewed_import.json` + `public/data/reviewed_import.json` に **29 ページ追加**（sourcePage sort 済、p322-p350 = 末尾追加）
- mirror byte-identical 確認（`cmp` OK）
- `src/lib/db.ts` DATA_VERSION: `2026-04-24-audit-v104-batch4-L2-p255-p293-320-import` → `2026-04-24-audit-v105-batch5-L2-p322-350-import`
- 総ページ 309 → 338 / 総肢 1671 → 1823

### v3 flow §12 成功条件

| # | 条件 | 結果 |
|---|---|---|
| 1 | 対象件数明示 (29) | ✅ |
| 2 | mirror byte-identical | ✅ |
| 3 | DATA_VERSION bump | ✅ v104 → v105 |
| 4 | 欠損率 ≤ 10% | ✅ 0/29 = 0%（0321 drop は指示ミス由来で dup 削除扱い、「欠損」分類しない）|
| 5 | polarity gate 全通過 | ✅ (suspect 28 = false positives のみ) |

**5/5 通過 = batch 5 成功**

### batch size ladder 判定

| 条件 | 実績 | 通過 |
|---|---|---|
| capture miss / focus loss なし | 0321 dup は **Claude 起点指示ミス由来、user 手作業 miss ではない** | ⚠️ margin（責任範囲違うが発生数として 1 件）|
| persistent 503 が 0 | 0（flash retry 1 で全解消、pro fallback 不要）| ✅ |
| transient 503 は 1 retry で解消 | ✅ 5/5 retry OK | ✅ |
| chapter transition ≤ 2 | 0（全 minpo-saiken）| ✅ |
| review で重すぎない | 152 肢 = 線形 scale | ✅ |

**判定**: **batch 6 も 30 枚維持**（50 枚 bump は見送り、Claude 起点指示ミス再発防止優先）。OCR 側は完全安定（flash 1 retry 解消）だが、指示ミス系の margin を解消するまで scale up しない。

### batch 6 起点（正しい数字）

- **book page 800/801 先頭**（0351- = 書籍 800-858 相当）
- 理由: 0350 = book 798/799、次 = 800/801
- **次 user action**: Kindle を **book p800/801** に開き `bash scripts/kindle_capture.sh 30` 実行（0351.png から 30 枚）

### 再発防止

- **handoff 記述の「0320 = 738/739」は誤り** → 本 PR で訂正（正: p320 = 740/741）
- **Gemini book_page label は+2 systematic offset ではなかった可能性**（0291/0292 dup 由来の観測誤認と判明）
- 次回以降、起点 book page を user へ指示する前に **必ず reviewed_import.json で直前ページの Q/A book_page を直接確認**する運用に変更

### 次アクション

1. ✅ **v105 merge 完了**: PR #78 squash = `2c75251d3d834d0a427af65f28cbb4c1e0abe38f`、本 handoff で SHA backfill 済
2. **batch 6**: user の 0351-0380 (30 枚、book p800/801-) Kindle capture 待ち → Claude 自律 sixth cycle
3. **p050 duplicate 判定 (P2 継続)**: user 判断待ち（p051 優先 / p050 preserve / merge の 3 択）
4. **p318 seq1 needsSourceCheck (P3 継続)**: 現物 `images/0318.png` で verbatim 確認（layer 2 escalate しない前提）

---

## 後半 L2 取込 batch 4 実行ログ（2026-04-24, Claude 自律 fourth cycle, batch size 20 → 30 ladder bump 試験）

**contextual directive**: `feedback_batch_autonomy.md` 継続適用、batch 3 完了 + PR #75 merge → user が **0291-0320 = 30 枚 capture**（ladder bump 試験運用）→ Claude 自律再開。batch size ladder 2026-04-24 user directive 更新反映: batch 1-3 = 10-20 / batch 4 = 30 枚試験 / batch 5+ = 50 枚 bump は capture/OCR/review 全条件通過時のみ。

### バッチ範囲（Claude 自動、user 30 枚 directive 反映）

- **coverage 確認**: batch 3 完了後 `~/Desktop/kindle_shots/` に `0291-0320.png` 新規追加確認（30 枚）
- **採用範囲**: p255 retry（batch 2/3 carryover）+ 0291-0320 = **計 31 ページ**
- **initial user report**: 「できたけど、重複と抜けできたかも」= capture 不安

### OCR + capture 診断

| phase | action | result |
|---|---|---|
| p255 retry | flash 単独 retry | ❌ 503 3 session 連続（flash 持続不安定）|
| p255 fallback | **gemini-2.5-pro** fallback | ✅ **7 肢回収**（occupation 612/613, minpo-bukken）= **P1 carryover 解消** |
| 0291-0320 main | flash (30 pages) | ✅ 29 成功 / ❌ 1 失敗 (p308 = 503 transient) |
| p308 retry | flash retry 1 | ✅ 5 肢回収 (716/717) |
| **OCR 最終** | — | **31/31 OK, defer 0**（pro fallback 確立）|

### capture dup 検出（初動「0292 のみ」→ 後続「0291 も」拡張）

- **初動報告**: user 「重複と抜けできたかも」、auto scan で 7 q_head dup 検出 → 0292 = 既存 p290 の dup 断定
- **後続深掘り**: q_head だけでなく本文 verbatim 比較で **0291 seq2-5 = 既存 p290 と 100% 完全一致**を確認
  - 0291 seq1: micro OCR diff = 1 箇所のみ（「当該家屋を」脱落）= 二重撮り時の微小 OCR variance 範囲内
  - 0292 = 0291 と image byte 一致レベル
- **結論（user approved GO）**: Kindle advance 失敗による 2 spread 空撮り。`0291+0292 = 既存 p290 の重複 capture` → **両方 drop**（初動方針「0292 drop only」は追加証拠で更新）
- **capture gap**: なし（連続性 0293→0294→...→0320 確認）

### chapter override（programmatic, p294 seq3/4）

- **sectionTitle**: 「責任財産の保全 債権者代位権」（民法423条）
- **Gemini raw 出力**: seq3 `minpo-sozoku` / seq4 `minpo-shinzoku`（代位行使の対象が相続・親族条文を引用しているため Gemini が対象条文の属する章で誤分類）
- **修正**: 両 seq とも `chapterCandidate` を **`minpo-saiken`** へ programmatic override（債権者代位権 = 債権総論 = saiken 正）
- **merge 前に override 適用済**、reviewed_import.json に反映

### needsSourceCheck 追加（p318 seq1、layer 2 escalate しない判定）

- **引用条文**: 民法523条2項
- **OCR 出力**: `第1項の規定による承諾の通知は、…定めた期間内に発しなければ、その効力を失う。`
- **判定**: `…` は法令文中の省略マーカー（前項の）ではなく、OCR が長い連体修飾を abbreviate した artifact
- **決定**: `needsSourceCheck=True` + `sourceCheckReason=OCR ellipsis in art.523 §2 quote` を設定、**layer 2 = ERROR_UNREADABLE_SOURCE までは escalate しない**（正誤判定は可能 / 解説骨格は完全 / user directive 明示）

### polarity suspect 8 件（全偽陽性、batch 3 と同 pattern）

- 全件 Q 否定形（「…できない」「…及ばない」等）+ ans=True 整合 = rule-based detection の false positive
- spot-check 8/8 判決・条文との整合確認

### auto scan 結果（29 ページ / 155 肢）

| field | value |
|---|---|
| 対象 pages | 29 (p255 + p293-p320) |
| drop | 2 (0291/0292 = 既存 p290 dup) |
| OCR 成功 | 31/31（pro fallback 含む）|
| 抽出肢数 | 155 |
| duplicate (sourcePage) | 0 |
| duplicate (q_head 50char) | 0 |
| ellipsis `...` / `…` | 1 (p318 seq1 = needsSourceCheck=True, layer 2 は escalate せず) |
| empty subject/chapter | 0 |
| chapter override | 2 (p294 seq3/4: sozoku/shinzoku → saiken) |
| polarity suspect | 8（全偽陽性）|
| chapter distribution | minpo-bukken 7 (p255) + minpo-saiken 148 (p293-p320) |
| confidence | 0.9-0.95 |

### import

- `data/reviewed_import.json` + `public/data/reviewed_import.json` に **29 ページ追加**（sourcePage sort 済、p255 は p254 と p256 の間に挿入、p293-p320 は末尾追加）
- mirror byte-identical 確認（`cmp` OK）
- `src/lib/db.ts` DATA_VERSION: `2026-04-24-audit-v103-batch3-L2-p271-290-import` → `2026-04-24-audit-v104-batch4-L2-p255-p293-320-import`
- 総ページ 280 → 309 / 総肢 1516 → 1671

### v3 flow §12 成功条件

| # | 条件 | 結果 |
|---|---|---|
| 1 | 対象件数明示 (29) | ✅ |
| 2 | mirror byte-identical | ✅ |
| 3 | DATA_VERSION bump | ✅ v103 → v104 |
| 4 | 欠損率 ≤ 10% | ✅ 0/29 = 0% |
| 5 | polarity gate 全通過 | ✅ (suspect 8 = false positives のみ) |

**5/5 通過 = batch 4 成功**

### batch size ladder 判定 (2026-04-24 user directive vs batch 4 実績)

| 条件 | 実績 | 通過 |
|---|---|---|
| capture miss / focus loss なし | 0291+0292 dup 検出（user 手作業由来、系統的 miss ではない）| ⚠️ margin |
| persistent 503 が 0 | p255 = flash 3 session 持続 503（fallback で解消）| ⚠️ margin |
| transient 503 は 1 retry で解消 | p308 = 1 retry OK | ✅ |
| chapter transition ≤ 2 | p255 (→ saiken 境界なし独立ページ) + p293-p320 内に境界なし = 実質 1 境界 | ✅ |
| review で重すぎない | 155 肢 = 準線形 scale | ✅ |

**判定**: **batch 5 も 30 枚維持**（50 枚 bump は見送り）。capture dup 2 枚は user 手作業範囲内だが OCR 安定性側に persistent 503 (p255) があり、bulk 50 枚運用時の blast radius 拡大は避ける。

### batch 5 起点（補正後）

- **book page 740/741 先頭**（初動想定の 742/743 から修正）
- 補正理由: 0291+0292 dup = 2 spread 空撮り / Gemini の book_page label は全体 +2 systematic offset = 実態 0320 = 738/739
- **次 user action**: screenshot 0321.png 以降 30 枚 capture（book p740/741 以降）

### 次アクション

1. **本 PR merge 後**: user の 0321-0350 (30 枚) Kindle screenshot 捕捉待ち（book p740/741 以降）
2. **batch 5 冒頭**: OCR は flash main、flash persistent 503 があれば **pro fallback 運用確立** (batch 4 precedent)
3. **p050 duplicate 判定 (P2 継続)**: user 判断待ち（p051 優先 / p050 preserve / merge の 3 択）
4. **p318 seq1 needsSourceCheck (P3 new)**: 現物 `images/0318.png` で verbatim 確認（layer 2 escalate しない前提、解説完全性は既確認）

---

## 後半 L2 取込 batch 3 実行ログ（2026-04-24, Claude 自律 third cycle）

**contextual directive**: `feedback_batch_autonomy.md` 継続適用、batch 2 完了 + PR #73 merge → user が `0271-0290.png` 捕捉 → Claude 自律再開

### バッチ範囲（Claude 自動）

- **coverage 確認**: batch 2 完了後 `~/Desktop/kindle_shots/` に `0271-0290.png` 新規追加確認 (20 枚)
- **採用範囲**: 0271-0290 (新捕捉) = **計 20 ページ**（連続 20 ページ = v3 flow 条件充足）
- **p255 retry（batch 2 carryover）**: single-page retry 1 回実施 → 再度 503 持続 → sub-lane P1 継続、batch 4 冒頭で再試行

### OCR 実行（2 run 累計）

- **main run** (20 pages): ✅ 18 成功 / ❌ 2 失敗 (p275/p276 両方 503)
- **retry 1** (2 pages): ✅ 2 成功 (p275/p276 解消)
- **最終**: 20/20 OK, defer 0

### auto scan 結果（20 ページ / 95 肢）

| field | value |
|---|---|
| 対象 pages | 20 (p271-p290) |
| OCR 成功 | 20/20 = 100% |
| 抽出肢数 | 95 |
| duplicate (sourcePage) | 0 |
| duplicate (q_head 50char) | 0 |
| ellipsis `...` / `…` | 0 |
| empty subject/chapter | 0 |
| layer 2 placeholder | 0 |
| polarity suspect | 5（全偽陽性 = Q 否定形 + ans=True 正当、後述） |
| chapter distribution | minpo-bukken 70 (p271-p285) / minpo-saiken 25 (p286-p290) |
| section coverage | 担保物権・抵当権の効力・法定地上権・物上代位・共同抵当 → 債権総論冒頭 |
| confidence | 0.9-0.95 |

**polarity suspect 全 5 件の偽陽性理由**: Q 自体が否定形（例: 「抵当権の効力は…及ばない」「…できない」）を主張し、その主張が法的に正しい場合 ans=True が整合。解説 E も負の結論で終わる構造であり、ルールベース検出が検知しただけ。spot check 5/5 全件、judgment error なし。

**chapter transition at p286**: 書籍構造上 p285 (民法 685/686) → p286 (民法 687/688) で物権各論末尾 → 債権総論冒頭への legitimate 境界。auto scan では subjectCandidate 一致 (minpo 継続)、chapterCandidate のみ bukken → saiken 変化を検知。

### import

- `data/reviewed_import.json` + `public/data/reviewed_import.json` に 20 ページ追加（sourcePage sort 済）
- mirror byte-identical 確認（`cmp` OK）
- `src/lib/db.ts` DATA_VERSION: `2026-04-23-audit-v102-batch2-L2-p250-270-import` → `2026-04-24-audit-v103-batch3-L2-p271-290-import`
- 総ページ 260 → 280 / 総肢 1421 → 1516

### v3 flow §12 成功条件

| # | 条件 | 結果 |
|---|---|---|
| 1 | 対象件数明示 (20) | ✅ |
| 2 | mirror byte-identical | ✅ |
| 3 | DATA_VERSION bump | ✅ |
| 4 | 欠損率 ≤ 10% | ✅ 0% |
| 5 | polarity gate 全通過 | ✅ (suspect 0 = false positives のみ) |

**5/5 通過 = batch 3 成功**

### 次アクション

1. **本 PR merge 後**: user の p291- Kindle screenshot 捕捉待ち
2. **batch 4 起動時 冒頭**: p255 single-page retry 再試行（2 セッション連続 503 = transient 前提再確認 or gemini-2.5-pro fallback 検討）
3. **PR #74 (v102 SHA backfill)**: 本 PR と独立 merge 可（data 無変更）

---

## 後半 L2 取込 batch 2 実行ログ（2026-04-23, Claude 自律 second cycle）

**contextual directive**: `feedback_batch_autonomy.md` 継続適用、batch 1 完了 → user が `0251-0270.png` 捕捉 → Claude 自律再開

### バッチ範囲（Claude 自動）

- **coverage 確認**: batch 1 完了後 `~/Desktop/kindle_shots/` に `0251-0270.png` 新規追加確認 (20 枚)
- **採用範囲**: p250 (batch 1 persistent 503 defer) + 0251-0270 (新捕捉) = **計 21 ページ**（連続 21 ページ = v3 flow 連続 20 ページ条件達成）

### OCR 実行（3 run 累計）

- **main run** (21 pages): ✅ 15 成功 / ❌ 6 失敗 (p251/p254/p255/p267/p268/p269 全て 503)
- **retry 1** (6 pages): ✅ 5 成功 (p251/p254/p267/p268/p269) / ❌ p255 のみ 503
- **retry 2-4** (p255 単独 × 3 回): ❌ 全て 503 (persistent = batch 1 の p250 と同パターン、defer 判定)
- **最終**: 20/21 OK, p255 defer

### auto scan 結果（20 ページ / 104 肢）

| page | branches | book_q | subject | note |
|------|----------|--------|---------|------|
| p250 | 4 | 602 | minpo-bukken | 物権総論（共同相続 + 登記）|
| p251 | 5 | 605 | minpo-bukken | 動産物権変動・対抗要件・即時取得 |
| p252 | 7 | 608 | minpo-bukken | 即時取得 |
| p253 | 4 | 608 | minpo-bukken | 即時取得・混同 |
| p254 | 6 | 610 | minpo-bukken | 占有権 |
| p255 | - | - | - | **503 defer, sub-lane P1** |
| p256 | 5 | 614 | minpo-bukken | 占有・所有権 |
| p257 | 5 | 616 | minpo-bukken | 所有権・相隣関係 |
| p258 | 6 | 618 | minpo-bukken | 相隣関係 |
| p259 | 5 | 620 | minpo-bukken | 所有権取得・共有 |
| p260 | 7 | 622 | minpo-bukken | 共有 |
| p261 | 6 | 624 | minpo-bukken | 共有 |
| p262 | 5 | 626 | minpo-bukken | 地役権・入会権等 |
| p263 | 7 | 628 | minpo-bukken | 用益物権 |
| p264 | 3 | 630 | minpo-bukken | - |
| p265 | 4 | 632 | minpo-bukken | - |
| p266 | 5 | 634 | minpo-bukken | - |
| p267 | 4 | 636 | minpo-bukken | - |
| p268 | 5 | 638 | minpo-bukken | - |
| p269 | 4 | 640 | minpo-bukken | - |
| p270 | 7 | 642 | minpo-bukken | - |

### 品質チェック結果（ingestion_flow.md §3, §5, §7）

- **duplicate 検出**: 0 (book_q = 602-642 は全て existing=596/598/600 の後で overlap なし)
- **`...` / broad raw / empty subject**: 全て 0
- **polarity gate**: spot-check で系統的な逆転なし（p252 即時取得判例整合 / 盗品回復 2 年起点 / 占有権相続など定番論点全て合致）
- **層 2 ERROR_UNREADABLE_SOURCE**: 該当なし
- **欠損率**: p255 defer = 1/21 = 4.8% ≤ 10% threshold（主レーン継続条件通過）

### 副レーン引継ぎ（open 上限 5 以内）

1. **P1 = p255 OCR retry** (持続 503, 次セッション single-page retry)
2. **P1 = p250 retry** → **本 batch で closed**（503 は transient、24 時間経過で成功）
3. **P2 = p050 duplicate 判定** （継続、user 判断待ち）
4. （既存）follow-up 3 本 P1-1/P1-2/P1-3 も継続 open

### batch 2 成功条件判定（ingestion_flow.md §12）

- [x] 対象件数明示（21 ページ、内訳 = legitimate 20 / defer 1）
- [x] mirror byte-identical
- [x] DATA_VERSION v101 → v102 bump
- [x] 欠損率 4.8% ≤ 10%
- [x] polarity gate 全肢通過（spot-check）
- ✅ **batch 2 成功**

### 次 user action（batch 3 前提）

**p271 以降の Kindle screenshot 捕捉**。batch 2 で coverage 末尾 (p270) に到達したため、batch 3 のためには新規追加 20 枚程度が必要。手順は batch 1→2 と同じ: Kindle で書籍 p644 付近の見開きを開き `bash scripts/kindle_capture.sh 20` を実行。

## 後半 L2 取込 batch 1 実行ログ（2026-04-23, Claude 自律 first cycle）

**directive source**: `~/.claude/projects/.../memory/feedback_batch_autonomy.md`（2026-04-23 user 確定 = バッチ範囲決定 + OCR 実行 は Claude 側で完結、user 依頼は screenshot 不足時のみ）

### バッチ範囲決定（Claude 自動）

- **判定 source**: `data/reviewed_import.json` + `images_preprocessed/`
- **gap 列挙結果**: p001-p249 範囲で 10 gap = [018, 019, 050, 067, 094, 121, 153, 166, 212, 248] + 未取込 p250 = 計 11 ページ
- **連続 20 ページ条件**: ❌ 達成不可（`images_preprocessed/` の coverage が p250 で stop = Kindle screenshot が p250 までしか存在しない）
- **採用範囲**: 既存 coverage 内 gap + p250 = **11 ページ**（`feedback_batch_autonomy.md` §「連続 20 ページが取れない場合: 最初の連続未処理範囲を切る + 理由を handoff に記録」に従い本 log に理由記載）

### OCR 実行（Gemini 2.5 Flash, `scripts/gemini_parse.js`, 6 run 累計）

- **run 1 (initial, 11 pages)**: ✅ p050 (5 肢) / ❌ p019 API_KEY_EXPIRED / ❌ p018/p067/p153/p248/p250 503
- **run 2 (retry, 6 pages after key refresh)**: ✅ p019 (0 肢) / ✅ p094/p121/p166/p212 (0 肢) / ✅ p248 (5 肢) / ❌ p018/p067/p153/p250 503
- **run 3-6 (narrowing retry)**: ✅ p018/p067/p153 (0 肢) / ❌ p250 持続的 503 (file size 2.8MB, capacity 到達の疑い)
- **最終結果**: 10/11 pages OCR 成功, p250 defer

### auto scan 分類結果

| page | branches | classification | action |
|------|----------|----------------|--------|
| p018 | 0 | legitimately blank/index | log only |
| p019 | 0 | legitimately blank/index | log only |
| **p050** | **5** | **duplicate suspected** (= p051 と Q204/A205 + 5 肢内容完全重複 = Kindle 二重 capture 疑い) | **sub-lane P2**（user 判断待ち）|
| p067 | 0 | legitimately blank/index | log only |
| p094 | 0 | legitimately blank/index | log only |
| p121 | 0 | legitimately blank/index | log only |
| p153 | 0 | legitimately blank/index | log only |
| p166 | 0 | legitimately blank/index | log only |
| p212 | 0 | legitimately blank/index | log only |
| **p248** | **5** | **legitimate new content** (物権変動, minpo-bukken, Q598/A599, sectionTitle「登記を対抗要件とする物権変動」, confidence 0.95, `...` / broad raw / polarity mismatch なし) | **本 PR で import** |
| p250 | 0 (503) | defer retry | **sub-lane P1**（次セッション先頭で retry） |

### 欠損率判定（ingestion_flow.md §3）

- OCR 成功率 = 10/11 = 90.9% (503 defer を除外すれば 10/10 = 100%)
- legitimate content rate = 2/10 = 20%（blank 判定除外後 = 0-肢除外率 80% だが design 意図と整合、欠損ではない）
- **結論**: ≤10% threshold 内、主レーン継続、欠損率 stop 条件に抵触せず

### polarity gate（ingestion_flow.md §5）for p248

5 肢全てで triangulation OK:
- seq1 (背信的悪意転得者D): ans=false（E「Dはその不動産の取得を第1の買主に対抗することができる」 = Q「Bは対抗できる」否定）→ 整合
- seq2 (詐欺取消後第三者): ans=true（判例 大判昭17.9.30 登記先後）→ 整合
- seq3 (解除後第三者): ans=true（判例 最判昭35.11.29 登記先後）→ 整合
- seq4 (時効完成前譲受人): ans=true（判例 最判昭41.11.22 登記不要）→ 整合
- seq5 (時効完成後譲受人): ans=false（判例 最判昭33.8.28 登記必要）→ 整合
- **全 5 肢で image marker / E末尾 logic / 条文判例引用 の 3 経路一致**、polarity flip 不要

### 二層運用（ingestion_flow.md §7）

- 層 1 = substantive content restore: p248 全 5 肢 clean（`...` 無し / broad raw 無し）
- 層 2 = ERROR_UNREADABLE_SOURCE: 該当なし（Gemini OCR 品質が B 群時代の old pipeline より高い）

### 副レーン引継ぎ項目（open 上限 5 を超えないよう注意）

1. **p050 duplicate 判定** = P2: user に「p051 優先 / p050 preserve / merge」3 択を次セッション冒頭で確認
2. **p250 OCR retry** = P1: 次セッション先頭、single-page run で再試行（503 は transient）
3. **p251 以降の Kindle screenshot 捕捉** = **user 依頼**（唯一の user action 必要項目、batch 2 開始前条件）
4. （既存）P1-1 importParsedBatch integration test / P1-2 PreservedAttrs 拡張 / P1-3 CLAUDE.md §1 stale update は継続 open

### batch 1 成功条件判定（ingestion_flow.md §12）

- [x] 対象件数明示（11 ページ、内訳 = legitimate 1 / duplicate 1 / blank 8 / defer 1）
- [x] mirror byte-identical（`diff data/reviewed_import.json public/data/reviewed_import.json` = 差分なし）
- [x] DATA_VERSION v100 → v101 bump
- [x] 欠損率 ≤ 10% threshold 内
- [x] polarity gate 全肢通過
- ✅ **batch 1 成功**

### v76 差分（v75 → v76）

| PR  | v   | 種類              | 範囲                                         | 件数                 |
| --- | --- | --------------- | ------------------------------------------ | ------------------ |
| #30 | v76 | polarity + Q文復元 | p238-q1 (seq1, 書籍Q6), p238-q2 (seq2, 書籍Q7) | 2 flips + Q 文 3 箇所 |

内訳:

* **p238-q1 (seq1, 書籍Q6)**: 停止条件結語 `無効 → 無条件`、`ans false → true`（民法131条1項）
* **p238-q2 (seq2, 書籍Q7)**: `〇〇法律行為 → その法律行為` OCR 復元、解除条件結語 `無効 → 無条件`、`ans false → true`（民法131条2項）

確認経路: `0238.png` vision + Gemini OCR + 民法131条 1項/2項 条文整合、3経路一致。

### v76 で close 済み

* ~~p238-q1 / q2 原本再照合~~ → v76 で確定 close

### v77 差分（2026-04-19）

* **PR #31 / p238-q2 explanation**: `民法132条2項 → 民法131条2項`（条文番号 typo 修正、polarity 非影響）

### v78 差分（2026-04-19）

* **PR #32 / p227 seq1/seq2/seq3**:
  * seq1: `ans false → true`（強迫取消は善意無過失第三者に対抗可、96条3項、explanation 自己整合）
  * seq2: `sectionTitle 03_代理 → 02_意思表示と瑕疵`（drift のみ、polarity 非影響）
  * seq3: `ans true → false`（98条の2 は意思能力欠如/未成年者/成年被後見人 限定、Q「制限行為能力者」overbroad）

確認経路: 0227.png 原本 + 条文整合 + DB 内 explanation 自己整合の 3 経路一致。

### v81 差分（2026-04-20）

* **PR #36 / p219-q01 seq3 Q**: OCR 復元（Q text のみ、polarity 非影響）
  * event: `Aが結婚の式授挙` → `Aの船舶の沈没事故`
  * 請求者: `Aの実父の請求` → `Aの妻の請求`
  * ans=false 維持（特別失踪 30条2項/31条：危難が去った時、Q「7年経過」主張を否定）

確認経路: 0219.png 原本（Claude vision, page 541 Q4 = DB seq3） + 民法30条2項/31条整合 + 既存 explanation「本肢は特別失踪」自己整合 の 3 経路一致。

### v82 差分（2026-04-20）

* **PR #37 / p227-q01 seq2 substantive restore**（Q + E + polarity 1 PR bundled）
  * 現 DB が Q / E / ans 相互矛盾のため、単独修正では壊れた中間状態になる → 原本復元として束ねて修正
  * Q 強迫者: `AがBの強迫` → `DがAに強迫`（第三者強迫 scenario）
  * Q 中盤 garble: `知ることができる適当先がなかった` → `知ることができなかったことにつき善意無過失であった`
  * Q 結語: `取り消すことができない` → `取り消すことができる`
  * ans: `false → true`
  * E: `Bが善意の場合であっても、AはBの強迫` → `BがDの事実につき善意無過失であっても、AはDの強迫`
  * scope: seq2 のみ。seq3 E は別 pending 項目として温存

確認経路: 0227.png 原本（Claude vision, page 556 Q7 = DB seq2、page 557 右列 7 ○） + 民法96条2項対照（詐欺との対比、強迫は第三者強迫でも取消可） + DB 内 E 前段「第三者が強迫をした場合であっても」自己整合 の 3 経路一致。

### v83 差分（2026-04-20）

* **PR #38 / p227-q01 seq3 E high-confidence restore**（E text のみ、polarity 非影響、高信頼4箇所）
  * 冒頭: `意思能力を有していた` → `意思能力を有しなかった`
  * 98条の2 結語: `対抗することができる` → `対抗することができない`
  * 4類型列挙: `被後見人、被補助人、被補佐人` → `被後見人、被保佐人、被補助人`（条番号順 + 保佐の正字）
  * 結語ペア重複: `成年被後見人と成年被後見人` → `未成年者と成年被後見人`
  * **保留（低信頼）**: 条文引用 `13歳2項110号` → 画像 digit 読み切れず未修正、OCR pending に残存

確認経路: 0227.png 原本（Claude vision, page 557 右列 row 1 ×） + 民法98条の2 本文条文整合（意思能力なし/未成年者/成年被後見人 限定） + DB 内 Q「制限行為能力者」overbroad + ans=false（v78 close 済み）自己整合 の 3 経路一致。

### v84 差分（2026-04-20）

* **PR #39 / p062-q01 seq7 Q+E restore**（文末欠落復元 + OCR 誤字訂正、polarity 非影響）
  * Q OCR 誤字: `移動者が自主的に除却しない` → `義務者が自主的に除却しない`
  * Q 文末欠落: `行政の...` → `行政庁が義務者に代わって除却する行為は、行政法理論上、「即時強制」にあたる。`
  * E 文頭: `前提としないことから` → `前提としないところ`
  * E 文末欠落: `代替的作為義務を執行するもので、...` → `…代替的作為義務は義務者本人でなくても他人が代わって履行することができ、現に行政の職員が行っている。それゆえ、かかる行為は代執行である（行政代執行法2条）。`
  * ans=false 維持（本肢は代執行に該当するため「即時強制」と断定する記述は誤り）
  * scope: p062-q01 seq7 のみ

確認経路: images/0062.png 原本（Claude vision, book p226-227 行9、section 即時強制） + 行政代執行法2条（代替的作為義務の代執行）との整合 + DB 内 ans=false 自己整合 の 3 経路一致。

### v85 差分（2026-04-20）

* **PR #40 / p078-q01 seq4 Q+E restore**（OCR 誤字 + 文末欠落復元 + E substantive garble 復元、polarity 非影響）
  * Q 送り仮名: `手続 → 手続き`
  * Q 文末欠落: `とら… → とらなければならない。`
  * E 表記統一: `名宛人 → 名あて人`
  * E OCR 誤: `申請以外の者 → 申請者以外の者`
  * E OCR garble: `見張り機会を提供できる公聴会 → 意見を聴く機会である公聴会`
  * ans=false 維持（行政手続法13条1項は意見陳述の手続＝聴聞または弁明、公聴会ではない）
  * scope: p078-q01 seq4 のみ、Q+E 束ね（同一 seq・同一原本行、v84 と同方針）
  * handoff pending queue には Q のみ記録だったが、原本読取時に E substantive garble 3箇所を発見し束ねて修正

確認経路: images/0078.png 原本（Claude vision, book p258-259 行4、section 不利益処分） + 行政手続法13条1項（意見陳述の手続）+ 10条（公聴会は申請処分側の手続） + DB 内 ans=false 自己整合 の 3 経路一致。

### v86 差分（2026-04-20）

* **PR #41 / p119-q01 seq1 substantive restore**（Q + E + polarity 1 PR bundled、**polarity flip true→false**）
  * 現 DB が Q 中盤 OCR garble ＋ Q 文末欠落 ＋ ans 誤り（処分庁/他行政庁の採るべき措置が原本と逆）で相互矛盾のため、v82 precedent に倣い Q/E/ans 束ねて原本復元
  * Q 復元（全面置換）: `行政庁が処分を行う際に教示をしなかった場合、当該処分庁に不服申立書を提出することができ、当該処分が処分庁に審査請求をすることができるものであったときは、処分庁は、速やかに、当該不服申立書を当該処分庁以外の行政庁に送付しなければならないのに対して、当該処分が処分庁以外の行政庁に審査請求をすることができるものであったときは、不服申立書の提出時に初めから適法な審査請求がされたものとみなされる。`
  * ans: `true → false`（polarity flip）
  * E 復元（条文引用を 83条1項/3項/4項/5項 に整理）: `行政庁が処分を行う際に教示をしなかった場合、処分庁に不服申立書を提出することができる（行政不服審査法83条1項）。処分が処分庁に審査請求できるものであったときは不服申立書提出時に適法な審査請求がされたものとみなされ（同条5項）、処分庁以外の行政庁に審査請求をすることができるものであったときは、処分庁は当該処分庁以外の行政庁に不服申立書を送付し（同条3項）、初めから裁決等をする権限庁に不服申立てがあったものとみなされるため（同条4項）、採るべき措置が逆である本肢は誤っている。`
  * scope: p119-q01 seq1 のみ

確認経路: images/0119.png 原本（Claude vision, 教示をしなかった場合の救済 section） + 行政不服審査法83条1項/3項/4項/5項（2014改正後条番号、処分庁と他行政庁への審査請求それぞれの帰結）との整合 + DB 内 E 後半「本肢は誤っている」自己整合 の 3 経路一致。

### v87 差分（2026-04-20）

* **PR #42 / p136-q01 seq4 Q+E restore**（Q/E 両方に substantive garble + 文末欠落、polarity 非影響）
  * Q 中盤 substantive garble: `その審査請求は違法なもの` → `その審査請求は適法なもの`
  * Q 文末欠落: `却下裁決に対する... ` → `却下裁決に対する取消訴訟を提起すべきこととなる。`
  * E 冒頭 substantive garble: `違法な審査請求に対する裁決を経ない取消訴訟を提起できない` → `適法な審査請求に対する裁決を経なければ取消訴訟を提起できない`
  * E 文末欠落: `（行政事件訴訟法8条... ` → `（行政事件訴訟法8条1項ただし書）。ただ、適法な審査請求がなされた場合には、審査庁が誤って不適法却下したとしても、適法な審査請求を経たものと取り扱われるから(最判昭36.7.21)、本肢所定の場合の原処分取消しの訴えは許される。`
  * ans=false 維持（Q の結語「却下裁決に対する取消訴訟を提起すべき」は誤り、最判昭36.7.21 により原処分取消しの訴えが許される）
  * scope: p136-q01 seq4 のみ、Q+E 束ね（v85 同方針、polarity 非影響）
  * handoff pending queue には Q のみ記録だったが、原本読取時に E substantive garble + 文末欠落を発見し束ねて修正（v85 precedent 同様）

確認経路: images/0136.png 原本（Claude vision, book p374-375 行4、section 取消訴訟と審査請求との関係） + 行政事件訴訟法8条1項ただし書 + 最判昭36.7.21（誤って不適法却下された適法な審査請求は経たものと扱う） + DB 内 ans=false 自己整合 の 3 経路一致。

### v98 差分（2026-04-22）

* **本 PR / p006-q01 seq2 ans polarity hotfix**（**B 群 B2 の層 1 のみ = polarity flip 先行**、Q / E 未修正維持、書籍 page 014-015 見開き section 統治行為論、書籍 page 015 右列 row 2 ×）
  * **ans**: `True → False`（polarity flip、single byte diff）
  * **Q / E**: **未修正維持**。以下の破損は検出済みだが今回は **touch しない**:
    - Q: 「一見極めて明白に違憲無効と認められる場合を除き、司法審査は及ばない」と**留保あり**と記述
    - E: 冒頭 `判例（最判昭35.6.8：苫米地事件）は...` の `...` 未充填、`「` 開き欠落で `」` のみ閉じ、「**留保は付されていない**」と Q を正面否定する記述
    - Q（留保あり）vs E（留保なし）= 自己矛盾。ans=True はこの矛盾の下で Q を肯定していたが、E 側と整合させるなら ans=False が妥当
  * **なぜ ans だけ先行修正か**: 現 DB 内部の Q / E 対比から ans=False の妥当性が単独で読め、polarity 誤りは学習体験に直接影響するため早期修正の価値が高い。Q / E の verbatim restore は原本画像なしには AGENTS.md「推測で断定しない / data 全体書き換え禁止」ルールに抵触するため**層 1 と層 2 を明確に分離**する。
  * **なぜ Q / E を保留したか**: `images/0006.png` / `images_preprocessed/0006.png` が **repo 内に未存在**（2026-04-22 worktree 確認、`git ls-files` でも未追跡、`images_preprocessed/` は 0004.png → 0007.png で 0005/0006 欠落）。原本画像なしに verbatim Q/E 復元は条文逆算と同種の「domain knowledge 補完」となり、v96 / v97 で確立した **ERROR_UNREADABLE_SOURCE 維持 / 原本逆算禁止** ルールに抵触する。
  * **原本到着後に何を再開するか**:
    1. p006 原本画像（`0006.png`）が repo に追加された時点で frozen 解除
    2. B2 の Q / E verbatim restore（苫米地事件判旨の `...` 部分 + 「留保なし」記述の verbatim 確定）
    3. B3（seq3, 統治行為論）の read-only 判定 → ans=False→True flip 可否 + E restore（判例特定は原本照合後に確定）
    4. B1（seq1, 共産党除名事件、現 handoff `cosmetic close` 前提は**誤り**。Q+E restore 対象）の再 open
    5. B4（seq4, 在宅投票事件、E 中央 restore が主対象、Q 軽微修正は同 PR で可）の restore
  * scope: p006-q01 seq2 `answerBoolean` のみ、他 seq (1/3/4) の ans / Q / E sha256 変化なし確認済、data ↔ public byte-identical mirror 維持（1,224,336 bytes、+1 byte = `true`→`false`）

確認経路: **原本画像なし**ゆえ従来の 3 経路一致は不成立。代わりに DB 内部整合のみに依拠: (a) 現 DB Q は「留保あり＝除き、司法審査は及ばない」と記述 / (b) 現 DB E は「留保は付されていない」と明示 / (c) Q と E は polarity 反対の主張をしており、どちらかが誤りである / (d) E 側（苫米地事件は純粋統治行為、留保不在）は一般法学知識と整合 → ans=False が単独妥当。**この判定は原本による verbatim 確認を経ておらず、Q / E 本文の復元を伴わないことを前提とした polarity hotfix に限定する**。

load-bearing Python assertion（編集時に検証済み、7 点）:
- `p006 seq2 answerBoolean === False`（edit 後）
- `p006 seq2 Q sha256 前後で不変（a5d5d47e2c5b）`
- `p006 seq2 E sha256 前後で不変（6582419beec5）`
- `p006 seq1/seq3/seq4 answerBoolean 前後で不変（True / False / True）`
- `p006 seq1/seq3/seq4 Q + E sha256 前後で不変`
- `data/reviewed_import.json ↔ public/data/reviewed_import.json byte-identical`
- `size delta = +1 byte（"true" → "false"）`

### v97 差分（2026-04-21）

* **PR #58 / p118-q01 seq1 E restore**（**B 群 active #2 = B6 = B 群 active 完走**、E text のみ、Q 無修正、polarity 非影響、書籍 page 338-339 見開き、section 教示, テキスト p.225〜227、書籍 page 339 右列 row 1 ×）
  * **E 中盤 教示事項**: `口頭又は書面で当該処分に係る部分を教示` → `①審査請求をすることができること、②審査請求をすべき行政庁および③審査請求期間を書面で教示`
    - 行政不服審査法82条1項の教示 3 事項（①審査請求可能な旨、②審査請求をすべき行政庁、③審査請求期間）+ 方法（書面）を、abstract drift `当該処分に係る部分` から concrete 3 点列挙へ restore
    - 方法も `口頭又は書面で` → `書面で`（82条1項本文は書面、口頭処分は冒頭「口頭でする場合を除き」で既に除外済み、二重表現の解消）
  * **E 括弧内ラベル**: `職権による必要的記載` → `職権による必要的教示`（講学上のラベル正字化、OCR 1 char drift）
  * **E 84条 tail は ERROR_UNREADABLE_SOURCE として完全不変維持**: `不服申立ての記載に関する事項は、教示ではなく、裁決をする権限庁に情報提供努力義務が課せられている（84条）。` は画像解像度で「努力/供与」「課せられている/課されている」等の微差 verbatim 確定不能、条文逆算禁止ルールに従い touch せず（v96 B5 `...` 保持と同方針）
  * **E 冒頭 `...`** は原本教科書自体が `…` 省略ゆえ touch なし（handoff 既判定、non-issue）
  * **括弧内 separator `・`** は低信頼ゆえ touch なし（`・` vs `：` の差、cosmetic 寄り）
  * **Q 無修正**: 現行 Q の overbroad `審査請求書に記載すべき事項` は 82条1項の教示 3 点に含まれず、本肢の誤答ポイント = ans=False の根拠そのもの、正常
  * ans=False 維持（polarity 非影響）
  * scope: p118-q01 seq1 のみ、他 seq (2-5) hash 変化なし確認済

確認経路: images_preprocessed/0118.png（Claude vision, 書籍 page 338-339 見開き、section 教示, テキスト p.225〜227、書籍 page 339 右列 row 1 ×） + 行政不服審査法82条1項（教示 3 事項 + 書面）との整合 + DB 内 ans=False / Q overbroad を E 3 点列挙で正面否定の自己整合 の 3 経路一致（84条 tail + separator + `...` は未確定、3 経路一致の対象から除外）。

load-bearing Python assertion（編集時に検証済み、9 点）:
- data ↔ public byte-identical mirror（1,224,335 bytes）
- Q 完全 verbatim 一致（touch なし確認）
- E: `①審査請求をすることができること、②審査請求をすべき行政庁および③審査請求期間を書面で教示` 含有
- E: 旧 drift `口頭又は書面で当該処分に係る部分を教示` 非含有
- E: `（職権による必要的教示・行政不服審査法82条1項）` 含有
- E: `必要的記載` 非含有
- E: 84条 tail verbatim 保持 + E 末尾終端
- ans=False 維持
- 他 seq (2/3/4/5) E sha256 変化なし

### v96 差分（2026-04-21）

* **PR #57 / p090-q01 seq1 Q+E restore**（**B 群 active #1 = B5**、Q 1 char OCR + E 末尾 substantive restore、書籍 page 282-283 見開き、section 届出, テキスト p.201〜202、書籍 page 283 右列 row 1 ×）
  * **Q**: `語否` → `諾否`（OCR 1 char 誤字、届出定義「諾否の応答が義務づけられている」の正字化、polarity 非影響）
  * **E 末尾**: `応答義務があり、通知により自己の期待する` → `応答義務がなく、通知により届出人の期待する`
    - `応答義務があり` → `応答義務がなく`: 届出定義（行政手続法2条7号）との整合、現行 E は条文定義と真っ向から反転していたため substantive restore の核心
    - `自己の期待する` → `届出人の期待する`: 主語 drift の原本復元
  * **E 中盤 `...` は unresolved 維持**: `申請（2条3号）...届出の場合には、` の `...` 部分 = transitional sentence は `images_preprocessed/0090.png` の解像度で verbatim 確定不能のため **ERROR_UNREADABLE_SOURCE** として unresolved 維持。条文逆算による補完は運用ルール上禁止（user directive 2026-04-21 確立）
  * ans=False 維持（Q「届出は諾否応答義務あり」を E が届出定義で正面否定、polarity 非影響）
  * scope: p090-q01 seq1 のみ、Q+E 束ね（v84/v85/v87/v92 と同型）、他 seq (2-5) hash 変化なし確認済

確認経路: images_preprocessed/0090.png（Claude vision, 書籍 page 282-283 見開き、section 届出, テキスト p.201〜202、書籍 page 283 右列 row 1 ×） + 行政手続法2条3号（申請の諾否応答義務）/ 2条7号（届出の通知義務、応答義務なし、通知による法的効果発生）+ DB 内 ans=False / Q-E polarity の自己整合 の 3 経路一致（中盤 transitional sentence は画像解像度限界で未確定、3 経路一致の対象から除外）。

load-bearing Python assertion（編集時に検証済み、v95 までの precedent 継承）:
- Q: `諾否` 含有、`語否` 非含有
- E: `応答義務がなく、通知により届出人の期待する` 含有
- E: 旧 garble `応答義務があり、通知により自己の期待する` 非含有
- E: `申請（2条3号）...届出の場合には、` 構造保持（`...` を unresolved marker として意図的に残置）
- ans=False 維持
- data/reviewed_import.json ↔ public/data/reviewed_import.json byte-identical（1,224,257 bytes）
- p090 他 seq (2/3/4/5) E sha256 変化なし（seq2: `85facba259e4` / seq3: `92e63992b12d` / seq4: `5e4fb546c376` / seq5: `efea57758032`）

### v95 差分（2026-04-21）

* **PR #55 / p136-q01 seq3 E restore**（**A 群 #7 = A 群最終項目**、E text のみ、polarity 非影響、書籍 page 375 右列 row 3 ×）
  * stray opening bracket + 語句 substantive 誤字: `「直ちに提出できるのが原則` → `直ちに提起できるのが原則`（開き「を除去 + 提出/提起の法律用語正字化）
  * 大幅文末欠落復元（行訴法 3 条文整合の全段）:
    - 前段評価: `、裁決を経なければ取消訴訟を提起できないのが原則であるとする前段は誤っている。`（Q 前段「裁決を経ることなく…できない」を否定）
    - 例外 section citation: `なお、審査請求前置主義が採用されている場合でも（8条1項ただし書）、`
    - 3 か月 rule + 後段評価: `審査請求があった日から3か月を経過しても裁決がないときは、裁決を経ないで処分取消訴訟を提起することができるから（8条2項1号）、後段は正しい。`（Q 後段「審査請求をするか否かを確認する必要がある」の方を正しいと評価）
  * ans=false 維持（Q 全体としては前段が誤りゆえ不正解、polarity 非影響）
  * scope: p136-q01 seq3 E のみ。**本 PR で A 群 7 件全て close**
  * 新方針 2 サイクル目適用（PR #53 確立、PR #54 で初適用）

確認経路: images_preprocessed/0136.png 原本（Claude vision, Kindle p374-375 見開き、書籍 page 375 右列 row 3 ×、section 7) 取消訴訟と審査請求との関係） + 行政事件訴訟法8条1項本文（自由選択主義 = 原則）/ 8条1項ただし書（審査請求前置主義 = 例外）/ 8条2項1号（3か月経過で直ちに提起可）との整合 + DB 内 ans=false / 前段誤り・後段正しいの分離評価の自己整合 + v87 close 済み seq4（8条1項ただし書）/ v93 close 済み seq1（8条1項本文）/ v94 close 済み seq2（8条1項本文 + ただし書）との対比整合 の 3 経路一致。

load-bearing Python assertion（編集時に検証済み）:
- 冒頭 `処分取消しの訴えは、審査請求ができる場合であっても直ちに提起できるのが原則であるから` で開始（`「直ちに` の stray bracket なし、`提出` なし）
- `（行政事件訴訟法8条1項本文：自由選択主義）` 含有
- `裁決を経なければ取消訴訟を提起できないのが原則であるとする前段は誤っている。` 含有
- `なお、審査請求前置主義が採用されている場合でも（8条1項ただし書）` 含有
- `審査請求があった日から3か月を経過しても裁決がないときは` 含有
- `（8条2項1号）` 含有
- `後段は正しい。` で末尾終端
- 旧 garble 非含有: `「直ちに` / `直ちに提出` / `...` / `…`

### v94 差分（2026-04-20）

* **PR #54 / p136-q01 seq2 E restore**（A 群 #6、E text のみ、polarity 非影響、書籍 page 375 右列 row 2 ×）
  * 中盤 structural garble: `、法律に別段の定めがない限り、直ちに処分の取消しの訴えを提起してもよいのが原則である）...自由選択主義...`
    → `、不服申立てをしてもよいし、直ちに処分の取消しの訴えを提起してもよいのが原則であり（行政事件訴訟法8条1項本文：自由選択主義）、`
  * 文末欠落（残り本文全段の復元）:
    - `、法律により不服申立てに対する裁決を経た後でなければ、処分の取消しの訴えを提起できないのは例外である（8条1項ただし書：審査請求前置主義）。`（審査請求前置主義 = 例外の明示）
    - `よって、処分の取消しの訴えは、法律に別段の定めがない限り、審査請求に対する裁決を経ないで直ちに処分の取消しの訴えを提起できる。`（本肢 Q の結語「裁決を経た後でなければ提起できない」を正面否定）
  * ans=false 維持（Q 前段「原則として審査請求前置主義」を E が自由選択主義＝原則、審査請求前置主義＝例外と反転して正面否定、polarity 非影響）
  * scope: p136-q01 seq2 E のみ。p136 残は A7 seq3 E のみ（v87 で seq4 close、v93 で seq1 close、本 PR で seq2 close）
  * 新方針（PR #53 確立）初適用: sync PR 無し、restore PR 1 本のみで完結

確認経路: images_preprocessed/0136.png 原本（Claude vision, Kindle p374-375 見開き、書籍 page 375 右列 row 2 ×、section 7) 取消訴訟と審査請求との関係） + 行政事件訴訟法8条1項本文（自由選択主義 = 原則）/ 8条1項ただし書（審査請求前置主義 = 例外）との整合 + DB 内 ans=false / Q「原則として審査請求前置主義」を E が正面否定の自己整合 + v93 close 済み seq1（同じく自由選択主義側）/ v87 close 済み seq4（8条1項ただし書）との対比整合 の 3 経路一致。

load-bearing Python assertion（編集時に検証済み）:
- 冒頭 `行政処分に対し不服申立てをすることができる場合、不服申立てをしてもよいし、` で開始
- `（行政事件訴訟法8条1項本文：自由選択主義）` 含有
- `（8条1項ただし書：審査請求前置主義）` 含有
- `よって、処分の取消しの訴えは、法律に別段の定めがない限り、` 含有
- `審査請求に対する裁決を経ないで直ちに処分の取消しの訴えを提起できる。` で末尾終端
- 旧 garble 非含有: `場合、法律に別段の定めがない限り、直ちに処分の取消しの訴えを提起してもよいのが原則である` / `原則である）` / `...` / `…`

### v93 差分（2026-04-20）

* **PR #51 / p136-q01 seq1 E restore**（A 群 #5、E text のみ、polarity 非影響、書籍 page 375 右列 row 1 ○）
  * 中盤 substantive garble: `当該処分につき定めがなければ、` → `当該処分につき法令の規定により審査請求をすることができる場合においても、`
  * duplicate phrase 除去: `直ちに処分の取消しの訴えを提起すること...` → `直ちに提起することができる`（主語「処分の取消しの訴えは」は既に冒頭で提示済みゆえ重複句を削除、同時に文末欠落 `...` を `ができる` で閉じる）
  * 結語 citation は変更なし: `（行政事件訴訟法8条1項本文：自由選択主義）。`
  * ans=true 維持（Q「審査請求ができる場合でも処分取消の訴えを直ちに提起してよいか」を E「直ちに提起することができる」で肯定、polarity 非影響）
  * scope: p136-q01 seq1 E のみ

確認経路: images_preprocessed/0136.png 原本（Claude vision, Kindle p374-375 見開き、書籍 page 375 右列 row 1 ○、section 7) 取消訴訟と審査請求との関係） + 行政事件訴訟法8条1項本文（自由選択主義 = 審査請求できる処分でも取消訴訟を直ちに提起可）との整合 + DB 内 ans=true / Q を E が正面肯定の自己整合 + v87 で close 済みの seq4（8条1項ただし書）との対比整合 の 3 経路一致。

load-bearing Python assertion（編集時に検証済み）:
- 冒頭 `処分の取消しの訴えは、当該処分につき法令の規定により審査請求をすることができる場合においても、` で開始
- `直ちに提起することができる（行政事件訴訟法8条1項本文：自由選択主義）。` 含有
- `（行政事件訴訟法8条1項本文：自由選択主義）。` で末尾終端
- 旧 garble `定めがなければ` / 重複句 `直ちに処分の取消しの訴えを提起すること` 非含有
- `...` / `…` 非含有

### v92 差分（2026-04-20）

* **PR #49 / p116-q01 seq2 E restore**（A 群 #4、E text のみ、polarity 非影響、書籍 page 335 右列 row 8 ×）
  * 頭欠落復元: （冒頭に追加）`再調査の請求においては、`
  * OCR 誤字: `処分庁が、必要があると認める場合には` → `処分庁は、必要があると認める場合には`（「が→は」）
  * 中盤 substantive garble + 文末欠落復元: `申立てによる場合で…` → `申立てによりまたは職権で、処分の効力、処分の執行または手続の続行の全部または一部の停止その他の措置（執行停止）をとることができる。`
  * ans=false 維持（Q「請求人が申し立てることはできない」に対し、E が「審査請求人の申立てによりまたは職権で」執行停止可能と示し正面否定、polarity 非影響）
  * scope: p116-q01 seq2 E のみ。Q 側の軽微 OCR 差（`なされたとき/なされた場合`、`職権で、/職権で`）は非substantive で保持
  * 書籍 page 335 の row 番号は p115 からの継続（row 7-10）。DB p116 seq1-4 ↔ 書籍 row 7-10 対応

確認経路: images_preprocessed/0116.png 原本（Claude vision, Kindle p334-335 見開き、書籍 page 335 右列 row 8 ×、section 再調査の請求） + 行政不服審査法25条2項（執行停止は審査請求人の申立てまたは職権）+ 61条（再調査の請求への準用）+ DB 内 ans=false / Q「請求人が申し立てることはできない」を E で正面否定の自己整合 の 3 経路一致。

load-bearing Python assertion（編集時に検証済み）:
- 冒頭 `再調査の請求においては、` で開始
- `行政不服審査法25条2項が準用され（61条）` 含有
- `処分庁は、必要があると認める場合には` 含有
- `審査請求人の申立てによりまたは職権で` 含有
- `（執行停止）をとることができる。` で末尾終端
- 旧 garble `処分庁が、` / `申立てによる場合で` 非含有、`…` / `...` 非含有

### v91 差分（2026-04-20）

* **PR #47 / p162-q01 seq2 E restore**（A 群 #3、E text のみ、polarity 非影響、書籍 page 427 右列 row 2 ×）
  * OCR 1 char drop: `負担者というためには` → `負担者といえるためには`（「え」欠落）
  * OCR 1 char drop: `実質的にこの者と` → `実質的にはこの者と`（「は」欠落）
  * 文末欠落（`…` → 原本復元）: `と認められる者であって、当該営造物の瑕疵による危険を効果的に防止しうる者であることが必要であり（最判昭50.11.28）、補助金を交付する場合、常に費用負担者にあたるとするものではない。`（国賠法3条1項共同執行者論の判例 + 結語復元）
  * ans=false 維持（E 末尾「補助金を交付する場合、常に費用負担者にあたるとするものではない」で Q「国も、…常に賠償責任を負う」を正面否定、polarity 非影響）
  * scope: p162-q01 seq2 E のみ。`国家賠償法３条１項` の全角表記は p162 内（seq1/seq3 含む）の DB 既存 convention を保持（変更せず）

確認経路: images_preprocessed/0162.png 原本（Claude vision, Kindle p426-427 見開き、書籍 page 427 右列 row 2 ×、section 賠償責任者、求償権） + 国家賠償法3条1項（費用負担者の損害賠償責任）+ 最判昭50.11.28（補助金交付のみでは費用負担者に当たらない判例）との整合 + DB 内 ans=false / Q「常に賠償責任を負う」を E で正面否定の自己整合 の 3 経路一致。

load-bearing Python assertion（編集時に検証済み）:
- `負担者といえるためには` 含有
- `実質的にはこの者と` 含有
- `（最判昭50.11.28）` 含有
- `常に費用負担者にあたるとするものではない。` で末尾終端
- `執行していると認められる者であって` 含有
- 旧 garble `というためには` / `実質的にこの者と` 非含有、`…` / `...` 非含有
- 全角 `国家賠償法３条１項` 保持、半角 variant 非混入

### v90 差分（2026-04-20）

* **PR #45 / p175-q01 seq3 E restore**（A 群 #2、E text のみ、polarity 非影響、書籍 page 453 右列 row 3 ×）
  * 条番号 garble: `（地方自治法102条1項）` → `（地方自治法102条2項）`（定例会招集の根拠条項訂正、seq2 が既に 102条1項 を「議会＝定例＋臨時」として引用済みとの整合改善）
  * 接続詞 OCR: `。また、` → `。なお、`
  * 構造 + 語句 garble: `普通地方公共団体の議会（定例会および臨時会とするのが妥当であるが）` → `普通地方公共団体の議会は定例会および臨時会とするのが原則であるが（102条1項）、`（括弧位置マングル + 妥当/原則 substantive garble + 102条1項 引用欠落、一括復元）
  * 文末欠落（`...` → 原本復元）: `条例の定めにより通年の会期（条例で定める日から翌年の当該日の前日までを会期とするもの）とすることができる（102条の2第1項）。`（通年会期制 102条の2第1項 の本文全段復元）
  * ans=false 維持（E 前段「4回以内で規則で定める回数」ではなく「条例で定める回数」で Q を正面否定、polarity 非影響）
  * scope: p175-q01 seq3 E のみ

確認経路: images_preprocessed/0175.png 原本（Claude vision, Kindle p452-453 見開き、書籍 page 453 右列 row 3 ×、section 3) 招集及び会期） + 地方自治法102条1項（議会＝定例＋臨時）/ 102条2項（定例会は条例で定める回数）/ 102条の2第1項（通年会期制）との整合 + DB 内 ans=false / seq2 が同条1項を別文脈で引用済みとの自己整合 の 3 経路一致。

load-bearing Python assertion（編集時に検証済み）:
- `（地方自治法102条2項）` 含有
- `とするのが原則であるが（102条1項）` 含有
- `通年の会期` 含有
- `（102条の2第1項）。` で末尾終端
- `なお、` 使用（`また、` 不使用）
- 旧 garble `妥当であるが` / `また、` / head の `（地方自治法102条1項）` 非含有

### v89 差分（2026-04-20）

* **PR #44 / p175-q01 seq1 E restore**（A 群 §5 再走検出分の先頭、E text のみ、polarity 非影響、書籍 page 453 右列 row 1 ×）
  * OCR 誤字: `議案または議員定数` → `議長または議員定数`
  * OCR 誤字: `あったときは（101条2項・3項）` → `あったときも（101条2項・3項）`
  * 条番号 garble: `（104条4項）` → `（101条4項）`
  * 文末欠落（`。も...` → 原本復元）: `。もっとも、議長または議員による臨時会招集請求（101条2項、3項参照）のあった日から20日以内に当該普通地方公共団体の長が臨時会を招集しないときは、議長は、議長による臨時会招集請求の場合には自ら臨時会を招集することができ（101条5項）、議員による臨時会招集請求の場合には請求者の申出に基づき当該申出の日から都道府県および市にあっては10日以内、町村にあっては6日以内に臨時会を招集しなければならない（101条6項）。`
  * ans=false 維持（E 冒頭「議長ではなく、原則として普通地方公共団体の長が招集する」で Q を正面否定、polarity 非影響）
  * scope: p175-q01 seq1 E のみ

確認経路: images_preprocessed/0175.png 原本（Claude vision, Kindle p452-453 見開き、書籍 page 453 右列 row 1 ×、section 3) 招集及び会期） + 地方自治法101条1項/2項・3項/4項/5項/6項（書籍が引用する条項番号）との整合 + DB 内 ans=false / Q「議長が招集」を E で正面否定 の 3 経路一致。

### v88 差分（2026-04-20）

* **PR #43 / p227-q01 seq3 E digit restore**（v83 保留の digit garble を高解像度 crop で close + 同 seq 内追加破損束ね修正、polarity 非影響）
  * 条文引用 digit（v83 保留項目）: `13歳2項110号` → `13条1項10号`（民法13条1項10号 = 制限行為能力者 4 類型の定義的引用箇所）
  * 論理接続詞: `有しなかったときは、「未成年者もしくは...」であったときは` → `有しなかったときまたは「未成年者もしくは...」であったときは`（民法98条の2 本文の「又は」構造）
  * 1 文字欠落: `受領に制限行為能力者` → `受領時に制限行為能力者`
  * 区切り記号: `；` → `：`
  * 結語 quote: `未成年者と成年被後見人」` → `「未成年者と成年被後見人」`（開き「欠落）
  * ans=false 維持（v78 で確定、polarity 非影響）
  * scope: p227-q01 seq3 E のみ

確認経路: images/0227.png 原本**高解像度 crop**（Claude vision, book p557 row 1 ×、section 意思表示の効力発生時期、digit が明瞭に `13条1項10号` と読取可能） + 民法13条1項10号（制限行為能力者の定義的引用：未成年者、成年被後見人、被保佐人、被補助人 4 類型を列挙）整合 + DB 内 ans=false / Q「制限行為能力者」overbroad（v78 close 済み）自己整合 の 3 経路一致。

v83 時点では「画像単独では digit 確定不能 / legal fit 弱く推定復元不可」として保留していたが、高解像度再 crop で digit 確定可能となり、かつ民法13条1項10号は制限行為能力者の定義的引用として legal fit も強く確立したため close。prior 保留理由の両条件が解消した局面での判断。

### post-v76 housekeeping

* leaked-key 由来の ephemeral JSON 削除済み
* 旧 PR branch / tmp branch cleanup 実施済み
* Gemini leaked key 2 本の rotate 完了（2026-04-19）：旧 2 本失効済み / 新 1 本発行済み / 値は未記載

## 次セッション最優先タスク

### 1. 累積 recheck queue 整理（C レーン一括 PR 候補）

C レーン先頭（次に触るべき 1 件）= **OCR pending queue の先頭項目（下記 §2）**

* ~~p214 seq1-3 追跡項目~~ → 2026-04-19 照合済み close（polarity / 条文整合 / ledger `master_correction_ledger.json` の 2026-04-07 fix と整合、修正不要）
* ~~p227 seq1/seq2/seq3 polarity / sectionTitle drift~~ → v78 で close（PR #32）
* ~~p219-q01 seq3 Q OCR 破損~~ → v81 で close（PR #36）
* ~~p227-q01 seq2 Q/E/ans 相互矛盾（第三者強迫 D への復元）~~ → v82 で close（PR #37）
* ~~p227-q01 seq3 E 高信頼4箇所（有していた→有しなかった、できる→できない、類型順序+正字、重複ペア）~~ → v83 で close（PR #38）。条文引用 `13歳2項110号` は低信頼のため未修正、下記 §2 の `—` 行に残存（実作業キュー外）
* ~~p062-q01 seq7 Q+E 文末欠落 + OCR 誤字（移動者→義務者、行政代執行法2条引用復元）~~ → v84 で close（PR #39）
* ~~p078-q01 seq4 Q+E 文末欠落 + 送り仮名 + E substantive garble（公聴会 vs 意見陳述の手続）~~ → v85 で close（PR #40）
* ~~p119-q01 seq1 Q+E+ans substantive restore（Q 全面復元 + polarity flip true→false + E 条文引用整理、行政不服審査法83条1項/3項/4項/5項）~~ → v86 で close（PR #41）
* ~~p136-q01 seq4 Q+E 文末欠落 + Q/E 両方の substantive garble（違法/適法の反転、行政事件訴訟法8条1項ただし書 + 最判昭36.7.21）~~ → v87 で close（PR #42）
* ~~p227-q01 seq3 E 条文引用 digit（13歳2項110号→13条1項10号）+ 同 seq 内追加破損束ね（または/受領時/開き「）、民法13条1項10号 整合~~ → v88 で close（PR #43、v83 保留項目の最終 close）
* ~~A1 p175-q01 seq1 E（§5 再走検出分の先頭、OCR 誤字 2 箇所「議案→議長」「ときは→ときも」+ 条番号 garble 104条4項→101条4項 + 文末欠落 `。も...` → 101条5項/6項まで復元、地方自治法101条全項整合）~~ → v89 で close（PR #44）
* ~~A2 p175-q01 seq3 E（条番号 garble 102条1項→2項 + 接続詞「また→なお」+ 構造 garble「議会（…妥当であるが）」→「議会は…原則であるが（102条1項）」+ 文末欠落 → 通年会期制 102条の2第1項 まで復元、地方自治法102条全項整合）~~ → v90 で close（PR #45）
* ~~A3 p162-q01 seq2 E（OCR 1 char drop 2 箇所「という→といえる」「実質的に→実質的には」+ 文末欠落 → 国賠法3条1項共同執行者論 + 最判昭50.11.28 引用復元）~~ → v91 で close（PR #47）
* ~~A4 p116-q01 seq2 E（頭欠落「再調査の請求においては、」+ OCR 誤字「処分庁が→は」+ 中盤 garble「申立てによる場合で…→申立てによりまたは職権で、…執行停止…」復元、行審法25条2項 + 61条整合）~~ → v92 で close（PR #49）
* ~~A5 p136-q01 seq1 E（中盤 substantive garble「定めがなければ、→法令の規定により審査請求をすることができる場合においても、」+ duplicate phrase 除去 + 文末欠落「提起すること...→提起することができる」、行訴法8条1項本文: 自由選択主義）~~ → v93 で close（PR #51）
* ~~A6 p136-q01 seq2 E（中盤 structural garble「法律に別段の定めがない限り、直ちに〜原則である）...→不服申立てをしてもよいし、直ちに〜原則であり（8条1項本文: 自由選択主義）」+ 大幅文末欠落「8条1項ただし書: 審査請求前置主義 + 結論」、行訴法8条1項本文 + ただし書 + 結論の 3 段構成復元）~~ → v94 で close（PR #54）
* ~~A7 p136-q01 seq3 E（stray 開き「 + 提出/提起 substantive 誤字 + 大幅文末欠落「前段誤り評価 + 8条1項ただし書 + 8条2項1号 3か月 rule + 後段正しい評価」復元、行訴法 3 条文整合）~~ → v95 で close（PR #55）**= A 群完走**

### 2. OCR pending queue（browser OCR / vision 要）

旧「cosmetic OCR 揺れ ~7 件」を廃止し、明示列挙に置換（2026-04-20）。
CLAUDE.md §5 auto-detection rule を **v88 反映後に再走**（2026-04-20）→ 新規に 13 件の未拾い案件を検出。A 群 7 件 = substantive 文末欠落（実作業対象）、B 群 6 件 = 判例/条文の `...` 圧縮で原本照合が必要（判断保留）、C 群 3 件 = 標準的な `……` 学術引用ゆえ修正不要（queue 外）。

**運用**:

* 修正は **1 ページずつ別 PR**（バンドル禁止、page-by-page PR 対象）
* browser OCR / vision で正文確定後に着手
* 確定前は polarity / ledger を触らない
* A 群を先に消化し、B 群は A 群完了後に原本照合で substantive/cosmetic を再判定

**A 群 — substantive 文末欠落（実作業対象, 7 件, 2026-04-20 §5 再走反映）**:

| # | 対象 | 症状 | 状態 |
| --- | --- | --- | --- |
| ~~A1~~ | ~~p175-q01 seq1 E~~ | ~~末尾 `（104条4項）。も...` で dangling（「も...」だけ残存）~~ | ~~close（v89, PR #44）~~ |
| ~~A2~~ | ~~p175-q01 seq3 E~~ | ~~末尾 `（定例会および臨時会とするのが妥当であるが）...` で中断（+ 前半に 102条1項/2項 条番号 garble、「また/なお」接続詞 garble、括弧構造 + 妥当/原則 garble）~~ | ~~close（v90, PR #45）~~ |
| ~~A3~~ | ~~p162-q01 seq2 E~~ | ~~末尾 `事業を共同して執行している…` で中断、国賠法3条1項共同執行者論の結語欠落（+ 前半に OCR 1 char drop 2 箇所「という/といえる」「実質的に/実質的には」）~~ | ~~close（v91, PR #47）~~ |
| ~~A4~~ | ~~p116-q01 seq2 E~~ | ~~末尾 `…審査請求人の申立てによる場合で…` で中断、行審法25条2項準用の帰結欠落（+ 頭欠落 + 「処分庁が/は」OCR 誤字）~~ | ~~close（v92, PR #49）~~ |
| ~~A5~~ | ~~p136-q01 seq1 E~~ | ~~`提起すること...（行政事件訴訟法8条1項本文：自由選択主義）。` — 「ができる」等の語欠落（+ 中盤 substantive garble「定めがなければ」、duplicate phrase）~~ | ~~close（v93, PR #51）~~ |
| ~~A6~~ | ~~p136-q01 seq2 E~~ | ~~末尾 `…自由選択主義...` で中断、結論文欠落（+ 中盤 structural garble 「法律に別段の定め/不服申立てをしてもよいし」、8条1項ただし書〜結論の 3 段全欠落）~~ | ~~close（v94, PR #54）~~ |
| ~~A7~~ | ~~p136-q01 seq3 E~~ | ~~末尾 `（行政事件訴訟法8条1項本文：自由選択主義）...` で中断（+ 冒頭 stray 「 と 提出/提起 誤字）~~ | ~~close（v95, PR #55）= A 群最終項目~~ |

**着手順**: 上表 ~~A1~~ → ~~A2~~ → ~~A3~~ → ~~A4~~ → ~~A5~~ → ~~A6~~ → ~~A7~~（全 close、**A 群完走**）。v87 で p136-q01 seq4 close + v93/v94/v95 で p136 seq1/seq2/seq3 close により、**p136 全 4 seq 完了**。**次着手 = B 群**（判断保留 6 件、原本照合で substantive/cosmetic 再判定）。

**B 群 — borderline（判断保留, 6 件, 原本照合後に substantive/cosmetic 再判定。2026-04-21 read-only 判定で内訳再整理）**:

| # | 対象 | 症状 | 状態 |
| --- | --- | --- | --- |
| B1 | p006-q01 seq1 Q + E | 共産党除名事件、Q + E 両方に restore 要。旧 handoff `cosmetic close` 判定は**誤り**（2026-04-22 user directive で再 open） | **P2 backlog（2026-04-23 v3 flow 反映で格下げ）** — `images_preprocessed/0006.png` 収載済（low-res raw 派生 preprocessed）だが主レーンを止めない方針。次バッチ境界で再判定、真の high-res recrop 取得時に着手。主レーン = 後半 L2 取込は B1 解消を待たずに進行 |
| ~~B2~~ | ~~p006-q01 seq2 Q + E + ans~~ | ~~苫米地事件、Q「留保あり」vs E「留保不在」の自己矛盾 + E 冒頭 `...` / 開き「欠落~~ | ~~**closed to limit of source quality**（層 1 = v98 ans polarity hotfix + v99 Q/E substantive restore、層 2 = image-quality-limited fragment は `...` literal 保持で ERROR_UNREADABLE_SOURCE 運用）。**層 1 = substantive risk mitigated**（v98 PR #62 `671eb79` ans True→False flip、v99 本 PR E 冒頭「最判」→「最大判」1 char 補正 + E 中盤 `...` → 3 段 concrete text restore（直接国家統治 / 法律上の争訟 / 裁判所の審査権の外）+ E 末尾「〜という本肢は誤っている。」評価句 restore、ans=False 維持、Q は層 1 では未変更）／ **層 2 = image-quality-limited fragment unresolved**（E 中盤の助詞 / 句読点 / subject 語句 character-level marginal、E 本文中に `...` literal を保持しつつ ERROR_UNREADABLE_SOURCE として **future high-res recrop candidate only**、条文逆算禁止、B5/B6 と同運用）~~ |
| ~~B3~~ | ~~p006-q01 seq3 E + ans~~ | ~~統治行為論、`判例は...場合でも` 中間語脱落、ans False→True flip 候補~~ | ~~**closed to limit of source quality**（v100, 本 PR、Q+E+ans bundled 束ね、v82/v86 precedent）。**層 1 = substantive risk mitigated + polarity flip**（ans False→True flip + E 冒頭「統治行為論の問題であり、判例は」→「いわゆる統治行為の問題である。判例（最大判昭35.6.8：苫米地事件）は、」+ E 中盤 `...` → 3 段 concrete text restore（直接国家統治 / 法律上の争訟 / 裁判所の審査の対象）+ E 末尾「判断している」→「判示している」1 char 正字化、Q は変更なし）／ **層 2 = image-quality-limited fragment unresolved**（助詞 / 句読点 / subject 語句 character-level marginal、E 本文中に `...` literal を保持しつつ ERROR_UNREADABLE_SOURCE として **future high-res recrop candidate only**、条文逆算禁止、B5/B6/B2 同運用）~~ |
| B4 | p006-q01 seq4 Q + E | 在宅投票事件、**E 中央 restore** が主対象、Q 軽微修正は同 PR で可 | **P2 backlog（2026-04-23 v3 flow 反映で格下げ）** — `images_preprocessed/0006.png` 収載済（low-res raw 派生 preprocessed）だが主レーンを止めない方針。次バッチ境界で再判定、真の high-res recrop 取得時に着手 |
| ~~B5~~ | ~~p090-q01 seq1 E~~ | ~~`申請（2条3号）...届出の場合には` — 申請と届出の対比記述が圧縮~~ | ~~**closed to limit of source quality**（v96, PR #57）。**層 1 = substantive risk mitigated**（Q 1 char「語否→諾否」+ E 末尾 論理反転「応答義務があり→応答義務がなく」+ 主語 drift「自己の→届出人の」を原本復元、ans=False 維持）／ **層 2 = image-quality-limited fragment unresolved**（E 中盤 `申請（2条3号）...届出の場合には、` の `...` transitional sentence は画像解像度で verbatim 確定不能、**ERROR_UNREADABLE_SOURCE** 維持、条文逆算禁止、**future high-res recrop candidate only**）~~ |
| ~~B6~~ | ~~p118-q01 seq1 E~~ | ~~`審査請求...をすることができる` — 条文列挙の `等` 圧縮（read-only 判定で E 中盤〜末尾の教示 3 点列挙 drift + `必要的記載` → `必要的教示` 差検出、substantive restore 対象）~~ | ~~**closed to limit of source quality**（v97, PR #58）。**層 1 = substantive risk mitigated**（E 中盤 `口頭又は書面で当該処分に係る部分を教示` → `①審査請求をすることができること、②審査請求をすべき行政庁および③審査請求期間を書面で教示`（行審法82条1項 教示 3 事項 + 書面、abstract drift から concrete restore）+ `職権による必要的記載` → `職権による必要的教示`（講学ラベル正字化）を原本復元、ans=False 維持）／ **層 2 = image-quality-limited fragment unresolved**（84条への繋ぎ末尾は画像解像度で verbatim 確定不能、**ERROR_UNREADABLE_SOURCE** として**完全不変維持**、条文逆算禁止、**future high-res recrop candidate only**）~~ |

**C 群 — 修正不要（標準的学術引用, 3 件, queue 外 / 記録のみ）**:

判例・条文の標準的 `……` 圧縮引用ゆえ OCR 破損ではない。再 scan 時の誤検知回避のため記録。

| # | 対象 | 理由 |
| --- | --- | --- |
| C1 | p005-q01 seq4 E | 富山大学事件 `……` 学術引用（標準） |
| C2 | p005-q01 seq5 E | 板まんだら事件 `……` 学術引用（標準） |
| C3 | p016-q01 seq7 E | 憲法41条/94条 `……` 条文引用（標準） |

**件数増減のルール**: 新たな scan hit や user 指摘で件数が増減する場合、理由を 1 行ずつ本表末に追記する。

- 2026-04-20: v81 反映で `p219-q01 seq3 Q` を close（-1 → 6 件）
- 2026-04-20: v82 反映で `p227-q01 seq2 Q` を close（substantive restore：Q + E + polarity 束ねて修正）（-1 → 5 件）
- 2026-04-20: v83 反映で `p227-q01 seq3 E` 高信頼4箇所を close、条文引用 `13歳2項110号`（低信頼）を新規 #1 に差し替え（±0 → 5 件）
- 2026-04-20: handoff-only 更新。`p227-q01 seq3 E 条文引用` を `requires user browser OCR or book reference` に降格し実作業キューから除外（±0 → 5 件、実作業は 4 件）。理由：画像 digit 断定不能、legal fit 弱く、推定復元は repo に入れない方針。close しない。
- 2026-04-20: v84 反映で `p062-q01 seq7 Q+E` を close（Q OCR 誤字 + Q/E 文末欠落を原本復元、行政代執行法2条 整合、polarity 非影響）（-1 → 4 件、実作業は 3 件）
- 2026-04-20: v85 反映で `p078-q01 seq4 Q+E` を close（Q 送り仮名 + 文末欠落、E substantive garble 3箇所を原本復元、行政手続法13条1項/10条 整合、polarity 非影響。handoff 記録は Q のみだったが原本読取時に E 破損発見し束ね修正）（-1 → 3 件、実作業は 2 件）
- 2026-04-20: v86 反映で `p119-q01 seq1 Q+E+ans` を close（Q 全面復元 + polarity flip true→false + E 条文引用を 行政不服審査法83条1項/3項/4項/5項 に整理、v82 precedent の Q+E+ans 束ねパターン）（-1 → 2 件、実作業は 1 件）
- 2026-04-20: v87 反映で `p136-q01 seq4 Q+E` を close（Q/E 両方の substantive garble「違法/適法」反転 + 文末欠落を原本復元、行政事件訴訟法8条1項ただし書 + 最判昭36.7.21 整合、polarity 非影響。handoff 記録は Q のみだったが原本読取時に E 破損発見し束ね修正、v85 precedent 同様）（-1 → 1 件、実作業は 0 件）
- 2026-04-20: v88 反映で `p227-q01 seq3 E` を close（v83 保留の digit garble `13歳2項110号` を高解像度 crop で `13条1項10号` に確定復元、民法13条1項10号＝制限行為能力者定義的引用との legal fit 強、prior 保留理由の両条件解消。同 seq 内追加破損 4 箇所「または/受領時/区切り/開き「」も束ね修正、polarity 非影響）（-1 → 0 件、実作業・外部確認待ちとも 0 件）
- 2026-04-20: **CLAUDE.md §5 auto-detection rule を v88 反映後に再走 → 新規 hit 13 件を検出**。A 群 7 件（substantive 文末欠落: p175 seq1/seq3, p162 seq2, p116 seq2, p136 seq1/seq2/seq3）を queue に追加（実作業対象）、B 群 6 件（borderline 判例/条文 `...` 圧縮: p006 seq1/seq2/seq3/seq4, p090 seq1, p118 seq1）を queue に追加（原本照合後に再判定）、C 群 3 件（cosmetic 標準学術引用: p005 seq4/seq5, p016 seq7）は管理対象外として記録のみ（+13 → 13 件、実作業は 7 件）。理由：v88 まで「pending queue 完全空」と見なしていたが、§5 再走により未拾い案件が明確に検出されたため、source of truth を再走結果に合わせて復帰。
- 2026-04-20: v89 反映で A 群 `A1 p175-q01 seq1 E` を close（OCR 誤字 2 箇所「議案→議長」「ときは→ときも」+ 条番号 garble「104条4項→101条4項」+ 文末欠落 `。も...` → 地方自治法101条5項/6項までの正文復元、書籍 page 453 右列 row 1 × と 3 経路一致、polarity 非影響）（-1 → 12 件、実作業は 6 件）。
- 2026-04-20: v90 反映で A 群 `A2 p175-q01 seq3 E` を close（条番号 garble「102条1項→2項」+ 接続詞 OCR「また→なお」+ 構造 + 語句 garble「議会（…妥当であるが）→議会は…原則であるが（102条1項）、」+ 文末欠落 → 通年会期制 102条の2第1項 までの正文復元、書籍 page 453 右列 row 3 × と 3 経路一致、load-bearing 4 点「102条2項 / 原則 / 通年の会期 / 102条の2第1項」を Python assertion で確認、polarity 非影響）（-1 → 11 件、実作業は 5 件。p175 関連 A 群はゼロに）。
- 2026-04-20: v91 反映で A 群 `A3 p162-q01 seq2 E` を close（OCR 1 char drop 2 箇所「という→といえる」「実質的に→実質的には」+ 文末欠落 → 国賠法3条1項共同執行者論 + 最判昭50.11.28 引用復元、書籍 page 427 右列 row 2 × と 3 経路一致、load-bearing 4 点「といえるためには / 実質的には / 最判昭50.11.28 / 常に費用負担者にあたるとするものではない」を Python assertion で確認、polarity 非影響、全角 ３条１項 保持）（-1 → 10 件、実作業は 4 件。p162 関連 A 群はゼロに）。
- 2026-04-20: v92 反映で A 群 `A4 p116-q01 seq2 E` を close（頭欠落「再調査の請求においては、」+ OCR 誤字「処分庁が→は」+ 中盤 garble「申立てによる場合で…→申立てによりまたは職権で、…執行停止…をとることができる。」復元、書籍 page 335 右列 row 8 × と 3 経路一致、load-bearing 4 点「再調査の請求においては / 処分庁は / 申立てによりまたは職権で / 執行停止」を Python assertion で確認、polarity 非影響）（-1 → 9 件、実作業は 3 件。p116 関連 A 群はゼロに）。
- 2026-04-20: v93 反映で A 群 `A5 p136-q01 seq1 E` を close（中盤 substantive garble「定めがなければ、→法令の規定により審査請求をすることができる場合においても、」+ duplicate phrase 除去「直ちに処分の取消しの訴えを提起すること...→直ちに提起することができる」、書籍 page 375 右列 row 1 ○ と 3 経路一致、load-bearing 3 点「法令の規定により審査請求 / 直ちに提起することができる / 自由選択主義末尾」を Python assertion で確認、polarity 非影響、v87 close 済み seq4 との対比整合）（-1 → 8 件、実作業は 2 件。残 A 群 2 件はすべて p136 seq2/seq3）。
- 2026-04-20: v94 反映で A 群 `A6 p136-q01 seq2 E` を close（中盤 structural garble「法律に別段の定めがない限り、直ちに〜原則である）...→不服申立てをしてもよいし、直ちに〜原則であり（8条1項本文: 自由選択主義）」+ 大幅文末欠落 → 8条1項ただし書（審査請求前置主義=例外）+ 結論「よって〜審査請求に対する裁決を経ないで直ちに処分の取消しの訴えを提起できる」を復元、行訴法8条1項本文 + ただし書 + 結論の 3 段構成、書籍 page 375 右列 row 2 × と 3 経路一致、load-bearing 5 点「不服申立てをしてもよいし / 自由選択主義 / 審査請求前置主義 / よって〜別段の定めがない限り / 末尾終端」を Python assertion で確認、polarity 非影響）（-1 → 7 件、実作業は 1 件。**新方針 = sync PR 無し、restore PR 1 本のみで完結**の初適用）。
- 2026-04-21: v95 反映で A 群 `A7 p136-q01 seq3 E` を close（stray 開き「除去 + 提出/提起 substantive 誤字「直ちに提出→直ちに提起」+ 大幅文末欠落「〜自由選択主義）...→前段誤り評価 +（8条1項ただし書）+ 3か月 rule +（8条2項1号）+ 後段正しい評価」を復元、行訴法8条1項本文 / ただし書 / 2項1号の 3 条文整合、書籍 page 375 右列 row 3 × と 3 経路一致、load-bearing 7 点「直ちに提起できる / 自由選択主義 / 前段は誤っている / 審査請求前置主義 / 3か月を経過 / 8条2項1号 / 後段は正しい」を Python assertion で確認、polarity 非影響、v87 seq4 / v93 seq1 / v94 seq2 との対比整合で p136 全 4 seq 完了）（-1 → 6 件、**実作業 0 件 = A 群完走**）。
- 2026-04-21: **handoff-only 更新**（data 変更なし、DATA_VERSION bump なし）。B 群 6 件の内訳を read-only 判定で再整理：
  - `B1 p006-q01 seq1 E` を **cosmetic close**（共産党除名事件判旨、bracket-balanced 標準学術引用 `「...」`、C 群 C1/C2 と同型 → queue から除外、data 変更は発生しない）
  - `B2 p006-q01 seq2 E` / `B3 p006-q01 seq3 E` / `B4 p006-q01 seq4 E` を **凍結（frozen）**。理由：`images_preprocessed/0006.png` が repo 内に未存在で原本照合が成立しないため、画像取得までは判定も data 修正も行わない（B2 は polarity 疑義 / B3 は substantive restore 候補 / B4 は typography restore 見込みの未検証心証のみ記録）
  - `B5 p090-q01 seq1 E` / `B6 p118-q01 seq1 E` を **次着手**（`images_preprocessed/0090.png` / `0118.png` は存在確認済み、次セッションで read-only 判定 → substantive なら A 群流の restore PR、cosmetic なら close）
  - v95 merge SHA `95a50f95aae52bf43fe5b1db8ef70d81a53bde51` を `latest data merge` / `latest main HEAD at handoff edit time` / 直近 data merge 履歴 の 3 箇所に補完（PR #55 merge 後の snapshot として確定）
  - 件数増減：close -1（B1）/ frozen -3（B2-B4、queue の active 枠からは外れるが記録は保持）/ active +2（B5-B6 を次着手化）。形式的には **6 件維持**（B1 close 済 + B2-B4 frozen + B5-B6 active）、**実作業（active）は 2 件**
- 2026-04-21: v96 反映で B 群 active #1 = `B5 p090-q01 seq1 Q+E` を **partial close**（Q OCR 1 char 誤字「語否→諾否」+ E 末尾 substantive 復元「応答義務があり→応答義務がなく」（届出定義 2条7号との論理反転修正）+「自己の期待する→届出人の期待する」（主語 drift 復元）、書籍 page 283 右列 row 1 × と 3 経路一致、load-bearing 7 点「諾否 / 語否非含有 / 応答義務がなく / 旧 garble 非含有 / `...` unresolved marker 保持 / ans=False 維持 / mirror byte-identical」を Python assertion で確認、polarity 非影響、他 seq (2-5) hash 変化なし）。**E 中盤 `申請（2条3号）...届出の場合には、` の `...` 部分は ERROR_UNREADABLE_SOURCE として unresolved 維持**（画像解像度で transitional sentence verbatim 確定不能、条文逆算禁止ルール 2026-04-21 確立に従い未補完）。（-1 → 1 件 active、B 群 active 2 → 1、残は B6 p118-q01 seq1 E = v97 予定）。
- 2026-04-21: v97 反映で B 群 active #2 = `B6 p118-q01 seq1 E` を **closed to limit of source quality**（E 中盤 `口頭又は書面で当該処分に係る部分を教示` → `①審査請求をすることができること、②審査請求をすべき行政庁および③審査請求期間を書面で教示`（行審法82条1項 教示 3 事項 + 書面、abstract drift から concrete restore）+ `職権による必要的記載` → `職権による必要的教示`（講学ラベル正字化）を原本復元、書籍 page 338 右列 row 1 × と 3 経路一致、load-bearing 9 点「教示 3 事項列挙 / 書面で教示 / 必要的教示 / 旧 `口頭又は書面で当該処分に係る部分を教示` 非含有 / 旧 `必要的記載` 非含有 / 84条 tail 不変（ERROR_UNREADABLE_SOURCE 維持） / ans=False 維持 / 他 seq (2-5) hash 変化なし / mirror byte-identical」を Python assertion で確認、polarity 非影響）。**二層表現採用**: 層 1 = substantive risk mitigated / 層 2 = 84条への繋ぎ末尾は画像解像度で verbatim 確定不能ゆえ ERROR_UNREADABLE_SOURCE として完全不変維持、条文逆算禁止、**future high-res recrop candidate only**。（-1 → 0 件 active、**B 群 active 完走**、残は B2-B4 frozen（p006 画像未存在、repo 追加待ち）+ B5/B6 の image-resolution-limited fragment（高解像度 recrop 待ち））。
- 2026-04-21: **別領域移行 #1 = `importParsedBatch` の分類継承バグを修正**（PR #60、data 変更なし / DATA_VERSION bump なし / v97 維持）。known_issues.md §1 原因 1 を解決：
  - `src/lib/import-parsed.ts`: 純関数 `inheritClassificationField(newValue, existingValue, fallback='')` を export、`subjectId` / `chapterId` の優先順を (1) 新 OCR → (2) 既存 existingAttr → (3) fallback '' に固定。`PreservedAttrs` に `subjectId` / `chapterId` を追加、preserved Map の条件を撤廃し attr 存在時は常に積むよう変更（旧コードは `isExcluded` / `needsSourceCheck` 有無で条件付けしていて、分類だけ持っていた既存レコードから拾えなかった）
  - `src/components/AuthProvider.tsx`: `prepareLocalDataOnce` を追加し `autoImportIfEmpty → refreshProblemDataIfNeeded → runOneTimeCleanup` を await で直列化。旧 `handleSignIn` は `autoImportIfEmpty()` / `runOneTimeCleanup()` を非 await で呼び競合の余地があったが、これを解消。guest モードのローディング UX は現状維持（`void prepareLocalDataOnce(); setLoading(false);`）
  - `src/lib/import-parsed.test.ts`（新規）: `inheritClassificationField` の優先順 12 ケースを vitest で回帰防止、全 187 テスト pass
  - `isExcluded` / `needsSourceCheck` の継承ロジックは挙動変更なし（既存コードで既に preserved → 新レコードへ復元していた。本修正は preserved Map の収集条件を緩めただけで副作用なし）
  - 残る制約（別トラック）: known_issues.md §1 原因 2（PATCH / localStorage フラグの DATA_VERSION 連動化）・原因 3（`subjectId === ''` 禁止設計）・§2（`needsSourceCheck` Dexie index）は未対応。属性継承が入ったため実害は軽減
  - build green（Next.js 16.2.1 Turbopack、TypeScript pass）、lint は main に pre-existing 38 errors があるが本修正で新規追加なし
- 2026-04-22: v98 反映で **B2 p006-q01 seq2 の ans polarity hotfix を先行**（PR #62, `671eb79`）。現 DB 内で Q「留保あり＝除き、司法審査は及ばない」と E「留保は付されていない」が polarity 逆で自己矛盾していたため、ans=True → False に single byte flip。**Q / E は未修正維持**（`images/0006.png` / `images_preprocessed/0006.png` が repo 内に未存在、`images_preprocessed/` は 0004→0007 で 0006 欠落、`git ls-files` 未追跡、原本照合不能ゆえ verbatim restore は原本到着まで保留）。**二層表現採用**（v96/v97 と同型）：層 1 = polarity hotfix 完了 / 層 2 = Q/E verbatim restore 保留。2026-04-21 read-only 判定で B1 を cosmetic close としていた前提も**誤り**と user directive で判明 → **B1 / B3 / B4 も pending に再分類**（B1: Q+E restore 対象 / B3: ans False→True flip + E restore pending / B4: E 中央 restore + Q 軽微修正 pending）。件数増減：B2 の ans のみ部分 close、Q/E + B1/B3/B4 は active pending（原本画像到着待ち）。
- 2026-04-22: **handoff-only 更新**（post-v98-merge SHA backfill + p006 source 存在ログ, data 変更なし / DATA_VERSION bump なし / v98 維持）。
  - **SHA backfill**: v98 squash merge SHA = `671eb79f622bb797ec78b2c97788edba9ebe7b54`（PR #62）を `latest data merge` / `latest main HEAD at handoff edit time` / 直近 data merge 履歴 の 3 箇所に補完（新方針 3 サイクル目: sync PR なし、次作業 PR 同梱で backfill）。
  - **p006 source 存在ログ**: v98 時点で「原本画像未存在」としていた B 群 p006 について、local の `~/Desktop/kindle_shots/0006.png`（kindle_capture.sh の OUTDIR デフォルト）に DB `p006` 対応の書籍見開き 1 枚が scan されていることを確認。書籍 p.116-117「裁判所」section の「統治行為」小項目ページ、画像左ページ A 2段目 = seq2 Q 冒頭「内閣による衆議院の解散は、高度の政治性を有する国家行為であるから」が一致、右ページ 12 番 = 苫米地事件 E 原本。**ただし現物は低解像度の見開き 1 枚**（字画・句読点・漢字選択の微差は verbatim 確定不能）ゆえ「source existence の確認には使えるが、verbatim restore の根拠としては不十分」（user directive 2026-04-22）。
  - **方針（固定, user directive 2026-04-22）**: local-only 運用ではなく **repo に source を残す** 方針にする。ただし **低解像度 0006.png のみを根拠に本文修正はしない**。直近アクション: (1) p006 seq2 の Q/E 該当箇所の **高解像度 recrop を作成**（user 側作業、Claude は着手しない）→ (2) recrop 画像を **tracked source path** = `images_preprocessed/` に追加（新 PR。`images/` は `.gitignore` 対象で tracked 不可ゆえ使用しない。B5 `0090.png` / B6 `0118.png` が `images_preprocessed/` で tracked されている実績に倣う。`images/` を使う必要が生じた場合は先に `.gitignore` 変更を別 PR で行う）→ (3) その後に限り **B2 seq2 の verbatim restore** を再開。
  - **制約**: 高解像度 recrop 前に Q/E 本文は修正しない / 現 `ans=False` は維持でよい / 優先順 `B2 → B3 → B1 → B4` は維持、**p006 は高解像度 source 収載まで frozen 扱い**。
  - **件数増減**: 形式的には B1-B4 active pending 維持（解除条件のみ「原本画像 repo 追加」→「高解像度 recrop 収載」に更新）。B5-B6 は従前通り `closed to limit of source quality` で高解像度 recrop 待ち。
- 2026-04-22: **B2 seq2 read-only sufficiency check** (本 PR, handoff-only 更新, data 変更なし / DATA_VERSION bump なし / v98 維持 / Q/E/ans 無変更):
  - **対象**: `images_preprocessed/0006.png`（PR #64 squash `4c19f08...` 着地済、low-res raw 派生 preprocessed, 6048x3536）、row 13 = p006-q01 seq2（苫米地事件）
  - **制約**: read-only（`data/reviewed_import.json` / `public/data/reviewed_import.json` / Q / E / ans / DATA_VERSION は一切未変更）。handoff.md sufficiency ログ追加のみ
  - **1. 読める箇所（character-level に高信頼 or 構造判読可）**:
    - **Q 全文（row 13 左）**: 「内閣による衆議院の解散は、高度の政治性を有する国家行為であるから、解散が憲法の明文規定に反して行われる（と）、一見極めて明白に違憲無効と認められる場合を除き、司法審査は及ばないとするのが判例である。」まで 4 行判読可（line break 近傍の「と」有無は marginal、#2 参照）
    - **E 冒頭（row 13 右 start）**: 「○ 判例（**最大判**昭35.6.8：苫米地事件）は、」まで character-level 判読可。**現 DB `最判昭35.6.8` に対し画像は「最大判」**（1 char 差、「大」字の有無）を検出
    - **E 中盤の骨格構造**: 「直接国家統治の基本に関する高度に政治性のある国家行為のごときはたとえ法律上の争訟となり / 有効無効の判断が法律上可能である場合であっても / かかる国家行為は裁判所の審査権の外にあるとしている。」の 3 段構造は structural に判読可（DB で `...` 省略されている区間）
    - **E 末尾の評価句（現 DB で欠落）**: 「〜『一見極めて明白に違憲無効と認められる場合を除き』とする留保は付されていないという**本肢は誤っている**。」の最終評価句「という本肢は誤っている。」が判読可（**現 DB は「付されていない。」で切断**されており、この restore は v99 の主眼）
    - **polarity 再確認**: E 末尾「本肢は誤っている」 → 「留保あり」を主張する Q は誤 → `ans=False` 維持で整合（v98 hotfix と同一結論）
  - **2. 読めない / 確定困難な箇所（character-level verbatim marginal、preprocess 由来の binarization artifact 懸念）**:
    - **Q 行末 line break 近傍「行われる」vs「行われると」**: 1 char 差、underline の範囲と黒潰れ境界が preprocess binarization で verbatim 1:1 確定困難
    - **E 中盤の接続助詞 / 微小仮名**: 「これ**に**ついて」「**これに****す**いて」の判別、「〜のごとき**は**」等の助詞 1 char 差は preprocess 解像度で character-level 確信度 marginal
    - **E 中盤の subject 語句（「判例の解説は」vs「判例の態度は」vs「判旨は」等）**: 該当 phrase の character-level 特定は preprocess で blur があり marginal
    - **句読点（、 vs なし / 。 vs 、）**: 特に行末 / 改行近傍の punctuation は binarization による黒点ノイズと区別困難
    - **細字ルビ / 条数注記等の fine detail**: 追加情報があれば preprocess 解像度では拾えない
  - **3. 結論（binary, 本 PR）: `restore 可（B5/B6 precedent 準拠 = 二層運用）`**
    - **層 1 = substantive risk mitigated（v99 で restore 対象）**: (i) 判例名「最判」→「最大判」1 char 補正、(ii) E 中盤 `...` → 3 段構造の concrete text restore、(iii) E 末尾「〜という本肢は誤っている。」評価句 restore、(iv) ans=False 維持（画像再確認済）
    - **層 2 = image-quality-limited fragment unresolved（v99 作業中に fragment 単位で ERROR_UNREADABLE_SOURCE 扱い）**: 上記「2.」の助詞レベル / 句読点 / subject 語句 character-level marginal 箇所は v99 内で該当 fragment を `ERROR_UNREADABLE_SOURCE` 扱いとし、**future high-res recrop candidate** として記録（B5 `0090.png` 中盤 `...` transitional / B6 `0118.png` 84条繋ぎ末尾と同一運用）
    - **strict verbatim policy を採用する場合**: 層 2 fragment の保留も許さないならば結論は `restore 不可 → true high-res recrop 必要`。本 handoff は **B5/B6 precedent との一貫性を優先**し `restore 可` を勧告、strict 運用に切り替える場合は v99 着手前にレビュー側で差し戻し可能
  - **次 PR = v99 = B2 seq2 Q/E verbatim restore**（ans=False 維持）
    - v99 PR 内で backfill 予定の SHA: (i) PR #64 squash = `4c19f0843f874d93a07811c6d010d7694610411e`、(ii) 本 PR（sufficiency check）の squash merge SHA
    - 二層表現採用、層 2 fragment は ERROR_UNREADABLE_SOURCE として記録

- 2026-04-22: **v100 = B3 p006-q01 seq3 Q/E verbatim restore + ans False→True polarity flip 束ね**（本 PR、data 変更あり、DATA_VERSION v99 → v100 bump、Q+E+ans bundled、1 seq / 1 PR、v82 = p227-q01 seq2 / v86 = p119-q01 seq1 precedent）:
  - **対象**: `KB2025-p006-q01` seq3（統治行為論、書籍 page 014-015 見開き「裁判所」section 統治行為、書籍 page 015 右列 row 14 ○ = 画像 marker と判例整合 → ans=True）
  - **scope**: `data/reviewed_import.json` / `public/data/reviewed_import.json` の seq3 `answerBoolean` + `explanationText` 変更。Q / subjectCandidate / chapterCandidate / confidence / sectionTitle / sourcePageQuestion / sourcePageAnswer / 他 seq (1/2/4) / 他ページは無変更（byte-identical 維持）
  - **層 1 restore + polarity flip（substantive risk mitigated, v100 本 PR）**:
    - (i) **ans False → True polarity flip**（画像 row 14 右列 marker = `○` = TRUE、苫米地判例の統治行為論と Q「司法審査の対象にならない」= TRUE で整合、v98 作業時の handoff 予告と同一結論）
    - (ii) E 冒頭「統治行為**論**の問題であり、判例は」→「いわゆる統治行為の問題である。判例（**最大判**昭35.6.8：苫米地事件）は、」（「論」脱 + 句点化 + 判例名特定補足 = seq2 v99 と対照整合）
    - (iii) E 中盤 `...` → 3 段 concrete text restore：「直接国家統治の基本に関する高度に政治性のある国家行為のごときは**...**法律上の争訟となり、これにつき有効無効の判断が法律上可能である場合であっても、かかる国家行為は**...**裁判所の審査の対象とならない」（structural 骨格は画像 row 14 で判読可、助詞 / 微小仮名 / subject 語句の character-level marginal は `...` literal を保持し層 2 送り）
    - (iv) E 末尾「判**断**している」→「判**示**している」（動詞 1 char 正字化、判例引用として seq2 v99「としている」と対比、seq3 は「判示している」が正）
  - **Q の扱い（v100 本 PR）**: 画像 row 14 左 Q「国家統治の基本に関する高度に政治性のある国家行為は、それが法律上の争訟になり、有効無効の判断が法律上可能であっても、司法審査の対象にならない。」は現 DB Q と verbatim 一致と judge（character-level diff なし）。**現 DB の Q は無変更**で維持
  - **層 2 ERROR_UNREADABLE_SOURCE（unresolved, future high-res recrop candidate only）**: 層 1 に取り込んだ `...` literal（E 中盤 2 箇所、合計 2 箇所）は character-level verbatim 確定不能の marginal fragment（助詞「のごときは / のごとき、」、接続「たとえ / これにつき」有無、subject 語句「かかる国家行為は / これらの行為は」等、句読点「、 vs なし / 。 vs 、」）を represent。B5 `0090.png` 中盤 / B6 `0118.png` 84条繋ぎ末尾 / B2 seq2 と同一運用、条文逆算禁止
  - **DATA_VERSION**: `2026-04-22-audit-v99-p006-q01-seq2-qe-restore` → `2026-04-22-audit-v100-p006-q01-seq3-qe-restore-polarity-flip`（src/lib/db.ts L990）
  - **SHA backfill 同梱**: PR #67 squash = `59cf4a1d2de1134a3e29095b8fdee045ac21ac1c`（B3 read-only sufficiency check + v99 SHA backfill + エラー報告 queue 記録）を `latest main HEAD at handoff edit time` / 直近 merge 履歴に補完（new policy PR #53 準拠、sync-only PR なし）
  - **v98/v99 整合**: v98 = B2 ans False polarity hotfix / v99 = B2 Q/E 層 1 restore / v100 = B3 Q/E + ans polarity flip 束ね、で p006 B 群は **B2 と B3 の 2 seq が層 1 + 層 2 運用で 完了**、残は B1 + B4
  - **整合確認**: mirror byte-identical（`diff data/reviewed_import.json public/data/reviewed_import.json` = 差分なし）、他 seq (1/2/4) / 他ページ無変更
  - **次作業**: B1 = p006-q01 seq1 Q + E（同型 sufficiency check → restore フロー、画像 row 12 A 1段目 = 共産党除名事件）→ B4 = p006-q01 seq4 Q + E（row 15 = 在宅投票事件）で p006 閉じる。エラー報告 #1 KB2025-p194-q06 の差し込みは v100 merge 後に再判定

- 2026-04-22: **B3 p006-q01 seq3 read-only sufficiency check + v99 merge SHA backfill + エラー報告 queue 記録**（PR #67 squash = `59cf4a1d2de1134a3e29095b8fdee045ac21ac1c`, handoff-only 更新, data 変更なし / DATA_VERSION bump なし / v99 維持 / Q/E/ans 無変更）:
  - **対象**: `images_preprocessed/0006.png`（PR #64 `4c19f08...` 着地済、low-res raw 派生 preprocessed, 6048x3536）、row 14 = p006-q01 seq3（統治行為論）
  - **制約**: read-only（`data/reviewed_import.json` / `public/data/reviewed_import.json` / Q / E / ans / DATA_VERSION は一切未変更）。handoff.md に (i) B3 sufficiency ログ追加 + (ii) PR #66 SHA backfill + (iii) エラー報告 queue 記録 の 3 点のみ
  - **1. 読める箇所（character-level に高信頼 or 構造判読可）**:
    - **Q 全文（row 14 左）**: 「国家統治の基本に関する高度に政治性のある国家行為は、それが法律上の争訟になり、有効無効の判断が法律上可能であっても、司法審査の対象にならない。」判読可、**現 DB Q と verbatim 一致と judge**（character-level diff なし）
    - **E 冒頭（row 14 右 start）**: 「いわゆる**統治行為の問題である**。判例（**最大判**昭35.6.8：苫米地事件）は、」判読可。**現 DB 「統治行為論の問題であり、」→ 画像「統治行為の問題である。」**（「論」脱・句点差）、**現 DB 「判例は」→ 画像「判例（最大判昭35.6.8：苫米地事件）は」**（判例名特定補足）
    - **E 中盤の骨格構造**: 「直接国家統治の基本に関する高度に政治性のある国家行為のごときは、たとえ法律上の争訟となり、有効無効の判断が法律上可能である場合であっても、かかる国家行為は裁判所の審査の対象とならない」の structural 3 段は判読可（現 DB で `...` 省略されている区間）
    - **E 末尾（row 14 右 end）**: 「〜**と判示している**。」判読可。**現 DB 「と判断している。」→ 画像「と判示している。」**（「判断」→「判示」1 char 差、同判例引用の seq2 / row 13 と同型動詞）
    - **polarity marker（row 14 右列冒頭）**: **`○`** と判読（=画像上 TRUE）。Q「統治行為は司法審査の対象にならない」=苫米地判例（統治行為は審査権外）と整合 → Q は TRUE → **現 DB `ans=false` は polarity 逆**（v98 作業時の handoff 予告「ans False→True flip 候補」と同一結論）
  - **2. 読めない / 確定困難な箇所（character-level verbatim marginal、preprocess 由来の binarization artifact 懸念）**:
    - **E 中盤の接続助詞 / 微小仮名**: 「のごとき**は**」/「**、たとえ**」/「これ**につき**」等の助詞・接続の 1〜2 char 差は preprocess 解像度で marginal
    - **E 中盤の subject / 主語 phrase**: 「**かかる国家行為は**」vs「**これらの行為は**」等の character-level 特定は blur で marginal
    - **句読点（、 vs なし / 。 vs 、）**: 行末 / 改行近傍の punctuation は binarization による黒点ノイズと区別困難
    - **seq2（row 13）E との重複範囲**: seq3 E 中盤は seq2 E の骨格と判例引用が重なるため、verbatim 確定の独立性は限定的（どちらも同判例）
  - **3. 結論（binary, 本 PR）: `restore 可（B5/B6/B2 precedent = 二層運用、+ ans False→True polarity flip 同 PR 内束ね候補）`**
    - **層 1 = substantive risk mitigated（v100 で restore 対象）**: (i) ans False→True polarity flip（row 14 marker `○` + 判例整合、v82/v86/v119 precedent の Q+E+ans 束ね型）、(ii) E 冒頭「統治行為論の問題であり、判例は」→「いわゆる統治行為の問題である。判例（最大判昭35.6.8：苫米地事件）は、」（判例名補足 + 語尾 + 句点）、(iii) E 中盤 `...` → 3 段 concrete text restore（直接国家統治 / 法律上の争訟 / 裁判所の審査の対象）、(iv) E 末尾「判断している」→「判示している」（動詞 1 char 正字化）
    - **層 2 = image-quality-limited fragment unresolved（v100 作業中に fragment 単位で ERROR_UNREADABLE_SOURCE 扱い）**: 助詞レベル / subject 語句 / 句読点 marginal は v100 で該当 fragment を `...` literal 保持 = `ERROR_UNREADABLE_SOURCE` 扱いで記録（**future high-res recrop candidate only**、B5/B6/B2 と同運用）
    - **strict verbatim policy を採用する場合**: 層 2 fragment の保留も許さないならば結論は `restore 不可 → true high-res recrop 必要`。本 handoff は **B5/B6/B2 precedent との一貫性を優先**し `restore 可` を勧告
  - **PR #66 SHA backfill**: v99 squash merge SHA = `ed924f247ee6c780f5185b4921d06728fead65be`（PR #66）を `latest data merge` / `latest main HEAD at handoff edit time` / 直近 data merge 履歴 の 3 箇所に補完（new policy PR #53 準拠 4 サイクル目: sync PR なし、次作業 PR 同梱で backfill）
  - **次 PR = v100 = B3 seq3 Q/E verbatim restore + ans polarity flip 束ね**（v82 = p227-q01 seq2 / v86 = p119-q01 seq1 の Q+E+ans bundled 束ねパターン precedent）
    - v100 PR 内で backfill 予定の SHA: 本 PR（B3 sufficiency check）の squash merge SHA
    - 二層表現採用、層 2 fragment は ERROR_UNREADABLE_SOURCE として記録
  - **エラー報告 queue 記録（別領域 / 未判定 / B 群後候補）**: user UI 画面から検出された 3 件を記録のみ（本ターンで実調査しない、B3 restore 完了後に #1 差し込み or B 群継続を再判定）
    - **#1 KB2025-p194-q06（2026-04-21 報告, 分類「正誤の誤り」）** — 最優先候補（正誤の誤り = polarity 疑義、substantive risk 高）。Q「都道府県は、別に法律の定めるところにより、その住民につき、住民たる地位に関する正確な記録を常に整備しておかなければならない。」（住民基本台帳法 1 条系文言、地方自治法との区分確認要）
    - **#2 KB2025-p197-q01（2026-04-22 報告, 分類「その他」）** — Q「住民は、その属する普通地方公共団体のある条例について、条例制定改廃請求権を行使することができる。」（地方自治法 74 条 直接請求系、主体・対象範囲の確認要）
    - **#3 KB2025-p198-q05（2026-04-22 報告, 分類「その他」）** — Q「普通地方公共団体の議会の議員およびその選挙を行う者は、原則として、その総数の3分の1以上の者の連署をもって、その代表者から、選...」（議会解散請求 / 議員解職請求系、地方自治法 76 条/80 条 の区分確認要、UI 表示では末尾省略のため要全文確認）
    - **差し込み判定の基準（B3 restore 完了後）**: (a) #1 `正誤の誤り` = polarity risk ありゆえ差し込み候補 / (b) #2 #3 は分類「その他」で緊急度 unclear、B 群 B1/B4 完走後に合流可 / (c) 報告分類を「その他」から絞るため UI 側 error report form に「polarity / OCR / 分類 / その他」等の細分化を検討（別領域移行 #5 候補、known_issues.md §5 と重複の可能性）

- 2026-04-22: **v99 = B2 p006-q01 seq2 Q/E verbatim restore**（PR #66 squash = `ed924f247ee6c780f5185b4921d06728fead65be`, data 変更あり、DATA_VERSION v98 → v99 bump、ans=False 維持、1 seq / 1 PR）:
  - **対象**: `KB2025-p006-q01` seq2（苫米地事件、書籍 page 014-015 見開き「裁判所」section 統治行為、書籍 page 015 右列 row 13 × = DB ans=False）
  - **scope**: `data/reviewed_import.json` / `public/data/reviewed_import.json` の seq2 `explanationText` のみ変更。Q / ans / subjectCandidate / chapterCandidate / confidence / sectionTitle / sourcePageQuestion / sourcePageAnswer / 他 seq (1/3/4) / 他ページは無変更（byte-identical 維持）
  - **層 1 restore（substantive risk mitigated, v99 本 PR）**:
    - (i) E 冒頭「判例（最判昭35.6.8：苫米地事件）」→「判例（**最大判**昭35.6.8：苫米地事件）」1 char 補正（画像 row 13 右 start で「最大判」と判読、character-level 高信頼）
    - (ii) E 中盤 `...` → 3 段 concrete text restore：「直接国家統治の基本に関する高度に政治性のある国家行為のごときは**...**法律上の争訟となり、これにつき有効無効の判断が法律上可能である場合であっても、かかる国家行為は**...**裁判所の審査権の外にあるとしている。」（structural 骨格は画像で判読可、助詞 / 微小仮名 / subject 語句の character-level marginal は `...` literal を保持し層 2 送り）
    - (iii) E 末尾「〜『一見極めて明白に違憲無効と認められる場合を除き』とする留保は付されていない**...本肢は誤っている。**」評価句 restore（画像 row 13 右末尾で判読可、「付されていない」と「本肢は誤っている。」の繋ぎ marginal 1 fragment は `...` literal で保持）
    - (iv) ans=False 維持（画像末尾「本肢は誤っている」→ Q「留保あり」を主張 = 誤 → ans=False で整合、v98 hotfix と同一結論）
  - **層 2 ERROR_UNREADABLE_SOURCE（unresolved, future high-res recrop candidate only）**: 層 1 に取り込んだ `...` literal（E 中盤 2 箇所 + E 末尾 1 箇所、合計 3 箇所）は character-level verbatim 確定不能の marginal fragment（助詞レベル「のごときは / のごとき、」、subject 語句「判例の態度は / 判旨は」等、句読点「、 vs なし / 。 vs 、」）を represent。B5 `0090.png` 中盤 / B6 `0118.png` 84条繋ぎ末尾と同一運用、条文逆算禁止
  - **Q の扱い（v99 本 PR）**: 画像 row 13 左の Q 構造は現 DB と verbatim 一致と judge（「内閣による衆議院の解散は〜司法審査は及ばないとするのが判例である。」4 行判読可）。**Q 行末 line break 近傍「行われると」の verbatim 1 char は marginal**（sufficiency check で層 2 送り判定）だが、現 DB が「行われる**と**」を既に保持しており画像でも「と」が判読可（underline の右端・黒潰れ境界で verbatim 1:1 確定は binarization artifact で marginal）、差し戻し restore の根拠なしゆえ**現 DB の Q は無変更**で維持
  - **DATA_VERSION**: `2026-04-22-audit-v98-p006-q01-seq2-ans-polarity-hotfix` → `2026-04-22-audit-v99-p006-q01-seq2-qe-restore`（src/lib/db.ts L990）
  - **SHA backfill 同梱**: PR #64 `4c19f0843f874d93a07811c6d010d7694610411e`（p006 preprocessed source 収載）、PR #65 `c0f887533e3e8533bd90e9e1decc60f547e23328`（B2 read-only sufficiency check）を `latest main HEAD at handoff edit time` / 直近 merge 履歴に補完（new policy PR #53 準拠、sync-only PR なし）
  - **v98 polarity hotfix との整合**: 画像末尾「本肢は誤っている」→ ans=False は v98 hotfix 結論と同一、**v99 では ans 未変更**
  - **整合確認**: mirror byte-identical（`diff data/reviewed_import.json public/data/reviewed_import.json` = 差分なし）、他 seq (1/3/4) / 他ページ無変更
  - **次作業**: B3 p006-q01 seq3 E + ans を同じフロー（sufficiency check → restore）で着手。PR #65 sufficiency check は B2 専用ゆえ B3 は別途 read-only sufficiency check PR（handoff-only）または v##+1 で sufficiency + restore 束ね（方針は次セッション判断）

- 2026-04-22: **p006 tracked preprocessed source derived from low-res raw を収載** (PR #64 squash = `4c19f0843f874d93a07811c6d010d7694610411e`, image addition + handoff-only 更新, data 変更なし / DATA_VERSION bump なし / v98 維持):
  - **source**: `images_preprocessed/0006.png`（6048x3536, 390KB, 既存 B5 / B6 と同仕様）を追加。**出自（重要）**: 既存 low-res local raw `~/Desktop/kindle_shots/0006.png` (3024x1768) を `scripts/preprocess_images.py`（既存 OCR 前処理 pipeline = 2x upscale + CLAHE + 二値化 + 傾き補正 + 余白除去 + シャープ化）に通して生成した **preprocessed 派生物**であり、**新しい high-res recrop そのものではない**
  - **判定**: user directive 2026-04-22 「Claude 側で自力実行を試す」に応答し、既存 raw + 既存 pipeline で tracked 規格と整合する preprocessed source を生成 → user 手作業不要
  - **帰結（保守的評価, 2026-04-22 review 反映）**: `images_preprocessed/0006.png` の収載自体は完了だが、**resolution 起因の unreadable risk は未解消**（upscale は情報量を増やさない）。B1-B4 は `pending / frozen` → **`pending / preprocessed source available, sufficiency unverified`** に状態変更。**frozen 解除は保留**
  - **次の実作業（要 sufficiency check ファースト）**: 次 PR でいきなり B2 verbatim restore に入らず、**まず `images_preprocessed/0006.png` で B2 read-only sufficiency check** を実施。十分なら restore に進む / 不十分なら **真の high-res recrop が引き続き必要**（→ 上記 2026-04-22 B2 sufficiency check エントリで結論 = **`restore 可（B5/B6 precedent = 二層運用）`**）
  - **Q/E verbatim は本 PR では行わない**（scope = image addition + handoff 更新のみ）
  - **v99 SHA backfill**: 本 PR（p006 preprocessed source 収載 = PR #64）の squash merge SHA = `4c19f0843f874d93a07811c6d010d7694610411e` は次の実作業 PR = v99 で `latest main HEAD at handoff edit time` / 直近 merge 履歴に backfill 予定（new policy PR #53 準拠、sync-only PR は作らず次 work PR に相乗り）
  - **v98 polarity との整合**: 画像で行 13 解説末尾に「『一見極めて明白に違憲無効と認められる場合を除き』という留保は付されていないという本肢は誤っている」と判読可能、v98 の ans=False は維持で整合
  - **継続制約**: 既存 B5 / B6 と同仕様ゆえ、一部 fragment が ERROR_UNREADABLE_SOURCE として残置になる可能性は継続（layer 2 = 原本逆算禁止 / future high-res recrop candidate only の運用継続）

**次アクション**: **A 群完走** + **B 群 B2/B3/B5/B6 closed to limit of source quality** + **別領域移行 #1 部分修正完了 (PR #60)** + **v100 + PR #69 historical catchup merged (2026-04-22)** + **後半取り込みフロー v3 source of truth 化（本 PR, [`context/stable/ingestion_flow.md`](../stable/ingestion_flow.md)）**。次の優先順（v3 flow §11 実行順に準拠）:
1. **後半 L2 取込バッチ 1 = 主レーン最優先**（v100 merge 以降の主レーン shift）:
   - **手順**: (i) kindle_capture.sh で screenshot acquisition → (ii) OCR パイプラインで parsed 生成 → (iii) auto scan 自動分類 hook で dual-read gate / polarity gate 通過判定 → (iv) reviewed_import.json patch → (v) import PR 起票（1 PR = 1 バッチ、§2 完了 4 criteria 準拠）
   - **止めない条件**: §3 欠損率 ≤ 10% 帯、副レーン open ≤ 5。欠損率 > 10% の警告帯は PR 本文で内訳明示 + handoff に上積み、≥ 20% で主レーン停止判定
2. **follow-up 3 本 並行 open（副レーン）**: 優先順 (1) P1-1 importParsedBatch integration test（§9 CI 必須化、known_issues §1 stale 解消）→ (2) P1-2 PreservedAttrs 拡張（importance / needsReview / year / memo を対象に追加）→ (3) P1-3 CLAUDE.md §1 + known_issues §1 の stale 記述 update（PR #60 反映済を明示）。副レーン上限 5 内で並行可能
3. **p006 B1 / B4 = P2 backlog 維持（触らない）**: 主レーン停止理由にしない、次バッチ境界で再判定。真の high-res recrop 取得時に着手
4. **エラー報告 queue**: #1 KB2025-p194-q06 (P2), #2 #3 (P3)。主レーンを止めない非同期運用
5. **（分岐, 未採用）strict verbatim policy を採用する場合**: 層 2 fragment 保留も許さないならば P2 → P1 昇格 + 真の high-res recrop 取得へ。本 v96-v100 precedent = 二層運用で統一済
6. **別領域移行 #2 = `subjectId === ''` 禁止設計**（known_issues.md §3）— 空文字保存自体は許容されたまま。null / sentinel 値への移行は Dexie schema 変更 + 既存データ migration が必要ゆえ別 PR で設計検討から
7. **別領域移行 #3 = `needsSourceCheck` 自動検知**（known_issues.md §5）— CLAUDE.md 第 5 節のルール (`...`/`…` / 助詞重複 / 文末欠落 / 既知 OCR 誤字 / Q-E 極性矛盾 / broad raw / 空 raw) を自動走査する scan runner を追加。Dexie index は §2 と同時着手候補
8. **別領域移行 #4 = OCR パイプラインモデル差し替え**（known_issues.md §4、CLAUDE.md 第 4 節）— `scripts/ocr_batch.*` のみ対象、`kindle_capture.sh` / `reviewed_import.json` 形式 / `importParsedBatch` は維持
9. **B5 / B6 の image-quality-limited fragment は future high-res recrop 待ち**（B5 = `0090.png` 中盤 `...` transitional sentence、B6 = `0118.png` 84条繋ぎ末尾。高解像度 re-crop または手元原本で verbatim 確定できた時点で v## として追加 restore）

<!-- review-handoff:scope:begin -->
## 残件の大分類 (confirmed / inferred)

| 領域 | 状態 | 備考 |
|---|---|---|
| 肢別過去問データの原本照合 | 継続中。p238-q1/q2 は v76 で close 済み | 直近 v75-v76 で個別ページ単位の修正 |
| OCR パイプラインのモデル差し替え | 未着手 | `scripts/ocr_batch.*` が対象（CLAUDE.md 第 4 節） |
| `importParsedBatch` の分類継承バグ | **部分修正済み（2026-04-21, PR #60）** | 原因 1 を解決。`inheritClassificationField` で subjectId / chapterId の継承、cleanup 直列化。原因 2（PATCH 再実行条件）と 原因 3（`''` 禁止）は別トラック。詳細 `known_issues.md` §1 |
| `subjectId === ''` 保存の禁止設計 | 未修正 | `known_issues.md` §3。本修正で空文字上書きの経路 1 本は減ったが、許容設計自体は未変更 |
| `needsSourceCheck` 自動検知ルール | 未実装 | `known_issues.md` §5 |
| context automation Phase M1 | ✅ 完了 | PR #3〜#6 merged、`automation_plan.md` §0 参照。M2 は凍結 |

## 次に触るべき領域 (inferred)

automation は M1 で一旦凍結。本業に戻る方針。**2026-04-23 v3 flow 反映以降は [`context/stable/ingestion_flow.md`](../stable/ingestion_flow.md) が判断基準の source of truth**。優先度順：

0. **後半 L2 取込 = 主レーン（2026-04-23 shift）** — v100 merge 完了 + v3 flow 採用で、A 取込レーンが主。p006 B 群残件 (B1 / B4) は P2 backlog で主レーンを止めない。実行順 = v3 flow §11 の (1) v3 反映 → (2) 後半バッチ 1 → (3) follow-up 3 本並行 open → (4) p006 B1/B4 触らず P2 維持
1. **累積 recheck queue 整理（A 群完走、B 群 active 完走）** — v88 反映後に CLAUDE.md §5 auto-detection 再走で新規 hit 13 件を検出（A 群 7 件 = 実作業 / B 群 6 件 = 判断保留 / C 群 3 件 = 管理対象外）。**v89-v95 で A 群 7/7 完了**、2026-04-21 B 群再整理：**B1 cosmetic close** / **B2-B4 frozen（p006 画像未存在）** / **v96 で B5 closed to limit of source quality（Q+E 末尾 substantive restore、E 中盤 `...` は ERROR_UNREADABLE_SOURCE 維持）** / **v97 で B6 closed to limit of source quality（E 中盤 教示 3 点列挙 + 書面で + 必要的教示 substantive restore、84条 tail は ERROR_UNREADABLE_SOURCE 維持）** = **B 群 active 2/2 完走**。**二層表現採用**（層 1 = substantive risk mitigated / 層 2 = image-quality-limited fragment unresolved = future high-res recrop candidate only）。**別領域へ移行済み**（下記 2 を参照）。B2-B4 の解凍は `0006.png` repo 追加待ち / B5-B6 の層 2 fragment 確定は高解像度 recrop 待ち。
2. **別領域移行（進行中、優先順は known_issues.md §1-5 に整合）**
   - **#1 `importParsedBatch` 分類継承バグ**: 2026-04-21 PR #60 で**部分修正**（原因 1 解決、原因 2/3 は別トラック）
   - **#2 `subjectId === ''` 禁止設計**（未着手、§3）
   - **#3 `needsSourceCheck` 自動検知**（未着手、§5。Dexie index §2 と同時着手候補）
   - **#4 OCR パイプラインモデル差し替え**（未着手、§4、`scripts/ocr_batch.*` のみ対象）
3. **原本照合の継続** — 未処理ページが残る場合、直近フェーズと同じスタイルで続行可能
   - 未処理ページは `data/` 配下の ledger / pending 系 CSV を参照
   - 新規ページに着手する前に `data/*ledger*.json` と `data/pending_*.csv` を確認
4. **`MIGRATION_CANDIDATES.md` の実行判断（保留可）** — 余力時に判断
<!-- review-handoff:scope:end -->

## 現時点の未確定事項 (unverified)

- `data/reviewed_import.json` と `public/data/reviewed_import.json` の同期手順
  （手動コピーか、ビルド時コピーか、シンボリックリンクか）
- `scripts/run_auto_pipeline.sh` の実行順と現在も使われているか
- `scripts/patch_*.py` 系が履歴用か恒常使用か
- `docs/` 内のどれが stable policy で、どれが一時メモか（`MIGRATION_CANDIDATES.md` で整理予定）

## 避けるべきアクション

- 大規模ファイル移動（本セッションでは意図的に保留）
- `AGENTS.md` の既存 Next.js ブロック削除
- `CLAUDE.md` の書き換え（`@AGENTS.md` import が崩れないよう）
- `subjectId = ''` を温存するような修正
- 根拠不明を理由に `isExcluded` を立てること（`needsSourceCheck` に寄せる）

## 参照先の優先順位

- 判断基準: `AGENTS.md`（本 repo 内）
- ルール / 前提: `context/stable/`
- 現在状況: `context/working/`（本ファイル含む）
- 詳細設計: `docs/`（必要時のみ）
- repo 外 user memory (`~/.claude/projects/.../memory/*.md`): **補助**。
  - 現状 `study_schedule.md` / `data_import_plan.md` / `session_handoff.md` などがあるが、
    **source of truth は本 repo の `context/`**。競合時は repo 内を優先する。
  - memory 側の情報で重要なものは、適宜本ファイルに転記する。
