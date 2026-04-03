'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import SubjectChapterSelect from '@/components/SubjectChapterSelect';
import { db, getReadyProblems } from '@/lib/db';

interface LapProgress {
  lapNo: number;
  done: number;      // このフィルタ内で lapNo 周目を回答済みの問題数
  total: number;     // フィルタ内の総問題数
  isComplete: boolean;
}

/** フィルタ内の問題に対して周回進捗を計算し、次に取り組むべき lapNo を返す */
async function calcLapInfo(
  problemIds: string[],
): Promise<{ currentLap: number; progress: LapProgress[] }> {
  if (problemIds.length === 0) return { currentLap: 1, progress: [] };

  const total = problemIds.length;
  const idSet = new Set(problemIds);

  // フィルタ内の問題の全 attempt を取得
  const allAttempts = await db.attempts
    .filter((a) => idSet.has(a.problemId))
    .toArray();

  // problemId × lapNo の回答済みセット
  const answeredSet = new Set(allAttempts.map((a) => `${a.problemId}::${a.lapNo}`));

  // 各周回の進捗を計算（最大周回+1 まで）
  const maxLap = allAttempts.length > 0
    ? Math.max(...allAttempts.map((a) => a.lapNo))
    : 0;

  const progress: LapProgress[] = [];
  let currentLap = 1;

  for (let lap = 1; lap <= maxLap + 1; lap++) {
    const done = problemIds.filter((id) => answeredSet.has(`${id}::${lap}`)).length;
    const isComplete = done === total;
    progress.push({ lapNo: lap, done, total, isComplete });

    // 未完了の最初の周回 = 今やるべき周回
    if (!isComplete && currentLap === 1) {
      currentLap = lap;
    }
    if (lap > 1 && !isComplete && progress[lap - 2].isComplete) {
      currentLap = lap;
    }
  }

  // 全周完了していたら次の周回へ
  if (progress.every((p) => p.isComplete)) {
    currentLap = maxLap + 1;
  }

  return { currentLap, progress };
}

export default function ExerciseSetupPage() {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  const [problemCount, setProblemCount] = useState(0);
  const [random, setRandom] = useState(false);
  const [currentLap, setCurrentLap] = useState(1);
  const [progress, setProgress] = useState<LapProgress[]>([]);

  useEffect(() => {
    (async () => {
      const problems = await getReadyProblems(
        subjectId || undefined,
        chapterId || undefined,
        sectionTitle || undefined,
      );
      setProblemCount(problems.length);

      const ids = problems.map((p) => p.problemId);
      const { currentLap: lap, progress: prog } = await calcLapInfo(ids);
      setCurrentLap(lap);
      setProgress(prog);

      // 小分類の選択肢
      if (chapterId) {
        const allInChapter = await getReadyProblems(
          subjectId || undefined,
          chapterId || undefined,
        );
        const sections = [...new Set(
          allInChapter
            .map((p) => p.sectionTitle ?? '')
            .filter((s) => s.length > 0),
        )].sort();
        setSectionOptions(sections);
      } else {
        setSectionOptions([]);
        setSectionTitle('');
      }
    })();
  }, [subjectId, chapterId, sectionTitle]);

  const handleStart = () => {
    const params = new URLSearchParams();
    if (subjectId) params.set('subject', subjectId);
    if (chapterId) params.set('chapter', chapterId);
    if (sectionTitle) params.set('section', sectionTitle);
    params.set('lap', String(currentLap));
    if (random) params.set('random', '1');
    router.push(`/exercise/session?${params.toString()}`);
  };

  // 今やるべき周の進捗
  const currentProgress = progress.find((p) => p.lapNo === currentLap);
  const prevProgress = progress.find((p) => p.lapNo === currentLap - 1);

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      <h1 className="text-xl font-bold text-slate-800">演習モード</h1>

      {/* フィルタ */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <SubjectChapterSelect
          subjectId={subjectId}
          chapterId={chapterId}
          onSubjectChange={setSubjectId}
          onChapterChange={setChapterId}
        />

        {sectionOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              小分類
            </label>
            <select
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">すべて</option>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={() => { setSubjectId(''); setChapterId(''); setSectionTitle(''); }}
          className="text-sm text-indigo-600 underline"
        >
          全科目で出題
        </button>
      </div>

      {/* 周回・進捗 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">周回</span>
          <span className="text-lg font-bold text-indigo-600">第 {currentLap} 周目</span>
        </div>

        {/* 今の周の進捗バー */}
        {currentProgress && problemCount > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>
                {currentProgress.isComplete
                  ? '✅ 完了'
                  : `${currentProgress.done} / ${currentProgress.total} 問 回答済み`}
              </span>
              <span>{Math.round((currentProgress.done / currentProgress.total) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  currentProgress.isComplete ? 'bg-green-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${(currentProgress.done / currentProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 前周の正答率（あれば） */}
        {prevProgress && (
          <p className="text-xs text-slate-400">
            {currentLap - 1}周目: {prevProgress.done}/{prevProgress.total}問 完了
          </p>
        )}

        {/* 過去周回の履歴（折りたたみ可能） */}
        {progress.filter((p) => p.lapNo < currentLap).length > 0 && (
          <div className="flex gap-2 flex-wrap pt-1">
            {progress.filter((p) => p.lapNo < currentLap).map((p) => (
              <div key={p.lapNo} className="flex items-center gap-1 text-xs">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  p.isComplete ? 'bg-green-500' : 'bg-slate-300'
                }`}>
                  {p.lapNo}
                </span>
                <span className="text-slate-400">
                  {p.isComplete ? '完了' : `${p.done}/${p.total}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 順番・開始 */}
      <div className="space-y-3">
        <p className="text-center text-2xl font-bold text-slate-800">
          {problemCount}
          <span className="text-sm font-normal text-slate-500 ml-1">問</span>
        </p>

        <div className="flex rounded-xl overflow-hidden border border-slate-200 text-sm font-medium">
          <button
            onClick={() => setRandom(false)}
            className={`flex-1 py-2 transition-colors ${
              !random ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            連番順
          </button>
          <button
            onClick={() => setRandom(true)}
            className={`flex-1 py-2 transition-colors ${
              random ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            🔀 ランダム
          </button>
        </div>

        <button
          onClick={handleStart}
          disabled={problemCount === 0}
          className="w-full rounded-xl bg-indigo-600 py-4 text-white text-lg font-bold transition-colors hover:bg-indigo-700 disabled:bg-slate-300"
        >
          第{currentLap}周目を開始
        </button>

        {problemCount === 0 && (
          <p className="text-sm text-slate-400 text-center">
            該当する問題がありません
          </p>
        )}
      </div>

      <NavBar />
    </div>
  );
}
