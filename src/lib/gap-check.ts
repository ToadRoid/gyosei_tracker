import { db } from './db';

export interface GapCheckResult {
  // manifest
  manifestTotal: number;
  manifestPages: number[];       // manifest の baseName を数値変換したもの

  // DB
  dbImportedCount: number;       // 同一 batchId で DB に入った件数
  dbAllDraftCount: number;       // DB の draft 総数

  // 欠番
  expectedMin: number;
  expectedMax: number;
  missingPages: number[];        // 連番で抜けているページ番号
  hasMissing: boolean;

  // 整合性
  manifestVsDb: 'ok' | 'mismatch'; // manifest件数 と DB import件数が一致するか
}

/**
 * manifest.json の items と DB の import結果を突き合わせて欠番・不整合を検出する
 *
 * @param manifestItems  manifest.json の items 配列
 * @param batchId        import 時に使った batchId
 */
export async function runGapCheck(
  manifestItems: { baseName: string }[],
  batchId: string,
): Promise<GapCheckResult> {
  // manifest のページ番号一覧
  const manifestPages = manifestItems
    .map((item) => parseInt(item.baseName, 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  const manifestTotal = manifestPages.length;
  const expectedMin = manifestPages[0] ?? 0;
  const expectedMax = manifestPages[manifestPages.length - 1] ?? 0;

  // 連番の期待値セットと実際の差分
  const expectedSet = new Set<number>();
  for (let i = expectedMin; i <= expectedMax; i++) expectedSet.add(i);
  const actualSet = new Set(manifestPages);
  const missingPages = [...expectedSet].filter((n) => !actualSet.has(n));

  // DB の import件数（同一batchId）
  const dbImportedCount = await db.problems
    .where('importBatchId')
    .equals(batchId)
    .count();

  // DB の draft 総数
  const dbAllDraftCount = await db.problems
    .where('status')
    .equals('draft')
    .count();

  return {
    manifestTotal,
    manifestPages,
    dbImportedCount,
    dbAllDraftCount,
    expectedMin,
    expectedMax,
    missingPages,
    hasMissing: missingPages.length > 0,
    manifestVsDb: manifestTotal === dbImportedCount ? 'ok' : 'mismatch',
  };
}

/**
 * DB に登録済みの全 sourcePage から欠番を検出する（import後の全体確認用）
 */
export async function checkAllSourcePageGaps(bookId: string): Promise<{
  pages: number[];
  missingPages: number[];
  min: number;
  max: number;
  total: number;
}> {
  const problems = await db.problems.where('sourceBook').equals(bookId).toArray();
  const pages = problems
    .map((p) => parseInt(p.sourcePage, 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  const min = pages[0] ?? 0;
  const max = pages[pages.length - 1] ?? 0;

  const expectedSet = new Set<number>();
  for (let i = min; i <= max; i++) expectedSet.add(i);
  const actualSet = new Set(pages);
  const missingPages = [...expectedSet].filter((n) => !actualSet.has(n));

  return { pages, missingPages, min, max, total: pages.length };
}
