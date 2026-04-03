'use client';

import { useState, useEffect, useReducer, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getReadyProblems, upsertAttempt } from '@/lib/db';
import { subjects, chapters } from '@/data/master';
import type { ProblemForExercise, ExerciseResult, ExercisePhase } from '@/types';

interface State {
  problems: ProblemForExercise[];
  currentIndex: number;
  phase: ExercisePhase;
  lapNo: number;
  results: ExerciseResult[];
  questionStartTime: number;
}

type Action =
  | { type: 'INIT'; problems: ProblemForExercise[]; lapNo: number }
  | { type: 'ANSWER'; userAnswer: boolean }
  | { type: 'NEXT' }
  | { type: 'BACK' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        problems: action.problems,
        lapNo: action.lapNo,
        currentIndex: 0,
        phase: 'answering',
        results: [],
        questionStartTime: Date.now(),
      };
    case 'ANSWER': {
      const p = state.problems[state.currentIndex];
      const isCorrect = action.userAnswer === p.answerBoolean;
      const elapsed = Math.round((Date.now() - state.questionStartTime) / 1000);
      const result: ExerciseResult = {
        problemId: p.problemId,
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
      if (nextIndex >= state.problems.length) {
        return { ...state, phase: 'complete' };
      }
      return {
        ...state,
        currentIndex: nextIndex,
        phase: 'answering',
        questionStartTime: Date.now(),
      };
    }
    case 'BACK': {
      // feedback → answering（同じ問題を再回答）
      if (state.phase === 'feedback') {
        return {
          ...state,
          phase: 'answering',
          results: state.results.slice(0, -1),
          questionStartTime: Date.now(),
        };
      }
      // answering → 前の問題のfeedback
      if (state.phase === 'answering' && state.currentIndex > 0) {
        return {
          ...state,
          currentIndex: state.currentIndex - 1,
          phase: 'feedback',
        };
      }
      return state;
    }
    default:
      return state;
  }
}

const initialState: State = {
  problems: [],
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
  const [saveError, setSaveError] = useState(false);
  const lapNoRef = useRef(1);
  const isAnsweringRef = useRef(false);

  useEffect(() => {
    (async () => {
      const subjectId = searchParams.get('subject') || undefined;
      const chapterId = searchParams.get('chapter') || undefined;
      const sectionTitle = searchParams.get('section') || undefined;
      const lapNo = Number(searchParams.get('lap') || '1');

      let problems = await getReadyProblems(subjectId, chapterId, sectionTitle);
      const isRandom = searchParams.get('random') === '1';

      if (isRandom) {
        // ランダム
        for (let i = problems.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [problems[i], problems[j]] = [problems[j], problems[i]];
        }
      } else {
        // 連番順（problemId = "KB2025-p001-q01" の辞書順）
        problems = problems.slice().sort((a, b) =>
          a.problemId.localeCompare(b.problemId),
        );
      }

      lapNoRef.current = lapNo;
      dispatch({ type: 'INIT', problems, lapNo });
      setLoading(false);
    })();
  }, [searchParams]);

  const handleAnswer = async (userAnswer: boolean) => {
    if (isAnsweringRef.current) return;
    isAnsweringRef.current = true;

    const p = state.problems[state.currentIndex];
    const isCorrect = userAnswer === p.answerBoolean;
    const elapsed = Math.round((Date.now() - state.questionStartTime) / 1000);

    dispatch({ type: 'ANSWER', userAnswer });
    setSaveError(false);

    try {
      await upsertAttempt({
        problemId: p.problemId,
        lapNo: lapNoRef.current,
        answeredAt: new Date(),
        userAnswer,
        isCorrect,
        responseTimeSec: elapsed,
      });
    } catch (e) {
      console.error('回答の保存に失敗:', e);
      setSaveError(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  if (state.problems.length === 0) {
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

  const current = state.problems[state.currentIndex];
  const lastResult =
    state.results.length > 0 ? state.results[state.results.length - 1] : null;
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
            const p = state.problems[i];
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
                  {p.cleanedText || p.rawText}
                </span>
                <span className="text-slate-400 text-xs shrink-0">
                  {r.responseTimeSec}秒
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pb-8">
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
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/exercise')}
              className="text-slate-400 hover:text-slate-600 mr-1"
              aria-label="戻る"
            >
              ←
            </button>
            <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-medium">
              {subject?.name ?? ''}
            </span>
            <span className="text-xs text-slate-400">{chapter?.name ?? ''}</span>
          </div>
          <span className="text-sm text-slate-500">
            {state.currentIndex + 1} / {state.problems.length}
          </span>
        </div>
        {current.sectionTitle && (
          <p className="text-xs text-slate-500 pl-1">{current.sectionTitle}</p>
        )}
        {(current.sourcePageQuestion || current.sourcePageAnswer) && (
          <p className="text-xs text-slate-400 pl-1">
            {'📖 合格革命 行政書士 肢別過去問集'}
            {current.sourcePageQuestion && ` p.${current.sourcePageQuestion}`}
            {current.sourcePageQuestion && current.sourcePageAnswer && ' /'}
            {current.sourcePageAnswer && ` p.${current.sourcePageAnswer}`}
          </p>
        )}
      </div>

      {/* プログレス */}
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{
            width: `${
              ((state.currentIndex + (state.phase === 'feedback' ? 1 : 0)) /
                state.problems.length) *
              100
            }%`,
          }}
        />
      </div>

      {/* 問題文 */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 min-h-[150px]">
        <p className="text-base leading-relaxed text-slate-800">
          {current.cleanedText || current.rawText}
        </p>
      </div>

      {/* 回答ボタン or フィードバック */}
      {state.phase === 'answering' ? (
        <div className="space-y-3">
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
          {state.currentIndex > 0 && (
            <button
              onClick={() => dispatch({ type: 'BACK' })}
              className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-200 transition-colors"
            >
              ← 前の問題の解説を見る
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          {/* 正解 / 不正解バナー */}
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
            <p className="text-sm text-slate-600 mt-1">
              正解: {current.answerBoolean ? '◯' : '✗'}
              {lastResult && !lastResult.isCorrect && (
                <span className="ml-2 text-slate-400">
                  （あなたの回答: {lastResult.userAnswer ? '◯' : '✗'}）
                </span>
              )}
            </p>
          </div>

          {/* 解説 */}
          {current.explanationText && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">解説</p>
              <p className="text-sm leading-relaxed text-slate-700">{current.explanationText}</p>
            </div>
          )}

          {saveError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              この回答の保存に失敗しました。
            </div>
          )}

          {/* ボタン行 */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                isAnsweringRef.current = false;
                dispatch({ type: 'BACK' });
              }}
              className="rounded-xl bg-slate-100 px-4 py-4 font-bold text-slate-600 hover:bg-slate-200 transition-colors whitespace-nowrap"
              aria-label="問題に戻る"
            >
              再回答
            </button>
            <button
              onClick={() => {
                isAnsweringRef.current = false;
                dispatch({ type: 'NEXT' });
              }}
              className="flex-1 rounded-xl bg-indigo-600 py-4 text-white text-lg font-bold hover:bg-indigo-700 transition-colors"
            >
              {state.currentIndex + 1 < state.problems.length ? '次の問題へ' : '結果を見る'}
            </button>
          </div>
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
