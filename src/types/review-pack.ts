export interface QuickQuiz {
  question: string;
  answer: string;        // "○" or "×"
  explanation: string;
}

export interface ReviewTheme {
  // 元分類
  subjectName: string;
  chapterName: string;
  sectionTitle: string;
  themeName: string;
  priority: 'high' | 'medium' | 'low';

  // 1. 概要
  overview: string;            // この制度/章が何を扱うか・何のためのルールか

  // 2. 全体の位置づけ
  positioning: string;         // 章のどこにあるか・近い論点との違い

  // 3. 弱点診断
  weakDiagnosis: string;       // 何を誤解しているか・何と何を混同しているか

  // 4. ピンポイント解説
  pinpointExplanation: string; // つまずいた論点の丁寧な説明
  judgmentCriteria: string[];  // 判断基準
  typicalTraps: string[];      // 典型ひっかけ
  distinctionPoints: string[]; // 区別ポイント

  // 5. 仕上げ
  oneLiner: string;            // 一文まとめ
  quickQuiz: QuickQuiz[];
  relatedProblemIds: string[];
  pageRefQuestion: string;
  pageRefAnswer: string;
}

export interface ReviewPack {
  generatedAt: string;
  themes: ReviewTheme[];
  overallComment: string;
}

export interface WrongExample {
  questionText: string;
  correctAnswer: boolean;
  userAnswer: boolean;
  explanationSnippet: string;
  pageRefQuestion: string;
  pageRefAnswer: string;
}

export interface QuestionExample {
  problemId: string;
  questionText: string;
  correctAnswer: boolean;
  userAnswer: boolean;
  isCorrect: boolean;
  explanationText: string;
  responseTimeSec: number;
  pageRefQuestion: string;
  pageRefAnswer: string;
}

export interface WeakTopicInput {
  subjectName: string;
  chapterName: string;
  sectionTitle: string;
  accuracy: number;
  totalAttempts: number;
  lapStats: { lapNo: number; attempts: number; accuracy: number }[];
  improvement: number | null;
  pageRefQuestion: string;
  pageRefAnswer: string;
  candidateProblemIds: string[];
  wrongExamples: WrongExample[];
  questionExamples: QuestionExample[];
}

export interface ReviewPackInput {
  userSummary: {
    totalAttempts: number;
    overallAccuracy: number;
    lapCount: number;
  };
  weakTopics: WeakTopicInput[];
}

export interface ReviewPackRecord {
  id: string;
  userId: string;
  generatedAt: string;
  packJson: ReviewPack;
  sourceSummaryJson: ReviewPackInput;
}
