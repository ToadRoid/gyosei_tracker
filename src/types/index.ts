// ── マスタ ──

export interface Subject {
  id: string;
  name: string;
  order: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  order: number;
}

// ── 問題本文 ──

export type ProblemStatus = 'draft' | 'ready' | 'discard';

export interface Problem {
  id?: number;
  problemId: string;            // "KB2025-p001-q01"
  sourceBook: string;           // "KB2025"
  sourcePage: string;           // "001" — キャプチャ画像の連番（必須）
  sourceQuestionLabel?: string; // 問題集に印字された問題番号 e.g. "問1" "肢3"（任意）
  sourceImageName: string;      // "0001.png"
  importBatchId?: string;
  rawText: string;              // OCR全文（答え・解説含む可能性あり）
  cleanedText: string;          // 演習表示用テキスト（問題文のみ。rawTextと初期は同値）
  // ── 問題文と解答が同一画像の場合の分離フィールド ──────────────
  hasAnswerInImage?: boolean;   // 答え・解説が同一画像内に含まれるか
  rawAnswerText?: string;       // OCR済み回答部分テキスト（演習時には非表示）
  rawExplanationText?: string;  // OCR済み解説部分テキスト（将来の解説表示用）
  status: ProblemStatus;
  createdAt: Date;
}

// ── 問題属性 ──

export type AiTriageStatus = 'pending' | 'ready' | 'discard' | 'needs_review';
export type AiDiscardReason = 'index' | 'cover' | 'ocr_error' | 'page_num_only';

export interface ProblemAttr {
  id?: number;
  problemId: string;          // FK → Problem.problemId
  subjectId: string;
  chapterId: string;
  answerBoolean: boolean | null;
  importance?: 1 | 2 | 3;
  needsReview?: boolean;
  year?: number;
  memo?: string;
  // AI判定フィールド
  aiTriageStatus?: AiTriageStatus;
  aiDiscardReason?: AiDiscardReason;
  aiAnswerCandidate?: boolean | null;
  aiSubjectCandidate?: string;
  aiChapterCandidate?: string;
  aiCleanedText?: string;
  aiConfidence?: number;
  // 参考書対応情報（raw: 原本の章見出しそのまま・変更禁止）
  sectionTitle?: string;           // 原本の章見出し（例: 審査請求先、誤教示）
  sourcePageQuestion?: string;     // 問題ページ番号
  sourcePageAnswer?: string;       // 解説ページ番号
  // UI表示用（display: import時に正規化・上書き自由）
  displaySectionTitle?: string;    // UI表示用グルーピングラベル（sectionTitleの正規化版）
  explanationText?: string;        // 解説テキスト
  questionType?: 'descriptive';    // 記述式問題フラグ
  // 除外フラグ（物理削除の代替）
  isExcluded?: boolean;            // true = 演習・統計から除外
  excludeReason?: string;          // 'data_error' | 'duplicate' | 'ocr_corruption' | 'ghost_record' | 'out_of_scope'
  excludeNote?: string;            // 除外理由の補足
  excludedAt?: Date;
  excludedBy?: string;             // 実行者のメールアドレス
  // 原本確認フラグ
  needsSourceCheck?: boolean;      // true = 画像/参考書の原本確認が必要
  sourceCheckNote?: string;
}

// ── 学習ログ ──

export interface Attempt {
  id?: number;
  problemId: string;
  lapNo: number;
  userAnswer: boolean;
  isCorrect: boolean;
  answeredAt: Date;
  responseTimeSec: number;
}

// ── 演習用結合型 ──

export interface ProblemForExercise extends Problem {
  answerBoolean: boolean; // ProblemAttr から（readyなので必ず非null）
  explanationText: string;
  subjectId: string;
  chapterId: string;
  sectionTitle?: string;           // raw: 原本見出し
  displaySectionTitle?: string;    // UI用: 正規化済みラベル
  sourcePageQuestion?: string;
  sourcePageAnswer?: string;
  questionType?: 'descriptive';
}

// ── 演習ステート ──

export type ExercisePhase = 'answering' | 'feedback' | 'complete';

export interface ExerciseResult {
  problemId: string;
  userAnswer: boolean;
  isCorrect: boolean;
  responseTimeSec: number;
}

// ── 集計 ──

export interface SubjectStats {
  subjectId: string;
  subjectName: string;
  totalProblems: number;
  attemptedProblems: number;
  correctCount: number;
  totalAttempts: number;
  accuracy: number;
}

export interface ChapterStats {
  chapterId: string;
  chapterName: string;
  subjectId: string;
  totalProblems: number;
  correctCount: number;
  totalAttempts: number;
  accuracy: number;
}

// ── AI精査エクスポート形式 ──

export interface TriageExportItem {
  problemId: string;
  sourceBook: string;
  sourcePage: string;
  sourceImageName: string;
  rawText: string;
  cleanedText: string;
}

export interface TriageExport {
  exportedAt: string;
  totalProblems: number;
  problems: TriageExportItem[];
}

// ── AI判定インポート形式 ──

export interface TriageJudgment {
  problemId: string;
  aiTriageStatus: AiTriageStatus;
  aiDiscardReason?: AiDiscardReason | null;
  aiAnswerCandidate?: boolean | null;
  aiSubjectCandidate?: string | null;
  aiChapterCandidate?: string | null;
  aiCleanedText?: string | null;
  aiConfidence?: number;
}

export interface TriageImport {
  judgments: TriageJudgment[];
}

// ── LLM分割取込形式（llm_parse.js の出力） ──

export interface ParsedBranch {
  seqNo: number;
  questionText: string;
  answerBoolean: boolean | null;
  explanationText: string;
  subjectCandidate: string;
  chapterCandidate: string;
  confidence: number;
  sectionTitle?: string;
  sourcePageQuestion?: string;
  sourcePageAnswer?: string;
}

export interface ParsedPage {
  sourcePage: string;           // "001" — 3桁ゼロパディング
  originalProblemId: string;   // "KB2025-p001-q01" — ページ単位の旧ID
  bookId: string;
  batchId: string;
  branches: ParsedBranch[];
  parseError: string | null;
}

export interface ParsedImport {
  type: 'parsed';
  bookId: string;
  batchId: string;
  parsedAt: string;
  model: string;
  totalBranches: number;
  pages: ParsedPage[];
  queuedAt: string;
}
