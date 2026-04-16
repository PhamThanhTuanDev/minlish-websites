import { VocabularyWord } from './types';

export const STUDY_WORD_LIMIT = 10;

export function shuffleWords<T>(items: T[]): T[] {
  const copy = [...items];

  // Fisher-Yates: đổi chỗ ngẫu nhiên để tránh thiên vị vị trí ban đầu.
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function pickStudyWords(
  reviewWords: VocabularyWord[],
  allWords: VocabularyWord[],
  limit = STUDY_WORD_LIMIT,
): VocabularyWord[] {
  const reviewIds = new Set(reviewWords.map((word) => word.id));
  const selectedReview = shuffleWords(reviewWords).slice(0, limit);

  if (selectedReview.length >= limit) {
    return selectedReview;
  }

  // Nếu số từ đến hạn ôn ít hơn limit thì bù bằng từ chưa học để người dùng vẫn có đủ số câu.
  const remainingPool = allWords.filter((word) => !reviewIds.has(word.id));
  const filler = shuffleWords(remainingPool).slice(0, limit - selectedReview.length);

  return [...selectedReview, ...filler];
}
