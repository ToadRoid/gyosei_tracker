'use client';

import { useState, useEffect, useReducer, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, getReadyProblems, upsertAttempt } from '@/lib/db';
import { subjects, chapters } from '@/data/master';
import type { ProblemForExercise, ExerciseResult, ExercisePhase } from '@/types';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';

const REPORT_TYPES = [
  { value: 'ocr', label: '文字の抜け・誤字' },
  { value: 'answer', label: '正誤の誤り' },
  { value: 'explanation', label: '解説の誤り' },
  { value: 'other', label: 'その他' },
] as const;

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
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const lapNoRef = useRef(1);
  const isAnsweringRef = useRef(false);

  // 記述式
  const [descriptiveText, setDescriptiveText] = useState('');
  const [descriptiveRevealed, setDescriptiveRevealed] = useState(false);

  // AI深掘りコピー状態
  const [aiCopied, setAiCopied] = useState<string | null>(null); // コピー先サービス名
  const [aiFallbackPrompt, setAiFallbackPrompt] = useState<string | null>(null);

  // 報告モーダル
  const [reportOpen, setReportOpen] = useState(false);
  const [reportFromAnswering, setReportFromAnswering] = useState(false);
  const [reportType, setReportType] = useState<string>('ocr');
  const [reportComment, setReportComment] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const openReport = (fromAnswering: boolean) => {
    setReportFromAnswering(fromAnswering);
    setReportOpen(true);
  };

  const handleSendReport = async () => {
    if (!supabase || !user || !current) return;
    setReportSending(true);
    try {
      await supabase.from('error_reports').insert({
        user_id: user.id,
        problem_id: current.problemId,
        report_type: reportType,
        comment: reportComment,
        question_text: current.cleanedText || current.rawText || '',
        status: 'pending',
      });
      setReportSent(true);
      setTimeout(() => {
        setReportOpen(false);
        setReportSent(false);
        setReportComment('');
        setReportType('ocr');
        // 回答フェーズから報告した場合はスキップ
        if (reportFromAnswering) {
          dispatch({ type: 'NEXT' });
        }
      }, 1000);
    } catch (e) {
      console.error('報告の送信に失敗:', e);
    } finally {
      setReportSending(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    isAnsweringRef.current = false;
    (async () => {
      const subjectId = searchParams.get('subject') || undefined;
      const chapterId = searchParams.get('chapter') || undefined;
      const sectionTitle = searchParams.get('section') || undefined;
      const lapNo = Number(searchParams.get('lap') || '1');

      let problems = await getReadyProblems(subjectId, chapterId, sectionTitle);
      const isRandom = searchParams.get('random') === '1';

      // 今の周で既に回答済みの problemId を除外（途中再開は未回答のみ出題）
      const answeredInLap = await db.attempts
        .where('lapNo').equals(lapNo)
        .toArray();
      const answeredIds = new Set(
        answeredInLap
          .filter((a) => problems.some((p) => p.problemId === a.problemId))
          .map((a) => a.problemId),
      );
      const unanswered = problems.filter((p) => !answeredIds.has(p.problemId));
      // 未回答が一部ある場合（途中再開）→ 未回答のみ
      if (unanswered.length > 0 && unanswered.length < problems.length) {
        problems = unanswered;
      }

      if (isRandom) {
        for (let i = problems.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [problems[i], problems[j]] = [problems[j], problems[i]];
        }
      } else {
        problems = problems.slice().sort((a, b) =>
          a.problemId.localeCompare(b.problemId),
        );
      }

      lapNoRef.current = lapNo;
      dispatch({ type: 'INIT', problems, lapNo });
      setLoading(false);
    })();
  }, [searchParams]);

  // 記述式: 問題が変わったらリセット
  useEffect(() => {
    setDescriptiveText('');
    setDescriptiveRevealed(false);
  }, [state.currentIndex, state.phase === 'answering']);

  const handleAnswer = async (userAnswer: boolean) => {
    if (isAnsweringRef.current) return;
    isAnsweringRef.current = true;

    const p = state.problems[state.currentIndex];
    // 記述式は自己採点（userAnswerがそのまま正誤）
    const isCorrect = p.questionType === 'descriptive' ? userAnswer : userAnswer === p.answerBoolean;
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
        {(current.displaySectionTitle || current.sectionTitle) && (
          <p className="text-xs text-slate-500 pl-1">{current.displaySectionTitle || current.sectionTitle}</p>
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
        current.questionType === 'descriptive' ? (
          /* 記述式UI */
          <div className="space-y-3 pb-4">
            <textarea
              value={descriptiveText}
              onChange={(e) => setDescriptiveText(e.target.value)}
              placeholder="解答を書いてみましょう（任意）"
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed resize-none focus:outline-none focus:border-indigo-400"
            />
            {!descriptiveRevealed ? (
              <button
                onClick={() => setDescriptiveRevealed(true)}
                className="w-full rounded-xl bg-amber-500 py-4 text-white font-bold text-lg hover:bg-amber-600 transition-colors"
              >
                解答を見る
              </button>
            ) : (
              <div className="space-y-3">
                {current.explanationText && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">模範解答</p>
                    <p className="text-sm leading-relaxed text-slate-700">{current.explanationText}</p>
                  </div>
                )}
                <p className="text-sm text-center text-slate-500 font-medium">自己採点してください</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleAnswer(true)}
                    className="flex-1 rounded-xl bg-green-50 border-2 border-green-200 py-5 text-2xl font-black text-green-600 hover:bg-green-100 transition-colors"
                  >
                    ◯ 書けた
                  </button>
                  <button
                    onClick={() => handleAnswer(false)}
                    className="flex-1 rounded-xl bg-red-50 border-2 border-red-200 py-5 text-2xl font-black text-red-500 hover:bg-red-100 transition-colors"
                  >
                    ✗ 書けなかった
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              {state.currentIndex > 0 && (
                <button
                  onClick={() => dispatch({ type: 'BACK' })}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  ← 前の問題の解説を見る
                </button>
              )}
              <button
                onClick={() => openReport(true)}
                className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-slate-400 hover:text-red-400 hover:border-red-200 transition-colors"
                aria-label="問題を報告してスキップ"
              >
                🚩
              </button>
            </div>
          </div>
        ) : (
        /* 通常○×UI */
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
          <div className="flex gap-3">
            {state.currentIndex > 0 && (
              <button
                onClick={() => dispatch({ type: 'BACK' })}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ← 前の問題の解説を見る
              </button>
            )}
            <button
              onClick={() => openReport(true)}
              className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-slate-400 hover:text-red-400 hover:border-red-200 transition-colors"
              aria-label="問題を報告してスキップ"
            >
              🚩
            </button>
          </div>
        </div>
        )
      ) : (
        <div className="space-y-4 pb-8">
          {/* 正解 / 不正解バナー */}
          {current.questionType === 'descriptive' ? (
            <div className={`rounded-xl p-4 text-center ${lastResult?.isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <span className="text-3xl">{lastResult?.isCorrect ? '✍️ 書けた!' : '📝 要復習'}</span>
              <p className="text-xs text-slate-400 mt-1">記述式（自己採点）</p>
            </div>
          ) : (
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
          )}

          {/* 解説 */}
          {current.explanationText && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">解説</p>
              <p className="text-sm leading-relaxed text-slate-700">{current.explanationText}</p>
            </div>
          )}

          {/* AIで深掘り（ChatGPT / Gemini） */}
          {(() => {
            const buildPrompt = () => {
              const questionText = current.cleanedText || current.rawText || '';
              const explanation = current.explanationText || '';
              const correctAnswer = current.answerBoolean ? '○' : '×';
              const userAnswer = lastResult?.userAnswer ? '○' : '×';
              const isCorrect = lastResult?.isCorrect;
              return `行政書士試験の問題について、深く理解できるよう詳しく解説してください。

【問題文】
${questionText}

【正解】${correctAnswer}
【私の回答】${userAnswer}（${isCorrect ? '正解' : '不正解'}）

${explanation ? `【テキストの解説】\n${explanation}\n` : ''}
以下の観点で解説してください：
1. この問題の正解の根拠（条文・判例）
2. なぜ${correctAnswer}なのか、具体的な理由
${!isCorrect ? `3. 私が${userAnswer}と判断した場合、どんな誤解をしている可能性があるか\n4. 同じ間違いをしないための判断基準` : '3. この論点で間違えやすいパターン\n4. 関連する重要判例や条文'}
5. 類似の論点との区別ポイント`;
            };

            const handleAiClick = async (name: string, url: string) => {
              const prompt = buildPrompt();
              try {
                await navigator.clipboard.writeText(prompt);
                setAiCopied(name);
                setAiFallbackPrompt(null);
                setTimeout(() => setAiCopied(null), 3000);
                window.open(url, '_blank');
              } catch {
                setAiFallbackPrompt(prompt);
              }
            };

            const services = [
              { name: 'ChatGPT', url: 'https://chatgpt.com/', emoji: '🤖', btnClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100', openClass: 'bg-emerald-600' },
              { name: 'Gemini', url: 'https://gemini.google.com/app', emoji: '✨', btnClass: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100', openClass: 'bg-blue-600' },
            ];

            return (
              <>
                <div className="flex gap-2">
                  {services.map((svc) => (
                    <button
                      key={svc.name}
                      onClick={() => handleAiClick(svc.name, svc.url)}
                      className={`flex-1 rounded-xl border-2 ${svc.btnClass} px-3 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-1.5`}
                    >
                      <span>{svc.emoji}</span>
                      <span>{aiCopied === svc.name ? 'コピー済み!' : svc.name}</span>
                    </button>
                  ))}
                </div>
                {aiCopied && (
                  <p className="text-xs text-center text-slate-500">プロンプトをコピーしました。{aiCopied}に貼り付けてください</p>
                )}
                {aiFallbackPrompt && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">自動コピーできませんでした。下のテキストを長押しでコピーして貼り付けてください。</p>
                    <textarea
                      readOnly
                      value={aiFallbackPrompt}
                      className="w-full h-32 text-xs border border-slate-200 rounded-lg p-2 text-slate-600"
                      onFocus={(e) => e.target.select()}
                    />
                    <div className="flex gap-2">
                      {services.map((svc) => (
                        <button
                          key={svc.name}
                          onClick={() => window.open(svc.url, '_blank')}
                          className={`flex-1 rounded-lg ${svc.openClass} text-white py-2 text-sm font-bold`}
                        >
                          {svc.name}を開く
                        </button>
                      ))}
                      <button
                        onClick={() => setAiFallbackPrompt(null)}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-500"
                      >
                        閉じる
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

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
              onClick={() => openReport(false)}
              className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-4 text-slate-400 hover:text-red-400 hover:border-red-200 transition-colors text-lg"
              aria-label="問題を報告"
              title="問題を報告"
            >
              🚩
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

      {/* 報告モーダル */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">
              問題を報告{reportFromAnswering ? '・スキップ' : ''}
            </h3>
              <button
                onClick={() => { setReportOpen(false); setReportComment(''); setReportType('ocr'); }}
                className="text-slate-400 text-xl"
              >✕</button>
            </div>

            <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-2 line-clamp-2">
              {current?.cleanedText || current?.rawText}
            </p>

            {/* 報告タイプ */}
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setReportType(t.value)}
                  className={`rounded-xl py-2.5 text-sm font-medium border transition-colors ${
                    reportType === t.value
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* コメント */}
            <textarea
              value={reportComment}
              onChange={(e) => setReportComment(e.target.value)}
              placeholder="具体的な内容（任意）"
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-400"
            />

            <button
              onClick={handleSendReport}
              disabled={reportSending || reportSent}
              className={`w-full rounded-xl py-3 font-bold transition-colors ${
                reportSent
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50'
              }`}
            >
              {reportSent ? '送信しました ✓' : reportSending ? '送信中...' : '報告を送信'}
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
