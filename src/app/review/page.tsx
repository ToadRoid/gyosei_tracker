'use client';

import { useState, useEffect, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import { buildReviewPackInput } from '@/lib/review-pack-builder';
import { getOverallStats } from '@/lib/stats';
import { db } from '@/lib/db';
import type { ReviewPackInput, WeakTopicInput, QuestionExample } from '@/types/review-pack';

// ── AI Deep Dive ──────────────────────────────────────────────────────────

const AI_SERVICES = [
  { name: 'ChatGPT', url: 'https://chatgpt.com/', emoji: '🤖', btnClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100', openClass: 'bg-emerald-600' },
  { name: 'Gemini', url: 'https://gemini.google.com/app', emoji: '✨', btnClass: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100', openClass: 'bg-blue-600' },
] as const;

async function buildDeepDivePrompt(topic: WeakTopicInput): Promise<string> {
  const ids = topic.candidateProblemIds;
  const [problems, attrs, attempts] = await Promise.all([
    db.problems.where('problemId').anyOf(ids).toArray(),
    db.problemAttrs.where('problemId').anyOf(ids).toArray(),
    db.attempts.where('problemId').anyOf(ids).toArray(),
  ]);
  const attrMap = new Map(attrs.map((a) => [a.problemId, a]));
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
    return `問題: ${qText}\n正解: ${correctAns} / 私の回答: ${userAns}（${result}）\n${explanation ? `解説: ${explanation}` : ''}`;
  }).join('\n---\n');

  const accPct = Math.round(topic.accuracy * 100);

  return `行政書士試験の以下のテーマについて、試験に合格できるレベルまで深く詳しく解説してください。

【テーマ】${topic.sectionTitle}
【科目】${topic.subjectName} > ${topic.chapterName}
【正答率】${accPct}%（${topic.totalAttempts}問回答）

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
}

function AiDeepDiveButtons({
  topic,
  idx,
  copiedIdx,
  setCopiedIdx,
  fallbackPrompt,
  setFallbackPrompt,
}: {
  topic: WeakTopicInput;
  idx: number;
  copiedIdx: number | null;
  setCopiedIdx: React.Dispatch<React.SetStateAction<number | null>>;
  fallbackPrompt: { idx: number; text: string } | null;
  setFallbackPrompt: React.Dispatch<React.SetStateAction<{ idx: number; text: string } | null>>;
}) {
  const handleClick = async (serviceUrl: string) => {
    const prompt = await buildDeepDivePrompt(topic);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 3000);
      window.open(serviceUrl, '_blank');
    } catch {
      setFallbackPrompt({ idx, text: prompt });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {AI_SERVICES.map((svc) => (
          <button
            key={svc.name}
            onClick={() => handleClick(svc.url)}
            className={`flex-1 rounded-xl border-2 ${svc.btnClass} px-3 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-1.5`}
          >
            <span>{svc.emoji}</span>
            <span>{copiedIdx === idx ? 'コピー済み!' : svc.name}</span>
          </button>
        ))}
      </div>
      {copiedIdx === idx && (
        <p className="text-xs text-center text-slate-500">プロンプトをコピーしました。開いたページに貼り付けてください</p>
      )}
      {fallbackPrompt?.idx === idx && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">自動コピーできませんでした。下のテキストを長押しでコピーして貼り付けてください。</p>
          <textarea
            readOnly
            value={fallbackPrompt.text}
            className="w-full h-32 text-xs border border-slate-200 rounded-lg p-2 text-slate-600"
            onFocus={(e) => e.target.select()}
          />
          <div className="flex gap-2">
            {AI_SERVICES.map((svc) => (
              <button
                key={svc.name}
                onClick={() => window.open(svc.url, '_blank')}
                className={`flex-1 rounded-lg ${svc.openClass} text-white py-2 text-sm font-bold`}
              >
                {svc.name}を開く
              </button>
            ))}
            <button
              onClick={() => setFallbackPrompt(null)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Accuracy Badge ────────────────────────────────────────────────────────

function AccuracyBadge({ accuracy }: { accuracy: number }) {
  const pct = Math.round(accuracy * 100);
  const cls =
    pct >= 80 ? 'bg-green-100 text-green-700' :
    pct >= 60 ? 'bg-amber-100 text-amber-700' :
    pct >= 40 ? 'bg-orange-100 text-orange-700' :
    'bg-red-100 text-red-700';
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{pct}%</span>;
}

// ── Question Row ──────────────────────────────────────────────────────────

function QuestionRow({ q }: { q: QuestionExample }) {
  const icon = q.isCorrect ? '✓' : '✗';
  const iconCls = q.isCorrect ? 'text-green-500' : 'text-red-500';
  const text = q.questionText.length > 60 ? q.questionText.slice(0, 60) + '…' : q.questionText;

  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className={`text-sm font-bold shrink-0 ${iconCls}`}>{icon}</span>
      <p className="text-xs text-slate-600 flex-1 leading-relaxed">{text}</p>
      <span className="text-xs text-slate-400 shrink-0">{q.responseTimeSec}秒</span>
    </div>
  );
}

// ── Topic Card ────────────────────────────────────────────────────────────

function TopicCard({
  topic,
  idx,
  expanded,
  onToggle,
  copiedIdx,
  setCopiedIdx,
  fallbackPrompt,
  setFallbackPrompt,
}: {
  topic: WeakTopicInput;
  idx: number;
  expanded: boolean;
  onToggle: () => void;
  copiedIdx: number | null;
  setCopiedIdx: React.Dispatch<React.SetStateAction<number | null>>;
  fallbackPrompt: { idx: number; text: string } | null;
  setFallbackPrompt: React.Dispatch<React.SetStateAction<{ idx: number; text: string } | null>>;
}) {
  const accPct = Math.round(topic.accuracy * 100);
  const wrongCount = topic.questionExamples.filter((q) => !q.isCorrect).length;
  const correctCount = topic.questionExamples.filter((q) => q.isCorrect).length;

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button onClick={onToggle} className="w-full text-left p-4 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <AccuracyBadge accuracy={topic.accuracy} />
          <span className="font-bold text-slate-800 text-sm">{topic.sectionTitle}</span>
        </div>
        <p className="text-xs text-slate-400">
          {topic.subjectName} &gt; {topic.chapterName}
        </p>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{topic.totalAttempts}問回答</span>
          <span className="text-red-400">✗ {wrongCount}</span>
          <span className="text-green-400">✓ {correctCount}</span>
          {topic.improvement !== null && (
            <span className={topic.improvement >= 0 ? 'text-green-500' : 'text-red-500'}>
              {topic.improvement >= 0 ? '↑' : '↓'}{Math.abs(Math.round(topic.improvement * 100))}%
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 text-right">{expanded ? '▲ 閉じる' : '▼ 詳細を見る'}</p>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">

          {/* 周回別成績 */}
          {topic.lapStats.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-500">周回別成績</p>
              <div className="flex gap-2 flex-wrap">
                {topic.lapStats.map((lap) => (
                  <div key={lap.lapNo} className="rounded-lg bg-slate-50 px-3 py-1.5 text-center">
                    <p className="text-xs text-slate-400">{lap.lapNo}周目</p>
                    <p className="text-sm font-bold text-slate-700">{Math.round(lap.accuracy * 100)}%</p>
                    <p className="text-xs text-slate-400">{lap.attempts}問</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 問題一覧 */}
          {topic.questionExamples.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500">問題一覧</p>
              <div className="divide-y divide-slate-100">
                {topic.questionExamples.map((q) => (
                  <QuestionRow key={q.problemId} q={q} />
                ))}
              </div>
            </div>
          )}

          {/* ページ参照 */}
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            {topic.candidateProblemIds.length > 0 && (
              <span>関連問題 {topic.candidateProblemIds.length}問</span>
            )}
            {topic.pageRefAnswer && <span>📖 解説 p.{topic.pageRefAnswer}</span>}
          </div>

          {/* AIで深掘り */}
          <AiDeepDiveButtons
            topic={topic}
            idx={idx}
            copiedIdx={copiedIdx}
            setCopiedIdx={setCopiedIdx}
            fallbackPrompt={fallbackPrompt}
            setFallbackPrompt={setFallbackPrompt}
          />
        </div>
      )}
    </div>
  );
}

// ── ReviewPage ─────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const [data, setData] = useState<ReviewPackInput | null>(null);
  const [overallStats, setOverallStats] = useState<{ totalAttempts: number; accuracy: number; currentLap: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [fallbackPrompt, setFallbackPrompt] = useState<{ idx: number; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [input, stats] = await Promise.all([
        buildReviewPackInput(),
        getOverallStats(),
      ]);
      setData(input);
      setOverallStats(stats);
    } catch (err) {
      console.error('Failed to load review data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  const hasData = data && data.weakTopics.length > 0;

  return (
    <div className="px-4 pt-6 pb-24 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">弱点ダッシュボード</h1>
        <p className="text-sm text-slate-500 mt-1">弱点を特定し、AIで深掘り学習</p>
      </div>

      {/* Overall Stats */}
      {overallStats && overallStats.totalAttempts > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white border border-slate-100 p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-800">{Math.round(overallStats.accuracy * 100)}%</p>
            <p className="text-xs text-slate-400">正答率</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-800">{overallStats.totalAttempts}</p>
            <p className="text-xs text-slate-400">回答数</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-800">{overallStats.currentLap}</p>
            <p className="text-xs text-slate-400">周回</p>
          </div>
        </div>
      )}

      {/* Refresh button */}
      <button
        onClick={loadData}
        disabled={loading}
        className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold disabled:opacity-40"
      >
        {loading ? '読み込み中...' : 'データを更新'}
      </button>

      {/* Empty state */}
      {!hasData && !loading && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">📊</div>
          <p>弱点データがまだありません</p>
          <p className="text-sm mt-1">演習で3問以上回答すると表示されます</p>
        </div>
      )}

      {/* Weak topics */}
      {hasData && (
        <>
          <p className="text-xs text-slate-400">正答率が低いセクション（上位5件）</p>
          {data.weakTopics.map((topic, idx) => (
            <TopicCard
              key={`${topic.subjectName}-${topic.sectionTitle}`}
              topic={topic}
              idx={idx}
              expanded={expandedTopic === idx}
              onToggle={() => setExpandedTopic(expandedTopic === idx ? null : idx)}
              copiedIdx={copiedIdx}
              setCopiedIdx={setCopiedIdx}
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
