import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, Clock, Flame, Target, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { LearningStats } from '@/lib/types';
import { getStats } from '@/lib/api';
import { toast } from 'sonner';

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

  if (!stats) return null;

  const chartData = buildChartRows(
    Array.isArray(stats.dailyActivity) ? stats.dailyActivity : [],
    14,
  );
  const totalTimeSpentSeconds = stats.totalTimeSpent ?? 0;

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

    </div>
  );
}
