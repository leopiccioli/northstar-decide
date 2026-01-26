import { useState } from 'react';
import { Scores } from '@/types/decision';
import { DimensionSlider } from './DimensionSlider';

interface InputScreenProps {
  isComparison?: boolean;
  optionName?: string;
  onComplete: (name: string, scores: Scores) => void;
  onBack: () => void;
}

export function InputScreen({ isComparison, optionName, onComplete, onBack }: InputScreenProps) {
  const [name, setName] = useState(optionName || (isComparison ? '' : 'Situación actual'));
  const [scores, setScores] = useState<Scores>({
    dinero: 5,
    desarrollo: 5,
    diversion: 5,
  });

  const handleSubmit = () => {
    if (isComparison && !name.trim()) return;
    onComplete(name || 'Situación actual', scores);
  };

  const updateScore = (key: keyof Scores) => (value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full space-y-10">
        {/* Header for comparison */}
        {isComparison && (
          <div className="space-y-4 animate-fade-up opacity-0">
            <p className="text-subtle">Ahora cargá la otra opción</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ascenso / Nueva empresa / Freelance..."
              className="w-full px-4 py-3 bg-secondary border border-border rounded-sm
                         text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
        )}

        {/* Sliders */}
        <div className="space-y-8">
          <div className="animate-fade-up opacity-0 stagger-1">
            <DimensionSlider
              label="Dinero"
              value={scores.dinero}
              onChange={updateScore('dinero')}
              colorClass="text-dinero"
            />
          </div>
          
          <div className="animate-fade-up opacity-0 stagger-2">
            <DimensionSlider
              label="Desarrollo"
              value={scores.desarrollo}
              onChange={updateScore('desarrollo')}
              colorClass="text-desarrollo"
            />
          </div>
          
          <div className="animate-fade-up opacity-0 stagger-3">
            <DimensionSlider
              label="Diversión"
              value={scores.diversion}
              onChange={updateScore('diversion')}
              colorClass="text-diversion"
            />
          </div>
        </div>

        {/* Hint */}
        <p className="text-subtle text-center animate-fade-up opacity-0 stagger-4">
          Respondé intuitivo. No lo pienses mucho.
        </p>

        {/* Actions */}
        <div className="flex gap-4 animate-fade-up opacity-0 stagger-4">
          <button onClick={onBack} className="btn-ghost">
            ← Atrás
          </button>
          <button
            onClick={handleSubmit}
            disabled={isComparison && !name.trim()}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
