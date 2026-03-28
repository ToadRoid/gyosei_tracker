import { db } from './db';
import { subjects, chapters } from '@/data/master';
import type { SubjectStats, ChapterStats } from '@/types';

export async function getSubjectStats(lapNo?: number): Promise<SubjectStats[]> {
  const allQuestions = await db.questions.toArray();
  const allAttempts = lapNo
    ? await db.attempts.where('lapNo').equals(lapNo).toArray()
    : await db.attempts.toArray();

  return subjects.map((subject) => {
    const subjectQuestions = allQuestions.filter(
      (q) => q.subjectId === subject.id,
    );
    const questionIds = new Set(subjectQuestions.map((q) => q.id!));
    const subjectAttempts = allAttempts.filter((a) =>
      questionIds.has(a.questionId),
    );
    const correctCount = subjectAttempts.filter((a) => a.isCorrect).length;
    const attemptedQuestionIds = new Set(
      subjectAttempts.map((a) => a.questionId),
    );

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      totalQuestions: subjectQuestions.length,
      attemptedQuestions: attemptedQuestionIds.size,
      correctCount,
      totalAttempts: subjectAttempts.length,
      accuracy:
        subjectAttempts.length > 0 ? correctCount / subjectAttempts.length : 0,
    };
  });
}

export async function getChapterStats(lapNo?: number): Promise<ChapterStats[]> {
  const allQuestions = await db.questions.toArray();
  const allAttempts = lapNo
    ? await db.attempts.where('lapNo').equals(lapNo).toArray()
    : await db.attempts.toArray();

  return chapters.map((chapter) => {
    const chapterQuestions = allQuestions.filter(
      (q) => q.chapterId === chapter.id,
    );
    const questionIds = new Set(chapterQuestions.map((q) => q.id!));
    const chapterAttempts = allAttempts.filter((a) =>
      questionIds.has(a.questionId),
    );
    const correctCount = chapterAttempts.filter((a) => a.isCorrect).length;

    return {
      chapterId: chapter.id,
      chapterName: chapter.name,
      subjectId: chapter.subjectId,
      totalQuestions: chapterQuestions.length,
      correctCount,
      totalAttempts: chapterAttempts.length,
      accuracy:
        chapterAttempts.length > 0
          ? correctCount / chapterAttempts.length
          : 0,
    };
  });
}

export async function getOverallStats() {
  const totalQuestions = await db.questions.count();
  const totalAttempts = await db.attempts.count();
  const allAttempts = await db.attempts.toArray();
  const correctCount = allAttempts.filter((a) => a.isCorrect).length;
  const maxLap =
    allAttempts.length > 0
      ? Math.max(...allAttempts.map((a) => a.lapNo))
      : 0;

  return {
    totalQuestions,
    totalAttempts,
    correctCount,
    accuracy: totalAttempts > 0 ? correctCount / totalAttempts : 0,
    currentLap: maxLap,
  };
}

export async function getWeakChapters(
  limit = 3,
  minAttempts = 3,
): Promise<ChapterStats[]> {
  const stats = await getChapterStats();
  return stats
    .filter((s) => s.totalAttempts >= minAttempts)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}
