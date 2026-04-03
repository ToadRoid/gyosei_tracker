'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/db';
import NavBar from '@/components/NavBar';
import { supabase } from '@/lib/supabase';

interface ErrorReport {
  id: string;
  problem_id: string;
  report_type: string;
  comment: string;
  question_text: string;
  status: string;
  created_at: string;
}

const REPORT_TYPE_LABEL: Record<string, string> = {
  ocr: '文字の抜け・誤字',
  answer: '正誤の誤り',
  explanation: '解説の誤り',
  other: 'その他',
};

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim()).filter(Boolean);

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [attemptCount, setAttemptCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<string | null>(null);

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    db.attempts.count().then(setAttemptCount);
    if (isAdmin) loadReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [userStats, setUserStats] = useState<{ userId: string; count: number }[] | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadUserStats = async () => {
    if (!user?.email) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/admin/user-stats?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setUserStats(data.stats ?? []);
    } catch {
      setUserStats([]);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadReports = async () => {
    if (!supabase) return;
    setReportsLoading(true);
    const { data } = await supabase
      .from('error_reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setReports(data ?? []);
    setReportsLoading(false);
  };

  const resolveReport = async (id: string) => {
    if (!supabase) return;
    await supabase.from('error_reports').update({ status: 'resolved' }).eq('id', id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSyncJson = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/data/reviewed_import.json');
      if (!res.ok) throw new Error('JSONの取得に失敗しました');
      const json = await res.json();

      const pages: Array<{
        sourcePage: string;
        bookId: string;
        branches: Array<{
          seqNo: number;
          questionText: string;
          answerBoolean: boolean;
          explanationText: string;
          sectionTitle?: string;
          sourcePageQuestion?: string;
          sourcePageAnswer?: string;
          subjectCandidate?: string;
          chapterCandidate?: string;
        }>;
      }> = json.pages ?? [];

      let updatedProblems = 0;
      let updatedAttrs = 0;

      for (const page of pages) {
        const pageNo = parseInt(page.sourcePage, 10);
        const bookId = page.bookId ?? 'KB2025';

        for (const branch of page.branches) {
          const seq = branch.seqNo;
          const p = String(pageNo).padStart(3, '0');
          const q = String(seq).padStart(2, '0');
          const problemId = `${bookId}-p${p}-q${q}`;

          // problems テーブル: cleanedText を更新
          const existing = await db.problems.where('problemId').equals(problemId).first();
          if (existing && existing.cleanedText !== branch.questionText) {
            await db.problems.update(existing.id!, {
              cleanedText: branch.questionText,
              rawText: branch.questionText,
            });
            updatedProblems++;
          }

          // problemAttrs テーブル: answerBoolean / explanationText を更新
          const { upsertProblemAttr } = await import('@/lib/db');
          const existingAttr = await db.problemAttrs.where('problemId').equals(problemId).first();
          const attrChanges: Record<string, unknown> = {};
          if (existingAttr) {
            if (existingAttr.answerBoolean !== branch.answerBoolean)
              attrChanges.answerBoolean = branch.answerBoolean;
            if (existingAttr.explanationText !== branch.explanationText)
              attrChanges.explanationText = branch.explanationText;
            if (Object.keys(attrChanges).length > 0) {
              await upsertProblemAttr(problemId, attrChanges);
              updatedAttrs++;
            }
          }
        }
      }

      setSyncResult(`完了: 問題文 ${updatedProblems}件・解説/正誤 ${updatedAttrs}件を更新しました`);
    } catch (e) {
      setSyncResult(`エラー: ${String(e)}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleMigrateLapNo = async () => {
    setMigrating(true);
    setMigrateResult(null);
    try {
      const SESSION_GAP_MS = 60 * 60 * 1000; // 1時間以内 = 同一セッション（再回答）扱い
      const allAttempts = await db.attempts.toArray();

      // problemId ごとにグループ化
      const byProblem = new Map<string, typeof allAttempts>();
      for (const a of allAttempts) {
        const list = byProblem.get(a.problemId) ?? [];
        list.push(a);
        byProblem.set(a.problemId, list);
      }

      let updated = 0;
      let deleted = 0;

      for (const [, attempts] of byProblem) {
        // answeredAt 昇順でソート
        const sorted = [...attempts].sort(
          (a, b) => new Date(a.answeredAt).getTime() - new Date(b.answeredAt).getTime(),
        );

        // 1時間以内の連続回答を「同一セッション（再回答）」としてグループ化
        // 各セッションの最後の回答だけを正解ログとして残す
        type Attempt = (typeof sorted)[number];
        const sessions: Attempt[][] = [];
        let cur: Attempt[] = [sorted[0]];
        for (let i = 1; i < sorted.length; i++) {
          const gap =
            new Date(sorted[i].answeredAt).getTime() -
            new Date(sorted[i - 1].answeredAt).getTime();
          if (gap > SESSION_GAP_MS) {
            sessions.push(cur);
            cur = [sorted[i]];
          } else {
            cur.push(sorted[i]);
          }
        }
        sessions.push(cur);

        for (let si = 0; si < sessions.length; si++) {
          const session = sessions[si];
          const correctLap = si + 1;
          const keep = session[session.length - 1]; // 最後の回答を残す

          // セッション内の余分な回答を削除
          for (let ai = 0; ai < session.length - 1; ai++) {
            await db.attempts.delete(session[ai].id!);
            deleted++;
          }

          // lapNo が違う場合は更新
          if (keep.lapNo !== correctLap) {
            await db.attempts.update(keep.id!, { lapNo: correctLap });
            updated++;
          }
        }
      }

      setMigrateResult(`完了: ${updated}件修正 / ${deleted}件削除（再回答の重複）`);
    } catch (e) {
      setMigrateResult(`エラー: ${String(e)}`);
    } finally {
      setMigrating(false);
      db.attempts.count().then(setAttemptCount);
    }
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

      {/* 管理者ツール */}
      {isAdmin && (
        <div className="space-y-3">
          {/* JSONデータ同期 */}
          <div className="space-y-1">
            <button
              onClick={handleSyncJson}
              disabled={syncing}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl py-4 font-medium flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <span>🔄</span>
              {syncing ? '同期中...' : 'JSONデータをDBに同期する（管理者）'}
            </button>
            {syncResult && (
              <p className="text-sm text-center text-slate-500">{syncResult}</p>
            )}
          </div>

          {/* ユーザー別回答数 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">👥 ユーザー別回答数</p>
              <button onClick={loadUserStats} className="text-xs text-indigo-500">
                {statsLoading ? '取得中...' : '取得'}
              </button>
            </div>
            {userStats && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                {userStats.length === 0 ? (
                  <p className="text-xs text-slate-400">データなし</p>
                ) : (
                  userStats.map((s, i) => (
                    <div key={s.userId} className="flex justify-between text-xs text-slate-600">
                      <span>ユーザー{i + 1} <span className="text-slate-400 font-mono text-[10px]">{s.userId.slice(0, 8)}...</span></span>
                      <span className="font-bold text-indigo-600">{s.count}問</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* エラーレポート */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">
                🚩 エラー報告
                {reports.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{reports.length}</span>
                )}
              </p>
              <button onClick={loadReports} className="text-xs text-indigo-500">再読込</button>
            </div>
            {reportsLoading ? (
              <p className="text-xs text-slate-400 text-center py-2">読み込み中...</p>
            ) : reports.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">未解決のレポートはありません</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {reports.map((r) => (
                  <div key={r.id} className="rounded-xl border border-red-100 bg-red-50 p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-red-700 bg-red-100 rounded px-1.5 py-0.5">
                        {REPORT_TYPE_LABEL[r.report_type] ?? r.report_type}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(r.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-500">{r.problem_id}</p>
                    <p className="text-xs text-slate-700 line-clamp-2">{r.question_text}</p>
                    {r.comment && (
                      <p className="text-xs text-slate-600 italic">「{r.comment}」</p>
                    )}
                    <button
                      onClick={() => resolveReport(r.id)}
                      className="w-full rounded-lg bg-white border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      ✓ 解決済みにする
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* lapNo 修正 */}
          <div className="space-y-1">
          <button
            onClick={handleMigrateLapNo}
            disabled={migrating}
            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-2xl py-4 font-medium flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <span>🔧</span>
            {migrating ? '修正中...' : '周回データを修正する（管理者）'}
          </button>
          {migrateResult && (
            <p className="text-sm text-center text-slate-500">{migrateResult}</p>
          )}
          </div>
        </div>
      )}

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
