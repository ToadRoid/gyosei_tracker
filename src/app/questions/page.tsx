'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import QuestionCard from '@/components/QuestionCard';
import EditQuestionModal from '@/components/EditQuestionModal';
import {
  db,
  excludeProblem,
  unexcludeProblem,
  setNeedsSourceCheck,
  bulkExcludeProblems,
  bulkUnexcludeProblems,
  bulkSetNeedsSourceCheck,
} from '@/lib/db';
import { subjects, chapters } from '@/data/master';
import { useAuth } from '@/components/AuthProvider';
import type { Problem, ProblemAttr, ProblemStatus, Attempt } from '@/types';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim()).filter(Boolean);

type ExclusionFilter = '' | 'excluded' | 'needs_source_check';
type ProblemRow = Problem & { attr: ProblemAttr | undefined };

const EXCLUDE_REASONS = [
  { value: 'data_error', label: 'データ不整合' },
  { value: 'ocr_corruption', label: 'OCR破損' },
  { value: 'duplicate', label: '重複問題' },
  { value: 'ghost_record', label: '幽霊レコード' },
  { value: 'out_of_scope', label: '対象外' },
  { value: 'other', label: 'その他' },
] as const;

export default function QuestionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!authLoading && user && !ADMIN_EMAILS.includes(user.email ?? '')) {
      router.replace('/exercise');
    }
  }, [user, authLoading, router]);

  const [subjectFilter, setSubjectFilter] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | ProblemStatus>('');
  const [exclusionFilter, setExclusionFilter] = useState<ExclusionFilter>('');
  const [rows, setRows] = useState<ProblemRow[]>([]);
  const [attemptMap, setAttemptMap] = useState<Map<string, Attempt[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ problem: Problem; attr: ProblemAttr | undefined } | null>(null);

  // 選択モード
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 除外モーダル
  const [excludeModal, setExcludeModal] = useState<{ ids: string[] } | null>(null);
  const [excludeReason, setExcludeReason] = useState<string>('data_error');
  const [excludeNote, setExcludeNote] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);

    const [allProblems, allAttrs, allAttempts] = await Promise.all([
      db.problems.orderBy('createdAt').reverse().toArray(),
      db.problemAttrs.toArray(),
      db.attempts.toArray(),
    ]);

    const attrMap = new Map<string, ProblemAttr>(allAttrs.map((a) => [a.problemId, a]));

    const filtered: ProblemRow[] = allProblems
      .map((p) => ({ ...p, attr: attrMap.get(p.problemId) }))
      .filter((row) => {
        if (statusFilter && row.status !== statusFilter) return false;
        if (subjectFilter && row.attr?.subjectId !== subjectFilter) return false;
        if (chapterFilter && row.attr?.chapterId !== chapterFilter) return false;
        if (exclusionFilter === 'excluded' && row.attr?.isExcluded !== true) return false;
        if (exclusionFilter === 'needs_source_check' && row.attr?.needsSourceCheck !== true) return false;
        return true;
      });

    const aMap = new Map<string, Attempt[]>();
    for (const a of allAttempts) {
      const list = aMap.get(a.problemId) || [];
      list.push(a);
      aMap.set(a.problemId, list);
    }

    setRows(filtered);
    setAttemptMap(aMap);
    setLoading(false);
  }, [subjectFilter, chapterFilter, statusFilter, exclusionFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (problemId: string) => {
    const problem = rows.find((r) => r.problemId === problemId);
    if (!problem) return;
    await db.problems.delete(problem.id!);
    await db.problemAttrs.where('problemId').equals(problemId).delete();
    await db.attempts.where('problemId').equals(problemId).delete();
    setRows((prev) => prev.filter((r) => r.problemId !== problemId));
    setSelectedIds((prev) => { const s = new Set(prev); s.delete(problemId); return s; });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    for (const problemId of ids) {
      const row = rows.find((r) => r.problemId === problemId);
      if (!row) continue;
      await db.problems.delete(row.id!);
      await db.problemAttrs.where('problemId').equals(problemId).delete();
      await db.attempts.where('problemId').equals(problemId).delete();
    }
    setRows((prev) => prev.filter((r) => !selectedIds.has(r.problemId)));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  // 除外操作
  const openExcludeModal = (ids: string[]) => {
    setExcludeReason('data_error');
    setExcludeNote('');
    setExcludeModal({ ids });
  };

  const handleConfirmExclude = async () => {
    if (!excludeModal) return;
    await bulkExcludeProblems(excludeModal.ids, excludeReason, excludeNote || undefined, user?.email ?? undefined);
    setExcludeModal(null);
    setSelectedIds(new Set());
    await loadData();
  };

  const handleBulkUnexclude = async () => {
    await bulkUnexcludeProblems(Array.from(selectedIds));
    setSelectedIds(new Set());
    await loadData();
  };

  const handleBulkSetSourceCheck = async (value: boolean) => {
    await bulkSetNeedsSourceCheck(Array.from(selectedIds), value);
    setSelectedIds(new Set());
    await loadData();
  };

  const handleSingleExclude = async (problemId: string) => {
    openExcludeModal([problemId]);
  };

  const handleSingleUnexclude = async (problemId: string) => {
    await unexcludeProblem(problemId);
    await loadData();
  };

  const handleSingleToggleSourceCheck = async (problemId: string, current: boolean) => {
    await setNeedsSourceCheck(problemId, !current);
    await loadData();
  };

  const handleEditSaved = (updated: Problem, updatedAttr: ProblemAttr) => {
    setRows((prev) =>
      prev.map((r) =>
        r.problemId === updated.problemId ? { ...updated, attr: updatedAttr } : r,
      ),
    );
    setEditing(null);
  };

  const handleSelect = (problemId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      checked ? s.add(problemId) : s.delete(problemId);
      return s;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.problemId)));
    }
  };

  const filteredChapters = subjectFilter
    ? chapters.filter((c) => c.subjectId === subjectFilter)
    : [];

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">問題一覧</h1>
        <button
          onClick={() => {
            setSelectMode((v) => !v);
            setSelectedIds(new Set());
          }}
          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
            selectMode
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {selectMode ? '選択中' : '選択'}
        </button>
      </div>

      {/* フィルタ */}
      <div className="flex gap-2">
        <select
          value={subjectFilter}
          onChange={(e) => { setSubjectFilter(e.target.value); setChapterFilter(''); }}
          className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">全科目</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={chapterFilter}
          onChange={(e) => setChapterFilter(e.target.value)}
          disabled={!subjectFilter}
          className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100"
        >
          <option value="">全章</option>
          {filteredChapters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* ステータスフィルタ */}
      <div className="flex gap-2 flex-wrap">
        {(['', 'draft', 'ready'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === '' ? '全て' : s === 'draft' ? '下書き' : '整備済み'}
          </button>
        ))}
        <div className="w-px bg-slate-200 mx-1" />
        {([
          { value: '' as ExclusionFilter, label: '除外なし' },
          { value: 'excluded' as ExclusionFilter, label: '除外済み' },
          { value: 'needs_source_check' as ExclusionFilter, label: '要原本確認' },
        ]).map((f) => (
          <button
            key={f.value}
            onClick={() => setExclusionFilter(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              exclusionFilter === f.value
                ? f.value === 'excluded'
                  ? 'bg-red-600 text-white'
                  : f.value === 'needs_source_check'
                  ? 'bg-amber-500 text-white'
                  : 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 選択モード ツールバー */}
      {selectMode && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 space-y-2">
          <div className="flex items-center gap-3">
            <button onClick={handleSelectAll} className="text-sm text-indigo-600 font-medium">
              {selectedIds.size === rows.length ? '全解除' : '全選択'}
            </button>
            <span className="text-sm text-slate-500 flex-1">{selectedIds.size}件選択中</span>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="rounded-lg bg-red-500 text-white text-xs font-bold px-3 py-1.5 hover:bg-red-600"
              >
                削除
              </button>
            )}
          </div>
          {selectedIds.size > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => openExcludeModal(Array.from(selectedIds))}
                className="rounded-lg bg-orange-500 text-white text-xs font-bold px-3 py-1.5 hover:bg-orange-600"
              >
                除外
              </button>
              <button
                onClick={handleBulkUnexclude}
                className="rounded-lg bg-slate-500 text-white text-xs font-bold px-3 py-1.5 hover:bg-slate-600"
              >
                除外解除
              </button>
              <button
                onClick={() => handleBulkSetSourceCheck(true)}
                className="rounded-lg bg-amber-500 text-white text-xs font-bold px-3 py-1.5 hover:bg-amber-600"
              >
                要原本確認
              </button>
              <button
                onClick={() => handleBulkSetSourceCheck(false)}
                className="rounded-lg bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 hover:bg-slate-300"
              >
                確認済み
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-slate-500">{rows.length}件</p>

      {loading ? (
        <p className="text-center text-slate-400 py-12">読み込み中...</p>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <span className="text-4xl">📭</span>
          <p className="text-slate-500">問題がありません</p>
          <a
            href="/import"
            className="inline-block rounded-xl bg-indigo-600 px-6 py-2 text-white font-bold hover:bg-indigo-700"
          >
            問題を取り込む
          </a>
        </div>
      ) : (
        <div className="space-y-3 pb-24">
          {rows.map((row) => {
            const attempts = attemptMap.get(row.problemId) || [];
            const lastAttempt =
              attempts.length > 0
                ? attempts.sort(
                    (a, b) =>
                      new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime(),
                  )[0]
                : null;

            return (
              <div key={row.problemId} className="relative">
                <QuestionCard
                  problem={row}
                  attr={row.attr}
                  attemptCount={attempts.length}
                  lastCorrect={lastAttempt?.isCorrect ?? null}
                  selected={selectMode ? selectedIds.has(row.problemId) : undefined}
                  onSelect={selectMode ? handleSelect : undefined}
                  onEdit={!selectMode ? (p, a) => setEditing({ problem: p, attr: a }) : undefined}
                  onDelete={!selectMode ? handleDelete : undefined}
                />
                {!selectMode && (
                  <div className="flex gap-1.5 mt-1 px-1">
                    {row.attr?.isExcluded ? (
                      <button
                        onClick={() => handleSingleUnexclude(row.problemId)}
                        className="text-xs text-slate-400 hover:text-indigo-500"
                      >
                        除外解除
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSingleExclude(row.problemId)}
                        className="text-xs text-slate-400 hover:text-orange-500"
                      >
                        除外
                      </button>
                    )}
                    <span className="text-slate-200">|</span>
                    <button
                      onClick={() => handleSingleToggleSourceCheck(row.problemId, row.attr?.needsSourceCheck ?? false)}
                      className={`text-xs ${row.attr?.needsSourceCheck ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}
                    >
                      {row.attr?.needsSourceCheck ? '要確認中' : '要原本確認'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <NavBar />

      {editing && (
        <EditQuestionModal
          problem={editing.problem}
          attr={editing.attr}
          onSaved={handleEditSaved}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* 除外理由モーダル */}
      {excludeModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">除外設定 ({excludeModal.ids.length}件)</h3>
              <button onClick={() => setExcludeModal(null)} className="text-slate-400 text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EXCLUDE_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setExcludeReason(r.value)}
                  className={`rounded-xl py-2.5 text-sm font-medium border transition-colors ${
                    excludeReason === r.value
                      ? 'bg-orange-50 border-orange-300 text-orange-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              value={excludeNote}
              onChange={(e) => setExcludeNote(e.target.value)}
              placeholder="補足メモ（任意）"
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={handleConfirmExclude}
              className="w-full rounded-xl bg-orange-500 text-white font-bold py-3 hover:bg-orange-600"
            >
              除外する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
