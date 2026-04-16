import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Clock, Repeat2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  getRecentNotifications,
  markNotificationAsRead,
  Notification,
  getNotificationPreferences,
  updateNotificationPreferences,
  NotificationPreferences,
} from '@/lib/api';
import { toast } from 'sonner';

export default function NotificationSettings() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Preferences state
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enableDailyReminder: true,
    enableReviewReminder: true,
    enableEmailNotification: true,
    reminderTime: '08:00',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [noti, prefs] = await Promise.all([
          getRecentNotifications(),
          getNotificationPreferences(),
        ]);
        setItems(noti);
        setPreferences(prefs);
        window.dispatchEvent(new Event('notifications:updated'));
      } catch (e: any) {
        toast.error(e?.message || 'Không tải được dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      window.dispatchEvent(new Event('notifications:updated'));
      toast.success('Đã đánh dấu đã đọc');
    } catch (e: any) {
      toast.error(e?.message || 'Không thể cập nhật thông báo');
    }
  };

  const handleMarkAllRead = async () => {
    if (items.length === 0) return;
    try {
      const unread = items.filter((n) => !n.isRead);
      await Promise.all(unread.map((n) => markNotificationAsRead(n.id)));
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('notifications:updated'));
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (e: any) {
      toast.error(e?.message || 'Không thể cập nhật thông báo');
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      const updated = await updateNotificationPreferences(preferences);
      setPreferences(updated);
      toast.success('Cài đặt thông báo đã được lưu thành công');
    } catch (e: any) {
      toast.error(e?.message || 'Không thể lưu cài đặt');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
  };

  if (loading) return null;

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Settings Section */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 space-y-4"
      >
        <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">Cài đặt thông báo</h2>
        <p className="text-sm text-muted-foreground">Nhắc học mỗi ngày, từ đến hạn ôn, email và giờ nhắc học</p>

        {/* Settings Card */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/90 p-6 shadow-lg space-y-1 divide-y divide-border/50">
          {/* Daily Reminder Toggle */}
          <motion.div 
            className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors rounded-lg"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-500/15 p-3 mt-0.5">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Nhắc học mỗi ngày</p>
                <p className="text-xs text-muted-foreground">Nhận email nhắc học bài hằng ngày</p>
              </div>
            </div>
            <Switch
              checked={preferences.enableDailyReminder}
              onCheckedChange={(checked) => handlePreferenceChange('enableDailyReminder', checked)}
            />
          </motion.div>

          {/* Review Reminder Toggle */}
          <motion.div 
            className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors rounded-lg"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-purple-500/15 p-3 mt-0.5">
                <Repeat2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Nhắc từ đến hạn ôn</p>
                <p className="text-xs text-muted-foreground">Thông báo khi có từ cần ôn lại</p>
              </div>
            </div>
            <Switch
              checked={preferences.enableReviewReminder}
              onCheckedChange={(checked) => handlePreferenceChange('enableReviewReminder', checked)}
            />
          </motion.div>

          {/* Email Notification Toggle */}
          <motion.div 
            className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors rounded-lg"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-orange-500/15 p-3 mt-0.5">
                <Mail className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Email</p>
                <p className="text-xs text-muted-foreground">Bật/tắt cả email thông báo</p>
              </div>
            </div>
            <Switch
              checked={preferences.enableEmailNotification}
              onCheckedChange={(checked) => handlePreferenceChange('enableEmailNotification', checked)}
            />
          </motion.div>

          {/* Reminder Time Setting */}
          <motion.div 
            className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors rounded-lg"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-teal-500/15 p-3 mt-0.5">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Giờ nhắc học</p>
                <p className="text-xs text-muted-foreground">Chọn thời gian gửi nhắc học</p>
              </div>
            </div>
            <input
              type="time"
              value={preferences.reminderTime}
              onChange={(e) => handlePreferenceChange('reminderTime', e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </motion.div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-muted-foreground">
              Nhấn nút lưu để áp dụng những thay đổi
            </p>
            <Button
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="bg-gradient-primary text-[#0F172A] hover:from-teal-700 hover:to-teal-800 font-medium"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Notifications List Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Thông báo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Nhắc học hàng ngày, từ đến hạn ôn, tóm tắt phiên học, thành tích học trong ngày, hoàn thành mục tiêu học ngày hôm nay,chuỗi ngày học liên tiếp</p>
          </div>
          <Button
            variant="outline"
            className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground"
            onClick={handleMarkAllRead}
            disabled={!items.some((n) => !n.isRead)}
          
          >
            <CheckCheck className="mr-2 h-4 w-4" /> Đánh dấu tất cả
          </Button>
        </div>

      {items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-border bg-gradient-to-br from-muted/30 to-muted/10 p-12 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Chưa có thông báo nào</p>
          <p className="text-xs text-muted-foreground mt-1">Thông báo của bạn sẽ hiển thị ở đây</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {items
            .slice()
            .sort((a, b) => Number(a.isRead) - Number(b.isRead))
            .map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border border-border bg-gradient-to-r from-card to-card/95 p-5 shadow-sm hover:shadow-md transition-all ${
                item.isRead ? 'opacity-70' : 'border-primary/30 bg-gradient-to-r from-primary/5 to-card'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`font-semibold ${item.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {item.title}
                    </p>
                    {!item.isRead && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="rounded-full bg-teal-500 text-white px-2 py-0.5 text-xs font-semibold"
                      >
                        Mới
                      </motion.span>
                    )}
                  </div>
                  <p className={`mt-2 text-sm ${item.isRead ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                    {item.content}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground/60">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant={item.isRead ? 'outline' : 'default'}
                  disabled={item.isRead} 
                  onClick={() => handleMarkRead(item.id)}
                  className={
                    item.isRead
                      ? ''
                      : 'bg-gradient-primary text-[#0F172A] hover:brightness-95 hover:saturate-125 active:brightness-90'
                  }
                >
                  {item.isRead ? '✓' : 'Đã đọc'}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      </motion.div>
    </div>
  );
}
