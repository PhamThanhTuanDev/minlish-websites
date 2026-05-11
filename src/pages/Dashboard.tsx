import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, Clock, Flame, Target, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { LearningStats } from '@/lib/types';
import { getReviewedWordsToday, getStats } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { VocabularyWord } from '@/lib/types';

function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${hours} giờ ${minutes} phút ${seconds} giây`;
}

function buildChartRows(
  daily: {
    date: string;
    count: number;
    newWordsLearned?: number;
    timeSpentSeconds?: number;
    retentionRate?: number;
  }[],
  days: number,
): {
  date: string;
  'Lượt học': number;
  'Từ mới': number;
  'Retention %': number;
}[] {
  const byDate = new Map<
    string,
    {
      count: number;
      newWords: number;
      timeSpent: number;
      retention: number;
    }
  >();
  
  for (const row of daily) {
    const k = (row.date || '').slice(0, 10);
    if (k) {
      byDate.set(k, {
        count: row.count,
        newWords: row.newWordsLearned ?? 0,
        timeSpent: row.timeSpentSeconds ?? 0,
        retention: row.retentionRate ?? 0,
      });
    }
  }

  const out: {
    date: string;
    'Lượt học': number;
    'Từ mới': number;
    'Retention %': number;
  }[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const key = localYmd(dt);
    const data = byDate.get(key);
    out.push({
      date: key.slice(5),
      'Lượt học': data?.count ?? 0,
      'Từ mới': data?.newWords ?? 0,
      'Retention %': data?.retention ?? 0,
    });
  }
  return out;
}

const statCards = [
  { key: 'totalWords', label: 'Số từ đã học', icon: BookOpen, color: 'text-primary' },
  { key: 'streakDays', label: 'Streak (Chuỗi ngày học)', icon: Flame, color: 'text-accent' },
  { key: 'accuracy', label: 'Độ chính xác (% đúng)', icon: Target, color: 'text-primary' },
  { key: 'totalStudyRounds', label: 'Tổng số lượt học', icon: TrendingUp, color: 'text-success' },
  { key: 'totalTimeSpent', label: 'Tổng thời gian học', icon: Clock, color: 'text-success' },
  { key: 'levelEstimate', label: 'Ước lượng trình độ', icon: Award, color: 'text-accent' },
] as const;

export default function Dashboard() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [reviewedTodayWords, setReviewedTodayWords] = useState<VocabularyWord[]>([]);
  const [selectedReviewedIds, setSelectedReviewedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    void getStats()
      .then((s) => {
        if (!cancelled) {
          setStats(s);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Không tải được dữ liệu dashboard';
          toast.error(message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getReviewedWordsToday()
      .then((words) => {
        if (!cancelled) {
          const deduped = Array.from(
            new Map(words.map((word) => [word.id, word])).values(),
          );
          setReviewedTodayWords(deduped);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReviewedTodayWords([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;

  const chartData = buildChartRows(
    Array.isArray(stats.dailyActivity) ? stats.dailyActivity : [],
    14,
  );
  const totalTimeSpentSeconds = stats.totalTimeSpent ?? 0;
  const groupedBySet = reviewedTodayWords.reduce<Record<string, VocabularyWord[]>>((acc, word) => {
    const setId = String(word.setId ?? '').trim();
    if (!setId) {
      return acc;
    }
    if (!acc[setId]) {
      acc[setId] = [];
    }
    acc[setId].push(word);
    return acc;
  }, {});

  const toggleReviewedWord = (wordId: string) => {
    setSelectedReviewedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedReviewedIds.size === reviewedTodayWords.length) {
      setSelectedReviewedIds(new Set());
    } else {
      setSelectedReviewedIds(new Set(reviewedTodayWords.map((w) => String(w.id))));
    }
  };

  const handleRelearnSelected = () => {
    if (selectedReviewedIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất 1 từ để ôn lại');
      return;
    }
    // Lấy setId từ từ đầu tiên đã chọn (để navigate đến learn/:id)
    const firstSelectedWord = reviewedTodayWords.find((w) => selectedReviewedIds.has(String(w.id)));
    if (!firstSelectedWord?.setId) {
      toast.error('Không tìm thấy bộ từ cho từ đã chọn');
      return;
    }
    const selectedIds = Array.from(selectedReviewedIds).join(',');
    navigate(`/learn/${firstSelectedWord.setId}?ids=${selectedIds}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">Tiến độ học tập</h1>
        <p className="mt-1 text-muted-foreground">Theo dõi hành trình chinh phục từ vựng</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ key, label, icon: Icon, color }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-secondary`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {key === 'totalTimeSpent' ? formatDuration(totalTimeSpentSeconds) : stats[key]}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Daily Stats Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-card mb-6"
      >
        <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">Hoạt động hàng ngày</h2>
        {(stats.totalStudyRounds ?? 0) === 0 && chartData.every((d) => d['Lượt học'] === 0) ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-muted-foreground">Chưa có dữ liệu. Hãy bắt đầu học!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                }}
                formatter={(value) => `${value}`}
              />
              <Bar dataKey="Lượt học" fill="hsl(202 78% 45%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Từ mới" fill="hsl(152, 93%, 34%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Retention Rate Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-card mb-6"
      >
        <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">Tỷ lệ ghi nhớ hàng ngày</h2>
        {chartData.every((d) => d['Retention %'] === 0) ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-muted-foreground">Chưa có dữ liệu. Hãy bắt đầu học!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                }}
                formatter={(value) => `${value}%`}
              />
              <Line type="monotone" dataKey="Retention %" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Reviewed Today */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Từ đã học hôm nay</h2>
            <p className="text-sm text-muted-foreground">
              Hôm nay bạn đã học <strong>{reviewedTodayWords.length}</strong> từ.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedReviewedIds.size > 0 && (
              <Button variant="default" onClick={handleRelearnSelected} className="bg-primary text-primary-foreground">
                Ôn lại {selectedReviewedIds.size} từ
              </Button>
            )}
            <Button asChild variant="outline" className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground">
              <Link to="/sets?tab=plan">Xem từ đến hạn</Link>
            </Button>
          </div>
        </div>

        {reviewedTodayWords.length === 0 ? (
          <p className="text-muted-foreground">Hôm nay bạn chưa học từ nào. Bắt đầu một phiên học để hệ thống lưu lịch sử nhé.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedBySet).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(groupedBySet).map(([setId, words]) => {
                  const ids = words.map((word) => encodeURIComponent(word.id)).join(',');
                  return (
                    <Button
                      key={setId}
                      asChild
                      variant="outline"
                      className="border-primary/30 bg-primary/10 hover:bg-primary/20"
                    >
                      <Link to={`/learn/${setId}?ids=${ids}`}>Ôn lại bộ {setId} ({words.length})</Link>
                    </Button>
                  );
                })}
              </div>
            )}

            <div className="max-h-80 overflow-auto rounded-xl border border-border hidden md:block">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80">
                  <tr>
                    <th className="px-3 py-2 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedReviewedIds.size === reviewedTodayWords.length && reviewedTodayWords.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2 text-left">Từ</th>
                    <th className="px-3 py-2 text-left">Nghĩa</th>
                    <th className="px-3 py-2 text-left">Loại</th>
                    <th className="px-3 py-2 text-left">Trình độ</th>
                    <th className="px-3 py-2 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewedTodayWords.map((word) => (
                    <tr key={word.id} className="border-t border-border">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedReviewedIds.has(String(word.id))}
                          onChange={() => toggleReviewedWord(String(word.id))}
                          className="h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">{word.word}</td>
                      <td className="px-3 py-2">{word.meaning}</td>
                      <td className="px-3 py-2">{word.type || '-'}</td>
                      <td className="px-3 py-2">{word.level || '-'}</td>
                      <td className="px-3 py-2 text-right">
                        {word.setId ? (
                          <Button asChild size="sm" variant="outline" className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground">
                            <Link to={`/learn/${word.setId}?ids=${encodeURIComponent(word.id)}`}>Ôn lại</Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {reviewedTodayWords.map((word) => (
                <div key={`mobile-${word.id}`} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedReviewedIds.has(String(word.id))}
                        onChange={() => toggleReviewedWord(String(word.id))}
                        className="h-4 w-4 cursor-pointer mt-1 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{word.word}</p>
                        <p className="text-sm text-muted-foreground mt-1">{word.meaning}</p>
                      </div>
                    </div>
                    {word.setId ? (
                      <Button asChild size="sm" variant="outline" className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground flex-shrink-0">
                        <Link to={`/learn/${word.setId}?ids=${encodeURIComponent(word.id)}`}>Ôn lại</Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground flex-shrink-0">-</span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <span className="rounded bg-primary/10 px-2 py-1 text-primary">{word.type || 'N/A'}</span>
                    <span className="rounded bg-accent/15 px-2 py-1 text-amber-800">{word.level || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

    </div>
  );
}
