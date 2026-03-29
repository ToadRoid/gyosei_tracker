/**
 * import-batch.ts
 *
 * manifest.json の内容を受け取り IndexedDB に一括登録する純粋関数。
 * UI（フォルダ選択ダイアログ）に依存しないため、
 * ブラウザ上の自動取込・手動取込どちらからでも呼べる。
 */

import { db, generateProblemId } from './db';
import { runGapCheck, type GapCheckResult } from './gap-check';

export interface ManifestItem {
  baseName: string;
  imageFile: string | null;
  textFile: string;
  ocrText: string;
  isEmpty: boolean;
}

export interface Manifest {
  batchId: string;
  createdAt: string;
  totalItems: number;
  emptyItems?: number;
  items: ManifestItem[];
}

export interface ImportResult {
  batchId: string;
  saved: number;
  skipped: number;
  gapCheck: GapCheckResult;
}

/**
 * manifest + bookId を受け取って problems テーブルに upsert する。
 * 重複（同一 problemId）はスキップ。
 *
 * @param manifest  ocr_batch.sh が生成した manifest オブジェクト
 * @param bookId    "KB2025" など
 * @param onProgress  進捗コールバック（省略可）
 */
export async function importBatch(
  manifest: Manifest,
  bookId: string,
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const bid = manifest.batchId;
  const validItems = manifest.items.filter((item) => !item.isEmpty && item.ocrText.trim());
  let saved = 0;
  let skipped = 0;

  for (let i = 0; i < validItems.length; i++) {
    const item = validItems[i];
    const text = item.ocrText.trim();
    if (!text) {
      skipped++;
    } else {
      const pageNo = parseInt(item.baseName, 10) || (i + 1);
      const problemId = generateProblemId(bookId, pageNo);

      const exists = await db.problems.where('problemId').equals(problemId).count();
      if (exists === 0) {
        await db.problems.add({
          problemId,
          sourceBook: bookId,
          sourcePage: String(pageNo).padStart(3, '0'),
          sourceImageName: item.imageFile ?? item.baseName,
          importBatchId: bid,
          rawText: text,
          cleanedText: text,
          status: 'draft',
          createdAt: new Date(),
        });
        saved++;
      } else {
        skipped++;
      }
    }

    onProgress?.(i + 1, validItems.length);
  }

  const gapCheck = await runGapCheck(manifest.items, bid);

  return { batchId: bid, saved, skipped, gapCheck };
}
