'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!supabase) { setError('Supabase未設定です'); setLoading(false); return; }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/`,
      },
    });

    if (error) {
      setError('送信に失敗しました。メールアドレスを確認してください。');
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 gap-6">
        <div className="text-5xl">📬</div>
        <div className="text-center">
          <p className="font-bold text-slate-800 text-lg">メールを送信しました</p>
          <p className="text-slate-500 text-sm mt-2">
            {email} に届いたリンクをタップしてログインしてください
          </p>
        </div>
        <button
          onClick={() => setSent(false)}
          className="text-sm text-indigo-500 underline"
        >
          別のメールアドレスで試す
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 gap-8">
      <div className="text-center">
        <div className="text-4xl mb-3">📝</div>
        <h1 className="text-xl font-bold text-slate-800">肢別トラッカー</h1>
        <p className="text-slate-500 text-sm mt-1">
          メールアドレスでログイン（パスワード不要）
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          required
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold text-base disabled:opacity-50"
        >
          {loading ? '送信中...' : 'ログインリンクを送る'}
        </button>
      </form>

      <button
        onClick={() => router.push('/')}
        className="text-sm text-slate-400 underline"
      >
        ログインせずに使う
      </button>
    </div>
  );
}
