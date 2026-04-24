import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, BookOpen, ListChecks, Download, Edit } from 'lucide-react';
import ImportWords from '@/components/ImportWords';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VocabularyWord, createNewWord, VocabularySet } from '@/lib/types';
import { addVocabularyToSet, deleteVocabulary, exportVocabularySet, getSet, importVocabularies, updateVocabulary } from '@/lib/api';
import { toast } from 'sonner';

// Dedupe by word only (case-insensitive, trimmed) to block "Apple" vs "apple".
const normalizeKey = (word: string) => word.toLowerCase().trim();
const WORD_TYPES = [
  { value: 'noun', label: 'Danh từ' },
  { value: 'verb', label: 'Động từ' },
  { value: 'adjective', label: 'Tính từ' },
  { value: 'adverb', label: 'Trạng từ' },
  { value: 'phrase', label: 'Cụm từ' },
  { value: 'idiom', label: 'Thành ngữ' },
  { value: 'collocation', label: 'Collocation' },
  { value: 'other', label: 'Khác' },
];
const WORD_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function SetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [set, setSet] = useState<VocabularySet | null>(null);
  const [open, setOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [form, setForm] = useState({
    word: '', pronunciation: '', meaning: '', description: '',
    descriptionVi: '',
    example: '', exampleVi: '', collocation: '', relatedWords: '', note: '', type: '', level: '',
  });

  useEffect(() => {
    (async () => {
      if (!id) return;
      const s = await getSet(id);
      if (s) setSet(s);
      else navigate('/sets');
    })();
  }, [id, navigate]);

  if (!set) return null;

  const filteredWords = set.words.filter((w) => {
    if (showSelectedOnly && !selectedWordIds.has(w.id)) return false;
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    return [w.word, w.meaning, w.pronunciation, w.example, w.description, w.type, w.level]
      .join(' ')
      .toLowerCase()
      .includes(keyword);
  });

  const selectedLearnLink = selectedWordIds.size > 0
    ? `/learn/${set.id}?ids=${encodeURIComponent(Array.from(selectedWordIds).join(','))}`
    : `/learn/${set.id}`;

  const resetForm = () => {
    setForm({ word: '', pronunciation: '', meaning: '', description: '', descriptionVi: '', example: '', exampleVi: '', collocation: '', relatedWords: '', note: '', type: '', level: '' });
    setEditingWord(null);
  };

  const handleSave = async () => {
    if (!set) return;
    if (!form.word.trim() || !form.meaning.trim()) {
      toast.error('Vui lòng nhập "Từ" và "Nghĩa".');
      return;
    }

    const existingKeys = new Set(set.words.filter(w => w.id !== editingWord?.id).map(w => normalizeKey(w.word)));
    const key = normalizeKey(form.word);
    if (existingKeys.has(key)) {
      toast.error('Từ này đã có trong bộ từ vựng của bạn.');
      return;
    }

    const payload = {
      ...form,
      word: form.word.trim(),
      meaning: form.meaning.trim(),
    };

    if (editingWord) {
      await updateVocabulary(editingWord.id, payload);
      toast.success('Đã cập nhật từ vựng.');
    } else {
      const word = createNewWord(payload);
      await addVocabularyToSet(String(set.id), word);
      toast.success('Đã thêm từ vựng mới.');
    }

    const refreshed = await getSet(String(set.id));
    if (refreshed) setSet(refreshed);
    resetForm();
    setOpen(false);
  };

  const handleRemove = async (wordId: string) => {
    if (!set) return;
    await deleteVocabulary(wordId);
    const refreshed = await getSet(String(set.id));
    if (refreshed) {
      setSet(refreshed);
      setSelectedWordIds((prev) => {
        const next = new Set(prev);
        next.delete(wordId);
        return next;
      });
    }
  };

  const handleImport = async (words: VocabularyWord[]) => {
    if (!set) return;
    const updated = await importVocabularies(String(set.id), words);
    setSet(updated);
  };

  const toggleSelectWord = (wordId: string, checked: boolean) => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(wordId);
      else next.delete(wordId);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      filteredWords.forEach((w) => next.add(w.id));
      return next;
    });
  };

  const handleExport = async () => {
    if (!set) return;
    try {
      await exportVocabularySet(String(set.id));
      toast.success('Đã tải file CSV thành công');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không thể export CSV';
      toast.error(msg);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="border-primary/25 bg-primary/10 hover:bg-primary/20 hover:text-primary">
          <Link to="/sets"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{set.name}</h1>
          {set.description && <p className="text-sm text-muted-foreground">{set.description}</p>}
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-[#0F172A]">
              <Plus className="mr-2 h-4 w-4" /> Thêm từ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">{editingWord ? 'Chỉnh sửa từ' : 'Thêm từ mới'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Từ vựng *</p>
                <Input placeholder="Ví dụ: apple" value={form.word} onChange={e => setForm(f => ({ ...f, word: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Phát âm</p>
                <Input placeholder="Ví dụ:/ˈæp.əl/" value={form.pronunciation} onChange={e => setForm(f => ({ ...f, pronunciation: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Nghĩa *</p>
                <Input placeholder="Ví dụ:quả táo" value={form.meaning} onChange={e => setForm(f => ({ ...f, meaning: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Mô tả</p>
                <Textarea placeholder="Ví dụ: A round fruit with red or green skin." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Mô tả tiếng Việt</p>
                <Textarea placeholder="Ví dụ: Một loại trái cây tròn, có vỏ đỏ hoặc xanh." value={form.descriptionVi} onChange={e => setForm(f => ({ ...f, descriptionVi: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Ví dụ</p>
                <Textarea placeholder="Ví dụ: I eat an apple every day." value={form.example} onChange={e => setForm(f => ({ ...f, example: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Ví dụ tiếng Việt</p>
                <Textarea placeholder="Ví dụ: Tôi ăn một quả táo mỗi ngày." value={form.exampleVi} onChange={e => setForm(f => ({ ...f, exampleVi: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Cụm từ cố định</p>
                <Input placeholder="Ví dụ: apple pie" value={form.collocation} onChange={e => setForm(f => ({ ...f, collocation: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Từ liên quan</p>
                <Input placeholder="Ví dụ: fruit, banana, orange" value={form.relatedWords} onChange={e => setForm(f => ({ ...f, relatedWords: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Ghi chú</p>
                <Textarea placeholder="Ví dụ: Common everyday word" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Loại từ</p>
                  <Select value={form.type} onValueChange={(value) => setForm(f => ({ ...f, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại từ" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORD_TYPES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Trình độ</p>
                  <Select value={form.level} onValueChange={(value) => setForm(f => ({ ...f, level: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn level" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORD_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full bg-gradient-primary text-[#0F172A]">{editingWord ? 'Lưu thay đổi' : 'Thêm từ'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <ImportWords onImport={handleImport} existingWords={set.words} />

        <Button variant="outline" className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>

        {set.words.length > 0 && (
          <>
            <Button asChild className="bg-gradient-primary text-[#0F172A]">
              <Link to={selectedLearnLink}>
                <BookOpen className="mr-2 h-4 w-4" /> {selectedWordIds.size > 0 ? `Học từ đã chọn (${selectedWordIds.size})` : 'Học (10 từ)'}
              </Link>
            </Button>
            {set.words.length >= 4 && (
              <Button asChild variant="outline" className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground">
                <Link to={`/quiz/${set.id}`}>
                  <ListChecks className="mr-2 h-4 w-4" /> Quiz
                </Link>
              </Button>
            )}
          </>
        )}
      </div>

      {set.words.length > 0 && (
        <div className="mb-4 space-y-3">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo từ, nghĩa, ví dụ, loại từ, level..."
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Button type="button" variant="outline" size="sm" onClick={selectAllFiltered}>
              Chọn tất cả đang hiển thị
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedWordIds(new Set())}>
              Bỏ chọn tất cả
            </Button>
            <Button
              type="button"
              variant={showSelectedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowSelectedOnly((prev) => !prev)}
            >
              {showSelectedOnly ? 'Đang lọc: chỉ từ đã chọn' : 'Chỉ hiện từ đã chọn'}
            </Button>
            <span>Đã chọn: {selectedWordIds.size} từ</span>
            <span>Đang hiển thị: {filteredWords.length}/{set.words.length}</span>
          </div>
        </div>
      )}

      {set.words.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16">
          <p className="text-muted-foreground">Chưa có từ nào. Thêm từ để bắt đầu!</p>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16">
          <p className="text-muted-foreground">Không tìm thấy từ phù hợp với từ khóa.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWords.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-elevated"
            >
              <div className="flex flex-1 gap-3">
                <label className="mt-1 flex items-start">
                  <input
                    type="checkbox"
                    checked={selectedWordIds.has(w.id)}
                    onChange={(e) => toggleSelectWord(w.id, e.target.checked)}
                    aria-label={`Chọn từ ${w.word}`}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>
                <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-heading text-lg font-semibold text-foreground">{w.word}</span>
                  {w.pronunciation && <span className="text-sm text-muted-foreground">{w.pronunciation}</span>}
                </div>
                <p className="text-sm text-primary">{w.meaning}</p>
                {(w.type || w.level) && (
                  <div className="mt-1 flex gap-2">
                    {w.type && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{w.type}</span>}
                    {w.level && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{w.level}</span>}
                  </div>
                )}
                {w.example && <p className="mt-1 text-xs italic text-muted-foreground">"{w.example}"</p>}
                </div>
              </div>
              <div className="flex gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground border border-gray-300 hover:border-primary/60 hover:text-primary"
                  onClick={() => {
                    setEditingWord(w);
                    setForm({
                      word: w.word,
                      pronunciation: w.pronunciation,
                      meaning: w.meaning,
                      description: w.description,
                      descriptionVi: w.descriptionVi || '',
                      example: w.example,
                      exampleVi: w.exampleVi || '',
                      collocation: w.collocation,
                      relatedWords: w.relatedWords,
                      note: w.note,
                      type: w.type || '',
                      level: w.level || '',
                    });
                    setOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground border border-gray-300 hover:border-destructive/60 hover:text-destructive"
                  onClick={() => handleRemove(w.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
