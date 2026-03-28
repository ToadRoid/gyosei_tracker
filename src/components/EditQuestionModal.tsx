'use client';

import { useState } from 'react';
import SubjectChapterSelect from './SubjectChapterSelect';
import { db } from '@/lib/db';
import type { Question } from '@/types';

interface Props {
  question: Question;
  onSaved: (updated: Question) => void;
  onCancel: () => void;
}

export default function EditQuestionModal({ question, onSaved, onCancel }: Props) {
  const [text, setText] = useState(question.normalizedText || question.originalText);
  const [subjectId, setSubjectId] = useState(question.subjectId);
  const [chapterId, setChapterId] = useState(question.chapterId);
  const [answerBoolean, setAnswerBoolean] = useState<boolean>(question.answerBoolean);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = text.trim() && subjectId && chapterId;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);

    const changes = {
      normalizedText: text.trim(),
      subjectId,
      chapterId,
      answerBoolean,
    };

    try {
      await db.questions.update(question.id!, changes);
      onSaved({ ...question, ...changes });
    } catch (e) {
      console.error('更新エラー:', e);
      setError('保存に失敗しました。再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  return (
    // オーバーレイ
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* ボトムシート */}
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 space-y-4 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">問題を編集</h2>
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
          <label className="block text-sm font-medium text-slate-700 mb-2">正解</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAnswerBoolean(true)}
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
              onClick={() => setAnswerBoolean(false)}
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
            disabled={!canSave || saving}
            className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
