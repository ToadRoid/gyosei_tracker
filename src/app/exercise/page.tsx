'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import SubjectChapterSelect from '@/components/SubjectChapterSelect';
import { db } from '@/lib/db';

export default function ExerciseSetupPage() {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [lapNo, setLapNo] = useState(1);
  const [questionCount, setQuestionCount] = useState(0);
  const [maxLap, setMaxLap] = useState(0);

  useEffect(() => {
    (async () => {
      const allAttempts = await db.attempts.toArray();
      if (allAttempts.length > 0) {
        const max = Math.max(...allAttempts.map((a) => a.lapNo));
        setMaxLap(max);
        setLapNo(max + 1);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!subjectId) {
        const count = await db.questions.count();
        setQuestionCount(count);
        return;
      }
      const questions = await db.questions
        .where('subjectId')
        .equals(subjectId)
        .toArray();
      const filtered = chapterId
        ? questions.filter((q) => q.chapterId === chapterId)
        : questions;
      setQuestionCount(filtered.length);
    })();
  }, [subjectId, chapterId]);

  const handleStart = () => {
    const params = new URLSearchParams();
    if (subjectId) params.set('subject', subjectId);
    if (chapterId) params.set('chapter', chapterId);
    params.set('lap', String(lapNo));
    router.push(`/exercise/session?${params.toString()}`);
  };

  return (
    <div className="px-4 pt-6 space-y-6">
      <h1 className="text-xl font-bold text-slate-800">演習モード</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <SubjectChapterSelect
          subjectId={subjectId}
          chapterId={chapterId}
          onSubjectChange={setSubjectId}
          onChapterChange={setChapterId}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSubjectId('');
              setChapterId('');
            }}
            className="text-sm text-indigo-600 underline"
          >
            全科目で出題
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          周回
        </label>
        <div className="flex items-center gap-3">
          {[...Array(Math.max(maxLap + 1, 3))].map((_, i) => {
            const lap = i + 1;
            return (
              <button
                key={lap}
                onClick={() => setLapNo(lap)}
                className={`w-10 h-10 rounded-full text-sm font-bold transition-colors ${
                  lapNo === lap
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-indigo-50'
                }`}
              >
                {lap}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400">
          {maxLap > 0
            ? `第${maxLap}周まで記録あり`
            : 'まだ演習していません'}
        </p>
      </div>

      <div className="text-center space-y-3">
        <p className="text-2xl font-bold text-slate-800">
          {questionCount}
          <span className="text-sm font-normal text-slate-500 ml-1">問</span>
        </p>

        <button
          onClick={handleStart}
          disabled={questionCount === 0}
          className="w-full rounded-xl bg-indigo-600 py-4 text-white text-lg font-bold transition-colors hover:bg-indigo-700 disabled:bg-slate-300"
        >
          演習を開始
        </button>

        {questionCount === 0 && (
          <p className="text-sm text-slate-400">
            先に問題を取り込んでください
          </p>
        )}
      </div>

      <NavBar />
    </div>
  );
}
