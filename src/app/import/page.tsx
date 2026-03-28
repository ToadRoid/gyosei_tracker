'use client';

import { useState, useCallback, useRef } from 'react';
import NavBar from '@/components/NavBar';
import OcrReviewForm from '@/components/OcrReviewForm';
import { recognizeImage } from '@/lib/ocr';

interface QueueItem {
  file: File;
  previewUrl: string;
  ocrText: string | null; // null = OCR未完了
  ocrError: string | null;
}

type Phase = 'select' | 'processing' | 'review';

export default function ImportPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('select');
  const [registeredCount, setRegisteredCount] = useState(0);

  // 前回の科目・章を引き継ぎ（連続登録の効率化）
  const [lastSubjectId, setLastSubjectId] = useState('');
  const [lastChapterId, setLastChapterId] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = useCallback(async (files: FileList) => {
    const items: QueueItem[] = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      ocrText: null,
      ocrError: null,
    }));

    setQueue(items);
    setCurrentIndex(0);
    setPhase('processing');

    // 最初の1枚を即OCR、残りはバックグラウンドで順次処理
    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      try {
        const text = await recognizeImage(updated[i].file);
        updated[i] = { ...updated[i], ocrText: text };
      } catch {
        updated[i] = { ...updated[i], ocrError: 'OCR失敗。問題文を手入力してください。' };
      }
      setQueue([...updated]);
      // 最初の1枚が終わったら review フェーズへ移行
      if (i === 0) setPhase('review');
    }
  }, []);

  const handleRegistered = useCallback((subjectId: string, chapterId: string) => {
    setLastSubjectId(subjectId);
    setLastChapterId(chapterId);
    setRegisteredCount((c) => c + 1);

    const next = currentIndex + 1;
    if (next < queue.length) {
      setCurrentIndex(next);
      // 次の画像の OCR がまだなら processing 表示
      if (queue[next].ocrText === null && queue[next].ocrError === null) {
        setPhase('processing');
        // OCR完了を待って review に切り替え
        const wait = setInterval(() => {
          setQueue((q) => {
            if (q[next].ocrText !== null || q[next].ocrError !== null) {
              clearInterval(wait);
              setPhase('review');
            }
            return q;
          });
        }, 200);
      } else {
        setPhase('review');
      }
    } else {
      // 全件完了
      setPhase('select');
      setQueue([]);
      setCurrentIndex(0);
    }
  }, [currentIndex, queue]);

  const handleSkip = () => {
    const next = currentIndex + 1;
    if (next < queue.length) {
      setCurrentIndex(next);
      if (queue[next].ocrText === null && queue[next].ocrError === null) {
        setPhase('processing');
        const wait = setInterval(() => {
          setQueue((q) => {
            if (q[next].ocrText !== null || q[next].ocrError !== null) {
              clearInterval(wait);
              setPhase('review');
            }
            return q;
          });
        }, 200);
      } else {
        setPhase('review');
      }
    } else {
      setPhase('select');
      setQueue([]);
      setCurrentIndex(0);
    }
  };

  const current = queue[currentIndex];

  return (
    <div className="px-4 pt-6 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">問題を取り込む</h1>
        <div className="flex items-center gap-3 text-sm">
          {queue.length > 0 && (
            <span className="text-slate-500">
              {currentIndex + 1} / {queue.length}
            </span>
          )}
          {registeredCount > 0 && (
            <span className="text-indigo-600 font-bold">{registeredCount}件登録</span>
          )}
        </div>
      </div>

      {/* 進捗バー */}
      {queue.length > 0 && (
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
          />
        </div>
      )}

      {/* 画像選択 */}
      {phase === 'select' && (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
          >
            <span className="block text-3xl mb-2">📂</span>
            <span className="text-sm text-slate-600 font-medium">
              スクショを選択（複数可）
            </span>
            <span className="block text-xs text-slate-400 mt-1">
              タップして選択 / まとめて投入OK
            </span>
          </button>
          {registeredCount > 0 && (
            <p className="text-center text-sm text-slate-500">
              この画面での登録: {registeredCount}件完了
            </p>
          )}
        </div>
      )}

      {/* OCR処理中 */}
      {phase === 'processing' && current && (
        <div className="space-y-4">
          <img
            src={current.previewUrl}
            alt="処理中"
            className="w-full rounded-lg border border-slate-200 max-h-48 object-contain"
          />
          <div className="text-center py-6 space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-600">OCR処理中...</p>
          </div>
        </div>
      )}

      {/* OCR確認・登録 */}
      {phase === 'review' && current && (
        <div className="space-y-3">
          <img
            src={current.previewUrl}
            alt="確認"
            className="w-full rounded-lg border border-slate-200 max-h-48 object-contain"
          />

          {current.ocrError && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
              {current.ocrError}
            </div>
          )}

          <OcrReviewForm
            key={currentIndex}
            ocrText={current.ocrText ?? ''}
            imageName={current.file.name}
            defaultSubjectId={lastSubjectId}
            defaultChapterId={lastChapterId}
            onRegistered={handleRegistered}
          />

          <button
            onClick={handleSkip}
            className="w-full rounded-xl bg-slate-100 py-2 text-sm text-slate-500 hover:bg-slate-200"
          >
            この画像をスキップ →
          </button>
        </div>
      )}

      <NavBar />
    </div>
  );
}
