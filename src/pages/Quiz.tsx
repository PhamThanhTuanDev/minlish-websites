import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, PartyPopper, PenLine, ListChecks, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { VocabularyWord } from '@/lib/types';
import { createStudySummaryNotification, getSet, getWordsForReview, rateVocabulary } from '@/lib/api';
import { pickStudyWords, shuffleWords } from '@/lib/study-utils';
import { toast } from 'sonner';

type QuizMode = 'multiple-choice' | 'fill-blank';

interface QuizQuestion {
  word: VocabularyWord;
  options?: string[];
  correctAnswer: string;
}

function generateMCQuestions(words: VocabularyWord[]): QuizQuestion[] {
  return shuffleWords(words).map(word => {
    const others = words.filter(w => w.id !== word.id);
    const distractors = shuffleWords(others).slice(0, 3).map(w => w.meaning);
    const options = shuffleWords([word.meaning, ...distractors]);
    return { word, options, correctAnswer: word.meaning };
  });
}

function generateFillQuestions(words: VocabularyWord[]): QuizQuestion[] {
  return shuffleWords(words).map(word => ({
    word,
    correctAnswer: word.word.toLowerCase().trim(),
  }));
}

export default function Quiz() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [fillAnswer, setFillAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isHintSpeaking, setIsHintSpeaking] = useState(false);
  const [isWordSpeaking, setIsWordSpeaking] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [setName, setSetName] = useState('');
  const [allWords, setAllWords] = useState<VocabularyWord[]>([]);
  const lastScoreRef = useRef({ correct: 0, total: 0 });
  const summarySentRef = useRef(false);
  const quizStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const set = await getSet(id);
      if (!set || set.words.length < 4) { navigate('/sets'); return; }
      const reviewWords = await getWordsForReview(id);
      // Quiz cần một tập từ vừa đủ để trộn câu hỏi và tránh lặp lại quá ít.
      const quizWords = pickStudyWords(reviewWords, set.words);
      setSetName(set.name);
      setAllWords(quizWords);
    })();
  }, [id, navigate]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startQuiz = (m: QuizMode) => {
    setMode(m);
    quizStartTimeRef.current = Date.now();
    setQuestions(m === 'multiple-choice' ? generateMCQuestions(allWords) : generateFillQuestions(allWords));
    setCurrentIndex(0);
    setCorrect(0);
    setTotal(0);
    lastScoreRef.current = { correct: 0, total: 0 };
    summarySentRef.current = false;
    setDone(false);
    setAnswered(false);
  };

  const checkAnswer = async () => {
    if (answered) return;
    const q = questions[currentIndex];
    let isRight: boolean;
    if (mode === 'multiple-choice') {
      isRight = selected === q.correctAnswer;
    } else {
      isRight = fillAnswer.toLowerCase().trim() === q.correctAnswer;
    }
    setIsCorrect(isRight);
    setAnswered(true);
    const nextCorrect = correct + (isRight ? 1 : 0);
    const nextTotal = total + 1;
    setCorrect(nextCorrect);
    setTotal(nextTotal);
    lastScoreRef.current = { correct: nextCorrect, total: nextTotal };

    try {
      await rateVocabulary({ vocabularyId: q.word.id, rating: isRight ? 'good' : 'again' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không lưu được tiến độ học';
      toast.error(msg);
    }
  };

  const nextQuestion = async () => {
    if (done || summarySentRef.current) return;
    if (currentIndex + 1 >= questions.length) {
      summarySentRef.current = true;
      const { correct: c, total: t } = lastScoreRef.current;
      try {
        const elapsedSeconds = quizStartTimeRef.current == null
          ? 60
          : Math.max(1, Math.ceil((Date.now() - quizStartTimeRef.current) / 1000));
        await createStudySummaryNotification(c, t, elapsedSeconds);
      } catch {
        /* vẫn kết thúc quiz */
      }
      setDone(true);
    } else {
      setCurrentIndex(i => i + 1);
      setSelected('');
      setFillAnswer('');
      setAnswered(false);
    }
  };

  const handleSpeakHint = (example: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Trinh duyet khong ho tro doc van ban');
      return;
    }

    const text = example.trim();
    if (!text) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setIsHintSpeaking(false);
    utterance.onerror = () => setIsHintSpeaking(false);

    window.speechSynthesis.cancel();
    setIsHintSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeakWord = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Trinh duyet khong ho tro doc van ban');
      return;
    }

    const value = text.trim();
    if (!value) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setIsWordSpeaking(false);
    utterance.onerror = () => setIsWordSpeaking(false);

    window.speechSynthesis.cancel();
    setIsWordSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Mode selection screen
  if (!mode) {
    return (
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-8 flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="border-primary/25 bg-primary/10 hover:bg-primary/20 hover:text-primary">
            <Link to={`/sets/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="font-heading text-2xl font-bold text-foreground">Chọn chế độ Quiz</h1>
        </div>
        <p className="mb-8 text-muted-foreground">{setName} — {allWords.length} từ</p>
        <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => startQuiz('multiple-choice')}
            className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elevated"
          >
            <ListChecks className="h-12 w-12 text-primary" />
            <span className="font-heading text-lg font-bold text-foreground">Multiple Choice</span>
            <span className="text-sm text-muted-foreground">Chọn nghĩa đúng</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => startQuiz('fill-blank')}
            className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elevated"
          >
            <PenLine className="h-12 w-12 text-accent" />
            <span className="font-heading text-lg font-bold text-foreground">Fill in the Blank</span>
            <span className="text-sm text-muted-foreground">Nhập từ theo nghĩa</span>
          </motion.button>
        </div>
      </div>
    );
  }

  // Done screen
  if (done) {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <PartyPopper className="mb-4 h-20 w-20 text-accent" />
        </motion.div>
        <h2 className="font-heading text-3xl font-bold text-foreground">Hoàn thành Quiz!</h2>
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
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            variant="outline"
           className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground"
            onClick={() => { setMode(null); }}
          >
            Chọn chế độ khác
          </Button>
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

  const q = questions[currentIndex];
  const progress = ((currentIndex + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="outline" size="icon" className="border-primary/25 bg-primary/10 hover:bg-primary/20 hover:text-primary" onClick={() => setMode(null)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-heading text-xl font-bold text-foreground">
          {mode === 'multiple-choice' ? 'Multiple Choice' : 'Fill in the Blank'}
        </h1>
        <span className="ml-auto text-sm text-muted-foreground">{currentIndex + 1}/{questions.length}</span>
      </div>

      <Progress value={progress} className="mb-8" />

      <div className="mx-auto max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            {mode === 'multiple-choice' ? (
              <>
                <p className="mb-1 text-sm text-muted-foreground">Nghĩa của từ:</p>
                <div className="mb-6 flex items-center gap-2">
                  <h2 className="font-heading text-3xl font-bold text-foreground">{q.word.word}</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Doc tu ${q.word.word}`}
                    className="h-8 w-8 shrink-0 rounded-full border border-primary/30 bg-primary/5 text-primary transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:border-primary/60 hover:bg-primary/15 hover:shadow-md hover:shadow-primary/20"
                    onClick={() => handleSpeakWord(q.word.word)}
                  >
                    <Volume2 className={`h-4 w-4 ${isWordSpeaking ? 'animate-pulse' : ''}`} />
                  </Button>
                </div>
                {q.word.pronunciation && (
                  <p className="mb-4 text-sm text-muted-foreground">{q.word.pronunciation}</p>
                )}
                <RadioGroup value={selected} onValueChange={v => !answered && setSelected(v)} className="space-y-3">
                  {q.options!.map((opt, i) => {
                    let optClass = 'rounded-xl border border-border bg-background p-4 transition-all';
                    if (answered) {
                      if (opt === q.correctAnswer) optClass += ' border-primary bg-primary/10';
                      else if (opt === selected) optClass += ' border-destructive bg-destructive/10';
                    } else if (opt === selected) {
                      optClass += ' border-primary bg-primary/5';
                    }
                    return (
                      <Label key={i} className={`flex cursor-pointer items-center gap-3 ${optClass}`}>
                        <RadioGroupItem value={opt} disabled={answered} />
                        <span className="text-sm text-foreground">{opt}</span>
                        {answered && opt === q.correctAnswer && <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />}
                        {answered && opt === selected && opt !== q.correctAnswer && <XCircle className="ml-auto h-5 w-5 text-destructive" />}
                      </Label>
                    );
                  })}
                </RadioGroup>
              </>
            ) : (
              <>
                <p className="mb-1 text-sm text-muted-foreground">Nhập từ tiếng Anh có nghĩa:</p>
                <h2 className="mb-2 font-heading text-2xl font-bold text-primary">{q.word.meaning}</h2>
                {q.word.example && (
                  <div className="mb-4 flex items-start gap-2">
                    <p className="flex-1 text-sm italic text-muted-foreground">
                      Gợi ý: "{q.word.example.replace(new RegExp(q.word.word, 'gi'), '______')}"
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Doc cau goi y"
                      className="h-8 w-8 shrink-0 rounded-full border border-primary/30 bg-primary/5 text-primary transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:border-primary/60 hover:bg-primary/15 hover:shadow-md hover:shadow-primary/20"
                      onClick={() => handleSpeakHint(q.word.example)}
                    >
                      <Volume2 className={`h-4 w-4 ${isHintSpeaking ? 'animate-pulse' : ''}`} />
                    </Button>
                  </div>
                )}
                <Input
                  placeholder="Nhập từ..."
                  value={fillAnswer}
                  onChange={e => !answered && setFillAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !answered && fillAnswer.trim() && checkAnswer()}
                  disabled={answered}
                  className="mb-3 text-lg"
                />
                {answered && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className={`text-sm font-medium ${isCorrect ? 'text-primary' : 'text-destructive'}`}>
                      {isCorrect ? 'Chính xác!' : `Sai! Đáp án: ${q.word.word}`}
                    </span>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex justify-center gap-3">
          {!answered ? (
            <Button
              onClick={checkAnswer}
              disabled={mode === 'multiple-choice' ? !selected : !fillAnswer.trim()}
              className="bg-gradient-primary text-[#0F172A] px-8"
            >
              Kiểm tra
            </Button>
          ) : (
            <Button onClick={nextQuestion} className="bg-gradient-primary text-[#0F172A] px-8">
              {currentIndex + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
