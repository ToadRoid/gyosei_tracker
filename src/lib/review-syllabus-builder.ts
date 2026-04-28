import { subjects, chapters } from '@/data/master';
import type {
  WeakTopicInput,
  WrongExample,
  QuestionExample,
} from '@/types/review-pack';

const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
const chapterMap = new Map(chapters.map((c) => [c.id, c.name]));
const subjectOrderMap = new Map(subjects.map((s) => [s.id, s.order ?? 9999]));
const chapterOrderMap = new Map(chapters.map((c) => [c.id, c.order ?? 9999]));

type GroupKey = string;

interface GroupData {
  subjectId: string;
  chapterId: string;
  sectionTitle: string;
  problemIds: Set<string>;
  totalAttempts: number;
  correctCount: number;
  pageRefQuestion: string;
  pageRefAnswer: string;
  byLap: Map<number, { attempts: number; correct: number }>;
  recentWrong: { problemId: string; userAnswer: boolean; answeredAt: Date }[];
  allAttempts: {
    problemId: string;
    userAnswer: boolean;
    isCorrect: boolean;
    answeredAt: Date;
    responseTimeSec: number;
  }[];
}

function timeOf(value: Date | number | string | undefined): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return new Date(value).getTime();
  return 0;
}

/**
 * 教材順レビュー用の topic を生成する。
 *
 * 既存 review-pack-builder.ts は弱点順専用のため変更しない。
 * ここでは attempts >= 1 の section を対象にし、master.ts の subject/chapter order と
 * sectionTitle の安定ソートで教材順に並べる。
 */
export async function buildSyllabusReviewTopics(): Promise<WeakTopicInput[]> {
  const { db } = await import('@/lib/db');

  const allAttempts = await db.attempts.toArray();
  const allAttrs = await db.problemAttrs.toArray();
  const allProblems = await db.problems.toArray();

  const attrMap = new Map(allAttrs.map((a) => [a.problemId, a]));
  const problemMap = new Map(allProblems.map((p) => [p.problemId, p]));

  const groups = new Map<GroupKey, GroupData>();

  for (const attempt of allAttempts) {
    const attr = attrMap.get(attempt.problemId);
    if (!attr) continue;
    if (attr.isExcluded === true || attr.needsSourceCheck === true || attr.aiTriageStatus === 'discard') continue;

    const subjectId = attr.subjectId ?? '';
    const chapterId = attr.chapterId ?? '';
    const sectionTitle = attr.sectionTitle ?? '';

    if (!sectionTitle) continue;

    const key: GroupKey = `${subjectId}||${chapterId}||${sectionTitle}`;

    if (!groups.has(key)) {
      groups.set(key, {
        subjectId,
        chapterId,
        sectionTitle,
        problemIds: new Set(),
        totalAttempts: 0,
        correctCount: 0,
        pageRefQuestion: attr.sourcePageQuestion ?? '',
        pageRefAnswer: attr.sourcePageAnswer ?? '',
        byLap: new Map(),
        recentWrong: [],
        allAttempts: [],
      });
    }

    const group = groups.get(key)!;
    group.problemIds.add(attempt.problemId);
    group.totalAttempts += 1;
    if (attempt.isCorrect) group.correctCount += 1;

    if (!group.pageRefQuestion && attr.sourcePageQuestion) {
      group.pageRefQuestion = attr.sourcePageQuestion;
    }
    if (!group.pageRefAnswer && attr.sourcePageAnswer) {
      group.pageRefAnswer = attr.sourcePageAnswer;
    }

    const lapNo = attempt.lapNo;
    if (!group.byLap.has(lapNo)) {
      group.byLap.set(lapNo, { attempts: 0, correct: 0 });
    }
    const lapData = group.byLap.get(lapNo)!;
    lapData.attempts += 1;
    if (attempt.isCorrect) lapData.correct += 1;

    group.allAttempts.push({
      problemId: attempt.problemId,
      userAnswer: attempt.userAnswer,
      isCorrect: attempt.isCorrect,
      answeredAt: attempt.answeredAt,
      responseTimeSec: attempt.responseTimeSec,
    });

    if (!attempt.isCorrect) {
      group.recentWrong.push({
        problemId: attempt.problemId,
        userAnswer: attempt.userAnswer,
        answeredAt: attempt.answeredAt,
      });
    }
  }

  const rankedTopics: {
    subjectOrder: number;
    chapterOrder: number;
    sectionTitle: string;
    topic: WeakTopicInput;
  }[] = [];

  for (const group of groups.values()) {
    if (group.totalAttempts < 1) continue;

    const subjectName = subjectMap.get(group.subjectId) ?? group.subjectId;
    const chapterName = chapterMap.get(group.chapterId) ?? group.chapterId;
    const accuracy = group.totalAttempts > 0 ? group.correctCount / group.totalAttempts : 0;

    const lapStats = Array.from(group.byLap.entries())
      .sort(([a], [b]) => a - b)
      .map(([lapNo, data]) => ({
        lapNo,
        attempts: data.attempts,
        accuracy: data.attempts > 0 ? data.correct / data.attempts : 0,
      }));

    const candidateProblemIds = Array.from(group.problemIds);

    const wrongExamples: WrongExample[] = group.recentWrong
      .sort((a, b) => timeOf(b.answeredAt) - timeOf(a.answeredAt))
      .slice(0, 3)
      .map((w) => {
        const attr = attrMap.get(w.problemId);
        const problem = problemMap.get(w.problemId);
        const rawExp = problem?.rawExplanationText ?? '';
        const expText =
          attr?.explanationText ??
          (rawExp.startsWith('[解説読取困難') ? '' : rawExp);

        return {
          questionText: problem?.cleanedText ?? problem?.rawText ?? '',
          correctAnswer: attr?.answerBoolean ?? false,
          userAnswer: w.userAnswer,
          explanationSnippet: expText.slice(0, 120),
          pageRefQuestion: attr?.sourcePageQuestion ?? '',
          pageRefAnswer: attr?.sourcePageAnswer ?? '',
        };
      });

    const latestByProblem = new Map<string, typeof group.allAttempts[number]>();
    for (const a of group.allAttempts) {
      const existing = latestByProblem.get(a.problemId);
      if (!existing || timeOf(a.answeredAt) > timeOf(existing.answeredAt)) {
        latestByProblem.set(a.problemId, a);
      }
    }

    const questionExamples: QuestionExample[] = Array.from(latestByProblem.values())
      .sort((a, b) => timeOf(b.answeredAt) - timeOf(a.answeredAt))
      .slice(0, 10)
      .map((a) => {
        const attr = attrMap.get(a.problemId);
        const problem = problemMap.get(a.problemId);
        const rawExp = problem?.rawExplanationText ?? '';
        const expText =
          attr?.explanationText ??
          (rawExp.startsWith('[解説読取困難') ? '' : rawExp);

        return {
          problemId: a.problemId,
          questionText: problem?.cleanedText ?? problem?.rawText ?? '',
          correctAnswer: attr?.answerBoolean ?? false,
          userAnswer: a.userAnswer,
          isCorrect: a.isCorrect,
          explanationText: expText,
          responseTimeSec: a.responseTimeSec,
          pageRefQuestion: attr?.sourcePageQuestion ?? '',
          pageRefAnswer: attr?.sourcePageAnswer ?? '',
        };
      });

    rankedTopics.push({
      subjectOrder: subjectOrderMap.get(group.subjectId) ?? 9999,
      chapterOrder: chapterOrderMap.get(group.chapterId) ?? 9999,
      sectionTitle: group.sectionTitle,
      topic: {
        subjectName,
        chapterName,
        sectionTitle: group.sectionTitle,
        accuracy,
        totalAttempts: group.totalAttempts,
        correctCount: group.correctCount,
        lapStats,
        improvement: null,
        pageRefQuestion: group.pageRefQuestion,
        pageRefAnswer: group.pageRefAnswer,
        candidateProblemIds,
        wrongExamples,
        questionExamples,
      },
    });
  }

  return rankedTopics
    .sort((a, b) => {
      if (a.subjectOrder !== b.subjectOrder) return a.subjectOrder - b.subjectOrder;
      if (a.chapterOrder !== b.chapterOrder) return a.chapterOrder - b.chapterOrder;
      return a.sectionTitle.localeCompare(b.sectionTitle, 'ja');
    })
    .map((r) => r.topic);
}
