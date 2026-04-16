import { LearningStats, VocabularySet, VocabularyWord } from './types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '';

// ============ Helper Functions ============

const AUTH_STORAGE_KEYS = ['accessToken', 'authToken', 'userId', 'email', 'fullName'] as const;

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken') || localStorage.getItem('authToken');
}

function clearAuthSession(): void {
  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

function buildJsonHeaders(initHeaders?: HeadersInit): Headers {
  const headers = new Headers(initHeaders);
  headers.set('Content-Type', 'application/json');

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: buildJsonHeaders(init?.headers),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    if (resp.status === 401 || resp.status === 403) {
      clearAuthSession();
     // window.location.href = '/auth';
    }
    throw new Error(`API request failed ${resp.status} ${resp.statusText}: ${errorText}`);
  }

  if (resp.status === 204) {
    return undefined as T;
  }

  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await resp.json()) as T;
  }

  return (await resp.text()) as T;
}

function parseIsoSet(set: any): VocabularySet {
  const parsedTags = Array.isArray(set.tags)
    ? set.tags
    : typeof set.tags === 'string'
      ? set.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

  // Backend có thể trả ngày ở dạng chuỗi ISO hoặc timestamp; normalize ở đây để page không phải tự xử lý.
  return {
    ...set,
    id: String(set.id ?? ''),
    name: String(set.name ?? ''),
    description: String(set.description ?? ''),
    tags: parsedTags,
    createdAt: new Date(set.createdAt ?? Date.now()),
    updatedAt: new Date(set.updatedAt ?? Date.now()),
    words: Array.isArray(set.words) ? set.words.map(parseIsoWord) : [],
  };
}

function parseIsoWord(word: any): VocabularyWord {
  // Một số API cũ dùng tên field khác nhau, nên map mềm ở đây để giữ tương thích ngược.
  const nextReviewRaw = word.nextReview ?? word.nextReviewDate;
  const lastReviewedRaw = word.lastReviewed ?? word.lastReviewDate;

  return {
    id: String(word.id ?? crypto.randomUUID()),
    word: String(word.word ?? ''),
    pronunciation: String(word.pronunciation ?? ''),
    meaning: String(word.meaning ?? ''),
    description: String(word.description ?? ''),
    example: String(word.example ?? word.exampleSentence ?? ''),
    collocation: String(word.collocation ?? word.fixedPhrase ?? ''),
    relatedWords: String(word.relatedWords ?? ''),
    note: String(word.note ?? word.notes ?? ''),
    easeFactor: Number(word.easeFactor ?? 2.5),
    interval: Number(word.interval ?? 0),
    repetitions: Number(word.repetitions ?? 0),
    nextReview: new Date(nextReviewRaw ?? Date.now()),
    lastReviewed: lastReviewedRaw ? new Date(lastReviewedRaw) : undefined,
    correctCount: Number(word.correctCount ?? 0),
    incorrectCount: Number(word.incorrectCount ?? 0),
  };
}

// ============ Auth API ============

export async function forgotPassword(email: string): Promise<void> {
  await fetchJson<void>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  /** IELTS | TOEIC | Communication */
  learningGoal?: string;
  /** A1…C2 */
  level?: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  userId?: string;
  id?: string;
  email: string;
}

export interface GoogleLoginRequest {
  idToken?: string;
  accessToken?: string;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  return fetchJson<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function register(credentials: RegisterRequest): Promise<AuthResponse> {
  return fetchJson<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function googleLogin(payload: GoogleLoginRequest): Promise<AuthResponse> {
  return fetchJson<AuthResponse>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============ User API ============

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await fetchJson<void>('/api/users/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  learningGoal?: string;
  level?: string;
  avatar?: string;
  createdAt?: string;
}

function mapUserProfile(raw: any): UserProfile {
  return {
    userId: String(raw?.id ?? raw?.userId ?? ''),
    email: String(raw?.email ?? ''),
    fullName: String(raw?.fullName ?? ''),
    learningGoal: raw?.learningGoal != null ? String(raw.learningGoal) : '',
    level: raw?.level != null ? String(raw.level) : '',
  };
}

export async function getUserProfile(): Promise<UserProfile> {
  const raw = await fetchJson<any>('/api/users/profile');
  return mapUserProfile(raw);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const result = await fetchJson<number | string>('/api/notifications/unread-count');
  return Number(result ?? 0);
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const raw = await fetchJson<any>('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify({
      fullName: profile.fullName,
      learningGoal: profile.learningGoal,
      level: profile.level,
    }),
  });
  return mapUserProfile(raw);
}

// ============ Sets API ============

export async function getSet(id: string): Promise<VocabularySet | null> {
  try {
    const [setResult, words] = await Promise.all([
      fetchJson<any>(`/api/sets/${encodeURIComponent(id)}`),
      getVocabulariesInSet(id).catch(() => [] as VocabularyWord[]),
    ]);
    return setResult ? parseIsoSet({ ...setResult, words }) : null;
  } catch {
    return null;
  }
}

export async function saveSet(set: VocabularySet): Promise<VocabularySet> {
  const hasId = String(set.id ?? '').trim().length > 0;
  const method = hasId ? 'PUT' : 'POST';
  const url = hasId ? `/api/sets/${encodeURIComponent(String(set.id))}` : '/api/sets';
  const payload = {
    name: set.name,
    description: set.description,
    tags: Array.isArray(set.tags) ? set.tags.join(',') : (set.tags ?? ''),
  };
  const result = await fetchJson<any>(url, {
    method,
    body: JSON.stringify(payload),
  });
  return parseIsoSet({ ...result, words: set.words ?? [] });
}

export async function deleteSet(id: string): Promise<void> {
  await fetchJson<void>(`/api/sets/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function getSets(): Promise<VocabularySet[]> {
  const results = await fetchJson<any[]>('/api/sets');
  const parsedSets = (Array.isArray(results) ? results : []).map(parseIsoSet);
  const setsWithWords = await Promise.all(
    parsedSets.map(async (set) => {
      const words = await getVocabulariesInSet(String(set.id)).catch(() => [] as VocabularyWord[]);
      return { ...set, words };
    })
  );
  return setsWithWords;
}

// ============ Vocabularies API ============

export async function addVocabularyToSet(setId: string, word: VocabularyWord): Promise<VocabularyWord> {
  const payload = {
    word: word.word,
    pronunciation: word.pronunciation,
    meaning: word.meaning,
    description: word.description,
    exampleSentence: word.example,
    fixedPhrase: word.collocation,
    relatedWords: word.relatedWords,
    notes: word.note,
  };
  const result = await fetchJson<any>(`/api/vocabularies/set/${encodeURIComponent(setId)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseIsoWord(result);
}

export async function getVocabulariesInSet(setId: string): Promise<VocabularyWord[]> {
  const result = await fetchJson<any[]>(`/api/vocabularies/set/${encodeURIComponent(setId)}`);
  return (Array.isArray(result) ? result : []).map(parseIsoWord);
}

export async function updateVocabulary(vocabId: string, updates: Partial<VocabularyWord>): Promise<VocabularyWord> {
  const payload = {
    word: updates.word,
    pronunciation: updates.pronunciation,
    meaning: updates.meaning,
    description: updates.description,
    exampleSentence: updates.example,
    fixedPhrase: updates.collocation,
    relatedWords: updates.relatedWords,
    notes: updates.note,
  };
  const result = await fetchJson<any>(`/api/vocabularies/${encodeURIComponent(vocabId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return parseIsoWord(result);
}

export async function deleteVocabulary(vocabId: string): Promise<void> {
  await fetchJson<void>(`/api/vocabularies/${encodeURIComponent(vocabId)}`, { method: 'DELETE' });
}

export async function importVocabularies(setId: string, words: VocabularyWord[]): Promise<VocabularySet> {
  await Promise.all(words.map((word) => addVocabularyToSet(setId, word)));
  const updated = await getSet(setId);
  if (!updated) {
    throw new Error('Không thể tải lại bộ từ sau khi import');
  }
  return updated;
}

// ============ Study API ============

export interface StudyRatingPayload {
  vocabularyId: string;
  rating: 'again' | 'hard' | 'good' | 'easy';
}

export interface StudySession {
  sessionId: string;
  vocabId: string;
  rating: string;
  timestamp: string;
}

function toBackendRating(r: StudyRatingPayload['rating']): string {
  return r === 'again' ? 'repeat' : r;
}

export async function rateVocabulary(payload: StudyRatingPayload): Promise<void> {
  await fetchJson<void>('/api/study/rate', {
    method: 'POST',
    body: JSON.stringify({
      vocabularyId: Number(payload.vocabularyId),
      rating: toBackendRating(payload.rating),
    }),
  });
}

export async function getTodayStudySessions(): Promise<StudySession[]> {
  return fetchJson<StudySession[]>('/api/study/today');
}

// ============ Stats API ============

export interface DailyStats {
  date: string;
  count: number;
  accuracy?: number;
  newWordsLearned?: number;
  timeSpentSeconds?: number;
  retentionRate?: number;
  studySessions?: number;
}

export interface RetentionRateData {
  date?: string;
  week?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
  retentionRate: number;
  newWordsLearned: number;
  timeSpentSeconds: number;
}

export interface SummaryStats {
  totalWords: number;
  totalStudyRounds?: number;
  wordsLearned: number;
  streak?: number;
  streakDays?: number;
  accuracy: number;
  retentionRate: number;
  levelEstimate?: string;
  last30DaysTimeSpent?: number;
  last30DaysNewWords?: number;
  last30DaysStudyDays?: number;
  totalTimeSpent?: number;
  totalStudyDays?: number;
}

export interface LearningPlan {
  newWordsPerDay: number;
  todayNewWordsLearned: number;
  todayReviewWordsLearned: number;
  todayReviewWordsDue: number;
}

export interface DueReviewWord {
  vocabularyId: number;
  word: string;
  nextReviewDate?: string;
  lastReviewDate?: string;
  overdueDays?: number;
}

export interface DueReviewSet {
  setId: number;
  setName: string;
  totalDueWords: number;
  words: DueReviewWord[];
}

export async function getDailyStats(): Promise<DailyStats[]> {
  const result = await fetchJson<any[]>('/api/stats/daily');
  return (Array.isArray(result) ? result : []).map((item) => {
    const rawDate = item.studyDate ?? item.date ?? '';
    const normalized = typeof rawDate === 'string' ? rawDate.slice(0, 10) : String(rawDate);
    const dailyRounds = Number(item.studySessions ?? item.count ?? item.sessionCount ?? 0);
    return {
      date: normalized,
      count: dailyRounds,
      accuracy: typeof item.accuracy === 'number' ? item.accuracy : undefined,
      newWordsLearned: Number(item.newWordsLearned ?? 0),
      timeSpentSeconds: Number(item.timeSpentSeconds ?? 0),
      retentionRate: typeof item.retentionRate === 'number' ? item.retentionRate : undefined,
      studySessions: Number(item.studySessions ?? dailyRounds),
    };
  });
}

export async function getRetentionRateByDay(startDate?: string, endDate?: string): Promise<RetentionRateData[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('start', startDate);
  if (endDate) params.append('end', endDate);
  const queryStr = params.toString();
  const result = await fetchJson<any[]>(`/api/stats/retention-rate/daily${queryStr ? '?' + queryStr : ''}`);
  return (Array.isArray(result) ? result : []).map((item) => ({
    date: item.date,
    retentionRate: Number(item.retentionRate ?? 0),
    newWordsLearned: Number(item.newWordsLearned ?? 0),
    timeSpentSeconds: Number(item.timeSpentSeconds ?? 0),
  }));
}

export async function getRetentionRateByWeek(startDate?: string, endDate?: string): Promise<RetentionRateData[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('start', startDate);
  if (endDate) params.append('end', endDate);
  const queryStr = params.toString();
  const result = await fetchJson<any[]>(`/api/stats/retention-rate/weekly${queryStr ? '?' + queryStr : ''}`);
  return (Array.isArray(result) ? result : []).map((item) => ({
    week: item.week,
    startDate: item.startDate,
    endDate: item.endDate,
    retentionRate: Number(item.retentionRate ?? 0),
    newWordsLearned: Number(item.newWordsLearned ?? 0),
    timeSpentSeconds: Number(item.timeSpentSeconds ?? 0),
  }));
}

export async function getRetentionRateByMonth(startDate?: string, endDate?: string): Promise<RetentionRateData[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('start', startDate);
  if (endDate) params.append('end', endDate);
  const queryStr = params.toString();
  const result = await fetchJson<any[]>(`/api/stats/retention-rate/monthly${queryStr ? '?' + queryStr : ''}`);
  return (Array.isArray(result) ? result : []).map((item) => ({
    month: item.month,
    startDate: item.startDate,
    endDate: item.endDate,
    retentionRate: Number(item.retentionRate ?? 0),
    newWordsLearned: Number(item.newWordsLearned ?? 0),
    timeSpentSeconds: Number(item.timeSpentSeconds ?? 0),
  }));
}

export async function getSummaryStats(): Promise<SummaryStats> {
  const result = await fetchJson<any>('/api/stats/summary');
  return {
    totalWords: Number(result.totalWords ?? 0),
    totalStudyRounds: Number(result.totalStudyRounds ?? 0),
    wordsLearned: Number(result.wordsLearned ?? 0),
    streakDays: Number(result.streakDays ?? result.streak ?? 0),
    accuracy: Number(result.accuracy ?? 0),
    retentionRate: Number(result.retentionRate ?? 0),
    levelEstimate: result.levelEstimate != null ? String(result.levelEstimate) : undefined,
    last30DaysTimeSpent: Number(result.last30DaysTimeSpent ?? 0),
    last30DaysNewWords: Number(result.last30DaysNewWords ?? 0),
    last30DaysStudyDays: Number(result.last30DaysStudyDays ?? 0),
    totalTimeSpent: Number(result.totalTimeSpent ?? 0),
    totalStudyDays: Number(result.totalStudyDays ?? 0),
  };
}

export async function getLearningPlan(): Promise<LearningPlan> {
  const result = await fetchJson<any>('/api/learning-plan');
  return {
    newWordsPerDay: Number(result?.newWordsPerDay ?? 10),
    todayNewWordsLearned: Number(result?.todayNewWordsLearned ?? 0),
    todayReviewWordsLearned: Number(result?.todayReviewWordsLearned ?? 0),
    todayReviewWordsDue: Number(result?.todayReviewWordsDue ?? 0),
  };
}

export async function updateLearningPlan(payload: {
  newWordsPerDay?: number;
}): Promise<LearningPlan> {
  const result = await fetchJson<any>('/api/learning-plan', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return {
    newWordsPerDay: Number(result?.newWordsPerDay ?? 10),
    todayNewWordsLearned: Number(result?.todayNewWordsLearned ?? 0),
    todayReviewWordsLearned: Number(result?.todayReviewWordsLearned ?? 0),
    todayReviewWordsDue: Number(result?.todayReviewWordsDue ?? 0),
  };
}

export async function getDueReviewSets(): Promise<DueReviewSet[]> {
  const result = await fetchJson<any[]>('/api/stats/review-due-sets');
  return (Array.isArray(result) ? result : []).map((set) => ({
    setId: Number(set?.setId ?? 0),
    setName: String(set?.setName ?? ''),
    totalDueWords: Number(set?.totalDueWords ?? 0),
    words: (Array.isArray(set?.words) ? set.words : []).map((word: any) => ({
      vocabularyId: Number(word?.vocabularyId ?? 0),
      word: String(word?.word ?? ''),
      nextReviewDate: word?.nextReviewDate != null ? String(word.nextReviewDate) : undefined,
      lastReviewDate: word?.lastReviewDate != null ? String(word.lastReviewDate) : undefined,
      overdueDays: Number(word?.overdueDays ?? 0),
    })),
  }));
}

export async function exportVocabularySet(setId: string): Promise<void> {
  const token = getAccessToken();
  const resp = await fetch(`${API_BASE_URL}/api/vocabularies/export/${encodeURIComponent(setId)}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`API request failed ${resp.status} ${resp.statusText}: ${errorText}`);
  }

  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vocabulary-set-${setId}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function getStats(): Promise<LearningStats> {
  const summary = await getSummaryStats();
  const daily = await getDailyStats();
  return {
    totalWords: summary.totalWords,
    wordsLearned: summary.wordsLearned,
    totalStudyRounds: summary.totalStudyRounds,
    streak: summary.streak ?? summary.streakDays,
    streakDays: summary.streakDays,
    accuracy: summary.accuracy,
    retentionRate: summary.retentionRate,
    levelEstimate: summary.levelEstimate,
    last30DaysTimeSpent: summary.last30DaysTimeSpent,
    last30DaysNewWords: summary.last30DaysNewWords,
    last30DaysStudyDays: summary.last30DaysStudyDays,
    totalTimeSpent: summary.totalTimeSpent,
    totalStudyDays: summary.totalStudyDays,
    dailyActivity: daily,
  };
}

export async function recordStudySession(correct: number, total: number): Promise<LearningStats> {
  const stats = await getStats();
  return stats;
}

// ============ Notifications API ============

export interface Notification {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

function normalizeServerDateTime(raw: unknown): string {
  const value = String(raw ?? '').trim();
  if (!value) return '';

  // Backend often returns LocalDateTime without offset, treat it as UTC for stable cross-timezone rendering.
  const withZone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function mapApiNotification(n: any): Notification {
  const rawMsg = String(n.message ?? n.content ?? '').trim();
  const idx = rawMsg.indexOf('\n');

  // Ưu tiên tách tiêu đề/nội dung bằng xuống dòng; nếu không có, lấy câu đầu tiên làm tiêu đề để tránh hiển thị notificationType (vd: SESSION_SUMMARY).
  const lineTitle = idx >= 0 ? rawMsg.slice(0, idx) : rawMsg.split('. ')[0];
  const lineContent = idx >= 0 ? rawMsg.slice(idx + 1) : rawMsg;

  const title = (lineTitle || String(n.notificationType ?? n.title ?? 'Thông báo')).trim();
  const content = (lineContent || title).trim();
  return {
    id: String(n.id ?? ''),
    title,
    content,
    isRead: Boolean(n.isRead ?? false),
    createdAt: normalizeServerDateTime(n.createdAt),
  };
}

export async function getUnreadNotifications(): Promise<Notification[]> {
  const result = await fetchJson<any[]>('/api/notifications');
  return (Array.isArray(result) ? result : []).map(mapApiNotification);
}

export async function getRecentNotifications(): Promise<Notification[]> {
  const result = await fetchJson<any[]>('/api/notifications/recent');
  return (Array.isArray(result) ? result : []).map(mapApiNotification);
}

export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  await fetchJson<void>(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PUT',
  });
  return {
    id: notificationId,
    title: '',
    content: '',
    isRead: true,
    createdAt: '',
  };
}

export async function createStudySummaryNotification(correct: number, total: number, timeSpentSeconds: number): Promise<Notification> {
  const result = await fetchJson<any>('/api/notifications/session-summary', {
    method: 'POST',
    body: JSON.stringify({ correct, total, timeSpentSeconds }),
  });
  return {
    id: String(result?.id ?? ''),
    title: String(result?.title ?? 'Hoan thanh phien hoc'),
    content: String(result?.content ?? ''),
    isRead: Boolean(result?.isRead ?? false),
    createdAt: String(result?.createdAt ?? ''),
  };
}

export interface NotificationPreferences {
  enableDailyReminder: boolean;
  enableReviewReminder: boolean;
  enableEmailNotification: boolean;
  reminderTime: string; // HH:MM format
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return fetchJson<NotificationPreferences>('/api/notifications/preferences');
}

export async function updateNotificationPreferences(prefs: NotificationPreferences): Promise<NotificationPreferences> {
  return fetchJson<NotificationPreferences>('/api/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify(prefs),
  });
}

// ============ Helper Functions ============

export async function getWordsForReview(setId: string): Promise<VocabularyWord[]> {
  const set = await getSet(setId);
  if (!set) return [];
  const now = new Date();
  return set.words.filter(w => w.nextReview <= now);
}
