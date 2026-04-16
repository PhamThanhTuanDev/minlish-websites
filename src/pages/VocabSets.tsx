import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Trash2, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { VocabularySet } from '@/lib/types';
import { DueReviewSet, LearningPlan, getDueReviewSets, getLearningPlan, getSets, saveSet, deleteSet, updateLearningPlan } from '@/lib/api';
import { toast } from 'sonner';

export default function VocabSets() {
  const [searchParams] = useSearchParams();
  const [sets, setSets] = useState<VocabularySet[]>([]);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [dueReviewSets, setDueReviewSets] = useState<DueReviewSet[]>([]);
  const activeMenu: 'sets' | 'plan' = searchParams.get('tab') === 'plan' ? 'plan' : 'sets';
  const [newWordsTarget, setNewWordsTarget] = useState('10');
  const [savingNewWordsPlan, setSavingNewWordsPlan] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<VocabularySet | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [apiSets, plan, dueSets] = await Promise.all([getSets(), getLearningPlan(), getDueReviewSets()]);
        if (!cancelled) {
          setSets(apiSets);
          setLearningPlan(plan);
          setDueReviewSets(dueSets);
          setNewWordsTarget(String(plan.newWordsPerDay));
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Không tải được dữ liệu mô-đun học tập';
          toast.error(message);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setEditingSet(null);
    setName('');
    setDesc('');
    setTags('');
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (setItem: VocabularySet) => {
    setEditingSet(setItem);
    setName(setItem.name);
    setDesc(setItem.description ?? '');
    setTags(setItem.tags?.join(', ') ?? '');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const payload: VocabularySet = {
      id: editingSet?.id ?? '',
      name: name.trim(),
      description: desc.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      words: editingSet?.words ?? [],
      createdAt: editingSet?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    await saveSet(payload);
    const apiSets = await getSets();
    setSets(apiSets);
    toast.success(editingSet ? 'Đã cập nhật bộ từ vựng.' : 'Đã tạo bộ từ vựng mới.');
    resetForm();
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteSet(id);
    const apiSets = await getSets();
    setSets(apiSets);
    toast.success('Đã xóa bộ từ vựng.');
  };

  const handleSaveNewWordsPlan = async () => {
    const newWordsValue = Number(newWordsTarget);
    if (!Number.isFinite(newWordsValue) || newWordsValue < 0 || !Number.isInteger(newWordsValue)) {
      toast.error('Mục tiêu từ mới/ngày phải là số nguyên từ 0 trở lên');
      return;
    }

    setSavingNewWordsPlan(true);
    try {
      const updated = await updateLearningPlan({
        newWordsPerDay: newWordsValue,
      });
      setLearningPlan(updated);
      setNewWordsTarget(String(updated.newWordsPerDay));
      toast.success('Đã cập nhật mục tiêu từ mới/ngày');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không lưu được mục tiêu từ mới';
      toast.error(message);
    } finally {
      setSavingNewWordsPlan(false);
    }
  };

  const learnedNewWordsToday = learningPlan?.todayNewWordsLearned ?? 0;
  const safeNewWordsTarget = learningPlan?.newWordsPerDay ?? 0;
  const newWordsProgress = safeNewWordsTarget > 0
    ? Math.min(100, Math.round((learnedNewWordsToday / safeNewWordsTarget) * 100))
    : 0;
  const reviewedWordsToday = learningPlan?.todayReviewWordsLearned ?? 0;
  const dueReviewWordsToday = learningPlan?.todayReviewWordsDue ?? 0;
  const totalReviewWordsToday = reviewedWordsToday + dueReviewWordsToday;
  const reviewWordsProgress = totalReviewWordsToday > 0
    ? Math.min(100, Math.round((reviewedWordsToday / totalReviewWordsToday) * 100))
    : 0;
  const sortedDueSets = [...dueReviewSets].sort((a, b) => b.totalDueWords - a.totalDueWords);

  const pageTitle = activeMenu === 'sets' ? 'Quản lý bộ từ vựng' : 'Kế hoạch học tập';
  const pageSubtitle = activeMenu === 'sets'
    ? 'Tạo, chỉnh sửa và bắt đầu học theo từng chủ đề'
    : 'Theo dõi từ mới, tiến độ ôn trong ngày và danh sách từ đến hạn';

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8 border-b border-border/70 pb-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">{pageTitle}</h1>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">{pageSubtitle}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {activeMenu === 'sets' ? `Tổng: ${sets.length} chủ đề` : `${dueReviewWordsToday} từ đến hạn hôm nay`}
              </span>
              <span className="text-xs text-muted-foreground/90">
                {activeMenu === 'sets' ? 'Chọn một chủ đề để học ngay' : 'Theo dõi tiến độ học mỗi ngày'}
              </span>
            </div>
          </div>

          {activeMenu === 'sets' && (
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (!v) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="h-11 bg-gradient-primary px-6 text-[#0F172A] shadow-sm" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Tạo mới
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    {editingSet ? 'Chỉnh sửa bộ từ vựng' : 'Tạo bộ từ vựng mới'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input placeholder="Tên bộ từ" value={name} onChange={e => setName(e.target.value)} />
                  <Textarea placeholder="Mô tả" value={desc} onChange={e => setDesc(e.target.value)} />
                  <Input placeholder="Tags (phân cách bằng dấu phẩy)" value={tags} onChange={e => setTags(e.target.value)} />
                  <Button onClick={handleSave} className="w-full bg-gradient-primary text-[#0F172A]">
                    {editingSet ? 'Lưu thay đổi' : 'Tạo bộ từ'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {activeMenu === 'plan' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-secondary p-4">
              <p className="mb-2 text-sm font-medium text-foreground">Mục tiêu từ mới/ngày</p>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} value={newWordsTarget} onChange={(e) => setNewWordsTarget(e.target.value)} />
                <Button
                  onClick={handleSaveNewWordsPlan}
                  disabled={savingNewWordsPlan}
                  className="bg-gradient-primary px-5 text-[#0F172A] whitespace-nowrap"
                >
                  {savingNewWordsPlan ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            </div>

            <div className="rounded-xl bg-secondary p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-foreground">Tiến độ từ mới hôm nay</p>
                <p className="text-sm text-muted-foreground">{learnedNewWordsToday}/{safeNewWordsTarget}</p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                <div className="h-full bg-primary" style={{ width: `${newWordsProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl bg-secondary p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-foreground">Tiến độ ôn tập hôm nay</p>
              <p className="text-sm text-muted-foreground">{reviewedWordsToday}/{totalReviewWordsToday}</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-background">
              <div className="h-full bg-success" style={{ width: `${reviewWordsProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Số từ vựng đến hạn ôn hôm nay: {dueReviewWordsToday} từ</p>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Danh sách từ vựng đến hạn ôn</h3>
            {sortedDueSets.length === 0 ? (
              <div className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
                Hôm nay chưa có từ nào đến hạn ôn.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedDueSets.map((set) => (
                  <div key={set.setId} className="rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/30 hover:shadow-elevated">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-heading text-base font-semibold text-foreground">{set.setName}</p>
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                        {set.totalDueWords} từ
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {set.words.slice(0, 8).map((word) => (
                        <span
                          key={`${set.setId}-${word.vocabularyId}`}
                          className="rounded-full border border-orange-300 bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700"
                        >
                          {word.word}
                          {(word.overdueDays ?? 0) > 0 ? ` (${word.overdueDays} ngày trễ)` : ''}
                        </span>
                      ))}
                      {set.totalDueWords > 8 && (
                        <span className="rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                          +{set.totalDueWords - 8} từ
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ưu tiên ôn trong hôm nay</span>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground">
                          <Link to={`/sets/${set.setId}`}>
                            <Eye className="mr-1 h-3 w-3" /> Chi tiết
                          </Link>
                        </Button>
                        <Button asChild size="sm" className="bg-gradient-primary text-[#0F172A]">
                          <Link to={`/learn/${set.setId}`}>
                            <BookOpen className="mr-2 h-4 w-4" /> Học
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeMenu === 'sets' && sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">Chưa có bộ từ nào</p>
          <p className="text-sm text-muted-foreground">Tạo bộ từ đầu tiên để bắt đầu học</p>
        </div>
      ) : activeMenu === 'sets' ? (
        <>
          <div className="mb-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">Danh sách chủ đề</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sets.map((set, i) => (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:border-primary/30 hover:shadow-elevated"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-semibold text-foreground">{set.name}</h3>
                    {set.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{set.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 border border-gray-300 hover:border-primary/60 hover:text-primary"
                      onClick={() => openEdit(set)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 border border-gray-300 text-muted-foreground hover:border-destructive/60 hover:text-destructive"
                      onClick={() => handleDelete(set.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {set.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {set.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{set.words.length} từ</span>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground">
                      <Link to={`/sets/${set.id}`}>
                        <Eye className="mr-1 h-3 w-3" /> Chi tiết
                      </Link>
                    </Button>
                    {set.words.length > 0 && (
                      <Button asChild size="sm" className="bg-gradient-primary text-[#0F172A]">
                        <Link to={`/learn/${set.id}`}>
                         <BookOpen className="mr-2 h-4 w-4" /> Học
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
