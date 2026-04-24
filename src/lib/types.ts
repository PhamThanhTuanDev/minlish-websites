export interface VocabularyWord {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  description: string;
  descriptionVi?: string;
  example: string;
  exampleVi?: string;
  collocation: string;
  relatedWords: string;
  note: string;
  type?: string;
  level?: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
  lastReviewed?: Date;
  correctCount: number;
  incorrectCount: number;
}

export interface VocabularySet {
  id: string;
  name: string;
  description: string;
  tags: string[];
  words: VocabularyWord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningStats {
  /** Số từ vựng đã có tiến độ SRS (study_history) — số từ UNIQUE. */
  totalWords: number;
  /** Tổng số lượt chấm điểm ôn (SRS) theo ngày. */
  totalStudyRounds: number;
  /** Tổng từ đã học (dùng để compat với cũ, = totalWords). */
  wordsLearned: number;
  /** Chuỗi ngày học liên tiếp. */
  streak?: number;
  streakDays?: number;
  /** Độ chính xác (%). */
  accuracy: number;
  /** Daily activity chart data. */
  dailyActivity: {
    date: string;
    count: number;
    accuracy?: number;
    newWordsLearned?: number;
    timeSpentSeconds?: number;
    retentionRate?: number;
    studySessions?: number;
  }[];
  /** Retention rate (%). */
  retentionRate: number;
  /** Level estimate (Beginner/Intermediate/Advanced). */
  levelEstimate?: string;
  /** Tổng thời gian học 30 ngày gần nhất (giây). */
  last30DaysTimeSpent?: number;
  /** Tổng từ mới 30 ngày gần nhất. */
  last30DaysNewWords?: number;
  /** Số ngày học trong 30 ngày gần nhất. */
  last30DaysStudyDays?: number;
  /** Tổng thời gian học từ lúc bắt đầu (giây). */
  totalTimeSpent?: number;
  /** Tổng số ngày học từ lúc bắt đầu. */
  totalStudyDays?: number;
}

export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export function createNewWord(partial: Partial<VocabularyWord> & { word: string; meaning: string }): VocabularyWord {
  return {
    id: crypto.randomUUID(),
    pronunciation: '',
    description: '',
    descriptionVi: '',
    example: '',
    exampleVi: '',
    collocation: '',
    relatedWords: '',
    note: '',
    type: '',
    level: '',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date(),
    correctCount: 0,
    incorrectCount: 0,
    ...partial,
  };
}

export function calculateSRS(word: VocabularyWord, rating: SRSRating): VocabularyWord {
  const ratingMap: Record<SRSRating, number> = { again: 0, hard: 1, good: 2, easy: 3 };
  const q = ratingMap[rating];
  
  let { easeFactor, interval, repetitions } = word;
  
  if (q < 2) {
    repetitions = 0;
    interval = 0;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  }
  
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02)));
  
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  
  return {
    ...word,
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastReviewed: new Date(),
    correctCount: q >= 2 ? word.correctCount + 1 : word.correctCount,
    incorrectCount: q < 2 ? word.incorrectCount + 1 : word.incorrectCount,
  };
}
