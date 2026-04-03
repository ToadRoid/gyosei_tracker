export interface QuickQuiz {
  question: string;
  answer: string;        // "○" or "×"
  explanation: string;
}

export interface ReviewTheme {
  // 元分類（GPT出力に含める）
  subjectName: string;
  chapterName: string;
  sectionTitle: string;
  // GPT生成コンテンツ
  themeName: string;
  priority: 'high' | 'medium' | 'low';
  weakPoint: string;
  keyPoints: string[];
  typicalTraps: string[];
  distinctionPoints: string[];
  quickQuiz: QuickQuiz[];
  relatedProblemIds: string[];   // subset of candidateProblemIds chosen by GPT
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
