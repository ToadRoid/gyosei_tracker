# subject/chapter override ルール設計メモ

> 策定: 2026-04-25（後半 L2 完走直後 = batch 1-9 累計実績ベース）
> scope: **設計メモのみ**。本 PR で script 実装は **しない**（user directive 2026-04-25 = 最初の提出は「事例棚卸し + ルール案 + 実装方針」まで）
> 関連: `docs/section-title-policy.md`（既存、sectionTitle 表示正規化の方針）

---

## 1. 背景・目的

後半 L2 取込（batch 1-9）で、Gemini OCR が抽出した `subjectCandidate` / `chapterCandidate` を Claude が systematic に override するケースが累計 **91 branches / 18 ページ** 発生した。最終 batch（batch 9）だけで **86 branches / 14 ページ = 過去最大 override** に達したため、**手動 override の根拠を script として明文化**し、次の新書投入（batch 10+）で半自動化する。

### 設計原則

| 原則 | 内容 |
|---|---|
| **狭く始める** | 全自動補正は目指さない。**安全に直せるものだけ自動、危ないものは review queue へ** |
| **sectionTitle-first** | Gemini が sectionTitle を取り違えるケースは稀（後述データ参照）。subject/chapter のみ誤る pattern が dominant |
| **既存 reviewed_import.json は壊さない** | 本 script は新規 parsed Gemini JSON に対する **read-only 提案 tool**。既存 import 済みデータには適用しない |
| **DATA_VERSION を上げない** | 提案だけ。実適用は別 PR で |

---

## 2. 事例棚卸し（batch 1-9 累計）

### 2-1. 全 override = 91 branches / 18 ページ

| batch | ページ | 総 branches |
|---|---:|---:|
| batch 4-5 周辺（minpo within-subject 微修正） | 1 | 2 |
| batch 6（minpo within-subject） | 1 | 2 |
| batch 7（minpo-sosoku → minpo-shinzoku） | 1 | 1 |
| **batch 9（科目間 = gyosei/minpo → kiso-chishiki）** | **14** | **86** |
| **計** | **18 ページ** | **91 branches** |

**観察**: batch 9 = 86 branches = **94.5%** が単一 batch に集中。**章扉直後の科目越境**で発生。

### 2-2. transition 別 raw → final

| count | raw (Gemini) | → | final (override 後) | 構成 |
|---:|---|---|---|---|
| 53 | gyosei/gyosei-ippan | → | kiso-chishiki/**kiso-chishiki-gyomu** | batch 9 VI章 |
| 24 | gyosei/gyosei-ippan | → | kiso-chishiki/**kiso-chishiki-joho** | batch 9 VII章 |
| 7 | minpo/minpo-shinzoku | → | kiso-chishiki/kiso-chishiki-gyomu | batch 9 p448 戸籍法 |
| 2 | gyosei/gyosei-fufuku | → | kiso-chishiki/kiso-chishiki-gyomu | batch 9 p447 監督 |
| 1 | minpo/minpo-sozoku | → | minpo/minpo-saiken | batch 5 p294 代位権 |
| 1 | minpo/minpo-shinzoku | → | minpo/minpo-saiken | batch 5 p294 代位権 |
| 1 | minpo/minpo-bukken | → | minpo/minpo-saiken | batch 6 p328 売主担保 |
| 1 | minpo/minpo-sosoku | → | minpo/minpo-saiken | batch 6 p328 売主担保 |
| 1 | minpo/minpo-sosoku | → | minpo/minpo-shinzoku | batch 7 p375 補助制度 |

**支配的 pattern = 上 4 行 = 86 件 = 全 override の 94.5%**。「**Gemini が `gyosei` or `minpo` と誤判定 → 実体は `kiso-chishiki`**」という単一の cross-subject error。残り 5 件は minpo 内の chapter 誤判定（micro corrections）。

### 2-3. sectionTitle 別（top）

| count | sectionTitle | 正解 chapter |
|---:|---|---|
| 22 | 業務関連諸法令 | kiso-chishiki-**gyomu** |
| 14 | 住民基本台帳法 | kiso-chishiki-**gyomu** |
| 12 | 情報通信・個人情報保護 | kiso-chishiki-**joho** |
| 7 | 行政書士の義務 | kiso-chishiki-**gyomu** |
| 7 | 戸籍法 | kiso-chishiki-**gyomu** |
| 7 | 1 個人情報保護法 (総論) | kiso-chishiki-**joho** |
| 7 | 行政書士法人 | kiso-chishiki-**gyomu** |
| 5 | 監督 | kiso-chishiki-**gyomu** |
| 5 | 公文書管理法 | kiso-chishiki-**joho** |
| 2 | 責任財産の保全 債権者代位権 | minpo-saiken |
| 2 | 契約 | minpo-saiken |
| 1 | （空） | minpo-shinzoku（章扉文脈で判定） |

**核心の発見**:

- chapter `kiso-chishiki-gyomu` の master.ts 上の name = **「業務関連諸法令」** = sectionTitle と **完全一致**（22 件）
- chapter `kiso-chishiki-joho` の name = **「情報通信・個人情報保護」** = sectionTitle と **完全一致**（12 件）
- それ以外の sectionTitle（戸籍法 / 住民基本台帳法 / 行政書士の義務 / etc.）は chapter name と一致はしないが、**1:1 で chapter にマップできる固有名詞**

→ **sectionTitle が override 判定の信頼できる primary key になる**。

---

## 3. 誤分類パターンの類型化

**注**: 類型は **mutually exclusive**（同一 branch を 2 つ以上の類型に重ねない）。E は「sectionTitle 空」を識別子とし、たとえ minpo 内 chapter 修正でも sectionTitle が空なら D ではなく E に振り分ける（auto-correction の最初の blocker は sectionTitle の有無のため）。

| 類型 | Gemini 失敗の本質 | 件数 | 自動補正の難易度 |
|---|---|---:|---|
| **A. 章扉直後の科目越境** | VI章扉（業務関連諸法令）/ VII章扉（情報通信・個人情報保護）後、Gemini は keyword「行政」に引きずられて旧科目 `gyosei` を継続。実体は `kiso-chishiki` | **77** | **低**（sectionTitle ≒ chapter name で確定可能） |
| **B. 主題 keyword の誤引き（戸籍法 → 民法親族）** | sectionTitle = 「戸籍法」だが Gemini が「家族関係」keyword から `minpo-shinzoku` に分類 | 7 | **低**（sectionTitle 固有名詞 → kiso-chishiki-gyomu に直接マップ） |
| **C. 章扉直後の科目越境（不服申立 → 監督）** | sectionTitle = 「監督」だが Gemini が前章「行政不服審査法」keyword から `gyosei-fufuku` に継続 | 2 | **低**（sectionTitle = 監督 → kiso-chishiki-gyomu） |
| **D. minpo 内 chapter 微修正（sectionTitle あり）** | sectionTitle = 「責任財産の保全 債権者代位権」「契約」など → minpo-saiken / minpo-shinzoku に修正 | **4** | **中**（sectionTitle と chapter name が直接一致しない、keyword 部分照合 or 章境界 context が必要） |
| **E. sectionTitle 空** | OCR で sectionTitle 取得失敗 + Gemini が前ページ context から誤継承（実例 = p375 = minpo-sosoku → minpo-shinzoku、ただし sectionTitle 空のため D ではなく E に分類） | 1 | **高**（自動補正は無理、review queue 必須） |
| **計** | | **91** | |

### 3-1. パターン A の発生条件（最頻）

1. **直前ページが主章扉**（branches=[] = legit blank で、image 上は「VI. 業務関連諸法令」のような大見出しのみ）
2. 当該ページの sectionTitle = 章扉直後の subsection 名
3. Gemini は前 batch の subject「行政法」を継続するため `gyosei/gyosei-ippan` と返す
4. **sectionTitle 自体は正確に取れている**（keyword「業務関連諸法令」「住民基本台帳法」など）

→ **sectionTitle のみで判定可能** = 自動補正 OK の条件。

### 3-2. パターン D の発生条件（minor、sectionTitle あり / 4 件）

1. 同一 subject (minpo) 内で**章境界**（債権 / 物権 / 親族 / 相続）を Gemini が混同
2. 例: p294「責任財産の保全 債権者代位権」= minpo-saiken だが Gemini は seq3/seq4 で minpo-sozoku（相続絡みの fact pattern）/minpo-shinzoku（家族絡み）と分類
3. sectionTitle に法概念（「債権者代位権」「契約」）が含まれるが chapter name とは一致しない
4. **対象 = p294 seq3/seq4 + p328 seq1/seq2 = 4 件**（p375 は sectionTitle 空のため類型 E）

→ **keyword 部分照合 + page-level majority** が必要。本 script では **review queue 行き** とする。

### 3-3. パターン E の発生条件（1 件）

1. sectionTitle が空文字列（OCR で取得失敗 or 書籍上 subsection header 不在）
2. Gemini は前ページ context から subject/chapter を継承するため誤継承率が高い
3. **対象 = p375 = minpo-sosoku → minpo-shinzoku の 1 件**（補助制度 Q だが教科書 context = 親族編、p374 で「補助」が shinzoku で既出）

→ sectionTitle というハンドルがないため自動補正の根拠なし。**review queue 必須**。

---

## 4. 最小ルール設計（sectionTitle-first rule v0.1）

### 4-1. 自動補正条件 = **2 段階厳格**

```
IF sectionTitle が確定マップ表に存在
   AND ページ内 ≥80% の branches が同一 sectionTitle を持つ
THEN 全 branches を override 後の (subject, chapter) に書き換え
ELSE review queue へ
```

### 4-2. 確定マップ表（v0.1 = batch 1-9 実績ベース）

| sectionTitle keyword | → subject | → chapter | 出典 |
|---|---|---|---|
| 業務関連諸法令 | kiso-chishiki | kiso-chishiki-gyomu | master.ts chapter name 完全一致 |
| 行政書士の義務 | kiso-chishiki | kiso-chishiki-gyomu | batch 9 p444 |
| 行政書士法人 | kiso-chishiki | kiso-chishiki-gyomu | batch 9 p446 |
| 監督 | kiso-chishiki | kiso-chishiki-gyomu | batch 9 p447（行書法 監督） |
| 戸籍法 | kiso-chishiki | kiso-chishiki-gyomu | batch 9 p448 |
| 住民基本台帳法 | kiso-chishiki | kiso-chishiki-gyomu | batch 9 p451-p452 |
| 情報通信・個人情報保護 | kiso-chishiki | kiso-chishiki-joho | master.ts chapter name 完全一致 |
| 個人情報保護法 | kiso-chishiki | kiso-chishiki-joho | batch 9 p455 ヘッダ「1 個人情報保護法 (総論)」startswith match |
| 公文書管理法 | kiso-chishiki | kiso-chishiki-joho | batch 9 p464 |

**注**: 表は **dictionary literal** として script に hard-code。新書で新しい sectionTitle が出たら **手動で表を拡張**する運用（無限自動学習はしない、安全側）。

### 4-3. review queue 行きの条件

- sectionTitle が確定マップ表に **無い**
- ページ内 branches の sectionTitle がバラつく（80% 未満）
- raw subject/chapter が章境界の手前 / 後ろの **両方**を跨ぐ
- sectionTitle が **空文字列**

このどれかに該当したら、自動補正せず report に出力。Claude or human が個別判断。

### 4-4. ページ内 majority 80% threshold の根拠

batch 9 の 14 override ページ全てで **同一ページ内の sectionTitle は 100% 一致**（Gemini は subsection 内の OCR は安定）。80% threshold = safe margin（外れ値 1-2 肢が混じっても全体修正できる）。

---

## 5. 実装方針

### 5-1. 配置

```
scripts/check_classification.py     # 新規（read-only proposal tool）
docs/override_rule_design.md         # 本 memo（sectionTitle 確定マップ表の正本）
```

`scripts/` 配下既存:
- `gemini_parse.js` = OCR 主処理（変更しない）
- `kindle_capture.sh` = capture（変更しない）
- `preprocess_images.py` = OCR 前処理（変更しない）

### 5-2. script の振る舞い（read-only）

```
入力: data/parsed_gemini_<timestamp>.json（Gemini OCR 直後の raw）
出力: stdout に proposal report
     - auto_apply: [(page, seq, raw_subj/chap, → final_subj/chap, sectionTitle, reason)]
     - review_queue: [(page, seq, raw_subj/chap, sectionTitle, reason_for_uncertain)]
副作用: なし（既存 reviewed_import.json は読まない、書かない）
```

### 5-3. 運用フロー（提案）

新 batch 取込時:

1. Gemini OCR を実行 → `data/parsed_gemini_<ts>.json` 生成
2. `python3 scripts/check_classification.py data/parsed_gemini_<ts>.json` を実行
3. report を Claude が読む:
   - **auto_apply** が出力した sectionTitle override は手作業で `parsed_gemini_<ts>_final.json` を作る前段で適用
   - **review_queue** は Claude or user が個別判定
4. その後 `importParsedBatch` 経由で reviewed_import.json に取り込み（v3 flow §11 を変えない）

→ 既存 v3 flow に **proposal step を 1 つ挟むだけ**。flow 全体は無改造。

### 5-4. テスト観点

- batch 1-9 の raw Gemini JSON を input として走らせ、**auto_apply 出力が実際の override 86/91 件と一致**することを再現テスト（A 77 + B 7 + C 2 = 86）
- **残 5 件**（D 4 件 = minpo within-subject with sectionTitle + E 1 件 = sectionTitle 空）は **review_queue に正しく回る**ことを確認
- false positive: sectionTitle が空のページ (パターン E) に誤って auto_apply しないこと

### 5-5. 拡張ポイント（v0.2 以降、新書投入時）

- 新書（行政書士テキスト 2026年度版 / 違う著者）で新しい sectionTitle が出たら表に追記
- 「sectionTitle 部分照合」（startswith / contains）を v0.2 で慎重に導入（v0.1 は exact match のみ）
- minpo 内 chapter（パターン D）の自動補正は未対応。実例 4 件のみのため heuristic を作るより review queue で十分
- パターン E（sectionTitle 空、実例 1 件）は構造的に自動補正不可、review queue 維持

---

## 6. やらないこと（このメモの範囲外）

- **既存 reviewed_import.json の書き換え**: 既存 91 件の override は import 済 = stable、再分類不要
- **DATA_VERSION bump**: 本 PR は memo のみ。実装 PR でも memo + script のみで data 触らない場合 bump 不要
- **Gemini prompt の修正**: OCR 自体は安定（sectionTitle は正しく取れている）。後段の judge を script で補正する方針
- **Gemini の subject/chapter 出力廃止**: subject/chapter 候補は依然として有用な signal（minpo within-subject の 5 件は subject だけで判定できる）
- **p006 B1/B4 の修正**: 別レーン（高解像度 recrop 待ち）

---

## 7. 次の実装 PR で作るもの（user 承認後）

1. `scripts/check_classification.py` = read-only proposal tool
2. `scripts/section_title_map.json` or `.py` constant = §4-2 の確定マップ表
3. `scripts/check_classification_test.py` or 同等の self-check（batch 1-9 raw を input にして 86/91 件再現）
4. handoff.md / current_status.md に運用手順 1 行（v3 flow §11 の前段）

実装サイズの見積もり: **~150 行 Python**（読込 / マップ照合 / report 出力 / 自己テスト）。

---

## 8. 確認待ち（user 判断ポイント）

1. **memo の方向性**: §4 の確定マップ表 + §5 の read-only proposal 方針で進めて OK か
2. **v0.1 範囲**: パターン A/B/C のみ自動、D/E は review queue 行き、で OK か
3. **次の PR**: design memo merge 後に `scripts/check_classification.py` を実装する PR を出す進行で OK か
