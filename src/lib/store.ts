import { VocabularySet, VocabularyWord, LearningStats, createNewWord } from './types';

const STORAGE_KEY = 'minlish_data';

interface AppData {
  sets: VocabularySet[];
  stats: LearningStats;
  lastStudyDate: string;
}

const sampleWords: VocabularyWord[] = [
  createNewWord({ word: 'Ubiquitous', meaning: 'Có mặt ở khắp nơi', pronunciation: '/juːˈbɪk.wɪ.təs/', description: 'Present, appearing, or found everywhere', example: 'Mobile phones are ubiquitous in modern society.', collocation: 'ubiquitous presence, ubiquitous technology', relatedWords: 'omnipresent, pervasive', note: 'IELTS Band 7+' }),
  createNewWord({ word: 'Resilient', meaning: 'Kiên cường, có sức chống chịu', pronunciation: '/rɪˈzɪl.i.ənt/', description: 'Able to recover quickly from difficult conditions', example: 'Children are often more resilient than adults.', collocation: 'resilient economy, resilient spirit', relatedWords: 'tough, adaptable', note: 'IELTS Writing Task 2' }),
  createNewWord({ word: 'Mitigate', meaning: 'Giảm nhẹ, làm dịu bớt', pronunciation: '/ˈmɪt.ɪ.ɡeɪt/', description: 'Make less severe, serious, or painful', example: 'Measures to mitigate the effects of climate change.', collocation: 'mitigate risk, mitigate impact', relatedWords: 'alleviate, reduce', note: 'Academic vocabulary' }),
  createNewWord({ word: 'Pragmatic', meaning: 'Thực dụng, thực tế', pronunciation: '/præɡˈmæt.ɪk/', description: 'Dealing with things sensibly and realistically', example: 'We need a pragmatic approach to solve this issue.', collocation: 'pragmatic approach, pragmatic solution', relatedWords: 'practical, realistic', note: 'Business English' }),
  createNewWord({ word: 'Eloquent', meaning: 'Hùng biện, lưu loát', pronunciation: '/ˈel.ə.kwənt/', description: 'Fluent or persuasive in speaking or writing', example: 'She gave an eloquent speech about human rights.', collocation: 'eloquent speaker, eloquent words', relatedWords: 'articulate, expressive', note: 'Speaking Band 8+' }),
];

const defaultData: AppData = {
  sets: [
    {
      id: 'sample-set',
      name: 'IELTS Academic Vocabulary',
      description: 'Từ vựng học thuật thường gặp trong IELTS',
      tags: ['IELTS', 'Academic'],
      words: sampleWords,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  stats: {
    totalWords: 5,
    wordsLearned: 0,
    streak: 0,
    accuracy: 0,
    dailyActivity: [],
    retentionRate: 0,
  },
  lastStudyDate: '',
};

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    parsed.sets = parsed.sets.map((s: VocabularySet) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      words: s.words.map((w: VocabularyWord) => ({
        ...w,
        nextReview: new Date(w.nextReview),
        lastReviewed: w.lastReviewed ? new Date(w.lastReviewed) : undefined,
      })),
    }));
    return parsed;
  } catch {
    return defaultData;
  }
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getSets(): VocabularySet[] {
  return loadData().sets;
}

export function getSet(id: string): VocabularySet | undefined {
  return loadData().sets.find(s => s.id === id);
}

export function saveSet(set: VocabularySet) {
  const data = loadData();
  const idx = data.sets.findIndex(s => s.id === set.id);
  if (idx >= 0) data.sets[idx] = set;
  else data.sets.push(set);
  data.stats.totalWords = data.sets.reduce((sum, s) => sum + s.words.length, 0);
  saveData(data);
}

export function deleteSet(id: string) {
  const data = loadData();
  data.sets = data.sets.filter(s => s.id !== id);
  data.stats.totalWords = data.sets.reduce((sum, s) => sum + s.words.length, 0);
  saveData(data);
}

export function getStats(): LearningStats {
  return loadData().stats;
}

export function updateStats(updates: Partial<LearningStats>) {
  const data = loadData();
  data.stats = { ...data.stats, ...updates };
  saveData(data);
}

export function recordStudySession(correct: number, total: number) {
  const data = loadData();
  const today = new Date().toISOString().slice(0, 10);
  
  if (data.lastStudyDate !== today) {
    if (data.lastStudyDate) {
      const last = new Date(data.lastStudyDate);
      const diff = Math.floor((Date.now() - last.getTime()) / 86400000);
      data.stats.streak = diff === 1 ? data.stats.streak + 1 : 1;
    } else {
      data.stats.streak = 1;
    }
    data.lastStudyDate = today;
  }
  
  data.stats.wordsLearned += correct;
  const totalAttempts = data.stats.wordsLearned + (data.stats.totalWords - data.stats.wordsLearned);
  data.stats.accuracy = totalAttempts > 0 ? Math.round((data.stats.wordsLearned / totalAttempts) * 100) : 0;
  
  const existing = data.stats.dailyActivity.find(d => d.date === today);
  if (existing) existing.count += total;
  else data.stats.dailyActivity.push({ date: today, count: total });
  
  if (data.stats.dailyActivity.length > 30) {
    data.stats.dailyActivity = data.stats.dailyActivity.slice(-30);
  }
  
  saveData(data);
}

export function getWordsForReview(setId: string): VocabularyWord[] {
  const set = getSet(setId);
  if (!set) return [];
  const now = new Date();
  return set.words.filter(w => new Date(w.nextReview) <= now);
}
