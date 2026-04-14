/**
 * import-parsed.ts
 *
 * llm_parse.js が生成した ParsedImport を IndexedDB に登録する。
 *
 * 動作:
 *   1. 各ページの「旧ページ単位レコード（q01）」を problems/problemAttrs から削除
 *   2. 各 branch を個別の problems + problemAttrs として INSERT
 *      - problemId: {bookId}-p{pageNo:03d}-q{seqNo:02d}
 *      - confidenceが CONFIDENCE_THRESHOLD 以上 → status='ready'
 *      - それ未満 → status='draft'（要レビュー）
 *   3. 既存 problemId（他バッチ由来など）はスキップ
 */

import { db, generateProblemId } from './db';
import type { ParsedImport, ParsedPage, ParsedBranch } from '@/types';
import { resolveDisplaySectionTitle } from '@/data/sectionNormalization';

/** このconfidence以上ならreadyに昇格 */
const CONFIDENCE_THRESHOLD = 0.75;

export interface ImportParsedResult {
  pagesProcessed: number;
  oldRecordsDeleted: number;
  branchesSaved: number;
  branchesSkipped: number;
  errorPages: number;
}

/** 再取込をまたいで保全するフラグ */
interface PreservedFlags {
  isExcluded?: boolean;
  excludeReason?: string;
  excludeNote?: string;
  excludedAt?: Date;
  excludedBy?: string;
  needsSourceCheck?: boolean;
  sourceCheckNote?: string;
}

/**
 * ParsedImport を受け取って IndexedDB に登録する。
 *
 * @param payload      stage_parsed.js が生成した pending_parsed.json の内容
 * @param onProgress   進捗コールバック (done, total)
 */
export async function importParsedBatch(
  payload: ParsedImport,
  onProgress?: (done: number, total: number) => void,
): Promise<ImportParsedResult> {
  const { bookId, pages } = payload;
  const validPages = pages.filter((p) => !p.parseError && p.branches.length > 0);

  let pagesProcessed = 0;
  let oldRecordsDeleted = 0;
  let branchesSaved = 0;
  let branchesSkipped = 0;
  let errorPages = 0;

  for (let i = 0; i < validPages.length; i++) {
    const page = validPages[i];
    onProgress?.(i, validPages.length);

    try {
      // ── 1. 旧ページ単位レコードを削除（削除前にフラグを保全） ──────────────
      const pageNo = String(parseInt(page.sourcePage, 10) || 0).padStart(3, '0');
      const oldProblems = await db.problems
        .where('sourceBook')
        .equals(bookId)
        .filter((p) => p.sourcePage === pageNo)
        .toArray();

      // 削除前に手動設定フラグを保全する（DATA_VERSION バンプで消えないようにする）
      const preservedFlags = new Map<string, PreservedFlags>();
      for (const old of oldProblems) {
        const attr = await db.problemAttrs.where('problemId').equals(old.problemId).first();
        if (attr && (attr.isExcluded !== undefined || attr.needsSourceCheck !== undefined)) {
          preservedFlags.set(old.problemId, {
            isExcluded: attr.isExcluded,
            excludeReason: attr.excludeReason,
            excludeNote: attr.excludeNote,
            excludedAt: attr.excludedAt,
            excludedBy: attr.excludedBy,
            needsSourceCheck: attr.needsSourceCheck,
            sourceCheckNote: attr.sourceCheckNote,
          });
        }
      }

      for (const old of oldProblems) {
        await db.problems.delete(old.id!);
        await db.problemAttrs.where('problemId').equals(old.problemId).delete();
        oldRecordsDeleted++;
      }

      // ── 2. 各 branch を INSERT ────────────────────────────────
      for (const branch of page.branches) {
        const problemId = generateProblemId(bookId, parseInt(pageNo, 10), branch.seqNo);

        // 念のため重複チェック
        const exists = await db.problems.where('problemId').equals(problemId).count();
        if (exists > 0) {
          branchesSkipped++;
          continue;
        }

        const isReady =
          branch.confidence >= CONFIDENCE_THRESHOLD &&
          branch.answerBoolean !== null &&
          branch.subjectCandidate &&
          branch.chapterCandidate;

        // problems に登録
        await db.problems.add({
          problemId,
          sourceBook: bookId,
          sourcePage: pageNo,
          sourceImageName: `${pageNo}.png`,
          importBatchId: payload.batchId,
          rawText: branch.questionText,
          cleanedText: branch.questionText,
          hasAnswerInImage: false,
          rawExplanationText: branch.explanationText,
          status: isReady ? 'ready' : 'draft',
          createdAt: new Date(),
        });

        // problemAttrs に登録（手動設定フラグを引き継ぐ）
        const preserved = preservedFlags.get(problemId);
        const rawSectionTitle = branch.sectionTitle ?? '';
        const chapterId = branch.chapterCandidate ?? '';
        const sourcePageQuestion = branch.sourcePageQuestion ?? '';
        await db.problemAttrs.add({
          problemId,
          subjectId: branch.subjectCandidate ?? '',
          chapterId,
          answerBoolean: branch.answerBoolean,
          aiTriageStatus: isReady ? 'ready' : 'needs_review',
          aiSubjectCandidate: branch.subjectCandidate,
          aiChapterCandidate: branch.chapterCandidate,
          aiAnswerCandidate: branch.answerBoolean,
          aiCleanedText: branch.questionText,
          aiConfidence: branch.confidence,
          sectionTitle: rawSectionTitle,           // raw: 原本見出し（変更禁止）
          displaySectionTitle: resolveDisplaySectionTitle(
            chapterId,
            rawSectionTitle,
            sourcePageQuestion,
            problemId,
          ),
          sourcePageQuestion,
          sourcePageAnswer: branch.sourcePageAnswer ?? '',
          // フラグ保全: 削除前に読み取った手動設定値を復元する
          isExcluded: preserved?.isExcluded,
          excludeReason: preserved?.excludeReason,
          excludeNote: preserved?.excludeNote,
          excludedAt: preserved?.excludedAt,
          excludedBy: preserved?.excludedBy,
          needsSourceCheck: preserved?.needsSourceCheck,
          sourceCheckNote: preserved?.sourceCheckNote,
        });

        branchesSaved++;
      }

      pagesProcessed++;
    } catch {
      errorPages++;
    }
  }

  onProgress?.(validPages.length, validPages.length);

  return {
    pagesProcessed,
    oldRecordsDeleted,
    branchesSaved,
    branchesSkipped,
    errorPages,
  };
}
