'use client';

import { useState, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import ImageUploader from '@/components/ImageUploader';
import OcrReviewForm from '@/components/OcrReviewForm';
import { recognizeImage } from '@/lib/ocr';

type Step = 'upload' | 'ocr' | 'review' | 'done';

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [ocrText, setOcrText] = useState('');
  const [imageName, setImageName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const handleImageSelected = useCallback(async (file: File) => {
    setImageName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('ocr');
    setProgress(0);
    setOcrError(null);

    try {
      const text = await recognizeImage(file, setProgress);
      setOcrText(text);
      setStep('review');
    } catch (e) {
      console.error('OCRエラー:', e);
      setOcrError('OCR処理に失敗しました。別の画像を試すか、テキストを手入力してください。');
      setStep('upload');
    }
  }, []);

  const handleRegistered = () => {
    setRegisteredCount((c) => c + 1);
    setStep('done');
  };

  const handleNext = () => {
    setStep('upload');
    setOcrText('');
    setImageName('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  return (
    <div className="px-4 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">問題を取り込む</h1>
        {registeredCount > 0 && (
          <span className="text-sm text-indigo-600 font-medium">
            {registeredCount}件登録済み
          </span>
        )}
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span
          className={
            step === 'upload' ? 'text-indigo-600 font-bold' : ''
          }
        >
          1. アップロード
        </span>
        <span>→</span>
        <span
          className={step === 'ocr' ? 'text-indigo-600 font-bold' : ''}
        >
          2. OCR
        </span>
        <span>→</span>
        <span
          className={
            step === 'review' ? 'text-indigo-600 font-bold' : ''
          }
        >
          3. 確認・登録
        </span>
      </div>

      {ocrError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {ocrError}
        </div>
      )}

      {step === 'upload' && (
        <ImageUploader onImageSelected={handleImageSelected} />
      )}

      {step === 'ocr' && (
        <div className="text-center py-12 space-y-4">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="アップロード画像"
              className="mx-auto max-h-40 rounded-lg border border-slate-200"
            />
          )}
          <div className="space-y-2">
            <p className="text-sm text-slate-600">OCR処理中...</p>
            <div className="mx-auto w-48 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="アップロード画像"
              className="w-full rounded-lg border border-slate-200"
            />
          )}
          <OcrReviewForm
            ocrText={ocrText}
            imageName={imageName}
            onRegistered={handleRegistered}
          />
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-12 space-y-4">
          <span className="text-5xl">✅</span>
          <p className="text-lg font-bold text-slate-800">登録完了!</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleNext}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-white font-bold hover:bg-indigo-700"
            >
              次の問題を取り込む
            </button>
            <a
              href="/questions"
              className="rounded-xl bg-slate-100 px-6 py-3 text-slate-700 font-bold hover:bg-slate-200"
            >
              問題一覧へ
            </a>
          </div>
        </div>
      )}

      <NavBar />
    </div>
  );
}
