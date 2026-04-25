import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Save, Mail, BookOpen, Award, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getUserProfile, updateUserProfile, UserProfile } from '@/lib/api';
import { changePassword } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const GOALS = [
  { value: 'IELTS', label: 'IELTS' },
  { value: 'TOEIC', label: 'TOEIC' },
  { value: 'Communication', label: 'Giao tiếp (Communication)' },
] as const;

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export default function Profile() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UserProfile>({
    userId: '',
    email: '',
    fullName: '',
    learningGoal: '',
    level: '',
  });

  // Change password dialog state
  const [showChangePw, setShowChangePw] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getUserProfile()
      .then((p) => {
        if (!cancelled) setForm(p);
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateUserProfile({
        fullName: form.fullName,
        learningGoal: form.learningGoal,
        level: form.level,
      });
      setForm(updated);
      toast.success('Đã cập nhật hồ sơ');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không lưu được');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('fullName');
    localStorage.removeItem('name');
    localStorage.removeItem('username');
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
          <p className="text-muted-foreground">Đang tải hồ sơ…</p>
        </motion.div>
      </div>
    );
  }

  const getGoalLabel = (value: string) => GOALS.find(g => g.value === value)?.label || value;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-24 md:pb-8">
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">Hồ sơ cá nhân</h1>
          <p className="mt-2 text-muted-foreground">Quản lý thông tin và mục tiêu học tập của bạn</p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card to-card/80 p-8 shadow-xl"
        >
          {/* Profile Header */}
          <div className="mb-8 flex items-center gap-4 pb-8 border-b border-border/30">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 border border-teal-500/30"
            >
              <UserIcon className="h-28 w-28 text-teal-600" />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Chào mừng,</p>
              <h2 className="font-heading text-2xl font-bold text-foreground">{form.fullName || 'Người dùng'}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{form.email}</p>
              <Dialog open={showChangePw} onOpenChange={setShowChangePw}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-gradient-primary text-[#0F172A] mt-2 border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground">
                    <Lock className="mr-1 h-4 w-4"/> Đổi mật khẩu
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Đổi mật khẩu</DialogTitle>
                    <DialogDescription>Nhập mật khẩu cũ và mật khẩu mới để thay đổi.</DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (newPassword !== confirmPassword) {
                        toast.error('Mật khẩu mới không khớp');
                        return;
                      }
                      setPwLoading(true);
                      try {
                        await changePassword(oldPassword, newPassword);
                        toast.success('Đổi mật khẩu thành công!');
                        setShowChangePw(false);
                        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
                      } catch (err: any) {
                        const msg = err?.message || '';
                        if (msg.includes('Mật khẩu cũ không đúng')) {
                          toast.error('Mật khẩu cũ không đúng');
                        } else {
                          toast.error('Không đổi được mật khẩu');
                        }
                      } finally {
                        setPwLoading(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <Input
                      type="password"
                      required
                      placeholder="Mật khẩu cũ"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      autoFocus
                      className="h-12 rounded-lg border border-gray-300 focus:border-amber-400 px-6 text-base bg-white/95 shadow-lg placeholder:text-gray-400 transition-all duration-200 outline-none focus:ring-2 focus:ring-amber-100"
                    />
                    <Input
                      type="password"
                      required
                      placeholder="Mật khẩu mới"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="h-12 rounded-lg border border-gray-300 focus:border-amber-400 px-6 text-base bg-white/95 shadow-lg placeholder:text-gray-400 transition-all duration-200 outline-none focus:ring-2 focus:ring-amber-100"
                    />
                    <Input
                      type="password"
                      required
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-lg border border-gray-300 focus:border-amber-400 px-6 text-base bg-white/95 shadow-lg placeholder:text-gray-400 transition-all duration-200 outline-none focus:ring-2 focus:ring-amber-100"
                    />
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={pwLoading}
                        className="w-full h-12 bg-gradient-primary text-[#0F172A] font-semibold text-base shadow-lg text-base shadow-none border border-cyan-200 hover:shadow-xl hover:brightness-[1.03] transition-all"
                      >
                                      
                        {pwLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <label className="mb-2 block text-sm font-semibold text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={form.email}
                  disabled
                  className="pl-12 bg-muted/40 border-border/50 text-muted-foreground cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Email của bạn được bảo vệ và không thể thay đổi</p>
            </motion.div>

            {/* Display Name Field */}
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <label className="mb-2 block text-sm font-semibold text-foreground">Tên hiển thị</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Nhập tên của bạn"
                  className="pl-12 border-border/50 focus:border-teal-500 focus:ring-teal-500/30 transition"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Tên này sẽ hiển thị trong hồ sơ của bạn</p>
            </motion.div>

            {/* Learning Goal Field */}
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <label className="mb-2 block text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                Mục tiêu học
              </label>
              <Select
                value={form.learningGoal || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, learningGoal: v }))}
              >
                <SelectTrigger className="border-border/50 focus:border-teal-500 focus:ring-teal-500/30 h-11">
                  <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Chọn mục tiêu học" />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      <div className="flex items-center gap-2">
                        {g.value === 'IELTS' && <Award className="h-4 w-4" />}
                        {g.value === 'TOEIC' && <Award className="h-4 w-4" />}
                        {g.value === 'Communication' && <BookOpen className="h-4 w-4" />}
                        {g.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Lựa chọn mục tiêu để nhận đề xuất phù hợp</p>
            </motion.div>

            {/* Level Field */}
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
              <label className="mb-2 block text-sm font-semibold text-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                Trình độ
              </label>
              <Select
                value={form.level || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}
              >
                <SelectTrigger className="border-border/50 focus:border-teal-500 focus:ring-teal-500/30 h-11">
                  <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Chọn trình độ" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((lv) => (
                    <SelectItem key={lv} value={lv}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-teal-600">{lv}</span>
                        <span className="text-xs text-muted-foreground">
                          {lv === 'A1' && '(Sơ cấp)'}
                          {lv === 'A2' && '(Sơ cấp nâng cao)'}
                          {lv === 'B1' && '(Trung cấp)'}
                          {lv === 'B2' && '(Trung cấp nâng cao)'}
                          {lv === 'C1' && '(Cao cấp)'}
                          {lv === 'C2' && '(Thành thạo)'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Mô tả mức độ tiếng Anh hiện tại của bạn</p>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-4"
            >
              <Button
                type="submit"
                disabled={saving}
                className="w-full h-12 bg-gradient-primary text-[#0F172A] font-semibold text-base shadow-lg hover:shadow-xl hover:brightness-[1.03] transition-all"
              >
                <Save className="mr-2 h-5 w-5" />
                {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSignOut}
                className="mt-3 w-full border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground"
              >
                Đăng xuất
              </Button>
            </motion.div>
          </form>

          {/* Info Alert */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-8 rounded-xl bg-teal-500/10 border border-teal-500/30 p-4"
          >
            <p className="text-sm text-teal-700 font-medium">💡 Mẹo:</p>
            <p className="mt-1 text-xs text-teal-600/80">
              Hồ sơ của bạn giúp MinLish cá nhân hóa bài học và gợi ý từ vựng phù hợp với mục tiêu của bạn.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
