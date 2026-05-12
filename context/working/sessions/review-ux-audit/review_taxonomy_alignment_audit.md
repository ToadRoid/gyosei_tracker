# Review taxonomy alignment audit

date: 2026-05-12
base: origin/main `1d2e686` (PR #149 merged)

---

## 結論（先出し）

**taxonomy には複数種類の構造問題が混在しており、参考書分類との整合は現状取れていない。**

| 問題種別 | 件数 | 深刻度 |
|---|---|---|
| 二重ラベル体系（番号付き `NN_` と 生テキストの併存） | 9 chapters | **高** |
| 同一意味の表記ゆれ・重複ラベル | 40+ ペア | **高** |
| sectionTitle 空 | 71 branches | 中（PR #149 で表示は救済済み） |
| 1問だけの singleton section | 65 sections | 中 |
| 同一ページ内に 3+ section が散乱 | 29 pages | 中 |
| 問題文がそのまま sectionTitle に混入 | 少なくとも 1 件 | 高（parser bug） |
| 完全に空の chapter | 1 件 (kenpo-jinken) | 中 |

応急処置（builder fallback）は完了したが、**正しい状態にするには data taxonomy の再整理が必須**。

---

## 1. 現在の taxonomy 全体像

| chapter | branches | sections (distinct) | 備考 |
|---|---|---|---|
| minpo-saiken | 376 | 28 | 番号無し中心、空 36件 |
| gyosei-ippan | 271 | 54 | 番号付6 + 生47、最も混乱 |
| gyosei-chiho | 250 | 54 | 番号付11 + 生42 |
| minpo-bukken | 205 | 24 | ほぼ番号無し |
| minpo-sosoku | 181 | 30 | **番号付6 + 生24（重複多数）** |
| shoho-kaisha | 172 | 16 | 空 13件、構造化途中 |
| gyosei-jiken | 156 | 30 | 番号付9 + 生21 |
| gyosei-tetsuzuki | 144 | 18 | 番号付7 + 生11、ペア重複 |
| gyosei-fufuku | 129 | 21 | 番号付6 + 生14 |
| kenpo-tochi | 100 | 23 | 番号付3 + 生19 |
| kiso-chishiki-gyomu | 100 | 10 | 比較的整理されている |
| minpo-shinzoku | 74 | 7 | 空 10件あり |
| shoho-shoho | 67 | 3 | 整理済み（理想形に近い） |
| gyosei-kokubai | 61 | 10 | 番号付1 + 生9 |
| kiso-chishiki-joho | 61 | 5 | 重複あり |
| minpo-sozoku | 58 | 12 | 空 2件 |
| kiso-hogaku-gairon | 32 | 6 | 整理済み |
| kiso-hogaku-funso | 10 | 2 | 整理済み |
| kenpo-jinken | 1 | 1 | **全 EMPTY、全1問** |

総 sections (空含む): 354 / 総 branches: 2,448

---

## 2. 問題種別ごとの詳細

### 2.1 二重ラベル体系（番号付き `NN_` と 生テキストの併存）

**最も深刻**。同じ chapter 内で、参考書の見出し階層に対応する番号付きラベル `01_…` と、その細目（生テキスト）が同居している。

例: `minpo-sosoku` (民法・総則)
- 番号付き: `01_権利能力・行為能力`, `02_意思表示と瑕疵`, `03_代理`, `04_無効・取消し・条件・期限`, `05_人・法人・物`, `06_時効`
- 生テキスト: `民法の基本原則`, `権利の主体・客体`, `意思能力`, `行為能力`, `被保佐人`, `被補助人`, `公序良俗`, `心裡留保`, `虚偽表示`, `錯誤`, `詐欺および強迫`, `任意代理人`, `総則`, `無効・取消し`, `条件・期限・期間の計算`, `取得時効`, `消滅時効` ほか多数

**結果**: `03_代理` (32問) と `任意代理人` (3問) が**別カード**として並ぶ。参考書では代理の章の一節だが /review では区別できない。

該当 chapters と件数:

| chapter | 番号付き sections | 生テキスト sections |
|---|---|---|
| gyosei-chiho | 11 | 42 |
| gyosei-ippan | 6 | 47 |
| gyosei-jiken | 9 | 21 |
| gyosei-fufuku | 6 | 14 |
| gyosei-tetsuzuki | 7 | 11 |
| minpo-sosoku | 6 | 24 |
| kenpo-tochi | 3 | 19 |
| gyosei-kokubai | 1 | 9 |
| minpo-bukken | 1 | 22 |

### 2.2 同一意味の表記ゆれ・重複ラベル

番号付きと生テキストが「同じものを指しているのに別 section として保存されている」明白なペア:

| chapter | A | B | 推定 |
|---|---|---|---|
| kenpo-tochi | `02_裁判所（組織・権限）` | `裁判所` | 同一 |
| kenpo-tochi | `05_地方自治・憲法改正` | `憲法改正` | A=親、B=子 |
| gyosei-ippan | `04_行政行為の効力・取消し・撤回` | `行政行為` | A=親、B=子 |
| gyosei-ippan | `07_行政上の強制執行` | `行政上の強制執行` | 同一 |
| gyosei-ippan | `09_行政罰` | `行政罰` | 同一 |
| gyosei-ippan | `代執行` | `行政代執行法` / `行政代執行` | 3者重複 |
| gyosei-tetsuzuki | `01_目的・対象` | `目的・対象` | 同一 |
| gyosei-tetsuzuki | `02_適用除外` | `適用除外` | 同一 |
| gyosei-tetsuzuki | `03_申請に対する処分` | `申請に対する処分` | 同一 |
| gyosei-tetsuzuki | `05_不利益処分（聴聞）` | `不利益処分` | A=細、B=親 |
| gyosei-tetsuzuki | `06_不利益処分（弁明）` | `不利益処分` | 同上 |
| gyosei-tetsuzuki | `07_行政指導` | `行政指導` | 同一 |
| gyosei-tetsuzuki | `08_届出・命令等制定手続` | `命令等制定手続` | A=親、B=子 |
| gyosei-fufuku | `04_執行停止` | `執行停止` | 同一 |
| gyosei-jiken | `01_行政事件訴訟の種類` | `行政事件訴訟の種類` | 同一 |
| gyosei-jiken | `05_取消訴訟の審理` | `取消訴訟の審理` | 同一 |
| gyosei-chiho | `08_住民・地縁団体` | `地縁団体` | A=親、B=子 |
| gyosei-chiho | `09_直接請求` | `直接請求` | 同一 |
| gyosei-chiho | `11_公の施設` | `公の施設` | 同一 |
| minpo-sosoku | `01_権利能力・行為能力` | `行為能力` | A=親、B=子 |
| minpo-sosoku | `04_無効・取消し・条件・期限` | `無効・取消し` | A=親、B=子 |
| kiso-chishiki-joho | `1 個人情報保護法 (総論)` | `個人情報保護` / `情報通信・個人情報保護` | 3者重複 |

→ 「同一」と判断した **15+ ペアは安全に統合可能**。

### 2.3 sectionTitle 空 71 branches

[section_title_empty_coverage_audit.md](context/working/sessions/review-ux-audit/section_title_empty_coverage_audit.md) で詳細済み。PR #149 で「未分類」fallback により表示は救済済み。最終形には正しい sectionTitle 補完が必要。

- recoverable (siblings から推定): 43 branches
- all-empty (5 problems): 28 branches → source 照合必要

### 2.4 singleton section（1問だけ）

65 sections が 1 branch のみ。

代表例（gyosei-chiho より）:
- `請願` p.177 (1問)
- `議員の地位` p.177 (1問)
- `通則` p.178 (1問)
- `規程・要綱` p.187 (1問)
- `予算` p.188 (1問)
- `時効` p.192 (1問)
- `財産` p.192 (1問)
- `選挙` p.196 (1問)

これらは **参考書の sub-heading をそのまま section として吸収してしまった**疑い。本来は親 section（例: `地方公共団体の機関`、`財務`）に属するべき。

### 2.5 同一ページ内に 3+ section が散乱

29 pages で発生。代表例:

```
p.022 -> 行政法の一般的な法律論 | 公営住宅 | 食品衛生法 | 通行権 | 土地所有権
p.024 -> 監査機関 | 執行機関 | 補助機関 | 外局 | 人事院 | 行政機関の権限
p.033 -> 公証 | 効力発生時期 | 拘束力 | 公定力
p.061 -> 直接強制 | 強制徴収 | 即時強制
p.073 -> 行政指導 | 行政手続 | 行政処分
```

**1ページ内で問題文の主題ワード（公定力、拘束力等）がそのまま section に化けている**。これは parser の section 抽出ロジックが弱く、問題文や肢内のキーワードを section header と誤認識した可能性が高い。

### 2.6 問題文混入の sectionTitle

最も明白な parser bug:

```
gyosei-jiken / sectionTitle = "取消訴訟の判決には、既判力を生じない。"
```

これは問題文そのもの。p.140 で 1 branch のみ。

### 2.7 kenpo-jinken: 完全に空の chapter

`kenpo-jinken` chapter 全体で 1 branch のみ、しかも sectionTitle 空。これは「人権」章だが、reviewed_import に問題がほぼ存在しない（取り込み漏れの可能性）。データ全体の coverage 問題でもある。

---

## 3. /review の集計への影響

| 影響 | 例 |
|---|---|
| **同じ参考書 section が複数カードに分裂** | `03_代理` (32問) と `任意代理人` (3問) が別カード → 弱点が誤判定される |
| **1問しかない singleton で雑音増加** | `請願`, `予算` などが「弱点」上位に上がってしまう |
| **未分類カード（PR #149 で救済）** | minpo-saiken 36問, shoho-kaisha 13問 などが「未分類」として 1 カードに集約され、参考書分類が見えない |
| **同一意味の重複** | `02_適用除外` と `適用除外` が並ぶ。集計が分散し、各カードの正答率が小さい n で揺れる |
| **問題文混入** | `取消訴訟の判決には、既判力を生じない。` というセクションタイトルが UI に出てしまう |

---

## 4. 修正方針の分類

### 案A: source 不要、安全に補正できる表記ゆれ（**最優先・即実装可**）

「番号付きと生テキストが同一意味」と判断できる 15+ ペアを統合する data patch。

例:
- `02_裁判所（組織・権限）` ← `裁判所` を統合
- `09_行政罰` ← `行政罰` を統合
- `01_目的・対象` ← `目的・対象` を統合

**統合方針**: 番号付き `NN_` 系を正とし、生テキスト側を番号付きに揃える。理由: 参考書の章立てと自然に対応するため。

**対象推定件数**: 80〜120 branches（同一/親子のペアにより集約）

**リスク**: 親子関係（A=親、B=子）のペアは慎重。子（細目）を親に統合すると粒度が下がるので、parent-child は別判断。

### 案B: sibling 推定可能な空 sectionTitle 補完（**Phase 2 として既に予定**）

43 branches。siblings の sectionTitle を継承。

### 案C: parser bug 由来の明白な誤分類補正（**source 確認軽め**）

- `取消訴訟の判決には、既判力を生じない。` のような問題文混入 → 親 section（`06_判決` 推定）に再分類
- 同一ページ内 3+ section の散乱 → 番号付き親 section に集約

### 案D: source 確認が必要なもの

- all-empty 5 problems (28 branches): Kindle 原本確認
- 1問 singleton 65件: 本当に独立節か、親に統合すべきか
- 親子関係の重複ペア（例: `不利益処分` vs `05_不利益処分（聴聞）` / `06_不利益処分（弁明）`）: 親→2子は正しい階層化なので、`不利益処分` 側の問題を `05_` か `06_` に振り分け直す source 判断が必要

### 案E: 現状維持

- `kenpo-jinken` の 1問のみ問題: 取り込み漏れ可能性。reviewed_import の coverage 問題なので別 audit
- 番号無し chapter（`shoho-shoho`, `kiso-hogaku-gairon` など）: そもそも整理されているので触らない

---

## 5. 次の data patch design 方針（推奨）

### Step 1: 安全な表記ゆれ統合（案A）

**docs-only** で patch plan を作成 → ペアごとに「統合先・統合元・件数・サンプル」を一覧化 → ユーザーレビュー → data patch。

優先ペア（同一意味、確信度高）:

1. gyosei-ippan: `07_行政上の強制執行` ← `行政上の強制執行`, `09_行政罰` ← `行政罰`
2. gyosei-tetsuzuki: `01_目的・対象` ← `目的・対象`, `02_適用除外` ← `適用除外`, `03_申請に対する処分` ← `申請に対する処分`, `07_行政指導` ← `行政指導`
3. gyosei-fufuku: `04_執行停止` ← `執行停止`
4. gyosei-jiken: `01_行政事件訴訟の種類` ← `行政事件訴訟の種類`, `05_取消訴訟の審理` ← `取消訴訟の審理`
5. gyosei-chiho: `09_直接請求` ← `直接請求`, `11_公の施設` ← `公の施設`

### Step 2: sibling 推定可能な空 sectionTitle 補完（案B、43件）

### Step 3: 親子関係の判断（source 確認軽め）

例: `05_附款・裁量` vs `附款` / `行政裁量` → 親 1 + 子 2 のどれが正しいかを参考書で照合し、子側の問題を親 or 別子へ振り分け。

### Step 4: parser 由来の明白な誤分類補正（案C）

問題文混入の `取消訴訟の判決には、既判力を生じない。` などを修正。

### Step 5: all-empty 5 problems source 照合（案D、28件）

Kindle 原本で section header 確認。

### Step 6: singleton 65件の親への統合判断

各 singleton について「真の独立節」か「親に統合すべきサブ見出し」かを source 照合。

### Step 7: parser 改善（恒久）

OCR バッチで section header 抽出ロジックを強化。問題文・肢内のキーワードを section と誤認しないよう、明示的な heading パターン（番号付き、改行直後等）を要求する。

---

## 6. patch 可能 / source確認必要 / 保留 の分類

| 分類 | 対象 | 件数概算 |
|---|---|---|
| **patch 可能（source 不要）** | 番号付き vs 生テキストの「同一」ペア 15+ | 80〜120 branches |
| **patch 可能（sibling 推定）** | 空 sectionTitle 71件のうち sibling 派生可能なもの | 43 branches |
| **source 確認軽め** | 親子関係ペア、問題文混入、singleton 一部 | 50〜80 branches |
| **source 確認必要** | all-empty 5 problems、不明な singleton | 28+ branches |
| **保留（別 audit）** | kenpo-jinken 取り込み漏れ疑い | 1 chapter 全体 |
| **現状維持** | 既に整理済みの chapter | 該当多数 |

---

## 7. 推奨次アクション

1. **Step 1 の patch design audit** を docs-only で作成（同一ペアごとに件数・対象 branch を列挙）
2. ユーザーがレビュー → 統合先確定
3. data patch + public data patch を 1 PR で適用（page 単位の最小 patch）
4. /review 実画面で集計差分を確認
5. Step 2 以降を順次

**今回の audit はここまでで停止**。Step 1 patch design は別タスクで実施。

---

## 禁止事項確認

- [x] src 修正なし
- [x] data 修正なし
- [x] public data 修正なし
- [x] answerBoolean 変更なし
- [x] questionText / explanationText 変更なし
- [x] import 実行なし
- [x] DATA_VERSION bump なし
- [x] stash apply/drop なし
- [x] padding 調整なし
- [x] commit / push / PR なし
