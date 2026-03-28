'use client';

import { useState, useEffect, useCallback } from 'react';
import SubjectChapterSelect from './SubjectChapterSelect';
import { db } from '@/lib/db';

interface Props {
  ocrText: string;
  imageName: string;
  defaultSubjectId?: string;
  defaultChapterId?: string;
  onRegistered: (subjectId: string, chapterId: string) => void;
}

export default function OcrReviewForm({
  ocrText,
  imageName,
  defaultSubjectId = '',
  defaultChapterId = '',
  onRegistered,
}: Props) {
  const [text, setText] = useState(ocrText);
  const [subjectId, setSubjectId] = useState(defaultSubjectId);
  const [chapterId, setChapterId] = useState(defaultChapterId);
  const [answerBoolean, setAnswerBoolean] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 新しい画像に切り替わったとき OCR テキストをリセット、正解もリセット
  useEffect(() => {
    setText(ocrText);
    setAnswerBoolean(null);
    setSaveError(null);
  }, [ocrText]);

  const canSave = text.trim() && subjectId && chapterId && answerBoolean !== null;

  const handleSave = useCallback(async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setSaveError(null);

    try {
      await db.imports.add({
        imageName,
        ocrRawText: ocrText,
        importedAt: new Date(),
        status: 'completed',
      });

      await db.questions.add({
        subjectId,
        chapterId,
        sourcePage: imageName,
        originalText: ocrText,
        normalizedText: text.trim(),
        answerBoolean: answerBoolean!,
        tags: [],
        createdAt: new Date(),
      });

      onRegistered(subjectId, chapterId);
    } catch (e) {
      console.error('保存エラー:', e);
      setSaveError('保存に失敗しました。ストレージ容量を確認してください。');
    } finally {
      setSaving(false);
    }
  }, [canSave, saving, imageName, ocrText, subjectId, chapterId, text, answerBoolean, onRegistered]);

  // キーボードショートカット: O=◯, X=✗, Enter=登録
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // textarea にフォーカス中は Enter 以外は素通し
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'o' || e.key === 'O') setAnswerBoolean(true);
      if (e.key === 'x' || e.key === 'X') setAnswerBoolean(false);
      if (e.key === 'Enter') handleSave();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          問題文（編集可）
        </label>
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
        <label className="block text-sm font-medium text-slate-700 mb-1">
          正解　<span className="text-xs text-slate-400 font-normal">（O キー = ◯　/ X キー = ✗）</span>
        </label>
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

      {saveError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className="w-full rounded-xl bg-indigo-600 py-3 text-white font-bold transition-colors hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500"
      >
        {saving ? '保存中...' : `登録して次へ　Enter ↵`}
      </button>
    </div>
  );
}
