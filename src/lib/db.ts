import Dexie, { type EntityTable } from 'dexie';
import type { Problem, ProblemAttr, Attempt, ProblemForExercise } from '@/types';
import { supabase } from './supabase';

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

  // Supabaseにも保存（ログイン中のみ・失敗してもローカルには影響しない）
  syncAttemptToSupabase(data).catch(() => {});
}

async function syncAttemptToSupabase(data: Omit<Attempt, 'id'>): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('attempts').upsert({
    user_id: user.id,
    problem_id: data.problemId,
    lap_no: data.lapNo,
    user_answer: data.userAnswer,
    is_correct: data.isCorrect,
    response_time_sec: data.responseTimeSec,
    answered_at: data.answeredAt.toISOString(),
  }, { onConflict: 'user_id,problem_id,lap_no' });
}

/**
 * 演習用: ready な Problem + ProblemAttr を結合して返す
 */
export async function getReadyProblems(
  subjectId?: string,
  chapterId?: string,
  sectionTitle?: string,
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
      if (sectionTitle && (attr.sectionTitle ?? '') !== sectionTitle) return null;
      return {
        ...p,
        answerBoolean: attr.answerBoolean as boolean,
        explanationText: (() => {
          const t = p.rawExplanationText ?? '';
          return t.startsWith('[解説読取困難') ? '' : t;
        })(),
        subjectId: attr.subjectId,
        chapterId: attr.chapterId,
        sectionTitle: attr.sectionTitle ?? undefined,
        sourcePageQuestion: attr.sourcePageQuestion ?? undefined,
        sourcePageAnswer: attr.sourcePageAnswer ?? undefined,
        questionType: attr.questionType ?? undefined,
      } as ProblemForExercise;
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

/**
 * データクリーンアップ v3
 * ─────────────────────────────────────────────────────────
 * 問題データ修正に伴う attempt の整合性を保つ。
 * 各パッチは localStorage フラグで1回だけ実行される。
 *
 * 新しい修正があった場合は PATCHES 配列に追加するだけでよい。
 */

interface CleanupPatch {
  key: string;               // localStorage キー（ユニークにする）
  deleteLap1: string[];       // lap1 の attempt を削除する problemId 一覧
  deleteAllAttempts: string[]; // 全 attempt を削除する problemId 一覧（未回答状態に戻す）
  recalcCorrect: {            // isCorrect を再計算する problemId と正解
    problemId: string;
    correctAnswer: boolean;
  }[];
}

const PATCHES: CleanupPatch[] = [
  // v2: 2026-04-05 セクション04 問題データ修正
  {
    key: 'cleanup_2026-04-05_v2',
    deleteAllAttempts: [],
    deleteLap1: [
      'KB2025-p133-q01',
      'KB2025-p134-q01', 'KB2025-p134-q02', 'KB2025-p134-q03',
      'KB2025-p134-q04', 'KB2025-p134-q05', 'KB2025-p134-q06', 'KB2025-p134-q07',
      'KB2025-p135-q06', 'KB2025-p135-q07',
      'KB2025-p136-q03',
    ],
    recalcCorrect: [],
  },
  // v3: 2026-04-05 p138-q05 answerBoolean 修正 (false→true)
  {
    key: 'cleanup_2026-04-05_v3_p138q05',
    deleteAllAttempts: [],
    deleteLap1: [],
    recalcCorrect: [
      { problemId: 'KB2025-p138-q05', correctAnswer: true },
    ],
  },
  // v3b: 2026-04-05 p138-q02 第三者効 answerBoolean 修正 (false→true)
  {
    key: 'cleanup_2026-04-05_v3b_p138q02',
    deleteAllAttempts: [],
    deleteLap1: [],
    recalcCorrect: [
      { problemId: 'KB2025-p138-q02', correctAnswer: true },
    ],
  },
  // v3c: 2026-04-05 p141-q04 再審の訴え answerBoolean 修正 (false→true)
  {
    key: 'cleanup_2026-04-05_v3c_p141q04',
    deleteAllAttempts: [],
    deleteLap1: [],
    recalcCorrect: [
      { problemId: 'KB2025-p141-q04', correctAnswer: true },
    ],
  },
  // v4: 2026-04-05 p139-p140 正誤逆転・架空問題修正 → 全attempt削除して未回答に戻す
  {
    key: 'cleanup_2026-04-05_v4_p139_p140',
    deleteLap1: [],
    deleteAllAttempts: [
      // p139 q5,q6: 正誤逆転していたため回答ログ削除
      'KB2025-p139-q05', 'KB2025-p139-q06',
      // p140 q4-q8: 架空問題だったため全削除
      'KB2025-p140-q04', 'KB2025-p140-q05', 'KB2025-p140-q06',
      'KB2025-p140-q07', 'KB2025-p140-q08',
    ],
    recalcCorrect: [],
  },
  // ─── 今後の修正はここに追加 ───
];

export async function runOneTimeCleanup(): Promise<void> {
  if (typeof window === 'undefined') return;

  let totalDeleted = 0;
  let totalFixed = 0;

  for (const patch of PATCHES) {
    if (localStorage.getItem(patch.key)) continue;

    // 0. 全 attempt 削除（未回答状態に戻す）
    for (const pid of patch.deleteAllAttempts ?? []) {
      const all = await db.attempts
        .where('problemId')
        .equals(pid)
        .toArray();
      for (const a of all) {
        if (a.id !== undefined) {
          await db.attempts.delete(a.id);
          totalDeleted++;
        }
      }
    }

    // 1. lap1 削除
    for (const pid of patch.deleteLap1) {
      const found = await db.attempts
        .where('[problemId+lapNo]')
        .equals([pid, 1])
        .first();
      if (found?.id !== undefined) {
        await db.attempts.delete(found.id);
        totalDeleted++;
      }
    }

    // 2. isCorrect 再計算
    for (const { problemId, correctAnswer } of patch.recalcCorrect) {
      const attempts = await db.attempts
        .where('problemId')
        .equals(problemId)
        .toArray();
      for (const attempt of attempts) {
        const shouldBeCorrect = attempt.userAnswer === correctAnswer;
        if (attempt.isCorrect !== shouldBeCorrect && attempt.id !== undefined) {
          await db.attempts.update(attempt.id, { isCorrect: shouldBeCorrect });
          totalFixed++;
        }
      }
    }

    localStorage.setItem(patch.key, new Date().toISOString());
  }

  if (totalDeleted > 0 || totalFixed > 0) {
    console.log(`[cleanup] Deleted ${totalDeleted} stale attempts, fixed ${totalFixed} isCorrect values.`);
  }
}
