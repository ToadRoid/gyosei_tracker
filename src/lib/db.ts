import Dexie, { type EntityTable } from 'dexie';
import type { Problem, ProblemAttr, Attempt, ProblemForExercise } from '@/types';
import { supabase } from './supabase';
import { resolveDisplaySectionTitle } from '@/data/sectionNormalization';

class GyoseiDB extends Dexie {
  problems!: EntityTable<Problem, 'id'>;
  problemAttrs!: EntityTable<ProblemAttr, 'id'>;
  attempts!: EntityTable<Attempt, 'id'>;

  constructor() {
    super('gyosei_tracker');

    // v1〜v4: 旧スキーマ（questions / imports ベース）
    this.version(1).stores({
      subjects: 'id, order',
      chapters: 'id, subjectId, order',
      questions: '++id, subjectId, chapterId, createdAt',
      attempts: '++id, questionId, lapNo, answeredAt',
      imports: '++id, status, importedAt',
    });
    this.version(2).stores({
      subjects: null,
      chapters: null,
      questions: '++id, subjectId, chapterId, createdAt',
      attempts: '++id, questionId, lapNo, answeredAt',
      imports: '++id, status, importedAt',
    });
    this.version(3).stores({
      questions: '++id, subjectId, chapterId, createdAt',
      attempts: '++id, questionId, lapNo, [questionId+lapNo], answeredAt',
      imports: '++id, status, importedAt',
    });
    this.version(4).stores({
      questions: '++id, subjectId, chapterId, status, needsReview, importance, year, createdAt',
      attempts: '++id, questionId, lapNo, [questionId+lapNo], answeredAt',
      imports: '++id, status, importedAt',
    }).upgrade((tx) =>
      tx.table('questions').toCollection().modify((q) => {
        if (!q.status) q.status = 'ready';
        if (q.answerBoolean === undefined) q.answerBoolean = null;
      }),
    );

    // v5: 3テーブル分離
    //   - questions / imports → 廃止
    //   - problems / problemAttrs / attempts（新） → 追加
    this.version(5).stores({
      questions: null,
      imports: null,
      problems: '++id, &problemId, sourceBook, importBatchId, status, createdAt',
      problemAttrs: '++id, &problemId, subjectId, chapterId, aiTriageStatus',
      attempts: '++id, problemId, lapNo, [problemId+lapNo], answeredAt',
    });

    // v6: isExcluded インデックス追加（除外フラグ管理）
    this.version(6).stores({
      problemAttrs: '++id, &problemId, subjectId, chapterId, aiTriageStatus, isExcluded',
    });
  }
}

export const db = new GyoseiDB();

// ── helpers ───────────────────────────────────────────

/**
 * problemAttrs を upsert（problemId で既存確認→update or insert）
 */
export async function upsertProblemAttr(
  problemId: string,
  changes: Partial<Omit<ProblemAttr, 'id' | 'problemId'>>,
): Promise<void> {
  const existing = await db.problemAttrs.where('problemId').equals(problemId).first();
  if (existing?.id !== undefined) {
    await db.problemAttrs.update(existing.id, changes);
  } else {
    await db.problemAttrs.add({
      problemId,
      subjectId: '',
      chapterId: '',
      answerBoolean: null,
      ...changes,
    });
  }
}

/**
 * 問題を除外フラグで非表示にする（物理削除の代替）
 */
export async function excludeProblem(
  problemId: string,
  reason: string,
  note?: string,
  excludedBy?: string,
): Promise<void> {
  await upsertProblemAttr(problemId, {
    isExcluded: true,
    excludeReason: reason,
    excludeNote: note,
    excludedAt: new Date(),
    excludedBy,
  });
}

export async function unexcludeProblem(problemId: string): Promise<void> {
  await upsertProblemAttr(problemId, {
    isExcluded: false,
    excludeReason: undefined,
    excludeNote: undefined,
    excludedAt: undefined,
    excludedBy: undefined,
  });
}

export async function setNeedsSourceCheck(
  problemId: string,
  value: boolean,
  note?: string,
): Promise<void> {
  await upsertProblemAttr(problemId, {
    needsSourceCheck: value,
    sourceCheckNote: note,
  });
}

export async function bulkExcludeProblems(
  problemIds: string[],
  reason: string,
  note?: string,
  excludedBy?: string,
): Promise<void> {
  for (const pid of problemIds) {
    await excludeProblem(pid, reason, note, excludedBy);
  }
}

export async function bulkUnexcludeProblems(problemIds: string[]): Promise<void> {
  for (const pid of problemIds) {
    await unexcludeProblem(pid);
  }
}

export async function bulkSetNeedsSourceCheck(
  problemIds: string[],
  value: boolean,
  note?: string,
): Promise<void> {
  for (const pid of problemIds) {
    await setNeedsSourceCheck(pid, value, note);
  }
}

/**
 * attempt を upsert（同一problemId+lapNOは上書き）
 */
export async function upsertAttempt(data: Omit<Attempt, 'id'>): Promise<void> {
  const existing = await db.attempts
    .where('[problemId+lapNo]')
    .equals([data.problemId, data.lapNo])
    .first();

  if (existing?.id !== undefined) {
    await db.attempts.update(existing.id, {
      userAnswer: data.userAnswer,
      isCorrect: data.isCorrect,
      responseTimeSec: data.responseTimeSec,
      answeredAt: data.answeredAt,
    });
  } else {
    await db.attempts.add(data);
  }

  // Supabaseにも保存（ログイン中のみ・失敗してもローカルには影響しない）
  syncAttemptToSupabase(data).catch(() => {});
}

async function syncAttemptToSupabase(data: Omit<Attempt, 'id'>): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('attempts').upsert({
    user_id: user.id,
    problem_id: data.problemId,
    lap_no: data.lapNo,
    user_answer: data.userAnswer,
    is_correct: data.isCorrect,
    response_time_sec: data.responseTimeSec,
    answered_at: data.answeredAt.toISOString(),
  }, { onConflict: 'user_id,problem_id,lap_no' });
}

/**
 * 演習用: ready な Problem + ProblemAttr を結合して返す
 */
export async function getReadyProblems(
  subjectId?: string,
  chapterId?: string,
  sectionTitle?: string,
): Promise<ProblemForExercise[]> {
  const readyProblems = await db.problems.where('status').equals('ready').toArray();
  const allAttrs = await db.problemAttrs.toArray();
  const attrMap = new Map(allAttrs.map((a) => [a.problemId, a]));

  return readyProblems
    .map((p) => {
      const attr = attrMap.get(p.problemId);
      if (!attr || attr.answerBoolean === null || attr.answerBoolean === undefined) return null;
      if (attr.isExcluded === true) return null;
      // needsSourceCheck = true の問題も安全優先で出題停止
      if (attr.needsSourceCheck === true) return null;
      if (subjectId && attr.subjectId !== subjectId) return null;
      if (chapterId && attr.chapterId !== chapterId) return null;
      // displaySectionTitle を優先したフィルタ（session URL の ?section= に display ラベルが入るため）
      // DB に displaySectionTitle がない旧レコードはオンザフライで解決する
      const effectiveDisplay =
        attr.displaySectionTitle ||
        resolveDisplaySectionTitle(
          attr.chapterId,
          attr.sectionTitle ?? '',
          attr.sourcePageQuestion ?? '',
          p.problemId,
        );
      if (sectionTitle && effectiveDisplay !== sectionTitle) return null;
      return {
        ...p,
        answerBoolean: attr.answerBoolean as boolean,
        explanationText: (() => {
          const t = p.rawExplanationText ?? '';
          return t.startsWith('[解説読取困難') ? '' : t;
        })(),
        subjectId: attr.subjectId,
        chapterId: attr.chapterId,
        sectionTitle: attr.sectionTitle ?? undefined,    // raw: 原本見出し（変更禁止）
        displaySectionTitle: effectiveDisplay || undefined, // UI用: 正規化済み（on-the-fly計算済み）
        sourcePageQuestion: attr.sourcePageQuestion ?? undefined,
        sourcePageAnswer: attr.sourcePageAnswer ?? undefined,
        questionType: attr.questionType ?? undefined,
      } as ProblemForExercise;
    })
    .filter((p): p is ProblemForExercise => p !== null);
}

/**
 * problemId 生成
 * format: {bookId}-p{pageNo:03d}-q{seq:02d}
 * e.g. "KB2025-p001-q01"
 */
export function generateProblemId(bookId: string, pageNo: number, seq = 1): string {
  const page = String(pageNo).padStart(3, '0');
  const q = String(seq).padStart(2, '0');
  return `${bookId}-p${page}-q${q}`;
}

/**
 * データクリーンアップ v3
 * ─────────────────────────────────────────────────────────
 * 問題データ修正に伴う attempt の整合性を保つ。
 * 各パッチは localStorage フラグで1回だけ実行される。
 *
 * 新しい修正があった場合は PATCHES 配列に追加するだけでよい。
 */

interface CleanupPatch {
  key: string;               // localStorage キー（ユニークにする）
  deleteLap1: string[];       // lap1 の attempt を削除する problemId 一覧
  deleteAllAttempts: string[]; // 全 attempt を削除する problemId 一覧（未回答状態に戻す）
  discardProblems?: string[];  // status='discard' にする problemId 一覧（演習から除外）
  needsSourceCheckProblems?: string[]; // needsSourceCheck=true にする problemId 一覧
  clearNeedsSourceCheck?: string[];    // needsSourceCheck=false にする（原本確認後復帰）
  isExcludedProblems?: {      // isExcluded=true にする problemId 一覧（理由付き）
    problemId: string;
    reason: string;           // 'ghost_record' | 'data_error' | 'ocr_corruption' | 'non_boolean_format' | 'manual_hold'
    note?: string;
  }[];
  clearIsExcluded?: string[];          // isExcluded=false にする（manual_hold 解除後復帰）
  removeProblems?: string[];           // problems / problemAttrs から完全削除する problemId 一覧（重複ページ除去等）
  recalcCorrect: {            // isCorrect を再計算する problemId と正解
    problemId: string;
    correctAnswer: boolean;
  }[];
}

const PATCHES: CleanupPatch[] = [
  // v2: 無効化（lap1削除が不要だったため空にして残す）
  {
    key: 'cleanup_2026-04-05_v2',
    deleteAllAttempts: [],
    deleteLap1: [],
    recalcCorrect: [],
  },
  // v3: 2026-04-05 p138-q05 answerBoolean 修正 (false→true)
  {
    key: 'cleanup_2026-04-05_v3_p138q05',
    deleteAllAttempts: [],
    deleteLap1: [],
    recalcCorrect: [
      { problemId: 'KB2025-p138-q05', correctAnswer: true },
    ],
  },
  // v3b: 2026-04-05 p138-q02 第三者効 answerBoolean 修正 (false→true)
  {
    key: 'cleanup_2026-04-05_v3b_p138q02',
    deleteAllAttempts: [],
    deleteLap1: [],
    recalcCorrect: [
      { problemId: 'KB2025-p138-q02', correctAnswer: true },
    ],
  },
  // v3c: 2026-04-05 p141-q04 再審の訴え answerBoolean 修正 (false→true)
  {
    key: 'cleanup_2026-04-05_v3c_p141q04',
    deleteAllAttempts: [],
    deleteLap1: [],
    recalcCorrect: [
      { problemId: 'KB2025-p141-q04', correctAnswer: true },
    ],
  },
  // v4: 2026-04-05 p139-p140 正誤逆転・架空問題修正 → 全attempt削除して未回答に戻す
  {
    key: 'cleanup_2026-04-05_v4_p139_p140',
    deleteLap1: [],
    deleteAllAttempts: [
      // p139 q5,q6: 正誤逆転していたため回答ログ削除
      'KB2025-p139-q05', 'KB2025-p139-q06',
      // p140 q4-q8: 架空問題だったため全削除
      'KB2025-p140-q04', 'KB2025-p140-q05', 'KB2025-p140-q06',
      'KB2025-p140-q07', 'KB2025-p140-q08',
    ],
    recalcCorrect: [],
  },
  // v5: 2026-04-05 原本照合p133-142 重複削除+正解修正
  {
    key: 'cleanup_2026-04-05_v5_p133_p142',
    deleteAllAttempts: [
      // p134 重複q6削除 → 旧q6,q7の回答リセット
      'KB2025-p134-q06', 'KB2025-p134-q07',
      // p136 重複q4削除 → 旧q4,q5の回答リセット
      'KB2025-p136-q04', 'KB2025-p136-q05',
      // p140 誤コピーq5-q7削除
      'KB2025-p140-q05', 'KB2025-p140-q06', 'KB2025-p140-q07',
    ],
    deleteLap1: [],
    recalcCorrect: [
      // p142-q4: false→true
      { problemId: 'KB2025-p142-q04', correctAnswer: true },
    ],
  },
  // v6: 2026-04-05 原本照合p122-132 正解修正
  {
    key: 'cleanup_2026-04-05_v6_p122_p132',
    deleteAllAttempts: [
      'KB2025-p122-q03',  // 問題文+正解が完全に別物だった
    ],
    deleteLap1: [],
    recalcCorrect: [
      { problemId: 'KB2025-p126-q06', correctAnswer: true },
      { problemId: 'KB2025-p127-q03', correctAnswer: false },
      { problemId: 'KB2025-p127-q04', correctAnswer: true },
      { problemId: 'KB2025-p129-q04', correctAnswer: false },
    ],
  },
  // v7: 2026-04-05 原本照合p143-152 正解修正
  {
    key: 'cleanup_2026-04-05_v7_p143_p152',
    deleteAllAttempts: [],
    deleteLap1: [],
    recalcCorrect: [
      { problemId: 'KB2025-p143-q01', correctAnswer: true },
      { problemId: 'KB2025-p143-q04', correctAnswer: true },
      { problemId: 'KB2025-p143-q05', correctAnswer: true },
      { problemId: 'KB2025-p144-q04', correctAnswer: true },
      { problemId: 'KB2025-p144-q06', correctAnswer: true },
      { problemId: 'KB2025-p147-q05', correctAnswer: true },
    ],
  },
  // v8: 2026-04-06 無効等確認訴訟 正解修正
  // p144-q06: 前置不要なので○(解説と一致) false→true
  // p145-q04: 無効原因なし=本案棄却であり却下ではない true→false
  {
    key: 'cleanup_2026-04-06_v8_p144q06_p145q04',
    deleteAllAttempts: [],
    deleteLap1: [],
    recalcCorrect: [
      { problemId: 'KB2025-p144-q06', correctAnswer: true },
      { problemId: 'KB2025-p145-q04', correctAnswer: false },
    ],
  },
  // v9: 2026-04-06 無効等確認訴訟 問題5・6・11 を discard（データ不整合のため教材不適）
  // 問5(p144-q05): 21条準用で「許されない」断言は不正確
  // 問6(p144-q06): 解説と正解が正面衝突、問題文も破損
  // 問11(p145-q04): 問13と同論点で逆転、本案棄却/訴訟却下の混同
  {
    key: 'cleanup_2026-04-06_v9_discard_invalid',
    deleteAllAttempts: [],
    deleteLap1: [],
    discardProblems: [
      'KB2025-p144-q05',
      'KB2025-p144-q06',
      'KB2025-p145-q04',
    ],
    recalcCorrect: [],
  },
  // v10: 2026-04-06 全問題監査結果の適用
  // 優先度1: 解説と正解が逆転している4件を修正
  // 優先度2: データ品質不明の14件に needsSourceCheck フラグ
  // 優先度3: データなし・意味不明・記述式の4件を除外
  {
    key: 'cleanup_2026-04-06_v10_audit_results',
    deleteAllAttempts: [],
    deleteLap1: [],
    discardProblems: [
      'KB2025-p068-q06', // questionText・explanationText が両方空
      'KB2025-p223-q01', // questionText空。データ構造ミス
      'KB2025-p085-q05', // 意味不明な文章（OCR崩壊）
      'KB2025-p137-q01', // □□□□ 穴埋め記述式。answerBoolean管理不可
    ],
    needsSourceCheckProblems: [
      // p062: questionText途中切断 5件
      'KB2025-p062-q01', 'KB2025-p062-q02', 'KB2025-p062-q03',
      'KB2025-p062-q04', 'KB2025-p062-q05',
      // p078: 同上 3件
      'KB2025-p078-q01', 'KB2025-p078-q02', 'KB2025-p078-q03',
      // p129: <省略>タグ混入 3件
      'KB2025-p129-q01', 'KB2025-p129-q02', 'KB2025-p129-q03',
      // p162: 国家賠償 questionText切断 3件
      'KB2025-p162-q01', 'KB2025-p162-q02', 'KB2025-p162-q03',
      // 個別
      'KB2025-p142-q02', // 執行停止の単独申立て可否。説明が複雑で破損疑い
      'KB2025-p101-q03', // 説明「前段は正しい」だが stored=False
    ],
    recalcCorrect: [
      { problemId: 'KB2025-p075-q06', correctAnswer: false }, // 解説「みなし拒否なし」→×
      { problemId: 'KB2025-p127-q02', correctAnswer: false }, // 解説「反則金通知は処分性なし」→×
      { problemId: 'KB2025-p135-q05', correctAnswer: true  }, // 解説「原告普通裁判籍に提起可」→○
      { problemId: 'KB2025-p138-q01', correctAnswer: true  }, // 解説「職権で第三者訴訟参加可」→○
    ],
  },
  // v11: 2026-04-06 p147-q04 answer inversion fix
  // 申請型義務付け訴訟（処分拒否型）は取消訴訟/無効確認訴訟との併合が必要（37条の3第3項2号）
  // → 問題文の記述は正しい → 正解は○（True）
  {
    key: 'cleanup_2026-04-06_v11_p147q04',
    deleteAllAttempts: [],
    deleteLap1: [],
    recalcCorrect: [
      { problemId: 'KB2025-p147-q04', correctAnswer: true },
    ],
  },
  // v12: 2026-04-06 import_optimizer.py 自動検出 HIGH信頼度3件
  // p011-q03: 「条例で税目・税率を定めることはできない」→解説「本肢は誤っている」→ False
  // p180-q04: 「議会の自主解散はできない」→解説「本肢は誤りである」(特例法で可) → False
  // p232-q04: 「追認後も取消できる」→解説「本肢は誤っている」(115条本文) → False
  {
    key: 'cleanup_2026-04-06_v12_optimizer_batch1',
    deleteAllAttempts: [],
    deleteLap1: [],
    recalcCorrect: [
      { problemId: 'KB2025-p011-q03', correctAnswer: false },
      { problemId: 'KB2025-p180-q04', correctAnswer: false },
      { problemId: 'KB2025-p232-q04', correctAnswer: false },
    ],
  },
  // v13: 2026-04-06 幽霊レコード除外 + needsSourceCheck を安全優先で一時停止に格上げ
  // p144/p145「08_無効等確認」セクションに書籍非掲載の問12・13が IndexedDB に残留。
  // 書籍では 問1-11（p144:q01-q07, p145:q01-q04）しか存在しないため、
  // それ以降のシーケンス番号 (p145-q05, p145-q06) を ghost_record で除外。
  // またneedsSourceCheck問題も安全優先で manual_hold 除外とする。
  {
    key: 'cleanup_2026-04-06_v13_ghost_records',
    deleteAllAttempts: [],
    deleteLap1: [],
    isExcludedProblems: [
      // 08_無効等確認 幽霊レコード（書籍上に存在しない問12・13）
      {
        problemId: 'KB2025-p145-q05',
        reason: 'ghost_record',
        note: '書籍ページ上に存在せず、IndexedDB残留疑い（無効等確認 問12相当）',
      },
      {
        problemId: 'KB2025-p145-q06',
        reason: 'ghost_record',
        note: '書籍ページ上に存在せず、IndexedDB残留疑い（無効等確認 問13相当）',
      },
      // needsSourceCheck 問題を安全優先で出題停止（manual_hold）
      // ※ getReadyProblems で needsSourceCheck=true も既にフィルタ済みだが、
      //   isExcluded フラグも立てて管理UIから確認しやすくする
      { problemId: 'KB2025-p062-q01', reason: 'manual_hold', note: '要原本確認のため一時停止（questionText途中切断疑い）' },
      { problemId: 'KB2025-p062-q02', reason: 'manual_hold', note: '要原本確認のため一時停止（questionText途中切断疑い）' },
      { problemId: 'KB2025-p062-q03', reason: 'manual_hold', note: '要原本確認のため一時停止（questionText途中切断疑い）' },
      { problemId: 'KB2025-p062-q04', reason: 'manual_hold', note: '要原本確認のため一時停止（questionText途中切断疑い）' },
      { problemId: 'KB2025-p062-q05', reason: 'manual_hold', note: '要原本確認のため一時停止（questionText途中切断疑い）' },
      { problemId: 'KB2025-p078-q01', reason: 'manual_hold', note: '要原本確認のため一時停止（questionText途中切断疑い）' },
      { problemId: 'KB2025-p078-q02', reason: 'manual_hold', note: '要原本確認のため一時停止（questionText途中切断疑い）' },
      { problemId: 'KB2025-p078-q03', reason: 'manual_hold', note: '要原本確認のため一時停止（questionText途中切断疑い）' },
      { problemId: 'KB2025-p129-q01', reason: 'manual_hold', note: '要原本確認のため一時停止（<省略>タグ混入）' },
      { problemId: 'KB2025-p129-q02', reason: 'manual_hold', note: '要原本確認のため一時停止（<省略>タグ混入）' },
      { problemId: 'KB2025-p129-q03', reason: 'manual_hold', note: '要原本確認のため一時停止（<省略>タグ混入）' },
      { problemId: 'KB2025-p162-q01', reason: 'manual_hold', note: '要原本確認のため一時停止（questionText切断疑い）' },
      { problemId: 'KB2025-p162-q02', reason: 'manual_hold', note: '要原本確認のため一時停止（questionText切断疑い）' },
      { problemId: 'KB2025-p162-q03', reason: 'manual_hold', note: '要原本確認のため一時停止（questionText切断疑い）' },
      { problemId: 'KB2025-p142-q02', reason: 'manual_hold', note: '要原本確認のため一時停止（執行停止の説明破損疑い）' },
      { problemId: 'KB2025-p101-q03', reason: 'manual_hold', note: '要原本確認のため一時停止（解説と正解不一致疑い）' },
    ],
    recalcCorrect: [],
  },
  // v14: 2026-04-07 訴訟法以外 全科目精査 — 8件修正 (行政手続法・不服申立法・地自法・民法)
  // 全 MEDIUM候補36件を全文照合し、optimizer誤検出28件を除外した確定修正。
  {
    key: 'cleanup_2026-04-07_v14_non_litigation_batch',
    deleteAllAttempts: [],
    deleteLap1: [],
    recalcCorrect: [
      { problemId: 'KB2025-p075-q05', correctAnswer: true },   // 行政手続法6条: 標準処理期間+公表義務
      { problemId: 'KB2025-p082-q01', correctAnswer: true },   // 行政手続法18条1項後段: 閲覧拒否要件
      { problemId: 'KB2025-p083-q04', correctAnswer: true },   // 行政手続法24条3項: 報告書+調書提出義務
      { problemId: 'KB2025-p141-q03', correctAnswer: true },   // 行訴法33条2項2号: 手続違法→再処分義務
      { problemId: 'KB2025-p167-q06', correctAnswer: true },   // 地自法252条の24第2項: 中核市申出要件
      { problemId: 'KB2025-p187-q04', correctAnswer: false },  // 過料≠刑罰(括弧書き誤り)
      { problemId: 'KB2025-p216-q06', correctAnswer: true },   // 民法876条の4: 保佐人代理権付与
      { problemId: 'KB2025-p242-q02', correctAnswer: true },   // 民法147条2項: 時効更新
    ],
  },
  // v15: 2026-04-07 全候補178件照合完了 — 26件修正 + v7パッチ3件誤り訂正
  // 残り142件を全文照合し batch_classifications で確定。
  // v7パッチ(p143-q04, p144-q04, p147-q05)が誤ってTrueに設定していたため、
  // 正しいFalseに上書きする。p141-q04は空問題（幽霊レコード）を除外。
  {
    key: 'cleanup_2026-04-07_v15_full_scan_all_subjects',
    deleteAllAttempts: [],
    deleteLap1: [],
    needsSourceCheckProblems: [
      'KB2025-p152-q01', // 行訴法46条2項: 口頭処分教示義務の有無 (OCR切断)
      'KB2025-p152-q03', // 行訴法46条3項: 相手方以外への教示義務 (OCR切断)
      'KB2025-p152-q04', // 行訴法: 誤教示救済規定の有無 (OCR切断)
      'KB2025-p152-q05', // 行訴法46条1項: 国家賠償請求の教示事項該当性 (OCR切断)
      'KB2025-p225-q05', // 民法: 動機の錯誤・表示要件 (Q・E両方OCR崩壊)
      'KB2025-p241-q01', // 民法: 時効完成後の債務承認と信義則 (E OCR崩壊)
    ],
    isExcludedProblems: [
      {
        problemId: 'KB2025-p141-q04',
        reason: 'ghost_record',
        note: '問題文・解説ともに空白。IndexedDB残留の幽霊レコード。',
      },
    ],
    recalcCorrect: [
      // 行政法総論
      { problemId: 'KB2025-p020-q02', correctAnswer: false },  // 信義則適用要件:平等に限らない
      { problemId: 'KB2025-p025-q07', correctAnswer: true },   // 国行組法13条1項:別法律の定め要
      { problemId: 'KB2025-p043-q04', correctAnswer: false },  // 確認・公証・受理は準法律行為的=附款不可
      // 行政代執行
      { problemId: 'KB2025-p059-q01', correctAnswer: true },   // 代執行法4条:証票携帯+要求時呈示
      // 秩序罰
      { problemId: 'KB2025-p065-q06', correctAnswer: true },   // 地自法15条2項:規則による過料可
      // 行政手続法
      { problemId: 'KB2025-p075-q03', correctAnswer: true },   // 行手法6条:標準処理期間=努力義務
      { problemId: 'KB2025-p082-q05', correctAnswer: true },   // 行手法20条6項:聴聞は原則非公開
      { problemId: 'KB2025-p083-q01', correctAnswer: true },   // 行手法23条1項:不出頭→機会不再付与
      { problemId: 'KB2025-p085-q06', correctAnswer: true },   // 行手法12条1項:処分基準=不利益処分全般
      { problemId: 'KB2025-p091-q02', correctAnswer: true },   // 行手法38条2項:命令等制定後の見直し努力
      // 行政不服申立
      { problemId: 'KB2025-p100-q05', correctAnswer: true },   // 不服審査法14条4項:総代を通じてのみ
      { problemId: 'KB2025-p116-q01', correctAnswer: true },   // 不服審査法31条1項準用:口頭意見陳述
      { problemId: 'KB2025-p117-q05', correctAnswer: true },   // 不服審査法64条3項:原処分不当でなければ棄却
      { problemId: 'KB2025-p119-q01', correctAnswer: true },   // 不服審査法38条5項:不教示→処分庁申立みなし
      // 行政事件訴訟法
      { problemId: 'KB2025-p125-q01', correctAnswer: true },   // 行訴法:違法のみ取消訴訟可、不当は不可
      { problemId: 'KB2025-p141-q01', correctAnswer: true },   // 行訴法33条1項:拘束力
      // v7パッチ誤り訂正 (Trueに設定されていたが実際はFalse)
      { problemId: 'KB2025-p143-q04', correctAnswer: false },  // 内閣総理大臣の異議:決定前に限らず
      { problemId: 'KB2025-p144-q04', correctAnswer: false },  // 無効確認訴訟:取消訴訟出訴期間の準用なし
      { problemId: 'KB2025-p147-q05', correctAnswer: false },  // 義務付け訴訟:申請型は重大損害不要
      // 地方自治法
      { problemId: 'KB2025-p169-q02', correctAnswer: false },  // 一部事務組合=同種事務必要(広域連合と非同様)
      { problemId: 'KB2025-p189-q04', correctAnswer: false },  // 支出命令=会計管理者でなく長の命令
      { problemId: 'KB2025-p207-q02', correctAnswer: true },   // 地自法245条の8第3項:高裁への訴え
      // 民法
      { problemId: 'KB2025-p214-q01', correctAnswer: true },   // 民法5条2項:未成年者の同意なし行為=取消可
      { problemId: 'KB2025-p219-q05', correctAnswer: false },  // 失踪宣告取消:後婚のみ有効、共に取消は誤り
      { problemId: 'KB2025-p230-q01', correctAnswer: false },  // 民法108条:自己契約=本人帰属しない
      { problemId: 'KB2025-p240-q01', correctAnswer: true },   // 民法145条かっこ書:物上保証人=時効援用可
    ],
  },
  // ─── v16: p148-q02 差止め訴え出訴期間準用なし (True→False) ───
  {
    key: 'cleanup_2026-04-07_v16_p148q02_sashitome_kikan',
    deleteAllAttempts: [],
    deleteLap1: [],
    needsSourceCheckProblems: [],
    isExcludedProblems: [],
    recalcCorrect: [
      { problemId: 'KB2025-p148-q02', correctAnswer: false }, // 差止めに出訴期間（6ヶ月）の規定は準用されない（行訴法38条1項）
    ],
  },
  // ─── v17: 再監査バグ修正（ans=True なのに法律と逆の4件） + 2件needsSourceCheck ───
  //   p058-q04: 行政代執行法2条「第三者をして行わせること**もできる**」→Q誤り
  //   p223-q03: 民法94条2項・大判昭13.12.10「仮装債権譲受人=第三者→善意なら支払請求**できる**」→Q誤り
  //   p228-q02: 民法102条ただし書「制限行為能力者が他の制限行為能力者の法定代理人→取消**できる**」→Q誤り
  //   p240-q03: 民法145条括弧書「第三取得者は時効援用**できる**、反射的利益ではない」→Q誤り
  //   p142-q06: 仮の義務付け要件の記述がOCR切断疑い→needsSourceCheck
  //   p155-q04: 国家賠償のE解説がOCR破損（「放改された」「女わされない」）→needsSourceCheck
  {
    key: 'cleanup_2026-04-07_v17_reaudit_true_false_mismatch',
    deleteAllAttempts: [],
    deleteLap1: [],
    needsSourceCheckProblems: [
      'KB2025-p142-q06', // 仮の義務付け要件 OCR切断疑い
      'KB2025-p155-q04', // 国家賠償 E解説OCR破損
    ],
    isExcludedProblems: [],
    recalcCorrect: [
      { problemId: 'KB2025-p058-q04', correctAnswer: false }, // 代執行=第三者使用可（行政代執行法2条）
      { problemId: 'KB2025-p223-q03', correctAnswer: false }, // 仮装債権譲受人=94条2項の第三者→善意なら請求可
      { problemId: 'KB2025-p228-q02', correctAnswer: false }, // 民法102条ただし書→制限行為能力者法定代理取消可
      { problemId: 'KB2025-p240-q03', correctAnswer: false }, // 民法145条括弧書→第三取得者は時効援用可
    ],
  },
  // ─── v18: 2部構成Q「後段誤り」パターン True→False 4件 ───
  //   p058-q08: 行政代執行法3条3項の緊急例外=令書省略のみ、口頭戒告は認めていない
  //   p069-q07: 行政手続法2条4号ただし書：許認可拒否=不利益処分外→聴聞・弁明不要
  //   p087-q04: 32条2項「不利益な取扱い」に助成金不交付は含まれない
  //   p101-q04: 行政不服審査法施行令3条1項：代理人資格は書面証明必要
  {
    key: 'cleanup_2026-04-07_v18_twopart_q_rear_wrong',
    deleteAllAttempts: [],
    deleteLap1: [],
    needsSourceCheckProblems: [],
    isExcludedProblems: [],
    recalcCorrect: [
      { problemId: 'KB2025-p058-q08', correctAnswer: false }, // 代執行緊急時の令書省略≠口頭戒告可
      { problemId: 'KB2025-p069-q07', correctAnswer: false }, // 許認可拒否は不利益処分外→弁明不要（行手法2条4号但書）
      { problemId: 'KB2025-p087-q04', correctAnswer: false }, // 助成金不交付は32条2項「不利益な取扱い」に含まれない
      { problemId: 'KB2025-p101-q04', correctAnswer: false }, // 代理人資格は書面証明必要（不服審査法施行令3条1項）
    ],
  },
  // ─── v19: p150-q01 民衆訴訟の定義（行訴法5条） False→True + 解説OCR修正 ───
  //   Q = 行訴法5条の条文そのまま = 正しい → True が正解
  //   OCR破損: 「提起するものではなく（5条）」→ 「をいい（5条）」
  //   解説も同時に修正済み（reviewed_import.json）
  {
    key: 'cleanup_2026-04-07_v19_p150q01_minshu_sosho_def',
    deleteAllAttempts: [],
    deleteLap1: [],
    needsSourceCheckProblems: [],
    isExcludedProblems: [],
    recalcCorrect: [
      { problemId: 'KB2025-p150-q01', correctAnswer: true }, // 行訴法5条定義=Qと一致、解説OCR「ではなく」→「をいい」修正
    ],
  },
  // ─── v20: グループA原本照合 — p062/p078 うち確認済み4件を演習復帰 ───
  //   【復帰】Q完全・答え正しい・E確認済み:
  //     p062-q01: 「代執行の説明」= False ✓（即時強制の定義ではない）
  //     p062-q02: 「制裁手段」誤り = False ✓（即時強制は制裁手段ではない）
  //     p078-q01: 「処分基準=努力義務」= True ✓（行手法12条1項「よう努めなければならない」）
  //     p078-q03: 「できる限り具体的」= True ✓（行手法12条2項のとおり）
  //   【継続保留】Q途中切断のため原本確認待ち:
  //     p062-q03 (⚠️答え不確定: 即時強制の正定義なら True 候補)
  //     p062-q04, p062-q05, p078-q02 (Falseが濃厚だが要確認)
  {
    key: 'cleanup_2026-04-07_v20_groupA_partial_restore',
    deleteAllAttempts: [],
    deleteLap1: [],
    clearNeedsSourceCheck: [
      'KB2025-p062-q01',
      'KB2025-p062-q02',
      'KB2025-p078-q01',
      'KB2025-p078-q03',
    ],
    clearIsExcluded: [
      'KB2025-p062-q01',
      'KB2025-p062-q02',
      'KB2025-p078-q01',
      'KB2025-p078-q03',
    ],
    needsSourceCheckProblems: [],
    isExcludedProblems: [],
    recalcCorrect: [],
  },
  // ─── v21: グループA残り4件 原本照合・Q末尾復元 ───
  //   p062-q03: 即時強制の正定義 → True（現在のFalseはバグ）
  //   p062-q04: 先行義務不要のQを復元。False維持
  //   p062-q05: 身体対象廃止の誤主張を復元。False維持。E修正
  //   p078-q02: 審査基準=努力義務の誤主張を復元。False維持。E条文引用5条に修正
  {
    key: 'cleanup_2026-04-07_v21_groupA_remaining4',
    deleteAllAttempts: [],
    deleteLap1: [],
    clearNeedsSourceCheck: [
      'KB2025-p062-q03',
      'KB2025-p062-q04',
      'KB2025-p062-q05',
      'KB2025-p078-q02',
    ],
    clearIsExcluded: [
      'KB2025-p062-q03',
      'KB2025-p062-q04',
      'KB2025-p062-q05',
      'KB2025-p078-q02',
    ],
    needsSourceCheckProblems: [],
    isExcludedProblems: [],
    recalcCorrect: [
      { problemId: 'KB2025-p062-q03', correctAnswer: true }, // 即時強制の正定義→True（OCR崩壊でFalseに誤設定）
    ],
  },
  // ─── v22: グループB 8件 原本照合・Q/E修正・NSC解除 ───
  // answerBoolean 変更なし（全件 False/True 維持）
  // p101-q03: E「前記肢は正しい」削除・明確化
  // p142-q02: E OCR崩壊修正（条文引用重複・崩壊）
  // p162-q01: Q「第１条」→「第２条」OCR誤り修正・末尾補完
  // p162-q03: Q/E末尾補完（都道府県が責任主体）
  // p129-q01~q03: <省略>タグ残存だが答え確認済み（E断片+判例で確認）
  // p162-q02: Q/E変更なし
  {
    key: 'cleanup_2026-04-07_v22_groupB_all8',
    deleteAllAttempts: [],
    deleteLap1: [],
    clearNeedsSourceCheck: [
      'KB2025-p101-q03',
      'KB2025-p129-q01',
      'KB2025-p129-q02',
      'KB2025-p129-q03',
      'KB2025-p142-q02',
      'KB2025-p162-q01',
      'KB2025-p162-q02',
      'KB2025-p162-q03',
    ],
    clearIsExcluded: [
      'KB2025-p101-q03',
      'KB2025-p129-q01',
      'KB2025-p129-q02',
      'KB2025-p129-q03',
      'KB2025-p142-q02',
      'KB2025-p162-q01',
      'KB2025-p162-q02',
      'KB2025-p162-q03',
    ],
    needsSourceCheckProblems: [],
    isExcludedProblems: [],
    recalcCorrect: [],
  },
  // ─── v23: グループC p152系4件 NSC解除 ───
  // p152-q03: answerBoolean False→True（行訴法46条2項 第三者利害関係人への教示義務）
  // p152-q01/q04/q05: E補完のみ（ans変更なし）
  {
    key: 'cleanup_2026-04-08_v23_groupC_p152',
    deleteAllAttempts: [],
    deleteLap1: [],
    clearNeedsSourceCheck: [
      'KB2025-p152-q01',
      'KB2025-p152-q03',
      'KB2025-p152-q04',
      'KB2025-p152-q05',
    ],
    clearIsExcluded: [
      'KB2025-p152-q01',
      'KB2025-p152-q03',
      'KB2025-p152-q04',
      'KB2025-p152-q05',
    ],
    needsSourceCheckProblems: [],
    isExcludedProblems: [],
    recalcCorrect: [
      { problemId: 'KB2025-p152-q03', correctAnswer: true }, // 行訴法46条2項 第三者利害関係人への教示義務→True
    ],
  },
  // ─── v24: グループC残り4件 NSC解除（p225-q05, p241-q01, p142-q06, p155-q04） ───
  // answerBoolean 変更なし（全件 True 維持）
  // p225-q05: OCR崩壊 Q/E全文再構成（最判平1.9.14 動機の錯誤・財産分与）
  // p241-q01: OCR崩壊 Q/E全文再構成（最判昭41.4.20 時効援用と信義則）
  // p142-q06: OCR崩壊 Q末尾「できない」→「できる」復元（25条4項 vs 37条の5）
  // p155-q04: OCR崩壊 Q末尾「負うことはない」→「負うことがある」復元（最判昭57.4.1）
  {
    key: 'cleanup_2026-04-08_v24_groupC_remaining4',
    deleteAllAttempts: [],
    deleteLap1: [],
    clearNeedsSourceCheck: [
      'KB2025-p142-q06',
      'KB2025-p155-q04',
      'KB2025-p225-q05',
      'KB2025-p241-q01',
    ],
    clearIsExcluded: [
      'KB2025-p142-q06',
      'KB2025-p155-q04',
      'KB2025-p225-q05',
      'KB2025-p241-q01',
    ],
    needsSourceCheckProblems: [],
    isExcludedProblems: [],
    recalcCorrect: [],
  },
  // v30: p038-q03 answerBoolean True→False（最判昭47.12.5: 理由附記不備は審査請求でも治癒されない）
  // + OCR全件スキャンフェーズ2（p012/p026/p038/p051/p078/p204/p231帯 改行・崩壊修正）
  {
    key: 'cleanup_2026-04-09_v30_ocr_phase2',
    deleteAllAttempts: [],
    deleteLap1: [],
    clearNeedsSourceCheck: [],
    clearIsExcluded: [],
    needsSourceCheckProblems: [],
    isExcludedProblems: [],
    recalcCorrect: [
      { problemId: 'KB2025-p038-q03', correctAnswer: false },
    ],
  },
  {
    key: 'cleanup_2026-04-09_v38_p160q02_ans',
    deleteAllAttempts: [],
    deleteLap1: [],
    clearNeedsSourceCheck: [],
    clearIsExcluded: [],
    needsSourceCheckProblems: [],
    isExcludedProblems: [],
    recalcCorrect: [
      { problemId: 'KB2025-p160-q02', correctAnswer: true },
    ],
  },
  {
    key: 'cleanup_2026-04-13_v52_p162_p165',
    deleteAllAttempts: [],
    deleteLap1: [],
    clearNeedsSourceCheck: [],
    clearIsExcluded: [],
    needsSourceCheckProblems: [
      'KB2025-p165-q01',
      'KB2025-p165-q02',
      'KB2025-p165-q03',
      'KB2025-p165-q04',
    ],
    isExcludedProblems: [],
    recalcCorrect: [
      { problemId: 'KB2025-p162-q05', correctAnswer: false },
    ],
  },
  {
    key: 'cleanup_2026-04-15_v54_p165_gemini_restore',
    deleteAllAttempts: [],
    deleteLap1: [],
    clearNeedsSourceCheck: [
      'KB2025-p165-q01',
      'KB2025-p165-q02',
      'KB2025-p165-q03',
      'KB2025-p165-q04',
    ],
    clearIsExcluded: [],
    needsSourceCheckProblems: [],
    isExcludedProblems: [],
    recalcCorrect: [],
  },
  {
    key: 'cleanup_2026-04-15_v55_p171q05_ans',
    deleteAllAttempts: [],
    deleteLap1: [],
    clearNeedsSourceCheck: [],
    clearIsExcluded: [],
    needsSourceCheckProblems: [],
    isExcludedProblems: [],
    recalcCorrect: [
      { problemId: 'KB2025-p171-q05', correctAnswer: true },
    ],
  },
  // v59: 2026-04-18 p050 duplicate 削除（p051 と同一 spread 行政契約 204/205 の二重キャプチャ）
  {
    key: 'cleanup_2026-04-18_v59_p050_removal',
    deleteAllAttempts: [],
    deleteLap1: [],
    removeProblems: [
      'KB2025-p050-q01',
      'KB2025-p050-q02',
      'KB2025-p050-q03',
      'KB2025-p050-q04',
      'KB2025-p050-q05',
    ],
    recalcCorrect: [],
  },
  // ─── 今後の修正はここに追加 ───
];

export async function runOneTimeCleanup(): Promise<void> {
  if (typeof window === 'undefined') return;

  let totalDeleted = 0;
  let totalFixed = 0;

  for (const patch of PATCHES) {
    if (localStorage.getItem(patch.key)) continue;

    // 0. 全 attempt 削除（未回答状態に戻す）
    for (const pid of patch.deleteAllAttempts ?? []) {
      const all = await db.attempts
        .where('problemId')
        .equals(pid)
        .toArray();
      for (const a of all) {
        if (a.id !== undefined) {
          await db.attempts.delete(a.id);
          totalDeleted++;
        }
      }
    }

    // 1. lap1 削除
    for (const pid of patch.deleteLap1) {
      const found = await db.attempts
        .where('[problemId+lapNo]')
        .equals([pid, 1])
        .first();
      if (found?.id !== undefined) {
        await db.attempts.delete(found.id);
        totalDeleted++;
      }
    }

    // 2. 問題を discard に設定（演習から除外）
    for (const pid of patch.discardProblems ?? []) {
      await upsertProblemAttr(pid, { aiTriageStatus: 'discard' });
      const p = await db.problems.where('problemId').equals(pid).first();
      if (p?.id !== undefined) {
        await db.problems.update(p.id, { status: 'discard' });
      }
    }

    // 2b. needsSourceCheck フラグ設定
    for (const pid of patch.needsSourceCheckProblems ?? []) {
      await upsertProblemAttr(pid, { needsSourceCheck: true });
    }

    // 2b2. needsSourceCheck 解除（原本確認後復帰）
    for (const pid of patch.clearNeedsSourceCheck ?? []) {
      await upsertProblemAttr(pid, { needsSourceCheck: false });
    }

    // 2c. isExcluded フラグ設定（理由付き）
    for (const { problemId, reason, note } of patch.isExcludedProblems ?? []) {
      await upsertProblemAttr(problemId, {
        isExcluded: true,
        excludeReason: reason,
        excludeNote: note,
        excludedAt: new Date(),
      });
    }

    // 2c2. isExcluded 解除（manual_hold 解除後復帰）
    for (const pid of patch.clearIsExcluded ?? []) {
      await upsertProblemAttr(pid, { isExcluded: false });
    }

    // 2d. problems / problemAttrs 完全削除（重複ページ除去等）
    for (const pid of patch.removeProblems ?? []) {
      const p = await db.problems.where('problemId').equals(pid).first();
      if (p?.id !== undefined) {
        await db.problems.delete(p.id);
      }
      await db.problemAttrs.where('problemId').equals(pid).delete();
    }

    // 3. isCorrect 再計算
    for (const { problemId, correctAnswer } of patch.recalcCorrect) {
      const attempts = await db.attempts
        .where('problemId')
        .equals(problemId)
        .toArray();
      for (const attempt of attempts) {
        const shouldBeCorrect = attempt.userAnswer === correctAnswer;
        if (attempt.isCorrect !== shouldBeCorrect && attempt.id !== undefined) {
          await db.attempts.update(attempt.id, { isCorrect: shouldBeCorrect });
          totalFixed++;
        }
      }
    }

    localStorage.setItem(patch.key, new Date().toISOString());
  }

  if (totalDeleted > 0 || totalFixed > 0) {
    console.log(`[cleanup] Deleted ${totalDeleted} stale attempts, fixed ${totalFixed} isCorrect values.`);
  }
}


/**
 * 問題データの強制リフレッシュ
 * reviewed_import.json から最新データを取り込み直す。
 * attempt（回答履歴）は保持し、問題文・解説・正解のみ更新する。
 * バージョン管理: DATA_VERSION が上がったときのみ実行。
 */
const DATA_VERSION = '2026-04-19-audit-v69-restore-p229-7branches';
const DATA_VERSION_KEY = 'gyosei_data_version';

export async function refreshProblemDataIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;

  const currentVersion = localStorage.getItem(DATA_VERSION_KEY);
  if (currentVersion === DATA_VERSION) return;

  console.log(`[data-refresh] Updating problem data: ${currentVersion ?? 'none'} → ${DATA_VERSION}`);

  try {
    const res = await fetch('/data/reviewed_import.json');
    if (!res.ok) return;
    const json = await res.json();

    const { importParsedBatch } = await import('@/lib/import-parsed');
    await importParsedBatch(json);

    localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
    console.log('[data-refresh] Problem data updated successfully');
  } catch (e) {
    console.warn('[data-refresh] Failed:', e);
  }
}
