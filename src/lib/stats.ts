import { db } from './db';
import { subjects, chapters } from '@/data/master';
import type { SubjectStats, ChapterStats } from '@/types';

export async function getSubjectStats(): Promise<SubjectStats[]> {
  const allAttrs = await db.problemAttrs.toArray();
  const allAttempts = await db.attempts.toArray();

  return subjects.map((subject) => {
    const subjectAttrs = allAttrs.filter((a) => a.subjectId === subject.id && a.isExcluded !== true && a.aiTriageStatus !== 'discard');
    const problemIds = new Set(subjectAttrs.map((a) => a.problemId));
    const subjectAttempts = allAttempts.filter((a) => problemIds.has(a.problemId));
    const correctCount = subjectAttempts.filter((a) => a.isCorrect).length;
    const attemptedProblemIds = new Set(subjectAttempts.map((a) => a.problemId));

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      totalProblems: subjectAttrs.length,
      attemptedProblems: attemptedProblemIds.size,
      correctCount,
      totalAttempts: subjectAttempts.length,
      accuracy: subjectAttempts.length > 0 ? correctCount / subjectAttempts.length : 0,
    };
  });
}

export async function getChapterStats(): Promise<ChapterStats[]> {
  const allAttrs = await db.problemAttrs.toArray();
  const allAttempts = await db.attempts.toArray();

  return chapters.map((chapter) => {
    const chapterAttrs = allAttrs.filter((a) => a.chapterId === chapter.id && a.isExcluded !== true && a.aiTriageStatus !== 'discard');
    const problemIds = new Set(chapterAttrs.map((a) => a.problemId));
    const chapterAttempts = allAttempts.filter((a) => problemIds.has(a.problemId));
    const correctCount = chapterAttempts.filter((a) => a.isCorrect).length;

    return {
      chapterId: chapter.id,
      chapterName: chapter.name,
      subjectId: chapter.subjectId,
      totalProblems: chapterAttrs.length,
      correctCount,
      totalAttempts: chapterAttempts.length,
      accuracy: chapterAttempts.length > 0 ? correctCount / chapterAttempts.length : 0,
    };
  });
}

export async function getOverallStats() {
  const readyProblems = await db.problems.where('status').equals('ready').toArray();
  const allAttrs = await db.problemAttrs.toArray();
  const attrMap = new Map(allAttrs.map((a) => [a.problemId, a]));
  const totalReady = readyProblems.filter((p) => {
    const attr = attrMap.get(p.problemId);
    return !attr || attr.isExcluded !== true;
  }).length;
  const totalDraft = await db.problems.where('status').equals('draft').count();
  const allAttempts = await db.attempts.toArray();
  const correctCount = allAttempts.filter((a) => a.isCorrect).length;
  const maxLap = allAttempts.length > 0 ? Math.max(...allAttempts.map((a) => a.lapNo)) : 0;

  return {
    totalReady,
    totalDraft,
    totalAttempts: allAttempts.length,
    correctCount,
    accuracy: allAttempts.length > 0 ? correctCount / allAttempts.length : 0,
    currentLap: maxLap,
  };
}

export async function getWeakChapters(limit = 3, minAttempts = 3): Promise<ChapterStats[]> {
  const stats = await getChapterStats();
  return stats
    .filter((s) => s.totalAttempts >= minAttempts)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}
