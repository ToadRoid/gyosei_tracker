'use client';

import type { Problem, ProblemAttr } from '@/types';
import { subjects, chapters } from '@/data/master';

interface Props {
  problem: Problem;
  attr?: ProblemAttr;
  attemptCount?: number;
  lastCorrect?: boolean | null;
  selected?: boolean;
  onSelect?: (problemId: string, checked: boolean) => void;
  onEdit?: (problem: Problem, attr: ProblemAttr | undefined) => void;
  onDelete?: (problemId: string) => void;
}

export default function QuestionCard({
  problem,
  attr,
  attemptCount = 0,
  lastCorrect,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const subject = subjects.find((s) => s.id === attr?.subjectId);
  const chapter = chapters.find((c) => c.id === attr?.chapterId);
  const isDraft = problem.status === 'draft';
  const isReady = problem.status === 'ready';

  return (
    <div
      className={`rounded-xl border bg-white p-4 space-y-2 ${
        selected ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {onSelect && (
            <input
              type="checkbox"
              checked={selected ?? false}
              onChange={(e) => onSelect(problem.problemId, e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {isDraft && (
            <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
              下書き
            </span>
          )}
          {isReady && subject && (
            <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-medium">
              {subject.name}
            </span>
          )}
          {isReady && chapter && (
            <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs">
              {chapter.name}
            </span>
          )}
          {attr?.aiTriageStatus === 'needs_review' && (
            <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs font-medium">
              要確認
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-400">{problem.sourcePage}p</span>
          {isReady && attr && (
            <span
              className={`text-sm font-bold ${
                attr.answerBoolean === true
                  ? 'text-green-600'
                  : attr.answerBoolean === false
                  ? 'text-red-500'
                  : 'text-slate-400'
              }`}
            >
              {attr.answerBoolean === true ? '◯' : attr.answerBoolean === false ? '✗' : '?'}
            </span>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(problem, attr)}
              className="text-slate-400 hover:text-indigo-500 text-xs"
            >
              編集
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(problem.problemId)}
              className="text-slate-300 hover:text-red-400 text-xs"
            >
              削除
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-800 line-clamp-3 leading-relaxed">
        {problem.cleanedText || problem.rawText}
      </p>

      {isReady && (
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>回答: {attemptCount}回</span>
          {lastCorrect !== null && lastCorrect !== undefined && (
            <span className={lastCorrect ? 'text-green-500' : 'text-red-400'}>
              前回: {lastCorrect ? '正解' : '不正解'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
