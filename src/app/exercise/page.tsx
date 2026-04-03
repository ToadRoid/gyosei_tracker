'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { db, getReadyProblems } from '@/lib/db';
import { subjects, chapters } from '@/data/master';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LapData {
  lapNo: number;
  answered: number;
  total: number;
  complete: boolean;
}

interface SectionInfo {
  sectionTitle: string;
  problemIds: string[];
  currentLap: number;
  answeredInCurrentLap: number;
  total: number;
  status: 'complete' | 'in_progress' | 'not_started';
  lapData: LapData[];
}

interface ChapterInfo {
  chapterId: string;
  chapterName: string;
  sections: SectionInfo[];
  totalProblems: number;
  answeredTotal: number;
}

interface SubjectInfo {
  subjectId: string;
  subjectName: string;
  chapters: ChapterInfo[];
  totalProblems: number;
  answeredTotal: number;
}

// ── Data loading ───────────────────────────────────────────────────────────────

async function loadCurriculumData(): Promise<SubjectInfo[]> {
  // 1. Load all ready problems
  const allProblems = await getReadyProblems();

  // 2. Load all attempts
  const allAttempts = await db.attempts.toArray();

  // Build answeredSet: "problemId::lapNo"
  const answeredSet = new Set(allAttempts.map((a) => `${a.problemId}::${a.lapNo}`));

  // Build per-problem lapSet for currentLap calculation
  // Map: problemId → Set<lapNo>
  const problemLaps = new Map<string, Set<number>>();
  for (const a of allAttempts) {
    if (!problemLaps.has(a.problemId)) problemLaps.set(a.problemId, new Set());
    problemLaps.get(a.problemId)!.add(a.lapNo);
  }

  // Helper: compute currentLap for a set of problemIds
  function computeCurrentLap(problemIds: string[]): number {
    if (problemIds.length === 0) return 1;
    const maxLap = Math.max(
      0,
      ...problemIds.flatMap((id) => [...(problemLaps.get(id) ?? [])]),
    );
    for (let lap = 1; lap <= maxLap + 1; lap++) {
      const allAnswered = problemIds.every((id) => answeredSet.has(`${id}::${lap}`));
      if (!allAnswered) return lap;
    }
    return maxLap + 1;
  }

  // 3. Group: subjectId → chapterId → sectionTitle → problemIds[]
  const subjectMap = new Map<string, Map<string, Map<string, string[]>>>();

  for (const p of allProblems) {
    const sid = p.subjectId ?? 'unknown';
    const cid = p.chapterId ?? 'unknown';
    const sec = (p.sectionTitle && p.sectionTitle.trim()) ? p.sectionTitle.trim() : 'その他';

    if (!subjectMap.has(sid)) subjectMap.set(sid, new Map());
    const chapMap = subjectMap.get(sid)!;
    if (!chapMap.has(cid)) chapMap.set(cid, new Map());
    const secMap = chapMap.get(cid)!;
    if (!secMap.has(sec)) secMap.set(sec, []);
    secMap.get(sec)!.push(p.problemId);
  }

  // 4. Build SubjectInfo[] following master order
  const result: SubjectInfo[] = [];

  for (const subject of subjects) {
    const chapMap = subjectMap.get(subject.id);
    if (!chapMap) continue;

    const chapterInfos: ChapterInfo[] = [];
    const relevantChapters = chapters
      .filter((c) => c.subjectId === subject.id)
      .sort((a, b) => a.order - b.order);

    for (const chapter of relevantChapters) {
      const secMap = chapMap.get(chapter.id);
      if (!secMap) continue;

      const sectionInfos: SectionInfo[] = [];
      for (const [sectionTitle, problemIds] of secMap.entries()) {
        const currentLap = computeCurrentLap(problemIds);
        const answeredInCurrentLap = problemIds.filter((id) =>
          answeredSet.has(`${id}::${currentLap}`),
        ).length;

        let status: SectionInfo['status'];
        if (answeredInCurrentLap === problemIds.length) {
          status = 'complete';
        } else if (answeredInCurrentLap > 0) {
          status = 'in_progress';
        } else {
          status = 'not_started';
        }

        // ラップごとの進捗
        const maxAttemptedLap = Math.max(
          0,
          ...problemIds.flatMap((id) => [...(problemLaps.get(id) ?? [])]),
        );
        const lapData: LapData[] = [];
        for (let lap = 1; lap <= Math.max(maxAttemptedLap, currentLap); lap++) {
          const ans = problemIds.filter((id) => answeredSet.has(`${id}::${lap}`)).length;
          lapData.push({ lapNo: lap, answered: ans, total: problemIds.length, complete: ans === problemIds.length });
        }

        sectionInfos.push({
          sectionTitle,
          problemIds,
          currentLap,
          answeredInCurrentLap,
          total: problemIds.length,
          status,
          lapData,
        });
      }

      const totalProblems = sectionInfos.reduce((s, sec) => s + sec.total, 0);
      // answeredTotal = answered in each section's currentLap (for display consistency)
      const answeredTotal = sectionInfos.reduce((s, sec) => s + sec.answeredInCurrentLap, 0);

      chapterInfos.push({
        chapterId: chapter.id,
        chapterName: chapter.name,
        sections: sectionInfos,
        totalProblems,
        answeredTotal,
      });
    }

    const totalProblems = chapterInfos.reduce((s, c) => s + c.totalProblems, 0);
    const answeredTotal = chapterInfos.reduce((s, c) => s + c.answeredTotal, 0);

    result.push({
      subjectId: subject.id,
      subjectName: subject.name,
      chapters: chapterInfos,
      totalProblems,
      answeredTotal,
    });
  }

  return result;
}

// ── Helper: find next section to resume ───────────────────────────────────────

function findNextSection(
  data: SubjectInfo[],
): { subjectId: string; chapterId: string; sectionTitle: string; lap: number } | null {
  // Prefer in_progress first, then not_started
  for (const status of ['in_progress', 'not_started'] as const) {
    for (const subject of data) {
      for (const chapter of subject.chapters) {
        for (const section of chapter.sections) {
          if (section.status === status) {
            return {
              subjectId: subject.subjectId,
              chapterId: chapter.chapterId,
              sectionTitle: section.sectionTitle,
              lap: section.currentLap,
            };
          }
        }
      }
    }
  }
  return null;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressBar({
  answered,
  total,
  status,
}: {
  answered: number;
  total: number;
  status: 'complete' | 'in_progress' | 'not_started' | 'mixed';
}) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  const barColor =
    status === 'complete'
      ? 'bg-green-500'
      : status === 'in_progress' || status === 'mixed'
      ? 'bg-indigo-500'
      : 'bg-slate-300';

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="h-1.5 w-20 flex-shrink-0 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 flex-shrink-0">{pct}%</span>
    </div>
  );
}

function StatusIcon({ status }: { status: SectionInfo['status'] }) {
  if (status === 'complete') return <span className="text-base">✅</span>;
  if (status === 'in_progress') return <span className="text-base">🔵</span>;
  return <span className="text-base">⬜</span>;
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ExercisePage() {
  const router = useRouter();
  const [data, setData] = useState<SubjectInfo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [random, setRandom] = useState(false);

  useEffect(() => {
    loadCurriculumData().then((d) => {
      setData(d);
      // Default: expand all subjects and chapters
      setExpandedSubjects(new Set(d.map((s) => s.subjectId)));
      setExpandedChapters(new Set(d.flatMap((s) => s.chapters.map((c) => c.chapterId))));
      setLoading(false);
    });
  }, []);

  const toggleSubject = (id: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startSection = (
    subjectId: string,
    chapterId: string,
    sectionTitle: string,
    lap: number,
  ) => {
    const params = new URLSearchParams({
      subject: subjectId,
      chapter: chapterId,
      section: sectionTitle,
      lap: String(lap),
    });
    if (random) params.set('random', '1');
    router.push(`/exercise/session?${params.toString()}`);
  };

  const handleResume = () => {
    if (!data) return;
    const next = findNextSection(data);
    if (!next) return;
    const params = new URLSearchParams({
      subject: next.subjectId,
      chapter: next.chapterId,
      section: next.sectionTitle,
      lap: String(next.lap),
    });
    router.push(`/exercise/session?${params.toString()}`);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">読み込み中...</p>
        <NavBar />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="px-4 pt-10 pb-24 text-center space-y-3">
        <p className="text-slate-500">問題データがありません</p>
        <p className="text-sm text-slate-400">問題をインポートしてから演習を開始してください。</p>
        <NavBar />
      </div>
    );
  }

  const hasNext = !!findNextSection(data);

  return (
    <div className="px-4 pt-6 pb-28 space-y-5 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">演習モード</h1>
        {/* Random toggle */}
        <button
          type="button"
          onClick={() => setRandom((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
            random
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
          }`}
        >
          🔀 ランダム
        </button>
      </div>

      {/* 続きから開始 */}
      <button
        type="button"
        onClick={handleResume}
        disabled={!hasNext}
        className="w-full rounded-xl bg-indigo-600 py-4 text-white text-base font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:bg-slate-300 transition-colors shadow-sm"
      >
        続きから開始 →
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">科目別進捗</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Subject tree */}
      <div className="space-y-2">
        {data.map((subject) => {
          const subjectExpanded = expandedSubjects.has(subject.subjectId);
          const subjectPct =
            subject.totalProblems > 0
              ? Math.round((subject.answeredTotal / subject.totalProblems) * 100)
              : 0;
          const subjectStatus =
            subject.answeredTotal === subject.totalProblems && subject.totalProblems > 0
              ? 'complete'
              : subject.answeredTotal > 0
              ? 'in_progress'
              : 'not_started';

          return (
            <div key={subject.subjectId} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              {/* Subject row */}
              <button
                type="button"
                onClick={() => toggleSubject(subject.subjectId)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <span className="text-slate-400 text-xs w-4">{subjectExpanded ? '▼' : '▶'}</span>
                <span className="flex-1 text-left text-sm font-bold text-slate-800">
                  {subject.subjectName}
                </span>
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {subject.answeredTotal}/{subject.totalProblems}問
                </span>
                <ProgressBar
                  answered={subject.answeredTotal}
                  total={subject.totalProblems}
                  status={subjectStatus === 'not_started' ? 'not_started' : subjectPct === 100 ? 'complete' : 'mixed'}
                />
              </button>

              {/* Chapters */}
              {subjectExpanded && (
                <div className="border-t border-slate-100">
                  {subject.chapters.map((chapter) => {
                    const chapExpanded = expandedChapters.has(chapter.chapterId);
                    const chapPct =
                      chapter.totalProblems > 0
                        ? Math.round((chapter.answeredTotal / chapter.totalProblems) * 100)
                        : 0;
                    const chapStatus =
                      chapter.answeredTotal === chapter.totalProblems && chapter.totalProblems > 0
                        ? 'complete'
                        : chapter.answeredTotal > 0
                        ? 'in_progress'
                        : 'not_started';

                    return (
                      <div key={chapter.chapterId}>
                        {/* Chapter row */}
                        <button
                          type="button"
                          onClick={() => toggleChapter(chapter.chapterId)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors border-t border-slate-100"
                        >
                          <span className="w-4" />
                          <span className="text-slate-300 text-xs w-4">{chapExpanded ? '▼' : '▶'}</span>
                          <span className="flex-1 text-left text-sm font-semibold text-slate-700">
                            {chapter.chapterName}
                          </span>
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {chapter.answeredTotal}/{chapter.totalProblems}問
                          </span>
                          <ProgressBar
                            answered={chapter.answeredTotal}
                            total={chapter.totalProblems}
                            status={chapStatus === 'not_started' ? 'not_started' : chapPct === 100 ? 'complete' : 'mixed'}
                          />
                        </button>

                        {/* Section rows */}
                        {chapExpanded && (
                          <div>
                            {chapter.sections.map((section) => (
                              <button
                                key={section.sectionTitle}
                                type="button"
                                onClick={() =>
                                  startSection(
                                    subject.subjectId,
                                    chapter.chapterId,
                                    section.sectionTitle,
                                    section.currentLap,
                                  )
                                }
                                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-indigo-50 transition-colors border-t border-slate-100 active:bg-indigo-100"
                              >
                                <span className="w-4" />
                                <span className="w-4" />
                                <span className="flex-1 text-left text-sm text-slate-700 truncate">
                                  {section.sectionTitle}
                                </span>
                                {/* ラップバッジ */}
                                <div className="flex gap-1 flex-shrink-0">
                                  {section.lapData.map((lap) => (
                                    <span
                                      key={lap.lapNo}
                                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                                        lap.complete
                                          ? 'bg-green-500 text-white'
                                          : lap.lapNo === section.currentLap && lap.answered > 0
                                          ? 'bg-indigo-500 text-white'
                                          : lap.lapNo === section.currentLap
                                          ? 'border-2 border-slate-300 text-slate-400'
                                          : 'bg-slate-200 text-slate-400'
                                      }`}
                                    >
                                      {lap.lapNo}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-xs text-indigo-400 flex-shrink-0">›</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <NavBar />
    </div>
  );
}
