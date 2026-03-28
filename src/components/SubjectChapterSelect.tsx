'use client';

import { subjects, chapters } from '@/data/master';

interface Props {
  subjectId: string;
  chapterId: string;
  onSubjectChange: (id: string) => void;
  onChapterChange: (id: string) => void;
}

export default function SubjectChapterSelect({
  subjectId,
  chapterId,
  onSubjectChange,
  onChapterChange,
}: Props) {
  const filteredChapters = chapters.filter((c) => c.subjectId === subjectId);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          科目
        </label>
        <select
          value={subjectId}
          onChange={(e) => {
            onSubjectChange(e.target.value);
            const firstChapter = chapters.find(
              (c) => c.subjectId === e.target.value,
            );
            if (firstChapter) onChapterChange(firstChapter.id);
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">選択してください</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          章
        </label>
        <select
          value={chapterId}
          onChange={(e) => onChapterChange(e.target.value)}
          disabled={!subjectId}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">選択してください</option>
          {filteredChapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
