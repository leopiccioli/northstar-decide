import { useState } from 'react';
import { Scores, UserContext, contextQuestions } from '@/types/decision';
import { DimensionSlider } from './DimensionSlider';
import { usePrefetchResultScreen } from '@/hooks/usePrefetch';

interface InputScreenProps {
  context: UserContext;
  isComparison?: boolean;
  isFirstComparison?: boolean;
  optionName?: string;
  onComplete: (name: string, scores: Scores, comment?: string) => void;
  onBack: () => void;
}

export default function InputScreen({ context, isComparison, isFirstComparison, optionName, onComplete, onBack }: InputScreenProps) {
  // Prefetch ResultScreen while user fills sliders
  usePrefetchResultScreen();
  
  const showNameInput = isComparison || isFirstComparison;
  const [name, setName] = useState(optionName || (showNameInput ? '' : 'Situación actual'));
  const [comment, setComment] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot field
  const [scores, setScores] = useState<Scores>({
    dinero: 1,
    desarrollo: 1,
    diversion: 1,
  });

  const handleSubmit = () => {
    if (showNameInput && !name.trim()) return;
    if (honeypot) return; // Bot detected - silently reject
    onComplete(name || 'Situación actual', scores, comment || undefined);
  };

  const updateScore = (key: keyof Scores) => (value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const questionText = contextQuestions[context];

  const headerText = isFirstComparison 
    ? 'Primera opción' 
    : 'Ahora cargá la otra opción';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-16">
      <div className="max-w-md w-full space-y-10">
        {/* Header for comparison */}
        {showNameInput && (
          <div className="space-y-4 animate-fade-up opacity-0">
            <p className="text-subtle">{headerText}</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleSubmit();
                }
              }}
              maxLength={100}
              placeholder="Seguir así / Ascenso / Nueva empresa..."
              className="w-full px-4 py-3 bg-secondary border border-border rounded-sm
                         text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
        )}

        {/* Honeypot - hidden field that only bots fill */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="absolute -left-[9999px]"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {/* Honesty primer — frames the gesture before the sliders */}
        <p className="text-base font-medium text-center animate-fade-up opacity-0">
          Respondé lo que sentís hoy,<br />no lo que quisieras sentir.
        </p>

        {/* Sliders */}
        <div className="space-y-8">
          <div className="animate-fade-up opacity-0 stagger-1">
            <DimensionSlider
              label="Dinero"
              value={scores.dinero}
              onChange={updateScore('dinero')}
              colorClass="text-dinero"
              tooltip={{
                title: "Libertad financiera hoy.",
                bullets: [
                  "Tus ingresos te permiten vivir sin estrés por plata",
                  "¿Podés ahorrar o invertir?",
                  "¿Tenés colchón si algo sale mal?"
                ]
              }}
            />
          </div>
          
          <div className="animate-fade-up opacity-0 stagger-2">
            <DimensionSlider
              label="Desarrollo"
              value={scores.desarrollo}
              onChange={updateScore('desarrollo')}
              colorClass="text-desarrollo"
              tooltip={{
                title: "Cuánto aumenta tu valor futuro.",
                bullets: [
                  "En tu trabajo aprendés habilidades nuevas",
                  "¿Te abre más oportunidades o contactos?",
                  "¿Te hace más empleable en 2–3 años?"
                ]
              }}
            />
          </div>
          
          <div className="animate-fade-up opacity-0 stagger-3">
            <DimensionSlider
              label="Diversión"
              value={scores.diversion}
              onChange={updateScore('diversion')}
              colorClass="text-diversion"
              tooltip={{
                title: "Qué tan bien la pasás mientras trabajás.",
                bullets: [
                  "¿Arrancás el día con ganas?",
                  "¿Las tareas te energizan o te drenan?",
                  "¿Te da energía o te la saca?"
                ]
              }}
            />
          </div>
        </div>

        {/* Hint */}
        <p className="text-subtle text-center animate-fade-up opacity-0 stagger-4">
          Respondé intuitivo. No lo pienses mucho.
        </p>

        {/* Optional comment - only show if context has a question */}
        {questionText && (
          <div className="space-y-2 animate-fade-up opacity-0 stagger-4">
            <label className="text-subtle block">{questionText} (opcional)</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !(showNameInput && !name.trim())) {
                  handleSubmit();
                }
              }}
              maxLength={500}
              placeholder="ej: exceso de trabajo, poco sueldo, falta de desafíos"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-sm
                         text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 animate-fade-up opacity-0 stagger-4">
          <button onClick={onBack} className="btn-ghost">
            ← Atrás
          </button>
          <button
            onClick={handleSubmit}
            disabled={showNameInput && !name.trim()}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Ver resultado
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-subtle">
        <a 
          href="https://ceoencamiseta.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Hecho con ❤️ para la comunidad de CEO en Camiseta
        </a>
      </footer>
    </div>
  );
}
