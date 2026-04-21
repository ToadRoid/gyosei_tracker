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
 *
 * 再 import の属性継承（known_issues.md §1、CLAUDE.md §1）:
 *   - 同 problemId の既存 problemAttrs を読み、新 OCR 結果に値が無ければ既存値を継承する
 *   - 対象フィールド: subjectId / chapterId / isExcluded / needsSourceCheck（+ 付随メタ）
 *   - subjectId / chapterId の優先順: (1) 新しく確定した値 → (2) 既存 existingAttr → (3) fallback ''
 *   - isExcluded / needsSourceCheck は手動設定フラグゆえ、新 OCR では決まらない。既存値をそのまま引き継ぐ。
 *   - 空文字 '' の sentinel 禁止設計は別スコープ（fallback は '' のまま維持）。
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

/** 再取込をまたいで保全する属性 */
interface PreservedAttrs {
  subjectId?: string;
  chapterId?: string;
  isExcluded?: boolean;
  excludeReason?: string;
  excludeNote?: string;
  excludedAt?: Date;
  excludedBy?: string;
  needsSourceCheck?: boolean;
  sourceCheckNote?: string;
}

/**
 * 分類フィールド (subjectId / chapterId) の継承ルール。
 *
 * 優先順:
 *   1. 新しく確定した値（非空文字）
 *   2. 既存 problemAttrs の値（非空文字）
 *   3. fallback（既定は ''）
 *
 * 空文字 '' は「値なし」扱い。`null` / `undefined` も同様。
 * 純関数ゆえテスト容易、import-parsed.test.ts で回帰防止する。
 */
export function inheritClassificationField(
  newValue: string | null | undefined,
  existingValue: string | null | undefined,
  fallback: string = '',
): string {
  if (newValue) return newValue;
  if (existingValue) return existingValue;
  return fallback;
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

      // 削除前に既存属性を保全する（DATA_VERSION バンプで分類・フラグが消えないようにする）
      // - subjectId / chapterId: 新 OCR に候補が無いとき継承する
      // - isExcluded / needsSourceCheck: 手動設定フラグ、常に既存値を引き継ぐ
      // existing attr がある限り必ず Map に積む（旧コードのように isExcluded/needsSourceCheck 有無で
      // 条件付けすると、分類だけ持っていた既存レコードの subjectId / chapterId が拾えない）
      const preservedAttrs = new Map<string, PreservedAttrs>();
      for (const old of oldProblems) {
        const attr = await db.problemAttrs.where('problemId').equals(old.problemId).first();
        if (!attr) continue;
        preservedAttrs.set(old.problemId, {
          subjectId: attr.subjectId,
          chapterId: attr.chapterId,
          isExcluded: attr.isExcluded,
          excludeReason: attr.excludeReason,
          excludeNote: attr.excludeNote,
          excludedAt: attr.excludedAt,
          excludedBy: attr.excludedBy,
          needsSourceCheck: attr.needsSourceCheck,
          sourceCheckNote: attr.sourceCheckNote,
        });
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

        // problemAttrs に登録（既存の分類 + 手動設定フラグを引き継ぐ）
        //   subjectId / chapterId: 新 OCR 値が空なら既存値を継承（inheritClassificationField）
        //   isExcluded / needsSourceCheck: 手動設定ゆえ常に既存値を復元
        const preserved = preservedAttrs.get(problemId);
        const rawSectionTitle = branch.sectionTitle ?? '';
        const chapterId = inheritClassificationField(branch.chapterCandidate, preserved?.chapterId);
        const subjectId = inheritClassificationField(branch.subjectCandidate, preserved?.subjectId);
        const sourcePageQuestion = branch.sourcePageQuestion ?? '';
        await db.problemAttrs.add({
          problemId,
          subjectId,
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
