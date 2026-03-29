'use client';

import { useState } from 'react';
import SubjectChapterSelect from './SubjectChapterSelect';
import { db, upsertProblemAttr } from '@/lib/db';
import type { Problem, ProblemAttr, ProblemStatus } from '@/types';

interface Props {
  problem: Problem;
  attr: ProblemAttr | undefined;
  onSaved: (updated: Problem, updatedAttr: ProblemAttr) => void;
  onCancel: () => void;
}

export default function EditQuestionModal({ problem, attr, onSaved, onCancel }: Props) {
  const [text, setText] = useState(problem.cleanedText || problem.rawText);
  const [subjectId, setSubjectId] = useState(attr?.subjectId ?? '');
  const [chapterId, setChapterId] = useState(attr?.chapterId ?? '');
  const [answerBoolean, setAnswerBoolean] = useState<boolean | null>(attr?.answerBoolean ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReady = text.trim() && subjectId && chapterId && answerBoolean !== null;

  const handleSave = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    setError(null);

    const status: ProblemStatus = isReady ? 'ready' : 'draft';

    try {
      // problems テーブル更新
      const problemChanges = {
        cleanedText: text.trim(),
        status,
      };
      await db.problems.update(problem.id!, problemChanges);

      // problemAttrs テーブル upsert
      const attrChanges = {
        subjectId,
        chapterId,
        answerBoolean,
      };
      await upsertProblemAttr(problem.problemId, attrChanges);

      const updatedProblem: Problem = { ...problem, ...problemChanges };
      const updatedAttr: ProblemAttr = {
        id: attr?.id,
        problemId: problem.problemId,
        subjectId,
        chapterId,
        answerBoolean,
        ...(attr ? {
          importance: attr.importance,
          needsReview: attr.needsReview,
          year: attr.year,
          memo: attr.memo,
          aiTriageStatus: attr.aiTriageStatus,
          aiDiscardReason: attr.aiDiscardReason,
          aiAnswerCandidate: attr.aiAnswerCandidate,
          aiSubjectCandidate: attr.aiSubjectCandidate,
          aiChapterCandidate: attr.aiChapterCandidate,
          aiCleanedText: attr.aiCleanedText,
          aiConfidence: attr.aiConfidence,
        } : {}),
      };

      onSaved(updatedProblem, updatedAttr);
    } catch (e) {
      console.error('更新エラー:', e);
      setError('保存に失敗しました。再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 space-y-4 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800">問題を編集</h2>
            <p className="text-xs text-slate-400 mt-0.5">{problem.problemId}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            ✕
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">問題文</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
          />
        </div>

        <SubjectChapterSelect
          subjectId={subjectId}
          chapterId={chapterId}
          onSubjectChange={setSubjectId}
          onChapterChange={setChapterId}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            正解　<span className="text-xs text-slate-400 font-normal">（未設定のまま保存すると下書き）</span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAnswerBoolean(answerBoolean === true ? null : true)}
              className={`flex-1 rounded-xl py-3 text-lg font-bold transition-colors ${
                answerBoolean === true
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-green-50'
              }`}
            >
              ◯
            </button>
            <button
              type="button"
              onClick={() => setAnswerBoolean(answerBoolean === false ? null : false)}
              className={`flex-1 rounded-xl py-3 text-lg font-bold transition-colors ${
                answerBoolean === false
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-red-50'
              }`}
            >
              ✗
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pb-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving}
            className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300"
          >
            {saving ? '保存中...' : isReady ? '保存（整備済み）' : '下書き保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
