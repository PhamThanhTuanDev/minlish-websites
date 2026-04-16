import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, BarChart3, Home, Bell, LogIn, LogOut, CircleUser, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getUnreadNotificationCount, getLearningPlan } from '@/lib/api';

const navItems = [
  { to: '/dashboard', label: 'Tiến độ', icon: BarChart3 },
  { to: '/profile', label: 'Hồ sơ', icon: CircleUser },
  { to: '/notifications', label: 'Thông báo', icon: Bell },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, loading, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dueReviewCount, setDueReviewCount] = useState(0);
  const hasBackendToken = !!(localStorage.getItem('accessToken') || localStorage.getItem('authToken'));
  const showAccountActions = !!(user || hasBackendToken);
  const storedDisplayName =
    localStorage.getItem('fullName') ||
    localStorage.getItem('name') ||
    localStorage.getItem('username') ||
    '';
  const userDisplayName = (user?.fullName || storedDisplayName || 'bạn').trim();

  useEffect(() => {
    let cancelled = false;

    const refreshUnread = async () => {
      if (loading) {
        return;
      }

      if (!showAccountActions) {
        setUnreadCount(0);
        return;
      }
      try {
        const unreadCount = await getUnreadNotificationCount();
        if (!cancelled) {
          setUnreadCount(unreadCount);
        }
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    };

    const refreshDueReview = async () => {
      if (!showAccountActions) {
        setDueReviewCount(0);
        return;
      }
      try {
        const plan = await getLearningPlan();
        if (!cancelled) {
          setDueReviewCount(plan.todayReviewWordsDue || 0);
        }
      } catch {
        if (!cancelled) {
          setDueReviewCount(0);
        }
      }
    };

    const onUpdated = () => {
      void refreshUnread();
    };
    const onReviewUpdated = () => {
      void refreshDueReview();
    };

    void refreshUnread();
    void refreshDueReview();
    window.addEventListener('notifications:updated', onUpdated);
    window.addEventListener('review:updated', onReviewUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('notifications:updated', onUpdated);
      window.removeEventListener('review:updated', onReviewUpdated);
    };
  }, [showAccountActions, pathname, loading]);

  const handleSignOut = async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('fullName');
    localStorage.removeItem('name');
    localStorage.removeItem('username');
    await signOut();
    window.location.assign('/auth');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 px-4 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src="/logo_minlish.png"
            alt="MinLish"
            className="block h-11 w-auto object-contain transition-opacity duration-200 hover:opacity-95"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              pathname === '/'
                ? 'bg-primary/14 text-primary shadow-sm ring-1 ring-primary/20'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary hover:shadow-sm'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Trang chủ</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  pathname.startsWith('/sets')
                    ? 'bg-primary/14 text-primary shadow-sm ring-1 ring-primary/20'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary hover:shadow-sm'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span className="flex items-center gap-1">
                  Học tập
                  {dueReviewCount > 0 && (
                    <span className="ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-xs font-semibold leading-none text-destructive-foreground">
                      {dueReviewCount > 99 ? '99+' : dueReviewCount}
                    </span>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild className="hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary data-[highlighted]:bg-primary/20 data-[highlighted]:text-primary">
                <Link className="block w-full" to="/sets?tab=sets">Bộ từ vựng</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary data-[highlighted]:bg-primary/20 data-[highlighted]:text-primary relative">
                <Link className="block w-full pr-8" to="/sets?tab=plan">
                  Kế hoạch học tập
                  {dueReviewCount > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 py-0.5 text-[11px] font-semibold leading-none text-destructive-foreground border border-white shadow">
                      {dueReviewCount > 99 ? '99+' : dueReviewCount}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                pathname === to
                  ? 'bg-primary/14 text-primary shadow-sm ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary hover:shadow-sm'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {label === 'Thông báo' && unreadCount > 0 && (
                <span className="ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-xs font-semibold leading-none text-destructive-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex">
          {showAccountActions ? (
            <div className="flex items-center gap-3">
              <span className="max-w-[180px] truncate text-sm font-medium text-foreground/80" title={userDisplayName}>
                Xin chào, {userDisplayName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline" size="sm" className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground">
              <Link to="/auth"><LogIn className="mr-2 h-4 w-4" /> Đăng nhập</Link>
            </Button>
          )}
        </div>

        {/* Mobile nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card md:hidden">
          {[{ to: '/', label: 'Trang chủ', icon: Home }, { to: '/sets?tab=sets', label: 'Học', icon: BookOpen }, ...navItems].map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                (label === 'Học' ? pathname.startsWith('/sets') : pathname === to) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
              {label === 'Thông báo' && unreadCount > 0 && (
                <span className="absolute right-4 top-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {label === 'Học' && dueReviewCount > 0 && (
                <span className="absolute right-4 top-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground">
                  {dueReviewCount > 99 ? '99+' : dueReviewCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
