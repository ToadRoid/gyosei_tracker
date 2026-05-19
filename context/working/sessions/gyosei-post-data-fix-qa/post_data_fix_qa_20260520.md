# Post data-fix QA — PR #171 / #172 / #173 merge 後

date: 2026-05-20
target commits:
- PR #171 merge: `4f8466e` (P0 answerBoolean 4件)
- PR #172 merge: `7cfa445` (P1 textual 3件)
- PR #173 merge: `b676c28` (時効 #1 E micro-patch)

base: origin/main `b676c28`
DATA_VERSION (code): `2026-05-19-jikou-e-micro-fix-c1`

---

## 1. QA 環境

| 項目 | 値 |
|---|---|
| dev server | `scripts/dev.sh` 経由（preview MCP server） |
| port | 3001 |
| URL | http://localhost:3001/ |
| ブラウザ | preview MCP（Chromium-based、未ログイン状態） |
| OS | macOS |

---

## 2. 確認した URL / 画面

| URL | 結果 |
|---|---|
| `/`（ルート） | HTTP 200、ログイン画面が表示される（`/login` 相当の認証画面） |
| `/exercise` | **BLOCKED — 認証必須**（preview MCP は未ログイン、過去セッションと同じ blocker） |
| `/review` | **BLOCKED — 認証必須**（同上） |
| `/data/reviewed_import.json` | HTTP 200、JSON 取得成功、内容を data-layer QA に使用 |

→ アプリ起動・ルーティング・public data 配信は **PASS**。
→ `/exercise` / `/review` の **画面表示 QA は login wall により blocked**。

---

## 3. IndexedDB / DATA_VERSION 更新挙動

| 項目 | 結果 |
|---|---|
| `DATA_VERSION` 定数（`src/lib/db.ts:1165`） | `2026-05-19-jikou-e-micro-fix-c1`（最新 merge 後の値、code 上で確認済み） |
| `refreshProblemDataIfNeeded` 関数の存在 | OK（同 ts 内に定義あり、`DATA_VERSION_KEY` を localStorage 経由で比較） |
| 既存ユーザーの次回ログイン時 re-import trigger | **想定上 PASS**（DATA_VERSION 不一致で `refreshProblemDataIfNeeded` が走り、新 data 反映） |
| 未ログイン状態での IndexedDB 実体確認 | **BLOCKED**（AuthProvider 経由でないと triggered されない） |

→ DATA_VERSION の **コード設定は PASS**、実際の IndexedDB 反映は **ログイン後検証必須**。

---

## 4. 各対象 record の確認結果（data-layer 経由）

`fetch('/data/reviewed_import.json')` で取得した実 JSON に対して、各 PR の patch 後の期待値が反映されているか確認。

| # | target | PR | expected answerBoolean | expected text probe | 結果 |
|---|---|---|---|---|---|
| 1 | KB2025-p247-q01 seq=1 | #171 | true | E に「大連判明41.12.15」 | **PASS** |
| 2 | KB2025-p247-q01 seq=3 | #172 | true | E に「制限説・大連判明41.12.15」 | **PASS** |
| 3 | KB2025-p247-q01 seq=4 | #171 | true | Q に「丙が乙から土地を購入」 | **PASS** |
| 4 | KB2025-p249-q01 seq=1 | #171 | true | E に「最判平18.1.17」 | **PASS** |
| 5 | KB2025-p249-q01 seq=2 | #171 | true | Q に「起算点を自由に選択」 | **PASS** |
| 6 | KB2025-p249-q01 seq=3 | #172 | false | E に「最判昭36.7.20」 | **PASS** |
| 7 | KB2025-p249-q01 seq=4 | #172 | true | Q に「抵当権設定登記」 | **PASS** |
| 8 | KB2025-p240-q01 seq=1 | #173 | true | E に「民法145条かっこ書」 | **PASS** |

### 全体メトリクス（public JSON 経由）

| 項目 | 値 | 期待値 | 結果 |
|---|---|---|---|
| branch count | 2448 | 2448 | **PASS** |
| answerBoolean true | 1140 | 1140 | **PASS** |
| answerBoolean false | 1308 | 1308 | **PASS** |

---

## 5. 結論: **PARTIAL PASS**

### PASS 項目（10 件）

1. アプリ起動 / ルーティング
2. public/data/reviewed_import.json の HTTP 配信
3. branch count 不変（2448）
4. answerBoolean count 正常（true:1140 / false:1308）
5. 8 対象 record すべて answerBoolean + text probe match
6. DATA_VERSION 定数の更新（`2026-05-19-jikou-e-micro-fix-c1`）
7. `refreshProblemDataIfNeeded` の存在確認
8. data/public 同期は merge 時に検証済み
9. 過去 patch（#159, #160, #166, PR171×4, PR172×3）すべて維持
10. JSON parse 健全

### BLOCKED 項目（login 必須、本 QA で確認不可）

1. `/exercise` 物権変動と登記 8件の実画面表示
2. `/review` の弱点ダッシュボード表示
3. ログイン後の `refreshProblemDataIfNeeded` 実行と localStorage 更新
4. ユーザー視点の正誤判定（answerBoolean 反映後の動作）
5. PR #161 参考書順 sort + PR #162 padding density の体感

これらは **user が認証済みブラウザで手動確認する必要がある**。

### FAIL 項目

なし。

---

## 6. NG / 再現手順

NG なし。BLOCKED 項目について、ユーザー側の確認手順:

1. ログイン済みブラウザで `https://gyosei-tracker.<vercel-preview>.vercel.app/` を開く
2. 初回アクセス時にコンソールで `[data-refresh]` ログが出ること（DATA_VERSION 更新の確認）
3. `/exercise` を開き、民法 > 物権 > 02_物権変動と登記 配下の 4 件（p.247 seq=1, 4 / p.249 seq=1, 2）の正答が **○** で出題されることを確認
4. 同 section の他 4 件（seq=2, 3 / p.249 seq=3, 4）の Q/E に旧 OCR崩れが残っていないことを確認
5. 民法 > 総則 > 06_時効 の問題1 (KB2025-p240-q01 seq=1) の E に「民法145条かっこ書」が表示されることを確認

---

## 7. next action

| 優先 | アクション | 担当 |
|---|---|---|
| 高 | ログイン済みブラウザで /exercise QA（上記 §6 手順） | user |
| 中 | 残 caveated（時効 #1 Q中央部、時効 #2 全体、#4/#5 E中央部、#6 E判例日付）の物理書籍確認 | user |
| 中 | 物権 taxonomy normalization Phase 1（images 0251-0285 捕捉） | 別タスク |
| 低 | 他 chapter の OCR mapping audit 継続 | 別タスク |

---

## 8. 検証

| 項目 | 結果 |
|---|---|
| `git status -sb` | clean（本 QA 後、本 doc のみ untracked） |
| `git diff --check` | clean |
| 変更ファイル | docs-only 1件（本 MD） |
| data/public/src 差分 | なし |
| `stash@{0}` | 残存 |

---

本 doc は QA 記録 docs-only。data/code 変更なし。
