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

// ── 問題 ──

export interface Question {
  id?: number;
  subjectId: string;
  chapterId: string;
  sourcePage: string;
  originalText: string;
  normalizedText: string;
  answerBoolean: boolean;
  tags: string[];
  createdAt: Date;
}

// ── 学習履歴 ──

export interface Attempt {
  id?: number;
  questionId: number;
  lapNo: number;
  answeredAt: Date;
  userAnswer: boolean;
  isCorrect: boolean;
  responseTimeSec: number;
}

// ── インポート ──

export type ImportStatus = 'pending' | 'completed' | 'error';

export interface Import {
  id?: number;
  imageName: string;
  ocrRawText: string;
  importedAt: Date;
  status: ImportStatus;
}

// ── 演習 ──

export type ExercisePhase = 'answering' | 'feedback' | 'complete';

export interface ExerciseResult {
  questionId: number;
  userAnswer: boolean;
  isCorrect: boolean;
  responseTimeSec: number;
}

export interface ExerciseState {
  questions: Question[];
  currentIndex: number;
  phase: ExercisePhase;
  lapNo: number;
  results: ExerciseResult[];
  startedAt: number;
}

// ── 集計 ──

export interface SubjectStats {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctCount: number;
  totalAttempts: number;
  accuracy: number;
}

export interface ChapterStats {
  chapterId: string;
  chapterName: string;
  subjectId: string;
  totalQuestions: number;
  correctCount: number;
  totalAttempts: number;
  accuracy: number;
}
