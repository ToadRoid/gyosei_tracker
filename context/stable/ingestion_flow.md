# 後半取り込みフロー v3 — source of truth

最終確定: 2026-04-23（v100 = PR #68 + PR #69 merge 後、user directive 2026-04-22 でフロー v3 採用 + 3 点修正 = 運用文書反映）

**位置付け**: 本ドキュメントは `context/stable/` 配下の source of truth。後半（L2）取り込み / 修正 / queue 運用の判断基準はすべてここに集約する。`handoff.md` は実行ログ、`current_status.md` は snapshot。運用判断で迷ったら本ファイルを先に読む。

---

## §0 方針転換（v100 merge 後）

- **主レーン = 後半 L2 取り込みレーン**。v100 merge 完了時点で p006 B 群 active の完走条件は「B2 / B3 / B5 / B6 の Q/E 層 1 restore + ans polarity 整合」であり、既にこれは満たした。以降の p006 B1/B4 は **P2 backlog**（止めない / 次バッチ境界で再判定）。
- **旧主レーン = p006 B 群 / polarity hotfix**: v98 → v99 → v100 で一連の restore は closed to limit of source quality。残件（B1 共産党除名事件 / B4 在宅投票事件）は low-res source only + 判決骨格 judge 可 + polarity gate 未充足のため、主レーンの一時停止理由にはしない。
- **「v100 完了」の語義**: **v100 = PR #68 squash merge 完了**（`c7630070b9d9f02fee7ddf67d7fb9a3b3bee6f43` ではなく PR #68 squash SHA を指す。merge 後に handoff へ backfill）+ PR #69 = historical catchup（`a33657428be9f5006091c83f8db10c2ec42b4fd7`）merge 完了。

---

## §1 3 レーン分離

| レーン | 内容 | 運用 | 停止可否 |
|---|---|---|---|
| **A 取込** | kindle_capture.sh → OCR → auto scan → reviewed_import.json patch → PR | **主レーン（v100 merge 後）** | 止めない |
| **B 修正** | 既存肢の Q/E verbatim restore / polarity flip / flag 調整 | **副レーン（open 上限 = 5）** | 5 超えで A を一時停止可 |
| **C queue** | エラー報告 / 自動検知 findings / follow-up tasks の待機列 | **非レーン**（P1/P2/P3 で優先分離） | 非同期、主レーン影響なし |

- **B 副レーン open 上限 = 5**: 同時に open な B 修正 PR は最大 5 件。超過したら主レーンを一時停止し B を先に drain。上限 = 5 の根拠は「レビュー回転と SHA backfill 運用の実測値」。
- **C queue は 非同期**。P1（hotfix, 主レーン独立で即着手）/ P2（次バッチ境界で再判定）/ P3（将来候補）で分離。P2 は主レーンを止めない。
- **問題ページは副レーンへ逃がす**。A 取込中に verbatim / polarity / flag が判定不能なページが出たら、**その 1 ページのみを B queue 化して A は次ページへ進む**。A 全体を止めない。

---

## §2 バッチ完了判定（4 criteria）

A 取込バッチ（= 1 PR = 複数ページ or 1 ページ複数 seq）が「完了 = merge 可」と言える条件：

1. **反映件数明示**: コミットメッセージに `限定反映 N 肢` / `N pages / M seqs` 等の数を書く。
2. **dual-file mirror byte-identical**: `diff data/reviewed_import.json public/data/reviewed_import.json` が空。
3. **DATA_VERSION bump**: `src/lib/db.ts` の `DATA_VERSION` を `YYYY-MM-DD-audit-vNN-<page>-q<num>-<desc>` 規約で bump。cleanup patch が必要なら PATCHES に同時追加。
4. **欠損率 ≤ 閾値**（§3 参照）: バッチ内の対象肢で `...` 等の欠損が規定割合以下。

4 criteria 不成立は main の主レーンを前進させない。ただし §5 の polarity gate 退路で「ans 維持 + layer 2 fragment として unresolved 保持」は許容される（= 欠損を解消できないまま PR を閉じる exit）。

---

## §3 欠損率 3 段階（割合主軸）

バッチ内の対象肢数を N、`...` / `…` / OCR unreadable fragment を含む肢数を D とする。割合 = D/N。

| 欠損率 | 運用 |
|---|---|
| **≤ 10%** | **主レーン進行可**。欠損肢は layer 2 literal `...` + ERROR_UNREADABLE_SOURCE 運用で unresolved 維持。handoff に個別記録せず、PR 本文に内訳を残す。 |
| **> 10%, < 20%** | **警告帯**。主レーン進行可だが、PR 本文で欠損肢リスト明示 + handoff の「B queue 候補」に上積み。次バッチ境界で一括再判定。 |
| **≥ 20%** | **主レーン停止**。欠損源（source 解像度 / OCR model / 前処理）の根本調査に回す。該当バッチは merge しない / 分割する / 別 source で再 OCR する。 |

**補助基準（文字単位 95% 十分一致）**: 個別肢レベルで、OCR 出力と source image を再読した際の **文字単位 95% 以上一致** は「verbatim 達成」の補助判定に使う。主判定は割合（上表）、95% は個別肢の layer 1 採否境界。

---

## §4 auto scan 自動分類 hook + dual-read gate

- **auto scan**: OCR 出力（`parsed_*.json`）に対し、取り込み前に `scripts/auto_scan.*`（または ocr_batch 内の hook）で以下を自動検知する：
  - `...` / `…` / 文末不自然欠落 / 助詞重複 / broad raw chapter/subject / Q↔E polarity 矛盾
  - 検知されたものは branch に `needsSourceCheck: true` を付与 + C queue へ記録
- **dual-read gate**: 疑わしい箇所（OCR confidence < 閾値 / 自動検知 hit / polarity 微妙）は **Gemini × 2 読 または Gemini + 別経路（GPT review のみ、復元主担当には使わない）** で照合。一致したら layer 1、不一致なら layer 2 literal + ERROR_UNREADABLE_SOURCE 維持。

---

## §5 polarity gate 退路

ans flip を伴う修正は **triangulation gate** を通す：

- **Gate**: (i) 画像 row marker（○/×）、(ii) E 末尾の論理、(iii) 解説ページの条文 / 判例名特定、の **3 経路一致**。
- **退路（1/3 または 解説未入手）**: 3 経路中 1 つ以下しか成立しないか、解説ページ source が未取得の場合は **ans 維持** のまま **layer 2 = E fragment を `...` 保持 + ERROR_UNREADABLE_SOURCE** でクローズ。flip は保留し C queue（P2）へ送る。

**推奨組み合わせ**（v82 / v86 / v100 precedent）: polarity flip を伴う Q/E 層 1 restore は **Q + E + ans を 1 PR に束ね** て中間状態を avoid。ただし Q 無変更 × E+ans 束ね、または ans のみ hotfix（v98 pattern）も許容。Q 単独修正は polarity 非影響の時のみ。

---

## §6 1 対象 = 1 PR + handoff-only 4 条件 + TTL 14 日

- **1 対象 = 1 PR**: 1 ページ or 1 seq を 1 PR に閉じる。複数束ねるのは「束ねないと中間状態が壊れる」場合のみ（polarity flip 同時 Q/E restore 等）。
- **handoff-only 4 条件**（data 無変更 PR は以下 4 条件すべて満たす時のみ許容）:
  1. source 存在ログ / sufficiency check / SHA backfill / queue 記録 の 4 種のいずれか
  2. `data/` / `public/data/` を一切触らない
  3. `DATA_VERSION` を bump しない
  4. PR 本文で「data 無変更 / DATA_VERSION 維持」を明示
- **handoff-only TTL = 14 日**: 14 日以内に対応する data PR（v## restore）が merge されない handoff-only は **自動 stale 扱い**。stale 化したら削除 or 次 v## に吸収。

---

## §7 二層運用の開始条件（文字単位 95% / span 局所切り出し主軸）

- **層 1 = substantive restore**: 骨格 + 結論句 + polarity + 特定可能な判例名 / 条文番号 / 金額 etc が verbatim に近い形で復元可能。**文字単位 95% 一致** を個別肢の採否境界とする（補助基準）。
- **層 2 = ERROR_UNREADABLE_SOURCE 維持**: source 画質起因で character-level verbatim 不能な fragment（助詞 / 接続 / 句読点 / 短 span）を `...` literal で保持。layer 2 を採るのは **span 局所切り出し主軸**（文全体 opaque ではなく、1-2 句の局所 fragment のみ unreadable）の時のみ。文全体 opaque は layer 2 採用せず主レーン停止（§3 ≥ 20% 帯）。

---

## §8 止めない / 止める条件

**止めない（主レーン進行可）**:
- §3 欠損率 ≤ 10% または 10-20% 警告帯
- B 副レーン open ≤ 5
- polarity gate 退路（§5）で ans 維持が確保できる
- 個別ページ判定不能 → B queue 化 + 次ページへ進む

**止める（主レーン一時停止）**:
- §3 欠損率 ≥ 20%
- B 副レーン open > 5
- auto scan の自動検知 hit 率が bachi 内 30% を超える（OCR model / source 根本問題の signal）
- CI / integration test 失敗（§9）

---

## §9 integration test CI 必須化（P-D 再発防止）

- **対象**: `importParsedBatch` の属性継承 + cleanup 再実行条件。PR #60 で部分修正済（PreservedAttrs Map pattern）。現状は pure function 単体 test のみ（`src/lib/import-parsed.test.ts` 12 cases）で、IndexedDB 経路の integration test は未整備。
- **要件**:
  1. 既存 DB の subjectId / chapterId / isExcluded / needsSourceCheck を持った状態で importParsedBatch を呼び直し、再作成後に全フラグが保全されることを integration test で検証
  2. DATA_VERSION bump 時の runOneTimeCleanup が localStorage フラグと PATCHES の差分で再実行可能になる条件 test
  3. CI pipeline（GitHub Actions）に組み込み、green でないと merge 不可
- **優先度**: P1（follow-up 3 本の最優先）。主レーン影響なし = 並行 open。

---

## §10 queue 優先度（P1 / P2 / P3）+ P1 hotfix lane

| 優先度 | 意味 | lane |
|---|---|---|
| **P1** | hotfix / 主レーン影響あり / CI 必須（§9）/ データ安全 | **独立 hotfix lane**。副レーン上限 = 5 に含めず別枠で即着手可 |
| **P2** | 主レーン影響なし / 次バッチ境界で再判定 | B 副レーン in、open 上限 = 5 の枠内 |
| **P3** | 将来候補 / follow-up / 実害なし | queue に残置、TTL 45 日で stale 判定 |

**現在の P1 queue**:
- P1-1: importParsedBatch integration test（§9）
- P1-2: PreservedAttrs 拡張（importance / needsReview / year / memo を PreservedAttrs 対象に追加）
- P1-3: CLAUDE.md §1 / `context/working/known_issues.md` §1 の stale 記述 update（PR #60 反映済を明示）

**現在の P2 queue**:
- P2-1: p006 B1 = `p006-q01 seq1` Q/E restore（共産党除名事件, row 12）
- P2-2: p006 B4 = `p006-q01 seq4` Q/E restore（在宅投票事件, row 15）

**現在の P3 queue**:
- P3-1: エラー報告 #1 = KB2025-p194-q06 正誤の誤り
- P3-2: エラー報告 #2 = KB2025-p197-q01 その他
- P3-3: エラー報告 #3 = KB2025-p198-q05 その他

---

## §11 実行順（2026-04-23 時点）

1. **v3 反映 = 本ファイル作成 + handoff / current_status 更新 + PR**（着手中）
2. **後半バッチ 1 開始**: screenshot acquisition → OCR → auto scan → reviewed_import.json patch → import PR（1 PR = 1 バッチ）
3. **follow-up 3 本を並行 open**: P1-1 / P1-2 / P1-3 を 3 worktree で並行（副レーン上限 = 5 の枠内）
4. **p006 B1/B4 は触らず P2 backlog 維持**: 次バッチ境界で再判定

「まず follow-up 3 本を全部終わらせる → 後で主レーン」運用は 遅延再発（2026-04-22 user directive で明確禁止）。**主レーン = A 取込** を最優先で動かす。

---

## §12 成功条件

**短期（2026-05 以内）**:
- 後半 L2 バッチを 少なくとも 3 回完走（欠損率 ≤ 10% + dual-file byte-identical + DATA_VERSION bump + mirror）
- P1 follow-up 3 本すべて merge
- p006 B1/B4 は P2 に維持（主レーンを止めていない証左）

**中期（1 周目完了 = 2026-06-15）**:
- L2 残り約 1,400 肢のうち 80% 以上を `ready` 昇格
- needsSourceCheck 残 < 5%
- auto scan 自動検知 rule を本番運用

---

## 用語定義

| 用語 | 意味 |
|---|---|
| **v100 完了** | v100 PR（= PR #68）の squash merge 完了を指す。PR #69 historical catchup（同日別 PR）merge 完了も含む（recalcCorrect 漏れ一括回収） |
| **主レーン停止** | A 取込 PR の新規起票を一時停止すること（既 open PR の merge は続行可） |
| **文字単位十分一致** | OCR 出力と source image 再読の character-level 一致率 **95%** を layer 1 採用の補助境界とする（主判定は §3 欠損率） |
| **ERROR_UNREADABLE_SOURCE** | layer 2 運用で `...` literal を保持するときの内部ラベル。data には記録せず PR 本文 / handoff / queue で使う表記 |
| **triangulation gate** | polarity flip 採用条件（§5）: (i) 画像 row marker、(ii) E 末尾論理、(iii) 解説ページ条文/判例 の 3 経路一致 |
| **handoff-only PR** | data 無変更で handoff.md だけ更新する PR（§6 の 4 条件 + TTL 14 日） |

---

## v2 → v3 差分要約

v2（GPT 提案）からの修正 3 点を反映：

1. **p006 B1/B4 = P2 backlog**（v2 は B1/B4 を active 扱いで残していたが、主レーン停止理由にしない運用に変更）
2. **95% は補助基準**（v2 は 95% を主判定にしていたが、主判定は §3 欠損率割合、95% は個別肢 layer 1 採否境界）
3. **欠損率 table は割合主軸**（v2 は絶対件数ベースだったが、バッチ規模に中立な割合に変更）

加えて v1 → v2 で既に反映済の 7 件：レーン分離 / バッチ完了 4 criteria / dual-read gate / polarity 退路 / 1 対象 = 1 PR / TTL / CI integration test 必須化。
