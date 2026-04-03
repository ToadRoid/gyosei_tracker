'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/db';
import NavBar from '@/components/NavBar';

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [attemptCount, setAttemptCount] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    db.attempts.count().then(setAttemptCount);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const attempts = await db.attempts.toArray();
      const attrs = await db.problemAttrs.toArray();
      const attrMap = new Map(attrs.map((a) => [a.problemId, a]));

      const rows = [
        ['問題ID', 'ラップ', '回答', '正誤', '応答時間(秒)', '回答日時', '科目', 'セクション'].join(','),
        ...attempts.map((a) => {
          const attr = attrMap.get(a.problemId);
          return [
            a.problemId,
            a.lapNo,
            a.userAnswer ? '○' : '×',
            a.isCorrect ? '正解' : '不正解',
            a.responseTimeSec,
            new Date(a.answeredAt).toLocaleString('ja-JP'),
            attr?.subjectId ?? '',
            attr?.sectionTitle ?? '',
          ].join(',');
        }),
      ].join('\n');

      const bom = '\uFEFF'; // Excel用BOM
      const blob = new Blob([bom + rows], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gyosei_log_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <>
    <div className="px-4 py-6 flex flex-col gap-6 pb-24">
      <h1 className="text-lg font-bold text-slate-800">アカウント</h1>

      {/* ユーザー情報 */}
      <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">
          👤
        </div>
        <div>
          {user ? (
            <>
              <p className="font-medium text-slate-800">{user.email}</p>
              <p className="text-xs text-slate-500">ログイン中</p>
            </>
          ) : (
            <>
              <p className="font-medium text-slate-600">ゲスト</p>
              <p className="text-xs text-slate-400">ログインするとデータが保護されます</p>
            </>
          )}
        </div>
      </div>

      {/* 統計 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <p className="text-sm text-slate-500 mb-1">回答ログ</p>
        <p className="text-2xl font-bold text-indigo-600">{attemptCount}<span className="text-base font-normal text-slate-500 ml-1">件</span></p>
      </div>

      {/* CSVエクスポート */}
      <button
        onClick={handleExportCSV}
        disabled={exporting || attemptCount === 0}
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl py-4 font-medium flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <span>📥</span>
        {exporting ? 'エクスポート中...' : '回答ログをCSVで保存'}
      </button>

      {/* ログイン/ログアウト */}
      {user ? (
        <button
          onClick={handleSignOut}
          className="w-full border border-red-200 text-red-500 rounded-2xl py-4 font-medium"
        >
          ログアウト
        </button>
      ) : (
        <button
          onClick={() => router.push('/login')}
          className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-bold"
        >
          ログイン
        </button>
      )}
    </div>
    <NavBar />
    </>
  );
}
