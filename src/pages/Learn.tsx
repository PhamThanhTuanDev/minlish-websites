import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Flashcard from '@/components/Flashcard';
import { VocabularyWord, SRSRating } from '@/lib/types';
import { createStudySummaryNotification, getSet, getWordsForReview, rateVocabulary } from '@/lib/api';
import { pickStudyWords } from '@/lib/study-utils';
import { toast } from 'sonner';

export default function Learn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [setName, setSetName] = useState('');
  const [studyStartTime, setStudyStartTime] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setStudyStartTime(Date.now());
      const set = await getSet(id);
      if (!set) { navigate('/sets'); return; }
      setSetName(set.name);
      const reviewWords = await getWordsForReview(id);
      // Chọn tối đa số từ học chuẩn để UI ổn định và không tạo quá ít câu.
      setWords(pickStudyWords(reviewWords, set.words));
    })();
  }, [id, navigate]);

  const handleRate = async (rating: SRSRating) => {
    if (!id || words.length === 0) return;
    const word = words[currentIndex];
    try {
      await rateVocabulary({ vocabularyId: word.id, rating });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không lưu được tiến độ học';
      toast.error(msg);
      return;
    }

    const isGood = rating === 'good' || rating === 'easy';
    const nextCorrect = correct + (isGood ? 1 : 0);
    const nextTotal = total + 1;
    setCorrect(nextCorrect);
    setTotal(nextTotal);

    if (currentIndex + 1 >= words.length) {
      try {
        const elapsedSeconds = studyStartTime == null
          ? 60
          : Math.max(1, Math.ceil((Date.now() - studyStartTime) / 1000));
        await createStudySummaryNotification(nextCorrect, nextTotal, elapsedSeconds);
      } catch {
        /* vẫn kết thúc phiên dù thông báo lỗi */
      }
      setDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (words.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4">
        <Trophy className="mb-4 h-16 w-16 text-accent" />
        <h2 className="font-heading text-2xl font-bold text-foreground">Tuyệt vời!</h2>
        <p className="mt-2 text-muted-foreground">Không có từ nào cần ôn hôm nay</p>
        <Button asChild className="mt-6 bg-gradient-primary text-[#0F172A]">
          <Link to="/sets">Quay lại</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <PartyPopper className="mb-4 h-20 w-20 text-accent" />
        </motion.div>
        <h2 className="font-heading text-3xl font-bold text-foreground">Hoàn thành!</h2>
        <div className="mt-6 grid grid-cols-2 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-primary">{correct}/{total}</p>
            <p className="text-sm text-muted-foreground">Đúng</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-accent">{accuracy}%</p>
            <p className="text-sm text-muted-foreground">Chính xác</p>
          </div>
        </div>
        <div className="mt-8 flex gap-3">
          <Button asChild variant="outline"  className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground">
            <Link to={`/sets/${id}`}>Chi tiết bộ từ</Link>
          </Button>
          <Button asChild className="bg-gradient-primary text-[#0F172A]">
            <Link to="/dashboard">Xem tiến độ</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="border-primary/25 bg-primary/10 hover:bg-primary/20 hover:text-primary">
          <Link to={`/sets/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="font-heading text-xl font-bold text-foreground">{setName}</h1>
      </div>

      <Flashcard
        word={words[currentIndex]}
        onRate={handleRate}
        current={currentIndex + 1}
        total={words.length}
      />
    </div>
  );
}
