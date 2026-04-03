import { db } from '@/lib/db';
import { subjects, chapters } from '@/data/master';

export interface SectionStats {
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  sectionTitle: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number; // 0–1
  problemCount: number; // unique problemIds
  pageRef: string; // sourcePageAnswer ?? sourcePageQuestion ?? ''
  lapStats: { lapNo: number; attempts: number; correct: number; accuracy: number }[];
  improvement: number | null; // lap2.accuracy - lap1.accuracy (null if only 1 lap)
  searchKeyword: string; // e.g. "行政不服審査法 教示制度 解説"
  priority: 'high' | 'medium' | 'low';
  comment: string;
}

export interface ReviewPack {
  generatedAt: Date;
  totalAttempts: number;
  totalProblems: number;
  weakSections: SectionStats[]; // top 3–5 by lowest accuracy (min 3 attempts)
  overallAccuracy: number;
  overallComment: string;
}

function resolveComment(
  totalAttempts: number,
  accuracy: number,
  improvement: number | null,
): string {
  if (totalAttempts < 5) return 'まだ演習回数が少ないため、追加演習が必要です';
  if (accuracy < 0.4) return '基本事項の再確認が必要です';
  if (improvement !== null && improvement < 0.1 && improvement >= -0.05) {
    return '同じ論点で繰り返し誤答しています';
  }
  if (improvement !== null && improvement < 0) {
    return '直近の周回で正答率が下がっています。要注意です';
  }
  if (accuracy >= 0.8) return 'よく理解できています。維持しましょう';
  return '継続して演習を続けましょう';
}

function resolvePriority(accuracy: number): 'high' | 'medium' | 'low' {
  if (accuracy < 0.4) return 'high';
  if (accuracy < 0.6) return 'medium';
  return 'low';
}

export async function buildReviewPack(): Promise<ReviewPack> {
  const allAttempts = await db.attempts.toArray();
  const allAttrs = await db.problemAttrs.toArray();

  if (allAttempts.length === 0) {
    return {
      generatedAt: new Date(),
      totalAttempts: 0,
      totalProblems: 0,
      weakSections: [],
      overallAccuracy: 0,
      overallComment: 'まだ回答履歴がありません。演習を始めましょう',
    };
  }

  // Build attr lookup
  const attrMap = new Map(allAttrs.map((a) => [a.problemId, a]));

  // Build subject/chapter name lookups
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const chapterMap = new Map(chapters.map((c) => [c.id, { name: c.name, subjectId: c.subjectId }]));

  // Group attempts by (subjectId, chapterId, sectionTitle)
  type GroupKey = string;
  interface GroupData {
    subjectId: string;
    chapterId: string;
    sectionTitle: string;
    problemIds: Set<string>;
    totalAttempts: number;
    correctCount: number;
    pageRef: string;
    byLap: Map<number, { attempts: number; correct: number }>;
  }

  const groups = new Map<GroupKey, GroupData>();

  for (const attempt of allAttempts) {
    const attr = attrMap.get(attempt.problemId);
    if (!attr) continue;

    const subjectId = attr.subjectId ?? '';
    const chapterId = attr.chapterId ?? '';
    const sectionTitle = attr.sectionTitle ?? '';
    const key: GroupKey = `${subjectId}||${chapterId}||${sectionTitle}`;

    if (!groups.has(key)) {
      groups.set(key, {
        subjectId,
        chapterId,
        sectionTitle,
        problemIds: new Set(),
        totalAttempts: 0,
        correctCount: 0,
        pageRef: attr.sourcePageAnswer ?? attr.sourcePageQuestion ?? '',
        byLap: new Map(),
      });
    }

    const group = groups.get(key)!;
    group.problemIds.add(attempt.problemId);
    group.totalAttempts += 1;
    if (attempt.isCorrect) group.correctCount += 1;

    // pageRef: prefer sourcePageAnswer
    if (!group.pageRef) {
      group.pageRef = attr.sourcePageAnswer ?? attr.sourcePageQuestion ?? '';
    }

    // Lap stats
    const lapNo = attempt.lapNo;
    if (!group.byLap.has(lapNo)) {
      group.byLap.set(lapNo, { attempts: 0, correct: 0 });
    }
    const lapData = group.byLap.get(lapNo)!;
    lapData.attempts += 1;
    if (attempt.isCorrect) lapData.correct += 1;
  }

  // Build SectionStats array
  const allSections: SectionStats[] = [];

  for (const group of groups.values()) {
    const accuracy = group.totalAttempts > 0 ? group.correctCount / group.totalAttempts : 0;

    // Lap stats sorted
    const lapStats = Array.from(group.byLap.entries())
      .sort(([a], [b]) => a - b)
      .map(([lapNo, data]) => ({
        lapNo,
        attempts: data.attempts,
        correct: data.correct,
        accuracy: data.attempts > 0 ? data.correct / data.attempts : 0,
      }));

    // Improvement: lap2 - lap1
    const lap1 = lapStats.find((l) => l.lapNo === 1);
    const lap2 = lapStats.find((l) => l.lapNo === 2);
    const improvement = lap1 && lap2 ? lap2.accuracy - lap1.accuracy : null;

    const chapterInfo = chapterMap.get(group.chapterId);
    const chapterName = chapterInfo?.name ?? group.chapterId;
    const subjectName = subjectMap.get(group.subjectId) ?? group.subjectId;

    const searchKeyword = `${chapterName} ${group.sectionTitle} 解説`;
    const priority = resolvePriority(accuracy);
    const comment = resolveComment(group.totalAttempts, accuracy, improvement);

    allSections.push({
      subjectId: group.subjectId,
      subjectName,
      chapterId: group.chapterId,
      chapterName,
      sectionTitle: group.sectionTitle,
      totalAttempts: group.totalAttempts,
      correctCount: group.correctCount,
      accuracy,
      problemCount: group.problemIds.size,
      pageRef: group.pageRef,
      lapStats,
      improvement,
      searchKeyword,
      priority,
      comment,
    });
  }

  // Filter sections with >= 3 attempts, sort by accuracy asc, take top 5
  const weakSections = allSections
    .filter((s) => s.totalAttempts >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  // Overall stats
  const totalAttempts = allAttempts.length;
  const totalCorrect = allAttempts.filter((a) => a.isCorrect).length;
  const overallAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  let overallComment: string;
  if (overallAccuracy < 0.4) {
    overallComment = '全体的に基礎固めが必要な段階です。各分野の基本事項から復習しましょう';
  } else if (overallAccuracy < 0.6) {
    overallComment = '理解が定着しつつあります。苦手分野を重点的に復習しましょう';
  } else if (overallAccuracy < 0.8) {
    overallComment = '着実に力がついています。苦手な小分類を潰し込みましょう';
  } else {
    overallComment = '高い正答率を維持しています。このまま継続しましょう';
  }

  const uniqueProblems = new Set(allAttempts.map((a) => a.problemId));

  return {
    generatedAt: new Date(),
    totalAttempts,
    totalProblems: uniqueProblems.size,
    weakSections,
    overallAccuracy,
    overallComment,
  };
}
