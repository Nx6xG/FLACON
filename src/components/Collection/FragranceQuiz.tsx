import { useState } from 'react';
import { Modal, Button } from '@/components/common';
import { useImageFetch } from '@/hooks/useImageFetch';
import type { Fragrance, Season } from '@/lib/types';
import { Sparkles, Droplets, RotateCcw } from 'lucide-react';

function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Frühling';
  if (month >= 5 && month <= 7) return 'Sommer';
  if (month >= 8 && month <= 10) return 'Herbst';
  return 'Winter';
}

interface Question {
  id: string;
  text: string;
  options: { label: string; value: string; emoji: string }[];
}

const questions: Question[] = [
  {
    id: 'mood',
    text: 'Wie fühlst du dich heute?',
    options: [
      { label: 'Selbstbewusst', value: 'confident', emoji: '💪' },
      { label: 'Entspannt', value: 'relaxed', emoji: '😌' },
      { label: 'Romantisch', value: 'romantic', emoji: '💕' },
      { label: 'Energiegeladen', value: 'energetic', emoji: '⚡' },
    ],
  },
  {
    id: 'occasion',
    text: 'Was steht heute an?',
    options: [
      { label: 'Arbeit / Meeting', value: 'office', emoji: '💼' },
      { label: 'Date / Abend', value: 'date', emoji: '🌙' },
      { label: 'Freizeit / Casual', value: 'casual', emoji: '☀️' },
      { label: 'Party / Event', value: 'party', emoji: '🎉' },
    ],
  },
  {
    id: 'intensity',
    text: 'Wie auffällig soll der Duft sein?',
    options: [
      { label: 'Dezent & nah', value: 'light', emoji: '🤫' },
      { label: 'Moderat', value: 'medium', emoji: '👌' },
      { label: 'Auffällig & laut', value: 'loud', emoji: '📢' },
    ],
  },
  {
    id: 'vibe',
    text: 'Welche Richtung?',
    options: [
      { label: 'Frisch & Clean', value: 'fresh', emoji: '🌊' },
      { label: 'Warm & Würzig', value: 'warm', emoji: '🔥' },
      { label: 'Süß & Gourmand', value: 'sweet', emoji: '🍫' },
      { label: 'Überrasch mich', value: 'any', emoji: '🎲' },
    ],
  },
];

function scoreFragrance(f: Fragrance, answers: Record<string, string>): number {
  let score = 0;
  const season = getCurrentSeason();

  // Season match
  if (f.season?.includes(season) || f.season?.includes('Ganzjährig')) score += 2;

  // Mood → rating categories
  switch (answers.mood) {
    case 'confident':
      score += (f.rating?.sillage || 0) * 0.3 + (f.rating?.compliments || 0) * 0.3;
      break;
    case 'relaxed':
      score += (f.rating?.versatility || 0) * 0.3 + (f.rating?.value || 0) * 0.2;
      break;
    case 'romantic':
      score += (f.rating?.compliments || 0) * 0.4 + (f.rating?.uniqueness || 0) * 0.2;
      break;
    case 'energetic':
      score += (f.rating?.sillage || 0) * 0.2 + (f.rating?.versatility || 0) * 0.3;
      if (['Fresh', 'Citrus', 'Aquatic'].includes(f.family)) score += 2;
      break;
  }

  // Occasion → occasion tags + family
  const occasions = f.occasions || [];
  switch (answers.occasion) {
    case 'office':
      if (occasions.includes('Office')) score += 3;
      if (['Fresh', 'Aquatic', 'Aromatic'].includes(f.family)) score += 1.5;
      score += (f.rating?.versatility || 0) * 0.2;
      break;
    case 'date':
      if (occasions.includes('Date Night')) score += 3;
      if (['Oriental', 'Gourmand', 'Floral'].includes(f.family)) score += 1.5;
      score += (f.rating?.compliments || 0) * 0.3;
      break;
    case 'casual':
      if (occasions.includes('Alltag') || occasions.includes('Sport')) score += 3;
      if (['Fresh', 'Citrus', 'Aquatic'].includes(f.family)) score += 1.5;
      break;
    case 'party':
      if (occasions.includes('Party')) score += 3;
      if (['Oriental', 'Oud', 'Leather'].includes(f.family)) score += 1.5;
      score += (f.rating?.sillage || 0) * 0.3;
      break;
  }

  // Intensity → sillage + concentration
  switch (answers.intensity) {
    case 'light':
      if (['EdC', 'Cologne'].includes(f.concentration)) score += 2;
      if ((f.rating?.sillage || 5) <= 4) score += 1.5;
      break;
    case 'medium':
      if (['EdT', 'EdP'].includes(f.concentration)) score += 1.5;
      break;
    case 'loud':
      if (['Parfum', 'EdP'].includes(f.concentration)) score += 2;
      if ((f.rating?.sillage || 0) >= 7) score += 2;
      break;
  }

  // Vibe → family
  switch (answers.vibe) {
    case 'fresh':
      if (['Fresh', 'Citrus', 'Aquatic', 'Aromatic'].includes(f.family)) score += 3;
      break;
    case 'warm':
      if (['Oriental', 'Woody', 'Leather', 'Oud', 'Fougère'].includes(f.family)) score += 3;
      break;
    case 'sweet':
      if (['Gourmand', 'Oriental', 'Floral'].includes(f.family)) score += 3;
      break;
    case 'any':
      score += Math.random() * 3;
      break;
  }

  // Bonus for higher rated
  score += (f.rating?.overall || 0) * 0.2;

  // Bonus for higher fill (use what you have)
  score += (f.fill_level / 100) * 1;

  return score;
}

function ResultImage({ fragrance }: { fragrance: Fragrance }) {
  const { resolvedUrl } = useImageFetch(fragrance.name, fragrance.brand, fragrance.image_url, fragrance.id);
  return resolvedUrl ? (
    <img src={resolvedUrl} alt={fragrance.name} className="w-full h-full object-cover" />
  ) : (
    <Droplets size={32} className="text-txt-muted" />
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  collection: Fragrance[];
  onSelect: (f: Fragrance) => void;
}

export function FragranceQuiz({ open, onClose, collection, onSelect }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Fragrance | null>(null);

  const reset = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate result
      const scored = collection
        .map((f) => ({ fragrance: f, score: scoreFragrance(f, newAnswers) }))
        .sort((a, b) => b.score - a.score);
      setResult(scored[0]?.fragrance || null);
      setStep(questions.length);
    }
  };

  const currentQuestion = questions[step];

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Duft-Quiz">
      <div className="py-4">
        {step < questions.length && currentQuestion ? (
          <>
            {/* Progress */}
            <div className="flex gap-1 mb-6">
              {questions.map((_, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-gold' : 'bg-surface-2'}`} />
              ))}
            </div>

            <h2 className="text-lg font-display text-txt text-center mb-6">{currentQuestion.text}</h2>

            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                  className="flex flex-col items-center gap-2 p-4 bg-surface-2 border border-border rounded-lg hover:border-gold/30 hover:bg-gold/5 transition-all"
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm text-txt font-medium">{opt.label}</span>
                </button>
              ))}
            </div>

            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="mt-4 text-xs text-txt-muted hover:text-txt transition-colors mx-auto block"
              >
                Zurück
              </button>
            )}
          </>
        ) : result ? (
          <div className="flex flex-col items-center text-center">
            <Sparkles size={20} className="text-gold mb-3" />
            <p className="text-xs text-gold uppercase tracking-wider font-semibold mb-4">Dein Duft für heute</p>

            <div className="w-28 h-40 rounded-lg bg-surface-2 flex items-center justify-center overflow-hidden mb-4 border border-gold/20">
              <ResultImage fragrance={result} />
            </div>

            <h3 className="text-xl font-display text-gold">{result.name}</h3>
            <p className="text-sm text-txt-muted mt-1">{result.brand} · {result.concentration}</p>

            {result.rating?.overall && (
              <p className="text-xs text-txt-muted mt-2">Bewertung: {result.rating.overall}/10</p>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={reset}>
                <RotateCcw size={14} />
                Nochmal
              </Button>
              <Button onClick={() => { onSelect(result); onClose(); reset(); }}>
                Details ansehen
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center text-txt-muted py-8">Keine Düfte in der Sammlung</p>
        )}
      </div>
    </Modal>
  );
}
