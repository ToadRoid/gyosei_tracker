import Dexie, { type EntityTable } from 'dexie';
import type { Problem, ProblemAttr, Attempt, ProblemForExercise } from '@/types';

class GyoseiDB extends Dexie {
  problems!: EntityTable<Problem, 'id'>;
  problemAttrs!: EntityTable<ProblemAttr, 'id'>;
  attempts!: EntityTable<Attempt, 'id'>;

  constructor() {
    super('gyosei_tracker');

    // v1〜v4: 旧スキーマ（questions / imports ベース）
    this.version(1).stores({
      subjects: 'id, order',
      chapters: 'id, subjectId, order',
      questions: '++id, subjectId, chapterId, createdAt',
      attempts: '++id, questionId, lapNo, answeredAt',
      imports: '++id, status, importedAt',
    });
    this.version(2).stores({
      subjects: null,
      chapters: null,
      questions: '++id, subjectId, chapterId, createdAt',
      attempts: '++id, questionId, lapNo, answeredAt',
      imports: '++id, status, importedAt',
    });
    this.version(3).stores({
      questions: '++id, subjectId, chapterId, createdAt',
      attempts: '++id, questionId, lapNo, [questionId+lapNo], answeredAt',
      imports: '++id, status, importedAt',
    });
    this.version(4).stores({
      questions: '++id, subjectId, chapterId, status, needsReview, importance, year, createdAt',
      attempts: '++id, questionId, lapNo, [questionId+lapNo], answeredAt',
      imports: '++id, status, importedAt',
    }).upgrade((tx) =>
      tx.table('questions').toCollection().modify((q) => {
        if (!q.status) q.status = 'ready';
        if (q.answerBoolean === undefined) q.answerBoolean = null;
      }),
    );

    // v5: 3テーブル分離
    //   - questions / imports → 廃止
    //   - problems / problemAttrs / attempts（新） → 追加
    this.version(5).stores({
      questions: null,
      imports: null,
      problems: '++id, &problemId, sourceBook, importBatchId, status, createdAt',
      problemAttrs: '++id, &problemId, subjectId, chapterId, aiTriageStatus',
      attempts: '++id, problemId, lapNo, [problemId+lapNo], answeredAt',
    });
  }
}

export const db = new GyoseiDB();

// ── helpers ───────────────────────────────────────────

/**
 * problemAttrs を upsert（problemId で既存確認→update or insert）
 */
export async function upsertProblemAttr(
  problemId: string,
  changes: Partial<Omit<ProblemAttr, 'id' | 'problemId'>>,
): Promise<void> {
  const existing = await db.problemAttrs.where('problemId').equals(problemId).first();
  if (existing?.id !== undefined) {
    await db.problemAttrs.update(existing.id, changes);
  } else {
    await db.problemAttrs.add({
      problemId,
      subjectId: '',
      chapterId: '',
      answerBoolean: null,
      ...changes,
    });
  }
}

/**
 * attempt を upsert（同一problemId+lapNOは上書き）
 */
export async function upsertAttempt(data: Omit<Attempt, 'id'>): Promise<void> {
  const existing = await db.attempts
    .where('[problemId+lapNo]')
    .equals([data.problemId, data.lapNo])
    .first();

  if (existing?.id !== undefined) {
    await db.attempts.update(existing.id, {
      userAnswer: data.userAnswer,
      isCorrect: data.isCorrect,
      responseTimeSec: data.responseTimeSec,
      answeredAt: data.answeredAt,
    });
  } else {
    await db.attempts.add(data);
  }
}

/**
 * 演習用: ready な Problem + ProblemAttr を結合して返す
 */
export async function getReadyProblems(
  subjectId?: string,
  chapterId?: string,
): Promise<ProblemForExercise[]> {
  const readyProblems = await db.problems.where('status').equals('ready').toArray();
  const allAttrs = await db.problemAttrs.toArray();
  const attrMap = new Map(allAttrs.map((a) => [a.problemId, a]));

  return readyProblems
    .map((p) => {
      const attr = attrMap.get(p.problemId);
      if (!attr || attr.answerBoolean === null || attr.answerBoolean === undefined) return null;
      if (subjectId && attr.subjectId !== subjectId) return null;
      if (chapterId && attr.chapterId !== chapterId) return null;
      return {
        ...p,
        answerBoolean: attr.answerBoolean as boolean,
        subjectId: attr.subjectId,
        chapterId: attr.chapterId,
      };
    })
    .filter((p): p is ProblemForExercise => p !== null);
}

/**
 * problemId 生成
 * format: {bookId}-p{pageNo:03d}-q{seq:02d}
 * e.g. "KB2025-p001-q01"
 */
export function generateProblemId(bookId: string, pageNo: number, seq = 1): string {
  const page = String(pageNo).padStart(3, '0');
  const q = String(seq).padStart(2, '0');
  return `${bookId}-p${page}-q${q}`;
}
