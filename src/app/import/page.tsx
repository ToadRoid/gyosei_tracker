'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { db, generateProblemId } from '@/lib/db';
import { runGapCheck, type GapCheckResult } from '@/lib/gap-check';
import { importBatch } from '@/lib/import-batch';
import type { Manifest } from '@/lib/import-batch';

import type { ManifestItem } from '@/lib/import-batch';

type Tab = 'batch' | 'text';
type BatchPhase = 'idle' | 'importing' | 'done';

const BOOK_ID_KEY = 'gyosei_tracker_bookId';

function splitBlocks(text: string): string[] {
  return text.split(/\n---+\n|\n{3,}/).map((s) => s.trim()).filter((s) => s.length > 0);
}

export default function ImportPage() {
  const [tab, setTab] = useState<Tab>('batch');
  const [totalAdded, setTotalAdded] = useState(0);
  const [bookId, setBookId] = useState('KB2025');

  const [batchPhase, setBatchPhase] = useState<BatchPhase>('idle');
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0, saved: 0, skipped: 0 });
  const [batchId, setBatchId] = useState('');
  const [gapCheck, setGapCheck] = useState<GapCheckResult | null>(null);
  const [manifestItemsRef, setManifestItemsRef] = useState<ManifestItem[]>([]);
  const [pendingBatch, setPendingBatch] = useState<{ bookId: string; manifest: Manifest; queuedAt: string } | null>(null);
  const [pendingLoading, setPendingLoading] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);

  const [textTab, setTextTab] = useState<'single' | 'bulk'>('single');
  const [singleText, setSingleText] = useState('');
  const [singleSaving, setSingleSaving] = useState(false);
  const [singleFlash, setSingleFlash] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkDone, setBulkDone] = useState(false);
  const [bulkSaved, setBulkSaved] = useState(0);

  // bookId を localStorage から復元
  useEffect(() => {
    const saved = localStorage.getItem(BOOK_ID_KEY);
    if (saved) setBookId(saved);
  }, []);

  // pending_import.json を自動検出
  useEffect(() => {
    fetch('/api/pending-import')
      .then((r) => r.json())
      .then((data) => {
        if (data.pending) setPendingBatch(data);
      })
      .catch(() => {}); // サーバー未起動時は無視
  }, []);

  const saveBookId = (val: string) => {
    setBookId(val);
    localStorage.setItem(BOOK_ID_KEY, val);
  };

  // ── バッチ取込（フォルダ選択） ─────────────────
  const handleFolderSelect = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const manifestFile = fileArray.find((f) => f.name === 'manifest.json');

    if (manifestFile) {
      await importFromManifest(manifestFile);
    } else {
      const txtFiles = fileArray.filter((f) => f.name.endsWith('.txt'));
      if (txtFiles.length === 0) {
        alert('manifest.json または .txt ファイルが見つかりませんでした');
        return;
      }
      await importTxtFiles(txtFiles, '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const runImport = async (manifest: Manifest, bid_bookId: string) => {
    const validCount = manifest.items.filter((item) => !item.isEmpty && item.ocrText.trim()).length;
    setManifestItemsRef(manifest.items);
    setBatchPhase('importing');
    setBatchProgress({ done: 0, total: validCount, saved: 0, skipped: 0 });

    const result = await importBatch(manifest, bid_bookId, (done, total, saved, skipped) => {
      setBatchProgress({ done, total, saved, skipped });
    });

    setBatchId(result.batchId);
    setBatchProgress({ done: validCount, total: validCount, saved: result.saved, skipped: result.skipped });
    setGapCheck(result.gapCheck);
    setTotalAdded((c) => c + result.saved);
    setBatchPhase('done');
  };

  const importFromManifest = async (manifestFile: File) => {
    const raw = await manifestFile.text();
    const manifest: Manifest = JSON.parse(raw);
    await runImport(manifest, bookId);
  };

  const handlePendingImport = async () => {
    if (!pendingBatch) return;
    setPendingLoading(true);
    try {
      await runImport(pendingBatch.manifest, pendingBatch.bookId);
      // 取込完了後のみ pending ファイルを削除（batchId 照合付き）
      const delRes = await fetch('/api/pending-import', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: pendingBatch.manifest.batchId }),
      });
      if (!delRes.ok) {
        console.warn('pending 削除時に batchId 不一致が発生しました（無視して続行）');
      }
      setPendingBatch(null);
    } catch (e) {
      console.error('pending import 失敗:', e);
      alert('取込中にエラーが発生しました。ページをリロードして再試行してください。');
      // pending_import.json は残したままにする（リトライ可能）
    } finally {
      setPendingLoading(false);
    }
  };

  const importTxtFiles = async (txtFiles: File[], bid: string) => {
    setBatchPhase('importing');
    setBatchProgress({ done: 0, total: txtFiles.length, saved: 0, skipped: 0 });

    let saved = 0;
    let skipped = 0;
    for (let i = 0; i < txtFiles.length; i++) {
      const file = txtFiles[i];
      const text = (await file.text()).trim();
      if (!text) { skipped++; }
      else {
        const baseName = file.name.replace(/\.txt$/, '');
        const pageNo = parseInt(baseName, 10) || (i + 1);
        const problemId = generateProblemId(bookId, pageNo);
        const exists = await db.problems.where('problemId').equals(problemId).count();
        if (exists === 0) {
          await db.problems.add({
            problemId,
            sourceBook: bookId,
            sourcePage: String(pageNo).padStart(3, '0'),
            sourceImageName: file.name,
            importBatchId: bid || undefined,
            rawText: text,
            cleanedText: text,
            status: 'draft',
            createdAt: new Date(),
          });
          saved++;
        } else { skipped++; }
      }
      setBatchProgress({ done: i + 1, total: txtFiles.length, saved, skipped });
    }

    setTotalAdded((c) => c + saved);
    setBatchPhase('done');
  };

  // ── テキスト 1問追加 ───────────────────────────
  const handleSingleSave = useCallback(async () => {
    const text = singleText.trim();
    if (!text || singleSaving) return;
    setSingleSaving(true);

    // 連番で problemId を生成（既存最大 + 1）
    const count = await db.problems.count();
    const problemId = generateProblemId(bookId, count + 1);

    await db.problems.add({
      problemId,
      sourceBook: bookId,
      sourcePage: '',
      sourceImageName: '',
      rawText: text,
      cleanedText: text,
      status: 'draft',
      createdAt: new Date(),
    });
    setTotalAdded((c) => c + 1);
    setSingleText('');
    setSingleSaving(false);
    setSingleFlash(true);
    setTimeout(() => setSingleFlash(false), 1500);
  }, [singleText, singleSaving, bookId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (tab === 'text' && textTab === 'single' && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSingleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tab, textTab, handleSingleSave]);

  // ── テキスト まとめて追加 ──────────────────────
  const handleBulkSave = async () => {
    const blocks = splitBlocks(bulkText);
    if (blocks.length === 0) return;
    const startCount = await db.problems.count();
    let saved = 0;
    for (let i = 0; i < blocks.length; i++) {
      const problemId = generateProblemId(bookId, startCount + i + 1);
      await db.problems.add({
        problemId,
        sourceBook: bookId,
        sourcePage: '',
        sourceImageName: '',
        rawText: blocks[i],
        cleanedText: blocks[i],
        status: 'draft',
        createdAt: new Date(),
      });
      saved++;
    }
    setBulkSaved(saved);
    setBulkDone(true);
    setTotalAdded((c) => c + saved);
  };

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">問題を追加</h1>
        {totalAdded > 0 && (
          <span className="text-indigo-600 font-bold text-sm">{totalAdded}件追加済み</span>
        )}
      </div>

      {/* CLI 保留中バナー */}
      {pendingBatch && batchPhase === 'idle' && (
        <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-amber-800">📦 CLIからの取込待ちがあります</p>
              <p className="text-xs text-amber-600 mt-0.5">
                bookId: {pendingBatch.bookId} ／ {pendingBatch.manifest.totalItems}件
              </p>
            </div>
            <button
              onClick={handlePendingImport}
              disabled={pendingLoading}
              className="rounded-lg bg-amber-500 text-white text-sm font-bold px-4 py-2 hover:bg-amber-600 disabled:bg-slate-300"
            >
              {pendingLoading ? '取込中...' : '取込開始'}
            </button>
          </div>
          <p className="text-xs text-amber-500">
            登録日時: {new Date(pendingBatch.queuedAt).toLocaleString('ja-JP')}
          </p>
        </div>
      )}

      {/* bookId 設定 */}
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
        <span className="text-xs text-slate-500 shrink-0">書籍ID</span>
        <input
          value={bookId}
          onChange={(e) => saveBookId(e.target.value)}
          placeholder="KB2025"
          className="flex-1 bg-transparent text-sm font-mono font-bold text-slate-800 focus:outline-none"
        />
        <span className="text-xs text-slate-400">problemId に使用</span>
      </div>

      {/* メインタブ */}
      <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
        <button onClick={() => { setTab('batch'); setBatchPhase('idle'); }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === 'batch' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
          バッチ取込
        </button>
        <button onClick={() => setTab('text')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === 'text' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
          テキスト入力
        </button>
      </div>

      {/* バッチ取込 */}
      {tab === 'batch' && batchPhase === 'idle' && (
        <div className="space-y-3">
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">推奨フロー</p>
            <ol className="list-decimal list-inside space-y-1">
              <li><code className="bg-white border rounded px-1">kindle_capture.sh</code> でスクショ収集</li>
              <li><code className="bg-white border rounded px-1">ocr_batch.sh</code> でOCR → バッチフォルダ生成</li>
              <li>「バッチフォルダを選択」でまとめて取込</li>
            </ol>
            <p className="mt-1">problemId: <code className="font-mono">{bookId}-p001-q01</code> 〜</p>
          </div>

          <input ref={folderInputRef} type="file"
            // @ts-expect-error webkitdirectory
            webkitdirectory="" multiple
            onChange={(e) => e.target.files && handleFolderSelect(e.target.files)}
            className="hidden" />
          <button onClick={() => folderInputRef.current?.click()}
            className="w-full rounded-xl border-2 border-indigo-300 bg-indigo-50 px-4 py-8 text-center hover:border-indigo-500 hover:bg-indigo-100 transition-colors">
            <span className="block text-3xl mb-2">📂</span>
            <span className="block text-sm font-bold text-indigo-700">バッチフォルダを選択</span>
            <span className="block text-xs text-indigo-500 mt-1">manifest.json を含むフォルダ → 全件ドラフト保存</span>
          </button>

          <input ref={txtInputRef} type="file" accept=".txt" multiple
            onChange={(e) => e.target.files && importTxtFiles(Array.from(e.target.files), '')}
            className="hidden" />
          <button onClick={() => txtInputRef.current?.click()}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center hover:bg-slate-100 transition-colors">
            <span className="block text-sm text-slate-600 font-medium">📄 .txt ファイルを直接選択</span>
            <span className="block text-xs text-slate-400 mt-0.5">manifest なしで複数 txt を一括取込</span>
          </button>
        </div>
      )}

      {tab === 'batch' && batchPhase === 'importing' && (
        <div className="space-y-4 py-4">
          <div className="text-center space-y-2">
            <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-700">取込中... {batchProgress.done} / {batchProgress.total}</p>
            <p className="text-xs text-slate-500">保存済み: {batchProgress.saved}件 / スキップ: {batchProgress.skipped}件</p>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${batchProgress.total > 0 ? (batchProgress.done / batchProgress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {tab === 'batch' && batchPhase === 'done' && (
        <div className="space-y-4 py-4">
          {/* 保存結果 */}
          <div className="text-center">
            <p className="text-2xl font-black text-indigo-600">{batchProgress.saved}件</p>
            <p className="text-sm font-bold text-slate-700">ドラフト保存しました</p>
            {batchId && <p className="text-xs text-slate-400 mt-1">バッチID: {batchId}</p>}
            {batchProgress.skipped > 0 && (
              <p className="text-xs text-slate-400">{batchProgress.skipped}件はスキップ（空・重複）</p>
            )}
          </div>

          {/* 欠番チェック結果 */}
          {gapCheck && (
            <div className={`rounded-xl border p-4 space-y-2 ${
              gapCheck.hasMissing || gapCheck.manifestVsDb === 'mismatch'
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <p className="text-sm font-bold text-slate-800">
                {gapCheck.hasMissing || gapCheck.manifestVsDb === 'mismatch' ? '⚠️ 欠番チェック' : '✅ 欠番チェック OK'}
              </p>
              <div className="text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>manifest件数</span>
                  <span className="font-mono font-bold">{gapCheck.manifestTotal}件</span>
                </div>
                <div className="flex justify-between">
                  <span>DB保存件数（本バッチ）</span>
                  <span className={`font-mono font-bold ${gapCheck.manifestVsDb === 'mismatch' ? 'text-red-600' : ''}`}>
                    {gapCheck.dbImportedCount}件
                    {gapCheck.manifestVsDb === 'mismatch' ? ' ⚠️不一致' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>DB draft 総数</span>
                  <span className="font-mono font-bold">{gapCheck.dbAllDraftCount}件</span>
                </div>
                <div className="flex justify-between">
                  <span>ページ範囲</span>
                  <span className="font-mono">
                    {String(gapCheck.expectedMin).padStart(4, '0')}〜{String(gapCheck.expectedMax).padStart(4, '0')}
                  </span>
                </div>
                {gapCheck.hasMissing && (
                  <div className="mt-2 pt-2 border-t border-red-200">
                    <p className="text-red-600 font-bold">欠番: {gapCheck.missingPages.length}件</p>
                    <p className="font-mono text-red-500 text-xs break-all">
                      {gapCheck.missingPages.slice(0, 20).map((n) => String(n).padStart(4, '0')).join(', ')}
                      {gapCheck.missingPages.length > 20 ? ` ... 他${gapCheck.missingPages.length - 20}件` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <a href="/triage" className="flex-1 rounded-xl bg-indigo-600 py-3 text-white font-bold text-center hover:bg-indigo-700">
              AI精査へ →
            </a>
            <button onClick={() => { setBatchPhase('idle'); setGapCheck(null); }}
              className="flex-1 rounded-xl bg-slate-100 py-3 text-slate-700 font-bold hover:bg-slate-200">
              続けて取込
            </button>
          </div>
        </div>
      )}

      {/* テキスト入力 */}
      {tab === 'text' && (
        <div className="space-y-3">
          <div className="flex rounded-lg bg-slate-100 p-0.5 gap-0.5">
            <button onClick={() => setTextTab('single')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${textTab === 'single' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
              1問追加
            </button>
            <button onClick={() => setTextTab('bulk')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${textTab === 'bulk' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
              まとめて追加
            </button>
          </div>

          {textTab === 'single' && (
            <>
              <textarea value={singleText} onChange={(e) => setSingleText(e.target.value)}
                rows={9} placeholder="問題文を貼り付け..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
                autoFocus />
              <button onClick={handleSingleSave} disabled={!singleText.trim() || singleSaving}
                className={`w-full rounded-xl py-3 font-bold transition-colors ${
                  singleFlash ? 'bg-green-500 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-400'
                }`}>
                {singleSaving ? '保存中...' : singleFlash ? '保存しました ✓' : '下書き保存　⌘↵'}
              </button>
            </>
          )}

          {textTab === 'bulk' && !bulkDone && (
            <>
              <p className="text-xs text-slate-500">区切り: <code className="bg-slate-100 px-1 rounded">---</code> または空行2行</p>
              <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)}
                rows={12} placeholder={"問題文1\n\n\n問題文2\n---\n問題文3"}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 resize-y font-mono"
                autoFocus />
              {bulkText.trim() && (
                <p className="text-xs text-slate-500 text-right">{splitBlocks(bulkText).length}件として認識</p>
              )}
              <button onClick={handleBulkSave} disabled={!bulkText.trim()}
                className="w-full rounded-xl bg-indigo-600 py-3 text-white font-bold hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-400">
                まとめて下書き保存
              </button>
            </>
          )}

          {textTab === 'bulk' && bulkDone && (
            <div className="py-6 text-center space-y-4">
              <p className="text-lg font-bold text-slate-800">{bulkSaved}件を下書き保存しました</p>
              <div className="flex gap-3">
                <a href="/triage" className="flex-1 rounded-xl bg-indigo-600 py-3 text-white font-bold text-center hover:bg-indigo-700">AI精査へ →</a>
                <button onClick={() => { setBulkText(''); setBulkDone(false); setBulkSaved(0); }}
                  className="flex-1 rounded-xl bg-slate-100 py-3 text-slate-700 font-bold hover:bg-slate-200">続けて追加</button>
              </div>
            </div>
          )}
        </div>
      )}

      <NavBar />
    </div>
  );
}
