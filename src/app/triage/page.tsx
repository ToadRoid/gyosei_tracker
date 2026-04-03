'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/components/AuthProvider';
import { db, upsertProblemAttr } from '@/lib/db';
import { importParsedBatch } from '@/lib/import-parsed';
import { subjects, chapters } from '@/data/master';
import type {
  Problem,
  ProblemAttr,
  TriageExport,
  TriageExportItem,
  TriageImport,
  TriageJudgment,
  AiTriageStatus,
  ParsedImport,
} from '@/types';

type Tab = 'export' | 'import' | 'split' | 'review';

// ── エクスポートタブ ──────────────────────────────────────

function ExportTab() {
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    db.problems.where('status').equals('draft').count().then(setDraftCount);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setDone(false);

    const drafts = await db.problems.where('status').equals('draft').toArray();
    const items: TriageExportItem[] = drafts.map((p) => ({
      problemId: p.problemId,
      sourceBook: p.sourceBook,
      sourcePage: p.sourcePage,
      sourceImageName: p.sourceImageName,
      rawText: p.rawText,
      cleanedText: p.cleanedText,
    }));

    const payload: TriageExport = {
      exportedAt: new Date().toISOString(),
      totalProblems: items.length,
      problems: items,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExporting(false);
    setDone(true);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
        <h2 className="font-bold text-slate-800">AI精査用JSONをエクスポート</h2>
        <p className="text-sm text-slate-500">
          下書き問題のテキストをJSONとして書き出し、ClaudeやChatGPTに判定させます。
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-center space-y-3">
        <p className="text-3xl font-black text-indigo-600">
          {draftCount ?? '...'}
          <span className="text-sm font-normal text-slate-500 ml-1">件（下書き）</span>
        </p>

        <button
          onClick={handleExport}
          disabled={exporting || draftCount === 0}
          className="w-full rounded-xl bg-indigo-600 py-3 text-white font-bold hover:bg-indigo-700 disabled:bg-slate-300"
        >
          {exporting ? 'エクスポート中...' : 'JSONをダウンロード'}
        </button>

        {done && (
          <p className="text-sm text-green-600 font-medium">ダウンロード完了！</p>
        )}
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2">
        <p className="text-sm font-bold text-blue-800">AIへの指示テンプレート</p>
        <p className="text-xs text-blue-700 leading-relaxed">
          下記のJSONは行政書士試験の肢別問題（◯✗選択式）です。各肢について以下を判定してください：
          <br /><br />
          • <b>aiTriageStatus</b>: "ready"（問題として使える）/ "discard"（目次・ページ番号等）/ "needs_review"（要確認）
          <br />
          • <b>aiDiscardReason</b>: "index" / "cover" / "ocr_error" / "page_num_only"
          <br />
          • <b>aiAnswerCandidate</b>: true（◯）/ false（✗）/ null（不明）
          <br />
          • <b>aiSubjectCandidate</b>: 科目ID（kenpo/gyosei/minpo/shoho/kenpot/ippan）
          <br />
          • <b>aiChapterCandidate</b>: 章ID
          <br />
          • <b>aiCleanedText</b>: OCRエラー修正後のテキスト
          <br />
          • <b>aiConfidence</b>: 確信度 0.0〜1.0
          <br /><br />
          返答形式: {"{"}"judgments": [{"{"}...{"}"}]{"}"}
        </p>
      </div>
    </div>
  );
}

// ── インポートタブ ──────────────────────────────────────

function ImportTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; skip: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);
    setError(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as TriageImport;

      if (!Array.isArray(parsed.judgments)) {
        throw new Error('judgments 配列が見つかりません');
      }

      let ok = 0;
      let skip = 0;

      for (const j of parsed.judgments as TriageJudgment[]) {
        const problem = await db.problems.where('problemId').equals(j.problemId).first();
        if (!problem) {
          skip++;
          continue;
        }

        // problemAttrs に AI 判定を書き込む
        await upsertProblemAttr(j.problemId, {
          aiTriageStatus: j.aiTriageStatus,
          ...(j.aiDiscardReason != null ? { aiDiscardReason: j.aiDiscardReason } : {}),
          ...(j.aiAnswerCandidate !== undefined ? { aiAnswerCandidate: j.aiAnswerCandidate } : {}),
          ...(j.aiSubjectCandidate != null ? { aiSubjectCandidate: j.aiSubjectCandidate } : {}),
          ...(j.aiChapterCandidate != null ? { aiChapterCandidate: j.aiChapterCandidate } : {}),
          ...(j.aiCleanedText != null ? { aiCleanedText: j.aiCleanedText } : {}),
          ...(j.aiConfidence != null ? { aiConfidence: j.aiConfidence } : {}),
        });

        ok++;
      }

      setResult({ ok, skip });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSONの解析に失敗しました');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
        <h2 className="font-bold text-slate-800">AI判定JSONをインポート</h2>
        <p className="text-sm text-slate-500">
          ClaudeやChatGPTから返ってきたJSONを読み込んでAI判定を保存します。
        </p>
      </div>

      <div
        className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <p className="text-3xl mb-2">📂</p>
        <p className="text-sm font-medium text-slate-600">
          JSONファイルを選択
        </p>
        <p className="text-xs text-slate-400 mt-1">triage_result_*.json</p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {importing && (
        <p className="text-center text-sm text-indigo-600">インポート中...</p>
      )}

      {result && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-1">
          <p className="font-bold text-green-800">インポート完了</p>
          <p className="text-sm text-green-700">
            更新: {result.ok}件 / スキップ（未登録）: {result.skip}件
          </p>
          <p className="text-xs text-green-600 mt-1">
            「レビュー」タブで確認・承認してください
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

// ── 分割取込タブ ──────────────────────────────────────

function SplitImportTab() {
  const [pending, setPending] = useState<(ParsedImport & { pending: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{
    pagesProcessed: number;
    oldRecordsDeleted: number;
    branchesSaved: number;
    branchesSkipped: number;
    errorPages: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pending-parsed');
      const data = await res.json();
      setPending(data.pending ? data : null);
    } catch {
      setPending(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPending();
  }, []);

  const handleImport = async () => {
    if (!pending) return;
    setImporting(true);
    setResult(null);
    setError(null);
    setProgress({ done: 0, total: pending.pages?.length ?? 0 });

    try {
      const res = await importParsedBatch(pending as ParsedImport, (done, total) => {
        setProgress({ done, total });
      });

      // ステージングファイルを削除
      await fetch('/api/pending-parsed', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: pending.batchId }),
      });

      setResult(res);
      setPending(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '取込に失敗しました');
    } finally {
      setImporting(false);
      setProgress(null);
    }
  };

  if (loading) {
    return <p className="text-center text-slate-400 py-12">確認中...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
        <h2 className="font-bold text-slate-800">LLM分割結果を取込</h2>
        <p className="text-sm text-slate-500">
          <code className="text-xs bg-slate-100 px-1 rounded">llm_parse.js</code> +{' '}
          <code className="text-xs bg-slate-100 px-1 rounded">stage_parsed.js</code> の出力を
          DBに登録します。既存のページ単位レコードは肢単位レコードに置き換わります。
        </p>
      </div>

      {!pending && !result && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <p className="text-3xl">📭</p>
          <p className="text-sm text-slate-500">保留中の分割データがありません</p>
          <p className="text-xs text-slate-400 mt-1">
            ターミナルで実行してください:<br />
            <code className="bg-slate-100 px-2 py-1 rounded text-xs mt-1 inline-block">
              node scripts/llm_parse.js --pages 1-10
            </code><br />
            <code className="bg-slate-100 px-2 py-1 rounded text-xs mt-1 inline-block">
              node scripts/stage_parsed.js
            </code>
          </p>
          <button
            onClick={checkPending}
            className="mt-2 text-xs text-indigo-600 hover:underline"
          >
            再確認
          </button>
        </div>
      )}

      {pending && !importing && !result && (
        <div className="space-y-4">
          {/* サマリー */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <p className="font-bold text-amber-900">⚡ 分割データを検出</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-black text-amber-700">{pending.pages?.length ?? 0}</p>
                <p className="text-xs text-slate-500">ページ数</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-black text-indigo-600">{pending.totalBranches ?? 0}</p>
                <p className="text-xs text-slate-500">総肢数</p>
              </div>
            </div>
            <div className="text-xs text-amber-700 space-y-1">
              <p>モデル: {pending.model}</p>
              <p>生成日時: {new Date(pending.parsedAt).toLocaleString('ja-JP')}</p>
            </div>
          </div>

          <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 text-xs text-orange-700">
            ⚠️ 取込実行すると、対象ページのページ単位レコードが削除され、肢単位レコードに置き換わります。
          </div>

          <button
            onClick={handleImport}
            className="w-full rounded-xl bg-indigo-600 py-3 text-white font-bold text-sm hover:bg-indigo-700"
          >
            取込開始（{pending.totalBranches}肢）
          </button>
        </div>
      )}

      {importing && progress && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 space-y-4 text-center">
          <p className="text-sm font-bold text-indigo-700">取込中...</p>
          <div className="w-full bg-indigo-100 rounded-full h-3">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0}%` }}
            />
          </div>
          <p className="text-xs text-indigo-600">
            {progress.done} / {progress.total} ページ
          </p>
        </div>
      )}

      {result && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-2">
          <p className="font-bold text-green-800">✅ 取込完了</p>
          <div className="text-sm text-green-700 space-y-1">
            <p>処理ページ数: {result.pagesProcessed}件</p>
            <p>旧レコード削除: {result.oldRecordsDeleted}件</p>
            <p>肢登録: {result.branchesSaved}件</p>
            {result.branchesSkipped > 0 && (
              <p className="text-slate-500">スキップ（重複）: {result.branchesSkipped}件</p>
            )}
            {result.errorPages > 0 && (
              <p className="text-red-600">エラーページ: {result.errorPages}件</p>
            )}
          </div>
          <p className="text-xs text-green-600 mt-1">
            「レビュー」タブで要確認（draft）の肢を確認できます
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

// ── レビュータブ ──────────────────────────────────────

type ReviewRow = Problem & { attr: ProblemAttr | undefined };

function ReviewTab() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [filter, setFilter] = useState<AiTriageStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  const loadRows = async () => {
    setLoading(true);
    const [allProblems, allAttrs] = await Promise.all([
      db.problems.where('status').equals('draft').toArray(),
      db.problemAttrs.toArray(),
    ]);
    const attrMap = new Map<string, ProblemAttr>(allAttrs.map((a) => [a.problemId, a]));
    const withAttrs: ReviewRow[] = allProblems
      .map((p) => ({ ...p, attr: attrMap.get(p.problemId) }))
      .filter((r) => r.attr?.aiTriageStatus != null); // AI判定ありのみ
    setRows(withAttrs);
    setLoading(false);
  };

  useEffect(() => {
    loadRows();
  }, []);

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.attr?.aiTriageStatus === filter);

  const handleApprove = async (row: ReviewRow) => {
    if (applying) return;
    setApplying(row.problemId);

    const attr = row.attr;
    if (!attr) { setApplying(null); return; }

    const subjectId = attr.aiSubjectCandidate || attr.subjectId || '';
    const chapterId = attr.aiChapterCandidate || attr.chapterId || '';
    const answerBoolean = attr.aiAnswerCandidate ?? attr.answerBoolean ?? null;
    const cleanedText = attr.aiCleanedText || row.cleanedText || row.rawText;

    const isReady = subjectId && chapterId && answerBoolean !== null;

    await db.problems.update(row.id!, {
      cleanedText,
      status: isReady ? 'ready' : 'draft',
    });
    await upsertProblemAttr(row.problemId, {
      subjectId,
      chapterId,
      answerBoolean,
      aiTriageStatus: 'ready',
    });

    setRows((prev) => prev.filter((r) => r.problemId !== row.problemId));
    setApplying(null);
  };

  const handleDiscard = async (row: ReviewRow) => {
    if (applying) return;
    setApplying(row.problemId);
    await db.problems.update(row.id!, { status: 'discard' });
    await upsertProblemAttr(row.problemId, { aiTriageStatus: 'discard' });
    setRows((prev) => prev.filter((r) => r.problemId !== row.problemId));
    setApplying(null);
  };

  const handleBulkApproveReady = async () => {
    const targets = rows.filter((r) => r.attr?.aiTriageStatus === 'ready');
    for (const row of targets) {
      await handleApprove(row);
    }
  };

  const counts = {
    all: rows.length,
    ready: rows.filter((r) => r.attr?.aiTriageStatus === 'ready').length,
    discard: rows.filter((r) => r.attr?.aiTriageStatus === 'discard').length,
    needs_review: rows.filter((r) => r.attr?.aiTriageStatus === 'needs_review').length,
  };

  if (loading) {
    return <p className="text-center text-slate-400 py-12">読み込み中...</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <span className="text-4xl">✅</span>
        <p className="text-slate-500">AI判定済みの下書きはありません</p>
        <p className="text-xs text-slate-400">エクスポート→AI判定→インポート後にここで確認できます</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ステータスフィルタ */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'ready', 'needs_review', 'discard'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {s === 'all' ? `全て (${counts.all})` :
             s === 'ready' ? `整備可 (${counts.ready})` :
             s === 'needs_review' ? `要確認 (${counts.needs_review})` :
             `廃棄 (${counts.discard})`}
          </button>
        ))}
      </div>

      {/* 一括承認ボタン */}
      {counts.ready > 0 && (
        <button
          onClick={handleBulkApproveReady}
          className="w-full rounded-xl bg-green-600 py-2.5 text-white text-sm font-bold hover:bg-green-700"
        >
          整備可 {counts.ready}件をまとめて承認
        </button>
      )}

      {/* カード一覧 */}
      <div className="space-y-3 pb-24">
        {filtered.map((row) => {
          const attr = row.attr;
          const subjectCandidate = subjects.find((s) => s.id === attr?.aiSubjectCandidate);
          const chapterCandidate = chapters.find((c) => c.id === attr?.aiChapterCandidate);

          return (
            <div key={row.problemId} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              {/* ヘッダ */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      attr?.aiTriageStatus === 'ready'
                        ? 'bg-green-100 text-green-700'
                        : attr?.aiTriageStatus === 'discard'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {attr?.aiTriageStatus === 'ready' ? '整備可' :
                     attr?.aiTriageStatus === 'discard' ? '廃棄' : '要確認'}
                  </span>
                  {attr?.aiConfidence != null && (
                    <span className="text-xs text-slate-400">
                      確信度 {Math.round(attr.aiConfidence * 100)}%
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">{row.sourcePage}p</span>
              </div>

              {/* AI提案 */}
              {(subjectCandidate || chapterCandidate || attr?.aiAnswerCandidate != null) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {subjectCandidate && (
                    <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs">
                      {subjectCandidate.name}
                    </span>
                  )}
                  {chapterCandidate && (
                    <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs">
                      {chapterCandidate.name}
                    </span>
                  )}
                  {attr?.aiAnswerCandidate != null && (
                    <span
                      className={`text-sm font-bold ${
                        attr.aiAnswerCandidate ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {attr.aiAnswerCandidate ? '◯' : '✗'}
                    </span>
                  )}
                </div>
              )}

              {/* 問題文 */}
              <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">
                {attr?.aiCleanedText || row.cleanedText || row.rawText}
              </p>

              {/* アクションボタン */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleDiscard(row)}
                  disabled={applying === row.problemId}
                  className="flex-1 rounded-lg border border-red-200 text-red-500 text-sm py-2 font-medium hover:bg-red-50 disabled:opacity-50"
                >
                  廃棄
                </button>
                <button
                  onClick={() => handleApprove(row)}
                  disabled={applying === row.problemId}
                  className="flex-1 rounded-lg bg-indigo-600 text-white text-sm py-2 font-bold hover:bg-indigo-700 disabled:bg-slate-300"
                >
                  {applying === row.problemId ? '処理中...' : '承認'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── メインページ ──────────────────────────────────────

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

export default function TriagePage() {
  const [tab, setTab] = useState<Tab>('export');
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user?.email || !ADMIN_EMAILS.includes(user.email))) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return null;
  }

  return (
    <div className="px-4 pt-6 space-y-4">
      <h1 className="text-xl font-bold text-slate-800">AI精査</h1>

      {/* タブ */}
      <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
        {([
          { key: 'split', label: '分割取込' },
          { key: 'export', label: 'OCR出力' },
          { key: 'import', label: 'AI判定' },
          { key: 'review', label: 'レビュー' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'split' && <SplitImportTab />}
      {tab === 'export' && <ExportTab />}
      {tab === 'import' && <ImportTab />}
      {tab === 'review' && <ReviewTab />}

      <NavBar />
    </div>
  );
}
