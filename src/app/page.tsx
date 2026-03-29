'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import StatsBar from '@/components/StatsBar';
import { getOverallStats, getSubjectStats, getWeakChapters } from '@/lib/stats';
import type { SubjectStats, ChapterStats } from '@/types';

export default function DashboardPage() {
  const [overall, setOverall] = useState({
    totalReady: 0,
    totalDraft: 0,
    totalAttempts: 0,
    correctCount: 0,
    accuracy: 0,
    currentLap: 0,
  });
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [weakChapters, setWeakChapters] = useState<ChapterStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [o, s, w] = await Promise.all([
        getOverallStats(),
        getSubjectStats(),
        getWeakChapters(),
      ]);
      setOverall(o);
      setSubjectStats(s);
      setWeakChapters(w);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  const hasData = overall.totalReady > 0 || overall.totalDraft > 0;

  return (
    <div className="px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">肢別トラッカー</h1>
        <p className="text-sm text-slate-500 mt-1">行政書士試験 学習管理</p>
      </div>

      {!hasData ? (
        <div className="text-center py-12 space-y-4">
          <span className="text-5xl">📚</span>
          <p className="text-slate-600 font-medium">
            まずは問題を取り込みましょう
          </p>
          <a
            href="/import"
            className="inline-block rounded-xl bg-indigo-600 px-8 py-3 text-white font-bold hover:bg-indigo-700"
          >
            問題を取り込む
          </a>
        </div>
      ) : (
        <>
          {/* 問題数サマリ */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-center">
              <p className="text-2xl font-black text-indigo-600">
                {overall.totalReady}
              </p>
              <p className="text-xs text-slate-500">整備済み</p>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-center">
              <p className="text-2xl font-black text-green-600">
                {overall.totalAttempts > 0
                  ? `${Math.round(overall.accuracy * 100)}%`
                  : '-'}
              </p>
              <p className="text-xs text-slate-500">累積正答率</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="text-2xl font-black text-amber-600">
                {overall.currentLap || '-'}
              </p>
              <p className="text-xs text-slate-500">最高周回</p>
            </div>
          </div>

          {/* 下書きバナー */}
          {overall.totalDraft > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-amber-800">
                  下書き {overall.totalDraft}件
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  AI精査で属性を設定しましょう
                </p>
              </div>
              <a
                href="/triage"
                className="rounded-lg bg-amber-500 text-white text-sm font-bold px-4 py-2 hover:bg-amber-600"
              >
                AI精査
              </a>
            </div>
          )}

          {overall.totalAttempts > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h2 className="font-bold text-slate-800">科目別 累積正答率</h2>
              {subjectStats
                .filter((s) => s.totalAttempts > 0)
                .map((s) => (
                  <StatsBar
                    key={s.subjectId}
                    label={s.subjectName}
                    value={s.accuracy}
                    count={`${s.correctCount}/${s.totalAttempts}`}
                  />
                ))}
            </div>
          )}

          {weakChapters.length > 0 && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-3">
              <h2 className="font-bold text-red-700">苦手分野（累積成績ベース）</h2>
              {weakChapters.map((c) => (
                <div
                  key={c.chapterId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-700">{c.chapterName}</span>
                  <span className="text-red-500 font-bold">
                    {Math.round(c.accuracy * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <a
              href="/import"
              className="rounded-xl bg-indigo-600 p-4 text-center text-white font-bold hover:bg-indigo-700"
            >
              📷 取り込む
            </a>
            <a
              href="/exercise"
              className="rounded-xl bg-green-600 p-4 text-center text-white font-bold hover:bg-green-700"
            >
              ✏️ 演習する
            </a>
          </div>
        </>
      )}

      <NavBar />
    </div>
  );
}
