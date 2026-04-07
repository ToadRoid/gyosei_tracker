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

function isTextPossiblyBroken(text: string): boolean {
  if (!text || text.length < 20) return true;
  if (text.includes('OCR') || text.includes('読取困難')) return true;
  return false;
}

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

  const problemLines = problems.map((p, i) => {
    const attr = attrMap.get(p.problemId);
    const attempt = latestAttempt.get(p.problemId);
    const qText = p.cleanedText || p.rawText || '';
    const correctAns = attr?.answerBoolean ? '○' : '×';
    const userAns = attempt ? (attempt.userAnswer ? '○' : '×') : '未回答';
    const result = attempt ? (attempt.isCorrect ? '正解' : '不正解') : '未回答';
    const rawExp = p.rawExplanationText ?? '';
    const explanation = attr?.explanationText || (rawExp.startsWith('[解説読取困難') ? '' : rawExp);
    const broken = isTextPossiblyBroken(qText);
    return `問題${i + 1}:
  questionText: ${qText}
  correctAnswer: ${correctAns}
  userAnswer: ${userAns}
  result: ${result}
  explanation: ${explanation || '（なし）'}
  isTextPossiblyBroken: ${broken}`;
  }).join('\n---\n');

  const accPct = Math.round(topic.accuracy * 100);
  const wrongCount = problems.filter((p) => {
    const attempt = latestAttempt.get(p.problemId);
    return attempt && !attempt.isCorrect;
  }).length;

  return `あなたは行政書士試験の学習支援を行う講師です。
目的は、ユーザーの理解を深めることではなく、**次回同種問題で正答できる状態にすること**です。
総論を広げすぎず、**ユーザーが実際に間違えた問題の誤答原因を特定し、再発防止につながる解説**を最優先してください。

【テーマ】${topic.sectionTitle}
【科目】${topic.subjectName} > ${topic.chapterName}
【正答率】${accPct}%（${topic.totalAttempts}問回答、不正解${wrongCount}問）

【この分野で私が解いた問題と結果】
${problemLines}

【最重要ルール】
1. **必ず各問題について、問題文・ユーザーの回答・正解をセットで再掲すること。**
   - ユーザーが問題文を記憶している前提で説明してはいけない。
   - どの文言が正誤を分けるのかを、問題文の中の具体的表現に即して示すこと。

2. **必ず実際の条文・判例・制度趣旨に照らして説明すること。**
   - 条文ベースで確認できる論点は、まず条文を優先すること。
   - 判例を出す場合は、論点との関連が明確なものだけに限定すること。
   - 不確かな記憶で断定しないこと。条文上・判例上の根拠関係を明示すること。

3. **章全体の総論を広げすぎないこと。**
   - ユーザーが聞いているのは「この分野の一般論」ではなく、「自分がなぜこの問題で間違えたか」である。
   - まずは誤答問題ごとに、誤読・混同・誤学習の原因を特定すること。
   - 総論や体系整理は、個別誤答の分析のあとに、必要な範囲でのみ行うこと。

4. **得点向上に直結する説明をすること。**
   - 「どう考えればこの肢を切れたか」
   - 「次に同じパターンが出たら何を見ればよいか」
   - 「混同しやすい対立概念は何か」
   まで必ず示すこと。

5. **ユーザーの誤答原因を具体的に言語化すること。**
   - 例：
     - 被告適格と裁判上の一切の行為を混同している
     - 主観的出訴期間と客観的出訴期間を逆に覚えている
     - 処分取消訴訟と裁決取消訴訟の被告を混同している
     - 管轄を審査請求の制度と混同している
   - 「理解不足」といった曖昧な表現で済ませないこと。

6. **問題文のどこが誤りか、どこが正しいかをピンポイントで示すこと。**
   - 「この一語が違う」
   - 「この主語の取り違えが誤り」
   - 「この起算点が違う」
   のように、肢の判定ポイントを明確にすること。

7. **ユーザーが正解した問題も、安定して理解しているのか、たまたま当たったのかを見極めること。**

8. **説明がブレないように、同一論点では同じ整理軸を使うこと。**

【出力の基本方針】
- まず最初に、今回の問題群における**主要な誤答原因の要約**を2〜5個程度で示すこと。
- その後、**各問題ごと**に以下の形式で説明すること。
- 最後に、その分野を解くための**判定ルール**と**再発防止の暗記ポイント**を整理すること。

【各問題の出力形式】
各問題について、必ず次の順序で書くこと。

### 問題番号

【問題文】
（問題文をそのまま再掲）

【あなたの回答】○ or ×

【正解】○ or ×

【結論】この問題は正しい / 誤り

【どの文言が正誤を分けるか】
- 問題文中の該当箇所を抜き出して示すこと
- どの表現が正しく、どの表現が誤りかを明示すること

【根拠】
- 該当条文
- 必要に応じて制度趣旨
- 必要に応じて重要判例
を簡潔かつ正確に示すこと

【なぜあなたが間違えた可能性が高いか】
- ユーザーの誤解・混同パターンを具体的に指摘すること
- 「〜と〜を混同した可能性が高い」の形で明示すること

【次に同じ問題が出たときの判定基準】
- 本試験で瞬時に使える判断基準を1〜3行で示すこと

【類似論点との違い】
- その問題で混同しやすい論点があれば、1〜3行で比較すること

【全体の最後に必ず入れるもの】
1. 今回の誤答原因の総括
2. 混同しやすい論点の比較表
3. この分野で確実に得点するための暗記ルール
4. 「今回のユーザーは何を誤学習したか」の明示
5. 次に解くときのチェックポイント

【表現上の禁止事項】
- ユーザーが問題文を覚えている前提で説明しない
- いきなり章全体の総論から入らない
- 条文上の根拠があるのに、ふわっとした説明で済ませない
- 正解理由だけ述べて、誤答原因分析を省略しない
- 「重要です」「覚えましょう」だけで終わらせない
- 似た論点を並べるだけで、違いを明示しない
- 問題群に現れていない論点を長々と展開しない

【優先順位】
1. 問題文・回答・正解の再掲
2. その問題の正誤判定
3. 誤答原因の特定
4. 次回正解するための判定基準
5. 条文・判例・制度趣旨
6. 必要最小限の体系整理

【ゴール】
最終的にユーザーが
- この問題をなぜ間違えたか
- 次に同種問題が出たらどこを見ればいいか
- 何を混同していたのか
を、自分で説明できる状態にすること。`;
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
  const correctCount = topic.correctCount;
  const wrongCount = topic.totalAttempts - correctCount;

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

const INITIAL_SHOW_COUNT = 5;

export default function ReviewPage() {
  const [data, setData] = useState<ReviewPackInput | null>(null);
  const [overallStats, setOverallStats] = useState<{ totalAttempts: number; accuracy: number; currentLap: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [fallbackPrompt, setFallbackPrompt] = useState<{ idx: number; text: string } | null>(null);
  const [showAllTopics, setShowAllTopics] = useState(false);

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
      {hasData && (() => {
        const total = data.weakTopics.length;
        const visibleTopics = showAllTopics
          ? data.weakTopics
          : data.weakTopics.slice(0, INITIAL_SHOW_COUNT);
        const showingCount = visibleTopics.length;
        return (
          <>
            <p className="text-xs text-slate-400">
              正答率が低いセクション（{showingCount}/{total}件）
            </p>
            {visibleTopics.map((topic, idx) => (
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
            {total > INITIAL_SHOW_COUNT && (
              <button
                onClick={() => setShowAllTopics((prev) => !prev)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              >
                {showAllTopics
                  ? '▲ 折りたたむ'
                  : `▼ すべて表示（残り ${total - INITIAL_SHOW_COUNT}件）`}
              </button>
            )}
          </>
        );
      })()}

      <NavBar />
    </div>
  );
}
