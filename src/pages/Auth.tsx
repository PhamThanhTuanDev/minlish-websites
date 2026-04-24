import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, Lock, Mail, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getUserProfile, login, register } from '@/lib/api';
import { forgotPassword } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const REGISTER_GOALS = [
  { value: 'IELTS', label: 'IELTS' },
  { value: 'TOEIC', label: 'TOEIC' },
  { value: 'Communication', label: 'Giao tiếp' },
] as const;
const REGISTER_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/sets';
  const oauthReturnTo = sessionStorage.getItem('oauth_return_to') || '/sets';
  const finalRedirectTo = redirectTo === '/sets' ? oauthReturnTo : redirectTo;
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    learningGoal: '',
    level: '',
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot password dialog state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const backendBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    (window.location.hostname.includes('minlish.site')
      ? 'https://api.minlish.site'
      : 'http://localhost:8080');

  const persistAuth = (response: any) => {
    const token = response.accessToken || response.token || (response as any).accessToken;
    const userId = response.userId || (response as any).id;
    const displayName = response.fullName || response.name || response.username || '';
    if (!token) {
      throw new Error('Không lấy được token từ máy chủ');
    }
    localStorage.setItem('accessToken', token);
    localStorage.removeItem('authToken');
    localStorage.setItem('userId', userId || '');
    localStorage.setItem('email', response.email || '');
    localStorage.setItem('fullName', displayName || '');
  };

  const startBackendGoogleLogin = () => {
    sessionStorage.setItem('oauth_return_to', redirectTo);
    window.location.href = `${backendBaseUrl}/oauth2/authorization/google`;
  };

  useEffect(() => {
    const hashContent = location.hash?.startsWith('#')
      ? location.hash.substring(1)
      : location.hash;
    const params = new URLSearchParams(hashContent || location.search);
    const accessToken = params.get('accessToken');
    const userId = params.get('userId');
    const email = params.get('email');
    const fullName = params.get('fullName') || params.get('name') || '';
    const oauthError = params.get('error');

    if (oauthError) {
      toast.error('Đăng nhập Google thất bại, vui lòng thử lại.');
      navigate(location.pathname, { replace: true });
      return;
    }

    if (!accessToken) {
      return;
    }

    localStorage.setItem('accessToken', accessToken);
    localStorage.removeItem('authToken');
    localStorage.setItem('userId', userId || '');
    localStorage.setItem('email', email || '');
    localStorage.setItem('fullName', fullName || '');

    void (async () => {
      try {
        // Always hydrate profile from API to avoid stale/blank fields after OAuth callback.
        const profile = await getUserProfile();
        localStorage.setItem('userId', profile.userId || userId || '');
        localStorage.setItem('email', profile.email || email || '');
        localStorage.setItem('fullName', profile.fullName || fullName || '');
      } catch {
        // Keep fallback values from OAuth fragment when profile API is temporarily unavailable.
      } finally {
        sessionStorage.removeItem('oauth_return_to');
        toast.success('Đăng nhập Google thành công!');
        navigate(finalRedirectTo, { replace: true });
      }
    })();
  }, [location.hash, location.pathname, location.search, navigate, finalRedirectTo]);

  // Khi chuyển sang trang khác hoặc đăng nhập thành công, reset dialog và lỗi
  useEffect(() => {
    setShowForgot(false);
    setErrorMsg(null);
  }, [isLogin, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (isLogin) {
        const response = await login({ email: form.email, password: form.password });
        persistAuth(response);
        toast.success('Đăng nhập thành công!');
        navigate(finalRedirectTo, { replace: true });
      } else {
        if (!form.learningGoal?.trim() || !form.level?.trim()) {
          toast.error('Chọn mục tiêu học và trình độ');
          setLoading(false);
          return;
        }
        const response = await register({
          email: form.email,
          password: form.password,
          fullName: form.name,
          learningGoal: form.learningGoal,
          level: form.level,
        });
        persistAuth(response);
        toast.success('Đăng ký thành công!');
        navigate(finalRedirectTo, { replace: true });
      }
    } catch (err: any) {
      // Lấy message rõ ràng từ backend nếu có
      let msg = err?.message || 'Có lỗi xảy ra';
      if (msg.includes('Bad credentials')) msg = 'Sai tài khoản hoặc mật khẩu!';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_top_right,#AEE9E133,transparent_40%),radial-gradient(circle_at_20%_20%,#F6C35733,transparent_35%),linear-gradient(180deg,#f8fafb_0%,#eef8f8_100%)] px-4 py-8 md:px-6 md:py-12">
      <div className="pointer-events-none absolute -left-24 top-14 h-52 w-52 rounded-full bg-[#f6c35722] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-16 h-60 w-60 rounded-full bg-[#2ca6a433] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#d7e6e5] bg-white/90 shadow-[0_20px_70px_-35px_rgba(16,63,73,0.45)] backdrop-blur md:grid-cols-[1.05fr_1fr]"
      >
        <div className="relative hidden bg-gradient-to-br from-[#0f7f86] via-[#0d6f75] to-[#0b5d61] p-10 text-white md:block">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
            <Sparkles className="h-4 w-4" />
            MinLish Learning Lab
          </div>
          <h1 className="font-heading text-4xl font-bold leading-tight">
            Tăng tốc tiếng Anh mỗi ngày theo lộ trình riêng của bạn
          </h1>
          <p className="mt-4 text-sm text-white/85">
            Theo dõi tiến độ, ôn đúng nhịp và nhận nhắc học thông minh. Đăng nhập một lần để mọi dữ liệu học tập luôn đồng bộ.
          </p>
          <div className="mt-10 space-y-4 text-sm text-white/90">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/15 p-2"><BookOpen className="h-4 w-4" /></div>
              Flashcard + ôn tập theo lịch tự động
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/15 p-2"><GraduationCap className="h-4 w-4" /></div>
              Dashboard retention và streak trực quan
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 md:p-10">
          <div className="mb-6 md:hidden">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f7f86]">MinLish</p>
          </div>

          <div className="mb-5">
            <h2 className="font-heading text-2xl font-bold text-[#12343b]">
              {isLogin ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
            </h2>
            <p className="mt-1 text-sm text-[#5d7075]">
              {isLogin ? 'Tiếp tục hành trình học của bạn' : 'Chỉ mất 1 phút để bắt đầu'}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={startBackendGoogleLogin}
              className="h-12 w-full border border-[#d4e2e1] bg-white px-4 text-[#12343b] hover:bg-[#f5fbfa] hover:text-[#0f7f89] transition-all duration-200"
            >
              <span className="flex w-full items-center justify-center gap-3 text-[1rem] font-medium">
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png"
                  alt="Google"
                  className="h-5 w-5"
                  loading="lazy"
                />
                Tiếp tục với Google
              </span>
            </Button>
            <div className="relative py-1 text-center">
              <span className="absolute inset-x-0 top-1/2 block h-px bg-[#d9e7e6]" />
              <span className="relative bg-white px-3 text-xs uppercase tracking-[0.18em] text-[#7f9598]">hoặc</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tên hiển thị"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="h-11 border-[#d4e2e1] pl-10"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Mục tiêu học</p>
                    <Select
                      value={form.learningGoal || undefined}
                      onValueChange={(v) => setForm((f) => ({ ...f, learningGoal: v }))}
                    >
                      <SelectTrigger className="h-11 border-[#d4e2e1]">
                        <SelectValue placeholder="Chọn mục tiêu" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGISTER_GOALS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Trình độ</p>
                    <Select
                      value={form.level || undefined}
                      onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}
                    >
                      <SelectTrigger className="h-11 border-[#d4e2e1]">
                        <SelectValue placeholder="A1 → C2" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGISTER_LEVELS.map((lv) => (
                          <SelectItem key={lv} value={lv}>
                            {lv}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="h-11 border-[#d4e2e1] pl-10"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Mật khẩu"
                required
                minLength={6}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="h-11 border-[#d4e2e1] pl-10"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-[#0f7f86] text-white hover:bg-[#0d7076]"
            >
              {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </Button>
              {isLogin && (
                <div className="mt-2 text-right">
                  <Dialog open={showForgot} onOpenChange={setShowForgot}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-xs text-[#0f7f86] hover:underline">Quên mật khẩu?</button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Quên mật khẩu</DialogTitle>
                        <DialogDescription>Nhập email để nhận mật khẩu mới qua email.</DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setForgotLoading(true);
                          try {
                            await forgotPassword(forgotEmail);
                            toast.success('Đã gửi mật khẩu mới về email!');
                            setShowForgot(false);
                          } catch (err: any) {
                            toast.error(err.message || 'Không gửi được email');
                          } finally {
                            setForgotLoading(false);
                          }
                        }}
                        className="space-y-4"
                      >
                          <input
                            type="email"
                            required
                            placeholder="Nhập email của bạn"
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gradient-primary focus:border-gradient-primary px-4 text-base bg-white/95 shadow placeholder:text-gray-400 transition-all duration-200 outline-none focus:ring-2 focus:ring-green-100"
                            autoFocus
                          />
                        <DialogFooter>
                          <Button type="submit" disabled={forgotLoading} className="w-full bg-gradient-primary text-[#0F172A] font-semibold text-base shadow-lg text-base shadow-none border border-cyan-200 hover:shadow-xl hover:brightness-[1.03] transition-all">
                            {forgotLoading ? 'Đang gửi...' : 'Gửi mật khẩu mới'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
          </form>

          <p className="mt-5 text-center text-sm text-[#5d7075]">
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-[#0f7f86] hover:underline"
            >
              {isLogin ? 'Đăng ký ngay' : 'Quay lại đăng nhập'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
