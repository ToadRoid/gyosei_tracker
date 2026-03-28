'use client';

import { useState, useEffect, useReducer, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, upsertAttempt } from '@/lib/db';
import { subjects, chapters } from '@/data/master';
import type { Question, ExerciseResult, ExercisePhase } from '@/types';

interface State {
  questions: Question[];
  currentIndex: number;
  phase: ExercisePhase;
  lapNo: number;
  results: ExerciseResult[];
  questionStartTime: number;
}

type Action =
  | { type: 'INIT'; questions: Question[]; lapNo: number }
  | { type: 'ANSWER'; userAnswer: boolean }
  | { type: 'NEXT' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        questions: action.questions,
        lapNo: action.lapNo,
        currentIndex: 0,
        phase: 'answering',
        results: [],
        questionStartTime: Date.now(),
      };
    case 'ANSWER': {
      const q = state.questions[state.currentIndex];
      const isCorrect = action.userAnswer === q.answerBoolean;
      const elapsed = Math.round((Date.now() - state.questionStartTime) / 1000);
      const result: ExerciseResult = {
        questionId: q.id!,
        userAnswer: action.userAnswer,
        isCorrect,
        responseTimeSec: elapsed,
      };
      return {
        ...state,
        phase: 'feedback',
        results: [...state.results, result],
      };
    }
    case 'NEXT': {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, phase: 'complete' };
      }
      return {
        ...state,
        currentIndex: nextIndex,
        phase: 'answering',
        questionStartTime: Date.now(),
      };
    }
    default:
      return state;
  }
}

const initialState: State = {
  questions: [],
  currentIndex: 0,
  phase: 'answering',
  lapNo: 1,
  results: [],
  questionStartTime: Date.now(),
};

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false); // 回答保存失敗フラグ
  const lapNoRef = useRef(1);           // reducer state の lapNo を async 内で参照するための ref
  const isAnsweringRef = useRef(false); // 二重タップ防止（NEXT で必ず false に戻す）

  useEffect(() => {
    (async () => {
      const subjectId = searchParams.get('subject') || '';
      const chapterId = searchParams.get('chapter') || '';
      const lapNo = Number(searchParams.get('lap') || '1');

      let questions: Question[];
      if (subjectId) {
        questions = await db.questions
          .where('subjectId')
          .equals(subjectId)
          .toArray();
        if (chapterId) {
          questions = questions.filter((q) => q.chapterId === chapterId);
        }
      } else {
        questions = await db.questions.toArray();
      }

      // シャッフル
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }

      lapNoRef.current = lapNo;
      dispatch({ type: 'INIT', questions, lapNo });
      setLoading(false);
    })();
  }, [searchParams]);

  // 回答ごとに即時保存（中断・リロードでもデータが残る）
  // isAnsweringRef で二重タップ・二重保存を防止
  const handleAnswer = async (userAnswer: boolean) => {
    if (isAnsweringRef.current) return;
    isAnsweringRef.current = true;

    const q = state.questions[state.currentIndex];
    const isCorrect = userAnswer === q.answerBoolean;
    const elapsed = Math.round((Date.now() - state.questionStartTime) / 1000);

    // UI更新（phase → feedback）
    dispatch({ type: 'ANSWER', userAnswer });
    setSaveError(false);

    // DB保存（即時・upsert: 同一lap同一問題は上書き）
    try {
      await upsertAttempt({
        questionId: q.id!,
        lapNo: lapNoRef.current,
        answeredAt: new Date(),
        userAnswer,
        isCorrect,
        responseTimeSec: elapsed,
      });
    } catch (e) {
      console.error('回答の保存に失敗:', e);
      setSaveError(true); // ユーザーに通知（次の問題へは進める）
    }
    // ※ isAnsweringRef は NEXT ボタン押下時にリセットする
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  if (state.questions.length === 0) {
    return (
      <div className="px-4 pt-6 text-center space-y-4">
        <p className="text-slate-500">該当する問題がありません</p>
        <button
          onClick={() => router.push('/exercise')}
          className="rounded-xl bg-indigo-600 px-6 py-2 text-white font-bold"
        >
          戻る
        </button>
      </div>
    );
  }

  const current = state.questions[state.currentIndex];
  const lastResult =
    state.results.length > 0
      ? state.results[state.results.length - 1]
      : null;
  const subject = subjects.find((s) => s.id === current?.subjectId);
  const chapter = chapters.find((c) => c.id === current?.chapterId);

  // 完了画面
  if (state.phase === 'complete') {
    const correct = state.results.filter((r) => r.isCorrect).length;
    const total = state.results.length;
    const pct = Math.round((correct / total) * 100);

    return (
      <div className="px-4 pt-6 space-y-6">
        <div className="text-center space-y-3 pt-8">
          <span className="text-5xl">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</span>
          <h2 className="text-2xl font-bold text-slate-800">演習完了!</h2>
          <p className="text-sm text-slate-500">第{state.lapNo}周</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center space-y-2">
          <p className="text-4xl font-black text-indigo-600">{pct}%</p>
          <p className="text-sm text-slate-500">
            {total}問中 {correct}問正解
          </p>
        </div>

        <div className="space-y-2">
          {state.results.map((r, i) => {
            const q = state.questions[i];
            return (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  r.isCorrect ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <span
                  className={`font-bold ${r.isCorrect ? 'text-green-600' : 'text-red-500'}`}
                >
                  {r.isCorrect ? '◯' : '✗'}
                </span>
                <span className="text-slate-700 line-clamp-1 flex-1">
                  {q.normalizedText}
                </span>
                <span className="text-slate-400 text-xs shrink-0">
                  {r.responseTimeSec}秒
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/exercise')}
            className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200"
          >
            設定に戻る
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700"
          >
            ダッシュボード
          </button>
        </div>
      </div>
    );
  }

  // 回答 / フィードバック画面
  return (
    <div className="px-4 pt-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-medium">
            {subject?.name}
          </span>
          <span className="text-xs text-slate-400">{chapter?.name}</span>
        </div>
        <span className="text-sm text-slate-500">
          {state.currentIndex + 1} / {state.questions.length}
        </span>
      </div>

      {/* プログレス */}
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{
            width: `${((state.currentIndex + (state.phase === 'feedback' ? 1 : 0)) / state.questions.length) * 100}%`,
          }}
        />
      </div>

      {/* 問題文 */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 min-h-[150px]">
        <p className="text-base leading-relaxed text-slate-800">
          {current.normalizedText || current.originalText}
        </p>
      </div>

      {/* 回答ボタン or フィードバック */}
      {state.phase === 'answering' ? (
        <div className="flex gap-4">
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 rounded-xl bg-green-50 border-2 border-green-200 py-6 text-3xl font-black text-green-600 hover:bg-green-100 active:bg-green-200 transition-colors"
          >
            ◯
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 rounded-xl bg-red-50 border-2 border-red-200 py-6 text-3xl font-black text-red-500 hover:bg-red-100 active:bg-red-200 transition-colors"
          >
            ✗
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={`rounded-xl p-4 text-center ${
              lastResult?.isCorrect
                ? 'bg-green-50 border-2 border-green-200'
                : 'bg-red-50 border-2 border-red-200'
            }`}
          >
            <span className="text-3xl">
              {lastResult?.isCorrect ? '🎉 正解!' : '😢 不正解'}
            </span>
            <p className="text-sm text-slate-600 mt-2">
              正解: {current.answerBoolean ? '◯' : '✗'}
            </p>
          </div>

          {saveError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              この回答の保存に失敗しました。通信・ストレージを確認してください。
            </div>
          )}

          <button
            onClick={() => {
              isAnsweringRef.current = false; // 次の問題で回答できるようにリセット
              dispatch({ type: 'NEXT' });
            }}
            className="w-full rounded-xl bg-indigo-600 py-4 text-white text-lg font-bold hover:bg-indigo-700 transition-colors"
          >
            {state.currentIndex + 1 < state.questions.length
              ? '次の問題へ'
              : '結果を見る'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExerciseSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-dvh">
          <p className="text-slate-400">読み込み中...</p>
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
