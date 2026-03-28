'use client';

import { useRef } from 'react';

interface Props {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onImageSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50"
      >
        <span className="block text-3xl mb-2">📷</span>
        <span className="text-sm text-slate-600">
          スクショをアップロード
        </span>
        <span className="block text-xs text-slate-400 mt-1">
          タップでカメラ / ファイル選択
        </span>
      </button>
    </div>
  );
}
