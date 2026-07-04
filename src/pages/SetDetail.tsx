import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  BookOpen,
  ListChecks,
  Download,
  Edit,
  ChevronUp,
} from "lucide-react";
import ImportWords from "@/components/ImportWords";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VocabularyWord, createNewWord, VocabularySet } from "@/lib/types";
import {
  addVocabularyToSet,
  addWordsToSet,
  deleteVocabulary,
  exportVocabularySet,
  getSet,
  getSets,
  importVocabularies,
  saveSet,
  updateVocabulary,
} from "@/lib/api";
import { toast } from "sonner";

// Dedupe by word only (case-insensitive, trimmed) to block "Apple" vs "apple".
const normalizeKey = (word: string) => word.toLowerCase().trim();
const WORD_TYPES = [
  { value: "noun", label: "Danh từ" },
  { value: "verb", label: "Động từ" },
  { value: "adjective", label: "Tính từ" },
  { value: "adverb", label: "Trạng từ" },
  { value: "phrase", label: "Cụm từ" },
  { value: "idiom", label: "Thành ngữ" },
  { value: "collocation", label: "Collocation" },
  { value: "other", label: "Khác" },
];
const WORD_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function SetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [set, setSet] = useState<VocabularySet | null>(null);
  const [open, setOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(
    new Set(),
  );
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [createNewSetOpen, setCreateNewSetOpen] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetDescription, setNewSetDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [addToExistingOpen, setAddToExistingOpen] = useState(false);
  const [existingSets, setExistingSets] = useState<VocabularySet[]>([]);
  const [targetSetId, setTargetSetId] = useState("");
  const [isAddingToExisting, setIsAddingToExisting] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // State quản lý số lượng từ hiển thị (Lazy load)
  const [visibleCount, setVisibleCount] = useState(50);

  const [form, setForm] = useState({
    word: "",
    pronunciation: "",
    meaning: "",
    description: "",
    descriptionVi: "",
    example: "",
    exampleVi: "",
    collocation: "",
    relatedWords: "",
    note: "",
    type: "",
    level: "",
  });

  useEffect(() => {
    (async () => {
      if (!id) return;
      const s = await getSet(id);
      if (s) setSet(s);
      else navigate("/sets");
    })();
  }, [id, navigate]);

  useEffect(() => {
    let cancelled = false;
    void getSets()
      .then((sets) => {
        if (cancelled) return;
        const available = sets.filter((item) => String(item.id) !== String(id));
        setExistingSets(available);
        setTargetSetId((current) => {
          if (current && available.some((item) => String(item.id) === current)) {
            return current;
          }
          return available[0] ? String(available[0].id) : "";
        });
      })
      .catch(() => {
        if (!cancelled) {
          setExistingSets([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Reset số lượng hiển thị về 50 mỗi khi gõ tìm kiếm hoặc đổi bộ lọc
  useEffect(() => {
    setVisibleCount(50);
  }, [searchTerm, showSelectedOnly]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!set) return null;

  // Lọc toàn bộ từ vựng theo từ khóa
  const filteredWords = set.words.filter((w) => {
    if (showSelectedOnly && !selectedWordIds.has(w.id)) return false;
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;

    // Chỉ tìm kiếm chứa từ khóa trong trường 'word'
    return w.word.toLowerCase().includes(keyword);
  });

  // Cắt mảng để chỉ hiển thị số lượng nhất định (giúp chống lag)
  const visibleWords = filteredWords.slice(0, visibleCount);

  const selectedLearnLink =
    selectedWordIds.size > 0
      ? `/learn/${set.id}?ids=${encodeURIComponent(Array.from(selectedWordIds).join(","))}`
      : `/learn/${set.id}`;

  const resetForm = () => {
    setForm({
      word: "",
      pronunciation: "",
      meaning: "",
      description: "",
      descriptionVi: "",
      example: "",
      exampleVi: "",
      collocation: "",
      relatedWords: "",
      note: "",
      type: "",
      level: "",
    });
    setEditingWord(null);
  };

  const handleSave = async () => {
    if (!set) return;
    if (!form.word.trim() || !form.meaning.trim()) {
      toast.error('Vui lòng nhập "Từ" và "Nghĩa".');
      return;
    }

    const existingKeys = new Set(
      set.words
        .filter((w) => w.id !== editingWord?.id)
        .map((w) => normalizeKey(w.word)),
    );
    const key = normalizeKey(form.word);
    if (existingKeys.has(key)) {
      toast.error("Từ này đã có trong bộ từ vựng của bạn.");
      return;
    }

    const payload = {
      ...form,
      word: form.word.trim(),
      meaning: form.meaning.trim(),
    };

    if (editingWord) {
      await updateVocabulary(editingWord.id, payload);
      toast.success("Đã cập nhật từ vựng.");
    } else {
      const word = createNewWord(payload);
      await addVocabularyToSet(String(set.id), word);
      toast.success("Đã thêm từ vựng mới.");
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
      toast.success("Đã tải file CSV thành công");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Không thể export CSV";
      toast.error(msg);
    }
  };

  const handleCreateNewSetFromSelected = async () => {
    if (!set || selectedWordIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một từ");
      return;
    }

    if (!newSetName.trim()) {
      toast.error("Vui lòng nhập tên bộ từ mới");
      return;
    }

    setIsCreating(true);
    try {
      // 1. Tạo bộ từ mới
      const newSet = await saveSet({
        id: undefined,
        name: newSetName.trim(),
        description: newSetDescription.trim(),
        words: [],
        tags: [],
        createdAt: new Date(),
      });

      // 2. Add từ đã chọn vào bộ từ mới
      const wordIdsArray = Array.from(selectedWordIds);
      if (wordIdsArray.length > 0) {
        await addWordsToSet(String(newSet.id), wordIdsArray);
      }

      toast.success(
        `Đã tạo bộ từ mới "${newSetName}" với ${selectedWordIds.size} từ`,
      );
      setCreateNewSetOpen(false);
      setNewSetName("");
      setNewSetDescription("");
      setSelectedWordIds(new Set());

      // Redirect đến bộ từ mới
      navigate(`/sets/${newSet.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi tạo bộ từ mới";
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddSelectedToExistingSet = async () => {
    if (!set || selectedWordIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một từ");
      return;
    }

    if (!targetSetId) {
      toast.error("Vui lòng chọn bộ từ đích");
      return;
    }

    setIsAddingToExisting(true);
    try {
      await addWordsToSet(targetSetId, Array.from(selectedWordIds));
      const targetName = existingSets.find((item) => String(item.id) === targetSetId)?.name ?? "bộ từ đã chọn";
      toast.success(`Đã thêm ${selectedWordIds.size} từ vào "${targetName}"`);
      setAddToExistingOpen(false);
      setSelectedWordIds(new Set());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi thêm từ vào bộ từ đã có";
      toast.error(msg);
    } finally {
      setIsAddingToExisting(false);
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="border-primary/25 bg-primary/10 hover:bg-primary/20 hover:text-primary"
        >
          <Link to="/sets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {set.name}
          </h1>
          {set.description && (
            <p className="text-sm text-muted-foreground">{set.description}</p>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-3 flex-wrap">
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-[#0F172A]">
              <Plus className="mr-2 h-4 w-4" /> Thêm từ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingWord ? "Chỉnh sửa từ" : "Thêm từ mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Từ vựng *</p>
                <Input
                  placeholder="Ví dụ: apple"
                  value={form.word}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, word: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Phát âm</p>
                <Input
                  placeholder="Ví dụ:/ˈæp.əl/"
                  value={form.pronunciation}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pronunciation: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Nghĩa *</p>
                <Input
                  placeholder="Ví dụ:quả táo"
                  value={form.meaning}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, meaning: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Mô tả</p>
                <Textarea
                  placeholder="Ví dụ: A round fruit with red or green skin."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Mô tả tiếng Việt
                </p>
                <Textarea
                  placeholder="Ví dụ: Một loại trái cây tròn, có vỏ đỏ hoặc xanh."
                  value={form.descriptionVi}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, descriptionVi: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Ví dụ</p>
                <Textarea
                  placeholder="Ví dụ: I eat an apple every day."
                  value={form.example}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, example: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Ví dụ tiếng Việt
                </p>
                <Textarea
                  placeholder="Ví dụ: Tôi ăn một quả táo mỗi ngày."
                  value={form.exampleVi}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, exampleVi: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Cụm từ cố định
                </p>
                <Input
                  placeholder="Ví dụ: apple pie"
                  value={form.collocation}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, collocation: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Từ liên quan
                </p>
                <Input
                  placeholder="Ví dụ: fruit, banana, orange"
                  value={form.relatedWords}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, relatedWords: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Ghi chú</p>
                <Textarea
                  placeholder="Ví dụ: Common everyday word"
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Loại từ</p>
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, type: value }))
                    }
                  >
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
                  <p className="text-sm font-medium text-foreground">
                    Trình độ
                  </p>
                  <Select
                    value={form.level}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, level: value }))
                    }
                  >
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
              <Button
                onClick={handleSave}
                className="w-full bg-gradient-primary text-[#0F172A]"
              >
                {editingWord ? "Lưu thay đổi" : "Thêm từ"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <ImportWords onImport={handleImport} existingWords={set.words} />

        <Button
          variant="outline"
          className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground"
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>

        {selectedWordIds.size > 0 && (
          <div className="flex flex-wrap gap-2">
            <Dialog open={addToExistingOpen} onOpenChange={setAddToExistingOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" /> Thêm vào bộ từ có sẵn ({selectedWordIds.size})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    Thêm từ đã chọn vào bộ từ có sẵn
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Chọn bộ từ đích
                    </p>
                    <Select value={targetSetId} onValueChange={setTargetSetId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn một bộ từ" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingSets.length === 0 ? (
                          <SelectItem value="__empty" disabled>
                            Không có bộ từ phù hợp
                          </SelectItem>
                        ) : (
                          existingSets.map((item) => (
                            <SelectItem key={item.id} value={String(item.id)}>
                              {item.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sẽ thêm <strong>{selectedWordIds.size}</strong> từ từ bộ "{set.name}" vào bộ đã chọn.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddSelectedToExistingSet}
                      className="flex-1 bg-gradient-primary text-[#0F172A]"
                      disabled={isAddingToExisting || !targetSetId}
                    >
                      {isAddingToExisting ? "Đang thêm..." : "Thêm vào bộ từ"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAddToExistingOpen(false)}
                      disabled={isAddingToExisting}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={createNewSetOpen} onOpenChange={setCreateNewSetOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-[#0F172A]">
                  <Plus className="mr-2 h-4 w-4" /> Tạo bộ từ mới (
                  {selectedWordIds.size})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    Tạo bộ từ mới từ các từ đã chọn
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Tên bộ từ mới *
                    </p>
                    <Input
                      placeholder="Ví dụ: Từ phổ biến A1"
                      value={newSetName}
                      onChange={(e) => setNewSetName(e.target.value)}
                      disabled={isCreating}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Mô tả (tùy chọn)
                    </p>
                    <Textarea
                      placeholder="Ví dụ: Bộ từ phổ biến dành cho trình độ A1"
                      value={newSetDescription}
                      onChange={(e) => setNewSetDescription(e.target.value)}
                      disabled={isCreating}
                      rows={3}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sẽ tạo bộ từ mới với <strong>{selectedWordIds.size}</strong>{" "}
                    từ từ bộ "{set.name}"
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateNewSetFromSelected}
                      className="flex-1 bg-gradient-primary text-[#0F172A]"
                      disabled={isCreating || !newSetName.trim()}
                    >
                      {isCreating ? "Đang tạo..." : "Tạo bộ từ"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCreateNewSetOpen(false)}
                      disabled={isCreating}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {set.words.length > 0 && (
          <>
            <Button asChild className="bg-gradient-primary text-[#0F172A]">
              <Link to={selectedLearnLink}>
                <BookOpen className="mr-2 h-4 w-4" />{" "}
                {selectedWordIds.size > 0
                  ? `Học từ đã chọn (${selectedWordIds.size})`
                  : "Học (10 từ)"}
              </Link>
            </Button>
            {set.words.length >= 4 && (
              <Button
                asChild
                variant="outline"
                className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground"
              >
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
            placeholder="Tìm kiếm từ vựng..."
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAllFiltered}
            >
              Chọn tất cả kết quả tìm kiếm
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedWordIds(new Set())}
            >
              Bỏ chọn tất cả
            </Button>
            <Button
              type="button"
              variant={showSelectedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSelectedOnly((prev) => !prev)}
            >
              {showSelectedOnly
                ? "Đang lọc: chỉ từ đã chọn"
                : "Chỉ hiện từ đã chọn"}
            </Button>
            <span>Đã chọn: {selectedWordIds.size} từ</span>
            <span>Tổng số: {filteredWords.length} kết quả</span>
          </div>
        </div>
      )}

      {set.words.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16">
          <p className="text-muted-foreground">
            Chưa có từ nào. Thêm từ để bắt đầu!
          </p>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16">
          <p className="text-muted-foreground">
            Không tìm thấy từ phù hợp với từ khóa.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* SỬ DỤNG visibleWords thay vì filteredWords ĐỂ RENDER */}
          {visibleWords.map((w) => (
            <div
              key={w.id}
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
                    <span className="font-heading text-lg font-semibold text-foreground">
                      {w.word}
                    </span>
                    {w.pronunciation && (
                      <span className="text-sm text-muted-foreground">
                        {w.pronunciation}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-primary">{w.meaning}</p>
                  {(w.type || w.level) && (
                    <div className="mt-1 flex gap-2">
                      {w.type && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {w.type}
                        </span>
                      )}
                      {w.level && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {w.level}
                        </span>
                      )}
                    </div>
                  )}
                  {w.example && (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      "{w.example}"
                    </p>
                  )}
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
                      descriptionVi: w.descriptionVi || "",
                      example: w.example,
                      exampleVi: w.exampleVi || "",
                      collocation: w.collocation,
                      relatedWords: w.relatedWords,
                      note: w.note,
                      type: w.type || "",
                      level: w.level || "",
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
            </div>
          ))}

          {/* NÚT XEM THÊM (Chỉ hiện khi chưa load hết từ vựng) */}
          {visibleCount < filteredWords.length && (
            <div className="pt-4 pb-8 flex justify-center">
              <Button
                variant="outline"
                className="w-full md:w-auto border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => setVisibleCount((prev) => prev + 50)}
              >
                Tải thêm 50 từ (Đang xem {visibleCount}/{filteredWords.length})
              </Button>
            </div>
          )}
        </div>
      )}

      {showScrollTop && (
        <Button
          type="button"
          size="icon"
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full bg-gradient-primary text-[#0F172A] shadow-lg hover:scale-105"
          aria-label="Cuộn lên đầu trang"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
