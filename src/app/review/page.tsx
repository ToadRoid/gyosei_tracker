'use client';

import { useState, useEffect, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/components/AuthProvider';
import { buildReviewPackInput } from '@/lib/review-pack-builder';
import type { ReviewPack, ReviewTheme } from '@/types/review-pack';

// ── ThemeCard ──────────────────────────────────────────────────────────────

interface ThemeCardProps {
  theme: ReviewTheme;
  idx: number;
  expanded: boolean;
  onToggle: () => void;
  quizAnswers: Record<string, string>;
  quizRevealed: Record<string, boolean>;
  setQuizAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setQuizRevealed: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

function PriorityBadge({ priority }: { priority: ReviewTheme['priority'] }) {
  const map = {
    high: { label: '高', cls: 'bg-red-100 text-red-700' },
    medium: { label: '中', cls: 'bg-amber-100 text-amber-700' },
    low: { label: '低', cls: 'bg-green-100 text-green-700' },
  } as const;
  const { label, cls } = map[priority];
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
      優先度 {label}
    </span>
  );
}

function ThemeCard({
  theme,
  idx,
  expanded,
  onToggle,
  quizAnswers,
  quizRevealed,
  setQuizAnswers,
  setQuizRevealed,
}: ThemeCardProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 space-y-1"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={theme.priority} />
          <span className="font-bold text-slate-800 text-sm">{theme.themeName}</span>
        </div>
        <p className="text-xs text-slate-400">
          {theme.subjectName} &gt; {theme.chapterName} &gt; {theme.sectionTitle}
        </p>
        <p className="text-xs text-slate-400 text-right">{expanded ? '▲ 閉じる' : '▼ 詳細を見る'}</p>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {/* Weak point */}
          <p className="text-sm italic text-slate-600">{theme.weakPoint}</p>

          {/* Key points */}
          {theme.keyPoints.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">要点整理</p>
              <ul className="space-y-1">
                {theme.keyPoints.map((kp, ki) => (
                  <li key={ki} className="text-sm text-slate-700 flex gap-1">
                    <span className="text-indigo-400 shrink-0">•</span>
                    <span>{kp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Typical traps */}
          {theme.typicalTraps.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">ひっかけ</p>
              <ul className="space-y-1">
                {theme.typicalTraps.map((trap, ti) => (
                  <li key={ti} className="text-sm text-slate-700 flex gap-1">
                    <span className="text-amber-400 shrink-0">•</span>
                    <span>{trap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Distinction points */}
          {theme.distinctionPoints.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">区別論点</p>
              <ul className="space-y-1">
                {theme.distinctionPoints.map((dp, di) => (
                  <li key={di} className="text-sm text-slate-700 flex gap-1">
                    <span className="text-blue-400 shrink-0">•</span>
                    <span>{dp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Quiz */}
          {theme.quickQuiz.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">確認クイズ</p>
              <div className="space-y-3">
                {theme.quickQuiz.map((quiz, qi) => {
                  const key = `${idx}-${qi}`;
                  const revealed = quizRevealed[key] ?? false;
                  const chosen = quizAnswers[key];
                  return (
                    <div key={qi} className="rounded-lg bg-slate-50 p-3 space-y-2">
                      <p className="text-sm text-slate-700">{quiz.question}</p>
                      {!revealed ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setQuizAnswers((prev) => ({ ...prev, [key]: '○' }));
                              setQuizRevealed((prev) => ({ ...prev, [key]: true }));
                            }}
                            className="flex-1 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-white"
                          >
                            ○
                          </button>
                          <button
                            onClick={() => {
                              setQuizAnswers((prev) => ({ ...prev, [key]: '×' }));
                              setQuizRevealed((prev) => ({ ...prev, [key]: true }));
                            }}
                            className="flex-1 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-white"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-bold">
                            正解:{' '}
                            <span
                              className={
                                quiz.answer === '○' ? 'text-green-600' : 'text-red-600'
                              }
                            >
                              {quiz.answer}
                            </span>
                            {chosen && (
                              <span
                                className={
                                  chosen === quiz.answer
                                    ? 'ml-2 text-green-600'
                                    : 'ml-2 text-red-600'
                                }
                              >
                                {chosen === quiz.answer ? '（正解）' : '（不正解）'}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-600">{quiz.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Page reference */}
          {theme.pageRefAnswer && (
            <p className="text-xs text-slate-500">📖 解説ページ p.{theme.pageRefAnswer}</p>
          )}

          {/* Related problems */}
          {theme.relatedProblemIds.length > 0 && (
            <p className="text-xs text-slate-500">
              関連問題 {theme.relatedProblemIds.length}問 → 演習する
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── ReviewPage ─────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const { user } = useAuth();
  const [pack, setPack] = useState<ReviewPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizRevealed, setQuizRevealed] = useState<Record<string, boolean>>({});

  // Fetch latest pack on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch(`/api/review-pack/latest?userId=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.record?.packJson) {
          setPack(data.record.packJson as ReviewPack);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch latest review pack:', err);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleGenerate = useCallback(async () => {
    if (!user) {
      setError('ログインが必要です');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const input = await buildReviewPackInput();
      const res = await fetch('/api/review-pack/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, input }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setPack(data.pack as ReviewPack);
      // Reset quiz state on new pack
      setQuizAnswers({});
      setQuizRevealed({});
      setExpandedTheme(null);
    } catch (err) {
      console.error('Review pack generation error:', err);
      setError(
        err instanceof Error ? err.message : '生成に失敗しました。時間をおいて再試行してください。',
      );
    } finally {
      setGenerating(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">復習パック</h1>
        <p className="text-sm text-slate-500 mt-1">AIが弱点を分析し、今学ぶべき内容を生成します</p>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold disabled:opacity-50"
      >
        {generating ? '生成中... (10〜20秒)' : pack ? '再生成する' : '復習パックを生成'}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!pack && !generating && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">📦</div>
          <p>まだ復習パックがありません</p>
          <p className="text-sm mt-1">演習を進めてから生成してください</p>
        </div>
      )}

      {/* Pack display */}
      {pack && (
        <>
          {/* Overall comment */}
          <div className="bg-indigo-50 rounded-xl p-4">
            <p className="text-sm text-indigo-800">{pack.overallComment}</p>
            <p className="text-xs text-slate-400 mt-2">
              生成日時: {new Date(pack.generatedAt).toLocaleString('ja-JP')}
            </p>
          </div>

          {/* Theme cards */}
          {pack.themes.map((theme, idx) => (
            <ThemeCard
              key={idx}
              theme={theme}
              idx={idx}
              expanded={expandedTheme === idx}
              onToggle={() => setExpandedTheme(expandedTheme === idx ? null : idx)}
              quizAnswers={quizAnswers}
              quizRevealed={quizRevealed}
              setQuizAnswers={setQuizAnswers}
              setQuizRevealed={setQuizRevealed}
            />
          ))}
        </>
      )}

      <NavBar />
    </div>
  );
}
