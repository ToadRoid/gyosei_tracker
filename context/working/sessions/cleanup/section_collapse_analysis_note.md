# Section collapse analysis note

## Source

- Original artifact: `data/section_collapse_analysis.json`
- Generated around 2026-04-12 (file mtime), untracked.
- Dataset: approximately 1,278 problems (stale — current reviewed import is 2,448 branches).
- Treat as historical signal only, not current source-of-truth.

## Findings: sectionTitle normalization candidates

`collapseScore` = singletonCount × singletonRatio. Higher score means more fragmented sectionTitle distribution within that chapter.

| priority | chapterId          | displayName          | problems | sections | singletons | collapseScore | needsNormalization |
|----------|--------------------|----------------------|----------|----------|------------|---------------|--------------------|
| P1       | gyosei-ippan       | 行政法の一般的な法理論 | 270      | 54       | 18         | 18.0          | yes                |
| P2       | gyosei-chiho       | 地方自治法            | 245      | 53       | 9          | 9.0           | yes                |
| P3       | minpo-sosoku       | 総則                  | 168      | 29       | 8          | 8.0           | yes                |
| P4       | gyosei-jiken       | 行政事件訴訟法        | 150      | 29       | 7          | 7.0           | yes                |
| P5       | kenpo-tochi        | 統治                  | 100      | 23       | 5          | 5.0           | yes                |
| P6       | gyosei-fufuku      | 行政不服審査法        | 129      | 21       | 4          | 4.0           | yes                |
| —        | gyosei-tetsuzuki   | 行政手続法            | 144      | 18       | 1          | 1.0           | no (low singleton) |
| —        | kenpo-jinken       | 人権                  | 1        | 1        | 1          | 1.0           | no (data too thin) |
| —        | minpo-bukken       | 物権                  | 19       | 4        | 1          | 1.0           | no                 |
| done     | gyosei-kokubai     | 国家賠償法・損失補償  | 52       | 10       | 0          | 0.0           | done               |

## Interpretation

- `gyosei-ippan`、`gyosei-chiho`、`minpo-sosoku` の3チャプターが最優先候補。
- singletonSection（問題が1件しかないセクション）が多いほど、UI上でセクションツリーが細かく分散しやすい。
- `gyosei-kokubai` は正規化済み（`needsNormalization: "done"`）。
- データが当時の約1,278問ベースのため、現行の約2,448問では比率・スコアが変動している可能性がある。将来 sectionTitle 正規化作業に着手する際は、現行データセットで再計算すること。

## Cleanup decision

- 旧 JSON artifact は分析時点の snapshot であり、進行中の正式データではない。
- 知見をこのノートに移行した後、`data/section_collapse_analysis.json`（untracked）を削除した。
- reviewed_import.json、public/data、src、tracked QA draft ファイルへの変更はなし。
