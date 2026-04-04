'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/components/AuthProvider';
import { buildReviewPackInput } from '@/lib/review-pack-builder';
import { db } from '@/lib/db';
import type { ReviewPack, ReviewTheme } from '@/types/review-pack';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim()).filter(Boolean);

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const LS_KEY = (userId: string) => `review_pack_cache_${userId}`;

function savePack(userId: string, pack: ReviewPack) {
  try {
    localStorage.setItem(LS_KEY(userId), JSON.stringify(pack));
  } catch {}
}

function loadCachedPack(userId: string): ReviewPack | null {
  try {
    const raw = localStorage.getItem(LS_KEY(userId));
    return raw ? (JSON.parse(raw) as ReviewPack) : null;
  } catch {
    return null;
  }
}

// ── Section block ──────────────────────────────────────────────────────────

function SectionBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      {children}
    </div>
  );
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-slate-700 flex gap-1.5">
          <span className={`shrink-0 ${color}`}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── QuickQuiz ──────────────────────────────────────────────────────────────

interface QuizState {
  answers: Record<string, string>;
  revealed: Record<string, boolean>;
}

function QuickQuizSection({
  theme,
  themeIdx,
  quizState,
  setQuizState,
}: {
  theme: ReviewTheme;
  themeIdx: number;
  quizState: QuizState;
  setQuizState: React.Dispatch<React.SetStateAction<QuizState>>;
}) {
  if (theme.quickQuiz.length === 0) return null;

  return (
    <SectionBlock label="5. 確認クイズ">
      <div className="space-y-3">
        {theme.quickQuiz.map((quiz, qi) => {
          const key = `${themeIdx}-${qi}`;
          const revealed = quizState.revealed[key] ?? false;
          const chosen = quizState.answers[key];
          return (
            <div key={qi} className="rounded-lg bg-slate-50 p-3 space-y-2">
              <p className="text-sm text-slate-700">{quiz.question}</p>
              {!revealed ? (
                <div className="flex gap-2">
                  {(['○', '×'] as const).map((ans) => (
                    <button
                      key={ans}
                      onClick={() =>
                        setQuizState((prev) => ({
                          answers: { ...prev.answers, [key]: ans },
                          revealed: { ...prev.revealed, [key]: true },
                        }))
                      }
                      className="flex-1 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-white"
                    >
                      {ans}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-bold">
                    正解:{' '}
                    <span className={quiz.answer === '○' ? 'text-green-600' : 'text-red-600'}>
                      {quiz.answer}
                    </span>
                    {chosen && (
                      <span className={chosen === quiz.answer ? 'ml-2 text-green-600' : 'ml-2 text-red-600'}>
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
    </SectionBlock>
  );
}

// ── ThemeCard ──────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: ReviewTheme['priority'] }) {
  const map = {
    high: { label: '優先度 高', cls: 'bg-red-100 text-red-700' },
    medium: { label: '優先度 中', cls: 'bg-amber-100 text-amber-700' },
    low: { label: '優先度 低', cls: 'bg-green-100 text-green-700' },
  } as const;
  const { label, cls } = map[priority];
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function ThemeCard({
  theme,
  idx,
  expanded,
  onToggle,
  quizState,
  setQuizState,
  copiedTheme,
  setCopiedTheme,
  fallbackPrompt,
  setFallbackPrompt,
}: {
  theme: ReviewTheme;
  idx: number;
  expanded: boolean;
  onToggle: () => void;
  quizState: QuizState;
  setQuizState: React.Dispatch<React.SetStateAction<QuizState>>;
  copiedTheme: number | null;
  setCopiedTheme: React.Dispatch<React.SetStateAction<number | null>>;
  fallbackPrompt: { idx: number; text: string } | null;
  setFallbackPrompt: React.Dispatch<React.SetStateAction<{ idx: number; text: string } | null>>;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button onClick={onToggle} className="w-full text-left p-4 space-y-1">
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
        <div className="border-t border-slate-100 p-4 space-y-5">

          {/* 1. 概要 */}
          <SectionBlock label="1. 概要">
            <p className="text-sm text-slate-700 leading-relaxed">{theme.overview}</p>
          </SectionBlock>

          {/* 2. 全体の位置づけ */}
          <SectionBlock label="2. 全体の位置づけ">
            <p className="text-sm text-slate-700 leading-relaxed">{theme.positioning}</p>
          </SectionBlock>

          {/* 3. 弱点診断 */}
          <SectionBlock label="3. 今回の弱点診断">
            <div className="rounded-lg bg-red-50 border border-red-100 p-3">
              <p className="text-sm text-red-800 leading-relaxed">{theme.weakDiagnosis}</p>
            </div>
          </SectionBlock>

          {/* 4. ピンポイント解説 */}
          <SectionBlock label="4. ピンポイント解説">
            <p className="text-sm text-slate-700 leading-relaxed">{theme.pinpointExplanation}</p>

            {theme.judgmentCriteria.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-indigo-500">判断基準</p>
                <BulletList items={theme.judgmentCriteria} color="text-indigo-400" />
              </div>
            )}
            {theme.typicalTraps.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-amber-500">典型ひっかけ</p>
                <BulletList items={theme.typicalTraps} color="text-amber-400" />
              </div>
            )}
            {theme.distinctionPoints.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-blue-500">区別ポイント</p>
                <BulletList items={theme.distinctionPoints} color="text-blue-400" />
              </div>
            )}
          </SectionBlock>

          {/* 5. 仕上げ */}
          <SectionBlock label="5. 仕上げ">
            {/* 一文まとめ */}
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3">
              <p className="text-sm font-semibold text-indigo-800">{theme.oneLiner}</p>
            </div>

            {/* 確認クイズ */}
            <QuickQuizSection
              theme={theme}
              themeIdx={idx}
              quizState={quizState}
              setQuizState={setQuizState}
            />

            {/* 関連問題 / ページ参照 */}
            <div className="flex flex-wrap gap-3 text-xs text-slate-400 pt-1">
              {theme.relatedProblemIds.length > 0 && (
                <span>関連問題 {theme.relatedProblemIds.length}問</span>
              )}
              {theme.pageRefAnswer && <span>📖 解説 p.{theme.pageRefAnswer}</span>}
            </div>
          </SectionBlock>

          {/* ChatGPTで深掘り */}
          <button
            onClick={async () => {
              // Fetch actual problem data + attempts for this theme
              const ids = theme.relatedProblemIds;
              const [problems, attrs, attempts] = await Promise.all([
                db.problems.where('problemId').anyOf(ids).toArray(),
                db.problemAttrs.where('problemId').anyOf(ids).toArray(),
                db.attempts.where('problemId').anyOf(ids).toArray(),
              ]);
              const attrMap = new Map(attrs.map((a) => [a.problemId, a]));
              // Latest attempt per problem
              const latestAttempt = new Map<string, typeof attempts[number]>();
              for (const a of attempts) {
                const existing = latestAttempt.get(a.problemId);
                if (!existing || a.answeredAt > existing.answeredAt) {
                  latestAttempt.set(a.problemId, a);
                }
              }

              const problemLines = problems.map((p) => {
                const attr = attrMap.get(p.problemId);
                const attempt = latestAttempt.get(p.problemId);
                const qText = p.cleanedText || p.rawText || '';
                const correctAns = attr?.answerBoolean ? '○' : '×';
                const userAns = attempt ? (attempt.userAnswer ? '○' : '×') : '未回答';
                const result = attempt ? (attempt.isCorrect ? '正解' : '不正解') : '未回答';
                const rawExp = p.rawExplanationText ?? '';
                const explanation = attr?.explanationText || (rawExp.startsWith('[解説読取困難') ? '' : rawExp);
                return `問題: ${qText}
正解: ${correctAns} / 私の回答: ${userAns}（${result}）
${explanation ? `解説: ${explanation}` : ''}`;
              }).join('\n---\n');

              const prompt = `行政書士試験の以下のテーマについて、試験に合格できるレベルまで深く詳しく解説してください。

【テーマ】${theme.themeName}
【科目】${theme.subjectName} > ${theme.chapterName} > ${theme.sectionTitle}

【弱点診断】
${theme.weakDiagnosis}

【この分野で私が解いた問題と結果】
${problemLines}

以下の観点で解説してください：
1. 根拠となる条文と趣旨（なぜこのルールが存在するか）
2. 重要判例（判例名・事案の概要・判旨のポイント）
3. 私が間違えた問題について、なぜ間違えたのか・どう考えれば正解できたか
4. 正解した問題も含め、この分野の知識を体系的に整理
5. 試験で問われる典型パターンと解き方のコツ
6. 類似論点との比較表（混同しやすいものを整理）
7. この分野で確実に得点するために覚えるべきことリスト`;

              try {
                await navigator.clipboard.writeText(prompt);
                setCopiedTheme(idx);
                setTimeout(() => setCopiedTheme(null), 3000);
                window.open('https://chatgpt.com/', '_blank');
              } catch {
                // クリップボード失敗時（iOS Safari等）→ テキスト表示
                setFallbackPrompt({ idx, text: prompt });
              }
            }}
            className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
          >
            <span>🤖</span>
            <span>{copiedTheme === idx ? 'コピー済み → ChatGPTに貼り付けてください' : 'ChatGPTでもっと深く学ぶ'}</span>
          </button>
          {fallbackPrompt?.idx === idx && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">自動コピーできませんでした。下のテキストを長押しでコピーしてChatGPTに貼り付けてください。</p>
              <textarea
                readOnly
                value={fallbackPrompt.text}
                className="w-full h-32 text-xs border border-slate-200 rounded-lg p-2 text-slate-600"
                onFocus={(e) => e.target.select()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.open('https://chatgpt.com/', '_blank');
                  }}
                  className="flex-1 rounded-lg bg-emerald-600 text-white py-2 text-sm font-bold"
                >
                  ChatGPTを開く
                </button>
                <button
                  onClick={() => setFallbackPrompt(null)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-500"
                >
                  閉じる
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ReviewPage ─────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const { user } = useAuth();
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);
  const [pack, setPack] = useState<ReviewPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({ answers: {}, revealed: {} });
  const [copiedTheme, setCopiedTheme] = useState<number | null>(null);
  const [fallbackPrompt, setFallbackPrompt] = useState<{ idx: number; text: string } | null>(null);

  // クールダウン残り時間（非管理者のみ）
  const cooldownRemaining = useMemo(() => {
    if (isAdmin || !pack?.generatedAt) return 0;
    const elapsed = Date.now() - new Date(pack.generatedAt).getTime();
    return Math.max(0, COOLDOWN_MS - elapsed);
  }, [isAdmin, pack?.generatedAt]);

  const cooldownLabel = useMemo(() => {
    if (cooldownRemaining <= 0) return '';
    const h = Math.floor(cooldownRemaining / (60 * 60 * 1000));
    const m = Math.floor((cooldownRemaining % (60 * 60 * 1000)) / 60000);
    return h > 0 ? `あと${h}時間後に再生成可能` : `あと${m}分後に再生成可能`;
  }, [cooldownRemaining]);

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
        } else {
          // Supabase取得失敗 or 未保存 → localStorageから復元
          const cached = loadCachedPack(user.id);
          if (cached) setPack(cached);
        }
      })
      .catch(() => {
        const cached = loadCachedPack(user.id);
        if (cached) setPack(cached);
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
        body: JSON.stringify({ userId: user.id, userEmail: user.email, input }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const newPack = data.pack as ReviewPack;
      setPack(newPack);
      savePack(user.id, newPack);
      setQuizState({ answers: {}, revealed: {} });
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
        <p className="text-sm text-slate-500 mt-1">AIが弱点を分析し、概要から丁寧に解説します</p>
      </div>

      {/* Generate button */}
      <div className="space-y-1">
        <button
          onClick={handleGenerate}
          disabled={generating || (!isAdmin && cooldownRemaining > 0)}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold disabled:opacity-40"
        >
          {generating ? '生成中... (10〜20秒)' : pack ? '再生成する' : '復習パックを生成'}
        </button>
        {!isAdmin && cooldownRemaining > 0 && (
          <p className="text-xs text-center text-slate-400">{cooldownLabel}</p>
        )}
      </div>

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
          <div className="bg-indigo-50 rounded-xl p-4">
            <p className="text-sm text-indigo-800">{pack.overallComment}</p>
            <p className="text-xs text-slate-400 mt-2">
              生成日時: {new Date(pack.generatedAt).toLocaleString('ja-JP')}
            </p>
          </div>

          {pack.themes.map((theme, idx) => (
            <ThemeCard
              key={idx}
              theme={theme}
              idx={idx}
              expanded={expandedTheme === idx}
              onToggle={() => setExpandedTheme(expandedTheme === idx ? null : idx)}
              quizState={quizState}
              setQuizState={setQuizState}
              copiedTheme={copiedTheme}
              setCopiedTheme={setCopiedTheme}
              fallbackPrompt={fallbackPrompt}
              setFallbackPrompt={setFallbackPrompt}
            />
          ))}
        </>
      )}

      <NavBar />
    </div>
  );
}
