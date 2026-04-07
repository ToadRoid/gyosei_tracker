import { subjects, chapters } from '@/data/master';
import type {
  ReviewPackInput,
  WeakTopicInput,
  WrongExample,
  QuestionExample,
} from '@/types/review-pack';

// Build subject/chapter name lookup maps (safe for both client and server)
const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
const chapterMap = new Map(chapters.map((c) => [c.id, c.name]));

/**
 * Aggregates Dexie data into ReviewPackInput.
 * IMPORTANT: This function is browser-only (uses Dexie/IndexedDB).
 * Do NOT call this from server-side API routes.
 */
export async function buildReviewPackInput(): Promise<ReviewPackInput> {
  // Dynamic import to avoid breaking server-side rendering
  const { db } = await import('@/lib/db');

  const allAttempts = await db.attempts.toArray();
  const allAttrs = await db.problemAttrs.toArray();
  const allProblems = await db.problems.toArray();

  // Build lookup maps
  const attrMap = new Map(allAttrs.map((a) => [a.problemId, a]));
  const problemMap = new Map(allProblems.map((p) => [p.problemId, p]));

  // Group attempts by (subjectId, chapterId, sectionTitle)
  type GroupKey = string;
  interface GroupData {
    subjectId: string;
    chapterId: string;
    sectionTitle: string;
    problemIds: Set<string>;
    totalAttempts: number;
    correctCount: number;
    pageRefQuestion: string;
    pageRefAnswer: string;
    byLap: Map<number, { attempts: number; correct: number }>;
    recentWrong: { problemId: string; userAnswer: boolean; answeredAt: Date }[];
    allAttempts: { problemId: string; userAnswer: boolean; isCorrect: boolean; answeredAt: Date; responseTimeSec: number }[];
  }

  const groups = new Map<GroupKey, GroupData>();

  for (const attempt of allAttempts) {
    const attr = attrMap.get(attempt.problemId);
    if (!attr) continue;
    if (attr.isExcluded === true || attr.needsSourceCheck === true || attr.aiTriageStatus === 'discard') continue;

    const subjectId = attr.subjectId ?? '';
    const chapterId = attr.chapterId ?? '';
    const sectionTitle = attr.sectionTitle ?? '';

    // Skip groups without sectionTitle
    if (!sectionTitle) continue;

    const key: GroupKey = `${subjectId}||${chapterId}||${sectionTitle}`;

    if (!groups.has(key)) {
      groups.set(key, {
        subjectId,
        chapterId,
        sectionTitle,
        problemIds: new Set(),
        totalAttempts: 0,
        correctCount: 0,
        pageRefQuestion: attr.sourcePageQuestion ?? '',
        pageRefAnswer: attr.sourcePageAnswer ?? '',
        byLap: new Map(),
        recentWrong: [],
        allAttempts: [],
      });
    }

    const group = groups.get(key)!;
    group.problemIds.add(attempt.problemId);
    group.totalAttempts += 1;
    if (attempt.isCorrect) group.correctCount += 1;

    // Keep first non-empty page refs
    if (!group.pageRefQuestion && attr.sourcePageQuestion) {
      group.pageRefQuestion = attr.sourcePageQuestion;
    }
    if (!group.pageRefAnswer && attr.sourcePageAnswer) {
      group.pageRefAnswer = attr.sourcePageAnswer;
    }

    // Lap stats
    const lapNo = attempt.lapNo;
    if (!group.byLap.has(lapNo)) {
      group.byLap.set(lapNo, { attempts: 0, correct: 0 });
    }
    const lapData = group.byLap.get(lapNo)!;
    lapData.attempts += 1;
    if (attempt.isCorrect) lapData.correct += 1;

    // Track all attempts
    group.allAttempts.push({
      problemId: attempt.problemId,
      userAnswer: attempt.userAnswer,
      isCorrect: attempt.isCorrect,
      answeredAt: attempt.answeredAt,
      responseTimeSec: attempt.responseTimeSec,
    });

    // Track wrong attempts (for backward compat)
    if (!attempt.isCorrect) {
      group.recentWrong.push({
        problemId: attempt.problemId,
        userAnswer: attempt.userAnswer,
        answeredAt: attempt.answeredAt,
      });
    }
  }

  // Overall stats
  const totalAttempts = allAttempts.length;
  const totalCorrect = allAttempts.filter((a) => a.isCorrect).length;
  const overallAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
  const lapCount =
    allAttempts.length > 0 ? Math.max(...allAttempts.map((a) => a.lapNo)) : 0;

  // Build WeakTopicInput array from groups
  const weakTopics: WeakTopicInput[] = [];

  for (const group of groups.values()) {
    // Filter: >= 3 attempts
    if (group.totalAttempts < 3) continue;

    const accuracy =
      group.totalAttempts > 0 ? group.correctCount / group.totalAttempts : 0;

    // Lap stats sorted
    const lapStats = Array.from(group.byLap.entries())
      .sort(([a], [b]) => a - b)
      .map(([lapNo, data]) => ({
        lapNo,
        attempts: data.attempts,
        accuracy: data.attempts > 0 ? data.correct / data.attempts : 0,
      }));

    // Improvement: lap2 - lap1
    const lap1 = lapStats.find((l) => l.lapNo === 1);
    const lap2 = lapStats.find((l) => l.lapNo === 2);
    const improvement = lap1 && lap2 ? lap2.accuracy - lap1.accuracy : null;

    const subjectName = subjectMap.get(group.subjectId) ?? group.subjectId;
    const chapterName = chapterMap.get(group.chapterId) ?? group.chapterId;

    // candidateProblemIds: all unique problemIds in this group
    const candidateProblemIds = Array.from(group.problemIds);

    // wrongExamples: up to 3 recent wrong attempts
    const sortedWrong = [...group.recentWrong].sort(
      (a, b) => b.answeredAt.getTime() - a.answeredAt.getTime(),
    );
    const wrongExamples: WrongExample[] = sortedWrong
      .slice(0, 3)
      .map((w) => {
        const attr = attrMap.get(w.problemId);
        const problem = problemMap.get(w.problemId);
        const rawExp = problem?.rawExplanationText ?? '';
        const expSnippet =
          attr?.explanationText?.slice(0, 100) ??
          (rawExp.startsWith('[解説読取困難') ? '' : rawExp.slice(0, 100));
        return {
          questionText: problem?.cleanedText ?? '',
          correctAnswer: attr?.answerBoolean ?? false,
          userAnswer: w.userAnswer,
          explanationSnippet: expSnippet,
          pageRefQuestion: attr?.sourcePageQuestion ?? '',
          pageRefAnswer: attr?.sourcePageAnswer ?? '',
        };
      });

    // questionExamples: all problems in section, prioritizing wrong → slow correct → rest
    // Deduplicate by problemId, keep latest attempt per problem
    const latestByProblem = new Map<string, typeof group.allAttempts[number]>();
    for (const a of group.allAttempts) {
      const existing = latestByProblem.get(a.problemId);
      if (!existing || a.answeredAt.getTime() > existing.answeredAt.getTime()) {
        latestByProblem.set(a.problemId, a);
      }
    }
    const sortedAll = Array.from(latestByProblem.values()).sort((a, b) => {
      // Wrong first, then slow correct, then rest
      if (a.isCorrect !== b.isCorrect) return a.isCorrect ? 1 : -1;
      return b.responseTimeSec - a.responseTimeSec;
    });
    const questionExamples: QuestionExample[] = sortedAll
      .slice(0, 10)
      .map((a) => {
        const attr = attrMap.get(a.problemId);
        const problem = problemMap.get(a.problemId);
        const rawExp = problem?.rawExplanationText ?? '';
        const expText =
          attr?.explanationText ??
          (rawExp.startsWith('[解説読取困難') ? '' : rawExp);
        return {
          problemId: a.problemId,
          questionText: problem?.cleanedText ?? problem?.rawText ?? '',
          correctAnswer: attr?.answerBoolean ?? false,
          userAnswer: a.userAnswer,
          isCorrect: a.isCorrect,
          explanationText: expText,
          responseTimeSec: a.responseTimeSec,
          pageRefQuestion: attr?.sourcePageQuestion ?? '',
          pageRefAnswer: attr?.sourcePageAnswer ?? '',
        };
      });

    weakTopics.push({
      subjectName,
      chapterName,
      sectionTitle: group.sectionTitle,
      accuracy,
      totalAttempts: group.totalAttempts,
      lapStats,
      improvement,
      pageRefQuestion: group.pageRefQuestion,
      pageRefAnswer: group.pageRefAnswer,
      candidateProblemIds,
      wrongExamples,
      questionExamples,
    });
  }

  // Sort by accuracy ascending, take top 5
  const sortedWeakTopics = weakTopics
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  return {
    userSummary: {
      totalAttempts,
      overallAccuracy,
      lapCount,
    },
    weakTopics: sortedWeakTopics,
  };
}

/**
 * @deprecated GPT API is no longer used. Deep-dive prompts are built in review/page.tsx.
 * Kept temporarily for reference. Will be removed in a future cleanup.
 */
export function buildGptPrompt(input: ReviewPackInput): string {
  const { userSummary, weakTopics } = input;
  const overallPct = Math.round(userSummary.overallAccuracy * 100);

  const topicsText = weakTopics
    .map((t, i) => {
      const accPct = Math.round(t.accuracy * 100);
      const improvText =
        t.improvement !== null
          ? `（1→2周目変化: ${t.improvement >= 0 ? '+' : ''}${Math.round(t.improvement * 100)}%）`
          : '（2周目データなし）';

      const lapText = t.lapStats
        .map(
          (l) =>
            `  - ${l.lapNo}周目: ${l.attempts}問 正答率${Math.round(l.accuracy * 100)}%`,
        )
        .join('\n');

      // Use questionExamples (full context) for the prompt
      const questionsText =
        t.questionExamples.length > 0
          ? t.questionExamples
              .map(
                (q, qi) =>
                  `  問題${qi + 1} [${q.isCorrect ? '正解' : '不正解'}${!q.isCorrect ? '' : q.responseTimeSec > 30 ? '・遅答' : ''}]:
    ID: ${q.problemId}
    問題文: ${q.questionText}
    正解: ${q.correctAnswer ? '○' : '×'} / ユーザー回答: ${q.userAnswer ? '○' : '×'}
    解答時間: ${q.responseTimeSec}秒
    解説: ${q.explanationText || '（解説なし）'}`,
              )
              .join('\n')
          : '  （問題データなし）';

      return `【トピック${i + 1}】
科目: ${t.subjectName}
章: ${t.chapterName}
セクション: ${t.sectionTitle}
正答率: ${accPct}%（${t.totalAttempts}問回答）${improvText}
周回別成績:
${lapText}
問題ページ参照: ${t.pageRefQuestion || '不明'}
解説ページ参照: ${t.pageRefAnswer || '不明'}
候補問題ID（relatedProblemIdsはここから選ぶこと）: ${t.candidateProblemIds.join(', ')}

--- このセクションの問題と解説 ---
${questionsText}`;
    })
    .join('\n\n');

  return `あなたは行政書士試験の熟練講師です。
以下のユーザーの学習データ（正解・不正解の両方を含む全問題と解説テキスト）を分析し、このセクションの知識を体系的に理解できる復習教材をJSON形式で生成してください。

【重要な方針】
- 不正解の問題だけでなく、正解した問題も含めて包括的に解説してください
- 正解していても理解が曖昧な可能性があります（解答時間が長い問題は特に注意）
- 提供された問題文・解説テキストの内容をベースに、より深い理解を促す解説を作成してください
- 単なるフィードバックではなく、「このセクションの知識を確実に身につける」ための教材として生成してください

【ユーザー学習サマリー】
総回答数: ${userSummary.totalAttempts}問
全体正答率: ${overallPct}%
周回数: ${userSummary.lapCount}周

${topicsText}

【出力要件】
- 出力は下記JSONスキーマに厳密に従ってください
- マークダウンコードブロック（\`\`\`json など）は使わず、JSONのみを出力してください
- 言語はすべて日本語
- themes は最大5件（トピックを参考に生成）
- 各テーマの relatedProblemIds は上記「候補問題ID」のリストから選んでください（それ以外のIDは使用禁止）
- quickQuiz は問題DBとは独立した補助的な確認クイズです（answer は "○" または "×" のみ）
- judgmentCriteria・typicalTraps・distinctionPoints はそれぞれ2〜4件

各テーマは以下の5段階構成で、セクション全体の知識を体系的に学べる教材として生成してください:
1. overview: この制度/論点が何を扱うものか・何のためのルールかを、条文の趣旨や背景も含めて3〜5文で解説
2. positioning: この論点が章・科目全体のどこに位置するか・近い論点（類似制度、関連条文）とどう違うかを3〜5文で解説
3. weakDiagnosis: ユーザーの正答・誤答パターンから、理解が不十分な点・混同しやすい点を具体的に2〜3文で診断。正解していても理解が浅そうな箇所も指摘
4. pinpointExplanation: このセクションの核心となる知識を、具体例・判例・条文を交えて5〜8文で丁寧に解説。試験で問われるポイントを明確に
5. oneLiner: この論点を一文で言い切るまとめ

【JSONスキーマ】
{
  "generatedAt": "ISO8601文字列",
  "overallComment": "全体コメント（2〜3文。学習の進捗に対する具体的な評価）",
  "themes": [
    {
      "subjectName": "科目名",
      "chapterName": "章名",
      "sectionTitle": "セクション名",
      "themeName": "テーマ名（簡潔に）",
      "priority": "high | medium | low",
      "overview": "概要（3〜5文）",
      "positioning": "全体の位置づけ（3〜5文）",
      "weakDiagnosis": "弱点診断（2〜3文）",
      "pinpointExplanation": "詳細解説（5〜8文）",
      "judgmentCriteria": ["判断基準1", "判断基準2", ...],
      "typicalTraps": ["ひっかけパターン1", ...],
      "distinctionPoints": ["区別論点1", ...],
      "oneLiner": "一文まとめ",
      "quickQuiz": [
        {
          "question": "問題文",
          "answer": "○ または ×",
          "explanation": "解説（2〜3文で丁寧に）"
        }
      ],
      "relatedProblemIds": ["KB2025-p001-q01", ...],
      "pageRefQuestion": "問題ページ番号",
      "pageRefAnswer": "解説ページ番号"
    }
  ]
}`;
}
