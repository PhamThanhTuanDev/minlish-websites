import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Volume2 } from 'lucide-react';
import { VocabularyWord, SRSRating } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface FlashcardProps {
  word: VocabularyWord;
  onRate: (rating: SRSRating) => void;
  current: number;
  total: number;
}

const ratingButtons: { rating: SRSRating; label: string; className: string }[] = [
  { rating: 'again', label: 'Lại', className: 'bg-destructive text-destructive-foreground hover:bg-destructive/90' },
  { rating: 'hard', label: 'Khó', className: 'bg-amber-500 text-white' },
  { rating: 'good', label: 'Tốt', className: 'bg-primary text-primary-foreground hover:bg-primary/90' },
  { rating: 'easy', label: 'Dễ', className: 'bg-success text-success-foreground hover:bg-success/90' },
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const renderHighlightedText = (text: string, term: string) => {
  const normalizedTerm = term.trim();

  if (!normalizedTerm) {
    return text;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(normalizedTerm)})`, 'ig'));
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <span key={`${part}-${index}`} className="font-semibold text-red-500">
        {part}
      </span>
    ) : (
      part
    ),
  );
};

const buildMeaningTerms = (meaning: string): string[] => {
  const raw = meaning
    .split(/[;,/]|\bor\b|\bhoặc\b/gi)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);

  // Ưu tiên cụm dài trước để giảm việc match bị cắt nhỏ.
  return Array.from(new Set(raw)).sort((a, b) => b.length - a.length);
};

const renderHighlightedByTerms = (text: string, terms: string[]) => {
  const normalizedTerms = terms.filter((term) => term.trim().length > 0);
  if (!text || normalizedTerms.length === 0) {
    return text;
  }

  const pattern = normalizedTerms.map((term) => escapeRegExp(term)).join('|');
  if (!pattern) {
    return text;
  }

  const parts = text.split(new RegExp(`(${pattern})`, 'ig'));
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <span key={`${part}-${index}`} className="font-semibold text-red-500">
        {part}
      </span>
    ) : (
      part
    ),
  );
};

export default function Flashcard({ word, onRate, current, total }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const meaningTerms = buildMeaningTerms(word.meaning || '');

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeakWord = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const text = word.word.trim();
    if (!text) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">
        {current} / {total}
      </p>

      <div
        className="perspective-1000 w-full max-w-2xl cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <motion.div
          className="relative h-[68vh] min-h-[430px] max-h-[620px] w-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-elevated md:p-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-xs">
              {word.type && <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">{word.type}</span>}
              {word.level && <span className="rounded-full bg-accent/15 px-2 py-1 font-medium text-amber-800">{word.level}</span>}
            </div>
            <p className="mb-2 max-w-full break-words text-sm text-muted-foreground">{word.pronunciation}</p>
            <div className="flex items-center gap-3">
              <h2 className="font-heading break-words text-center text-3xl font-bold text-foreground md:text-4xl">{word.word}</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Phat am ${word.word}`}
                className="h-9 w-9 rounded-full border border-primary/30 bg-primary/5 text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:border-primary/60 hover:bg-primary/15 hover:shadow-md hover:shadow-primary/20 focus-visible:ring-2 focus-visible:ring-primary/40"
                onClick={handleSpeakWord}
              >
                <Volume2 className={`h-5 w-5 transition-transform duration-200 ${isSpeaking ? 'animate-pulse' : 'hover:scale-110'}`} />
              </Button>
            </div>
            <div className="mt-5 flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
              <span>Nhấn để lật</span>
              <RotateCcw className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border border-border bg-card px-5 py-5 shadow-elevated md:px-10 md:py-8"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex-shrink-0 text-center">
                <h3 className="font-heading break-words text-3xl font-bold tracking-tight text-primary md:text-4xl">{word.meaning}</h3>
                {(word.type || word.level) && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
                    {word.type && <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">{word.type}</span>}
                    {word.level && <span className="rounded-full bg-accent/15 px-2 py-1 font-medium text-amber-800">{word.level}</span>}
                  </div>
                )}
              </div>

              <div className="mt-5 flex-1 overflow-y-auto pr-1 text-left">
                {word.example && (
                  <p className="text-sm italic leading-relaxed text-muted-foreground md:text-base">
                    <span className="font-semibold not-italic">Example:</span>{' '}
                    "{renderHighlightedText(word.example, word.word)}"
                  </p>
                )}
                {word.exampleVi && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                    <span className="font-semibold">Ví dụ VI:</span>{' '}
                    {renderHighlightedByTerms(word.exampleVi, meaningTerms)}
                  </p>
                )}
                {word.collocation && (
                  <p className="mt-3 text-sm text-muted-foreground md:text-base">
                    <span className="font-semibold">Collocation:</span> {word.collocation}
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-shrink-0 flex-col items-center gap-1.5 text-sm text-muted-foreground">
                <span>Nhấn để lật</span>
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {ratingButtons.map(({ rating, label, className }) => (
              <Button
                key={rating}
                className={className}
                onClick={(e) => {
                  e.stopPropagation();
                  setFlipped(false);
                  setTimeout(() => onRate(rating), 300);
                }}
              >
                {label}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
