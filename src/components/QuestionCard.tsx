import type { Question } from '@/types';
import { subjects, chapters } from '@/data/master';

interface Props {
  question: Question;
  attemptCount?: number;
  lastCorrect?: boolean | null;
  onEdit?: (question: Question) => void;
  onDelete?: (id: number) => void;
}

export default function QuestionCard({
  question,
  attemptCount = 0,
  lastCorrect,
  onEdit,
  onDelete,
}: Props) {
  const subject = subjects.find((s) => s.id === question.subjectId);
  const chapter = chapters.find((c) => c.id === question.chapterId);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-medium">
            {subject?.name}
          </span>
          <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs">
            {chapter?.name}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-sm font-bold ${question.answerBoolean ? 'text-green-600' : 'text-red-500'}`}
          >
            {question.answerBoolean ? '◯' : '✗'}
          </span>
          {onEdit && (
            <button
              onClick={() => onEdit(question)}
              className="text-slate-400 hover:text-indigo-500 text-xs"
            >
              編集
            </button>
          )}
          {onDelete && question.id !== undefined && (
            <button
              onClick={() => onDelete(question.id!)}
              className="text-slate-300 hover:text-red-400 text-xs"
            >
              削除
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-800 line-clamp-3 leading-relaxed">
        {question.normalizedText || question.originalText}
      </p>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>回答: {attemptCount}回</span>
        {lastCorrect !== null && lastCorrect !== undefined && (
          <span className={lastCorrect ? 'text-green-500' : 'text-red-400'}>
            前回: {lastCorrect ? '正解' : '不正解'}
          </span>
        )}
      </div>
    </div>
  );
}
