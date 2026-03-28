'use client';

import { useState, useEffect, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import QuestionCard from '@/components/QuestionCard';
import { db } from '@/lib/db';
import { subjects, chapters } from '@/data/master';
import type { Question, Attempt } from '@/types';

export default function QuestionsPage() {
  const [subjectFilter, setSubjectFilter] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Map<number, Attempt[]>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    let query = db.questions.orderBy('createdAt');

    const allQuestions = await query.reverse().toArray();
    const filtered = allQuestions.filter((q) => {
      if (subjectFilter && q.subjectId !== subjectFilter) return false;
      if (chapterFilter && q.chapterId !== chapterFilter) return false;
      return true;
    });

    const allAttempts = await db.attempts.toArray();
    const attemptMap = new Map<number, Attempt[]>();
    for (const a of allAttempts) {
      const list = attemptMap.get(a.questionId) || [];
      list.push(a);
      attemptMap.set(a.questionId, list);
    }

    setQuestions(filtered);
    setAttempts(attemptMap);
    setLoading(false);
  }, [subjectFilter, chapterFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: number) => {
    await db.questions.delete(id);
    await db.attempts.where('questionId').equals(id).delete();
    loadData();
  };

  const filteredChapters = subjectFilter
    ? chapters.filter((c) => c.subjectId === subjectFilter)
    : [];

  return (
    <div className="px-4 pt-6 space-y-4">
      <h1 className="text-xl font-bold text-slate-800">問題一覧</h1>

      {/* フィルタ */}
      <div className="flex gap-2">
        <select
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            setChapterFilter('');
          }}
          className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">全科目</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={chapterFilter}
          onChange={(e) => setChapterFilter(e.target.value)}
          disabled={!subjectFilter}
          className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100"
        >
          <option value="">全章</option>
          {filteredChapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-slate-500">{questions.length}件</p>

      {loading ? (
        <p className="text-center text-slate-400 py-12">読み込み中...</p>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <span className="text-4xl">📭</span>
          <p className="text-slate-500">まだ問題がありません</p>
          <a
            href="/import"
            className="inline-block rounded-xl bg-indigo-600 px-6 py-2 text-white font-bold hover:bg-indigo-700"
          >
            問題を取り込む
          </a>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {questions.map((q) => {
            const qAttempts = attempts.get(q.id!) || [];
            const lastAttempt =
              qAttempts.length > 0
                ? qAttempts.sort(
                    (a, b) =>
                      new Date(b.answeredAt).getTime() -
                      new Date(a.answeredAt).getTime(),
                  )[0]
                : null;

            return (
              <QuestionCard
                key={q.id}
                question={q}
                attemptCount={qAttempts.length}
                lastCorrect={lastAttempt?.isCorrect ?? null}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}

      <NavBar />
    </div>
  );
}
