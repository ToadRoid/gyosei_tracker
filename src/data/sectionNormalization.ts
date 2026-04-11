/**
 * sectionNormalization.ts
 *
 * raw sectionTitle（原本の章見出し）→ displaySectionTitle（UI表示用ラベル）の変換ルール。
 *
 * 設計原則:
 *   - sectionTitle（raw）は一切変更しない
 *   - displaySectionTitle は import 時にここで計算して保存する
 *   - 曖昧な raw title（同一 raw title が複数セクションに対応する場合）は
 *     page-based split で解決する（現時点は gyosei-kokubai の「損失補償」のみ）
 *   - 将来の拡張に備え resolver は problemId も受け取れる設計にしておく
 */

/** { chapterId: { rawSectionTitle → displaySectionTitle } } */
const EXACT_MAPPING: Record<string, Record<string, string>> = {
  'gyosei-kokubai': {
    // ── 原本見出し（raw）→ 正規化ラベル ──
    '国家賠償法1条':                        '01_国家賠償法1条（要件・概念）',
    '国の損害賠償責任':                     '03_国家賠償法1条（医療・追跡・立法）',
    '02_国家賠償法2条':                     '04_国家賠償法1条（求償権・共同責任）',
    '賠償責任者、求償権':                   '06_国家賠償法2条（責任者・求償権）',
    '損失補償法':                           '05_国家賠償法2条（営造物責任）',
    '民法の適用':                           '07_国家賠償法（民法適用・相互保証）',
    '相互保証':                             '07_国家賠償法（民法適用・相互保証）',
    '取消訴訟と国家賠償請求訴訟との関係':   '08_国家賠償法と取消訴訟',
    '憲法上の請求権':                       '09_損失補償（憲法29条）',
    // ── 開発中間状態の残骸対応（DB 内に混入した旧ラベルを正規化に吸収）──
    // v37 開発中に括弧なしで取り込まれた可能性があるラベル
    '01_国家賠償法1条':                     '01_国家賠償法1条（要件・概念）',
    // 「損失補償」はページ帯で3分岐するため下の関数で処理
  },
};

/**
 * page-based split が必要な raw title を解決するルール。
 * pageRange は sourcePageQuestion（書籍ページ）ではなく
 * problemId の pXXX 部分（ファイルページ）で判定する。
 * 例: 'KB2025-p155-q01' → filePage=155
 *
 * { chapterId: { rawSectionTitle: Array<{ pageRange: [min, max]; display: string }> } }
 */
const PAGE_SPLIT_RULES: Record<
  string,
  Record<string, Array<{ pageRange: [number, number]; display: string }>>
> = {
  'gyosei-kokubai': {
    '損失補償': [
      { pageRange: [155, 156], display: '02_国家賠償法1条（外形標準説・判例）' },
      { pageRange: [160, 161], display: '05_国家賠償法2条（営造物責任）' },
      { pageRange: [164, 165], display: '09_損失補償（憲法29条）' },
    ],
  },
};

/**
 * raw sectionTitle → displaySectionTitle を解決する。
 *
 * @param chapterId          problemAttrs.chapterId（例: 'gyosei-kokubai'）
 * @param rawSectionTitle    problemAttrs.sectionTitle（原本見出し・変更不可）
 * @param sourcePageQuestion problemAttrs.sourcePageQuestion（書籍ページ番号、例: '422'）
 * @param problemId          problemId（例: 'KB2025-p155-q01'）。
 *                           page-based split のファイルページ取得に使用。
 *                           将来の追加拡張にも対応できる設計。
 * @returns displaySectionTitle。マッピングなければ rawSectionTitle をそのまま返す。
 */
export function resolveDisplaySectionTitle(
  chapterId: string,
  rawSectionTitle: string,
  sourcePageQuestion: string,
  problemId?: string,
): string {
  // 1. まず exact mapping を試みる
  const exact = EXACT_MAPPING[chapterId]?.[rawSectionTitle];
  if (exact) return exact;

  // 2. page-based split が定義されているか確認
  const splits = PAGE_SPLIT_RULES[chapterId]?.[rawSectionTitle];
  if (splits) {
    // sourcePageQuestion は書籍ページ番号のため使用しない。
    // problemId の pXXX 部分（ファイルページ）で判定する。
    // 例: 'KB2025-p155-q01' → filePage=155
    const filePageMatch = problemId?.match(/[^-]+-p(\d+)-q/);
    const filePage = filePageMatch ? parseInt(filePageMatch[1], 10) : NaN;

    if (!Number.isNaN(filePage)) {
      for (const rule of splits) {
        if (filePage >= rule.pageRange[0] && filePage <= rule.pageRange[1]) {
          return rule.display;
        }
      }
    }
    // どのページ帯にも当てはまらない場合は raw を返す（安全フォールバック）
    return rawSectionTitle;
  }

  // 3. マッピングなし → raw をそのまま返す
  return rawSectionTitle;
}
