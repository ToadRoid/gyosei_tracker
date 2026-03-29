'use client';

import { useState, useEffect, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import QuestionCard from '@/components/QuestionCard';
import EditQuestionModal from '@/components/EditQuestionModal';
import { db } from '@/lib/db';
import { subjects, chapters } from '@/data/master';
import type { Problem, ProblemAttr, ProblemStatus, Attempt } from '@/types';

type ProblemRow = Problem & { attr: ProblemAttr | undefined };

export default function QuestionsPage() {
  const [subjectFilter, setSubjectFilter] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | ProblemStatus>('');
  const [rows, setRows] = useState<ProblemRow[]>([]);
  const [attemptMap, setAttemptMap] = useState<Map<string, Attempt[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ problem: Problem; attr: ProblemAttr | undefined } | null>(null);

  // 選択モード
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);

    const [allProblems, allAttrs, allAttempts] = await Promise.all([
      db.problems.orderBy('createdAt').reverse().toArray(),
      db.problemAttrs.toArray(),
      db.attempts.toArray(),
    ]);

    const attrMap = new Map<string, ProblemAttr>(allAttrs.map((a) => [a.problemId, a]));

    // Join and filter
    const filtered: ProblemRow[] = allProblems
      .map((p) => ({ ...p, attr: attrMap.get(p.problemId) }))
      .filter((row) => {
        if (statusFilter && row.status !== statusFilter) return false;
        if (subjectFilter && row.attr?.subjectId !== subjectFilter) return false;
        if (chapterFilter && row.attr?.chapterId !== chapterFilter) return false;
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
  }, [subjectFilter, chapterFilter, statusFilter]);

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
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            setChapterFilter('');
          }}
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
      <div className="flex gap-2">
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
      </div>

      {/* 選択モード ツールバー */}
      {selectMode && (
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
          <button
            onClick={handleSelectAll}
            className="text-sm text-indigo-600 font-medium"
          >
            {selectedIds.size === rows.length ? '全解除' : '全選択'}
          </button>
          <span className="text-sm text-slate-500 flex-1">{selectedIds.size}件選択中</span>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="rounded-lg bg-red-500 text-white text-sm font-bold px-4 py-1.5 hover:bg-red-600"
            >
              {selectedIds.size}件削除
            </button>
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
              <QuestionCard
                key={row.problemId}
                problem={row}
                attr={row.attr}
                attemptCount={attempts.length}
                lastCorrect={lastAttempt?.isCorrect ?? null}
                selected={selectMode ? selectedIds.has(row.problemId) : undefined}
                onSelect={selectMode ? handleSelect : undefined}
                onEdit={!selectMode ? (p, a) => setEditing({ problem: p, attr: a }) : undefined}
                onDelete={!selectMode ? handleDelete : undefined}
              />
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
    </div>
  );
}
