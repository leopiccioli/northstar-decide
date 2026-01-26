import { Option, UserContext } from '@/types/decision';
import { useMemo, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ResultScreenProps {
  context: UserContext;
  currentOption: Option;
  comparisonOption: Option | null;
  onContinue: () => void;
  onRestart: () => void;
}

type ReminderPeriod = '1m' | '3m' | 'none';

const reminderOptions: { id: ReminderPeriod; label: string }[] = [
  { id: '1m', label: 'En 1 mes' },
  { id: '3m', label: 'En 3 meses' },
  { id: 'none', label: 'Sin recordatorio' },
];

function ScoreBar({ label, value, maxValue = 10 }: { 
  label: string; 
  value: number; 
  maxValue?: number;
}) {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground tabular-nums">{value}/10</span>
      </div>
      <div className="h-3 bg-secondary rounded-sm overflow-hidden">
        <div 
          className="result-bar bg-foreground"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ComparisonTable({ a, b }: { a: Option; b: Option }) {
  const getDiff = (key: keyof typeof a.scores) => {
    const diff = b.scores[key] - a.scores[key];
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return '=';
  };

  const rows = [
    { key: 'dinero' as const, label: 'Dinero' },
    { key: 'desarrollo' as const, label: 'Desarrollo' },
    { key: 'diversion' as const, label: 'Diversión' },
  ];

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary">
            <th className="px-4 py-3 text-left font-medium"></th>
            <th className="px-4 py-3 text-center font-medium">{a.name}</th>
            <th className="px-4 py-3 text-center font-medium">{b.name}</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.key} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{row.label}</td>
              <td className="px-4 py-3 text-center font-mono">{a.scores[row.key]}</td>
              <td className="px-4 py-3 text-center font-mono">{b.scores[row.key]}</td>
              <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                {getDiff(row.key)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SaveSection({ 
  currentOption, 
  comparisonOption 
}: { 
  currentOption: Option; 
  comparisonOption: Option | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [reminder, setReminder] = useState<ReminderPeriod>('1m');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!email.trim()) return;

    setIsSaving(true);
    
    // Simulate save - in production this would call an edge function
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Resultado guardado",
      description: reminder !== 'none'
        ? `Te avisaremos ${reminderOptions.find(r => r.id === reminder)?.label.toLowerCase()}.`
        : "Revisá tu email.",
    });
    
    setIsSaving(false);
    setIsExpanded(false);
    setEmail('');
    setReminder('1m');
  };

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        Guardar para después →
      </button>
    );
  }

  return (
    <div className="space-y-5 p-4 bg-secondary rounded-sm border border-border animate-fade-up">
      {/* Microcopy */}
      <p className="text-subtle text-center">
        Quienes repiten el 3D suelen mejorar sus puntajes con el tiempo.
      </p>

      <div className="space-y-2">
        <label className="text-sm font-medium">Guardá tu resultado y comparalo después</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@ejemplo.com"
          className="w-full px-4 py-3 bg-background border border-border rounded-sm
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-1 focus:ring-foreground"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Recordatorio</label>
        <div className="flex flex-wrap gap-2">
          {reminderOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setReminder(option.id)}
              className={`px-3 py-1.5 text-sm rounded-sm border transition-all
                ${reminder === option.id 
                  ? 'bg-foreground text-background border-foreground' 
                  : 'bg-background border-border hover:border-foreground/50'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button 
          onClick={() => setIsExpanded(false)} 
          className="btn-ghost text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!email.trim() || isSaving}
          className="btn-primary flex-1 text-sm py-2 disabled:opacity-40"
        >
          {isSaving ? 'Guardando...' : 'Guardar y avisarme'}
        </button>
      </div>
    </div>
  );
}

export function ResultScreen({ 
  context, 
  currentOption, 
  comparisonOption, 
  onContinue,
  onRestart 
}: ResultScreenProps) {
  
  const insights = useMemo(() => {
    const { scores } = currentOption;
    const entries = Object.entries(scores) as [keyof typeof scores, number][];
    const sorted = [...entries].sort((a, b) => b[1] - a[1]);
    
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    
    const labels = {
      dinero: 'Dinero',
      desarrollo: 'Desarrollo',
      diversion: 'Diversión'
    };

    const results: string[] = [];
    
    results.push(`Hoy estás fuerte en ${labels[highest[0]]}.`);
    
    if (lowest[1] < 5) {
      results.push(`${labels[lowest[0]]} es tu punto más débil.`);
    }
    
    // Profile analysis
    if (scores.desarrollo > scores.diversion && scores.desarrollo > scores.dinero) {
      results.push('Tu perfil prioriza progreso sobre disfrute.');
    } else if (scores.dinero > scores.desarrollo && scores.dinero > scores.diversion) {
      results.push('Tu perfil prioriza estabilidad económica.');
    } else if (scores.diversion > scores.desarrollo && scores.diversion > scores.dinero) {
      results.push('Tu perfil prioriza satisfacción personal.');
    }

    return results;
  }, [currentOption]);

  const comparisonInsight = useMemo(() => {
    if (!comparisonOption) return null;
    
    const a = currentOption.scores;
    const b = comparisonOption.scores;
    
    const improvements: string[] = [];
    const drops: string[] = [];
    
    const labels = { dinero: 'Dinero', desarrollo: 'Desarrollo', diversion: 'Diversión' };
    
    (Object.keys(a) as (keyof typeof a)[]).forEach(key => {
      const diff = b[key] - a[key];
      if (diff >= 2) improvements.push(labels[key]);
      if (diff <= -2) drops.push(labels[key]);
    });

    if (improvements.length && drops.length) {
      return `${comparisonOption.name} mejora ${improvements.join(' y ')}, pero cae fuerte en ${drops.join(' y ')}.`;
    } else if (improvements.length) {
      return `${comparisonOption.name} mejora ${improvements.join(' y ')}.`;
    } else if (drops.length) {
      return `${comparisonOption.name} cae fuerte en ${drops.join(' y ')}.`;
    }
    
    return 'Ambas opciones están bastante equilibradas.';
  }, [currentOption, comparisonOption]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full space-y-10">
        
        {/* Single option result */}
        {!comparisonOption && (
          <div className="space-y-6 animate-fade-up">
            <h2 className="text-xl font-semibold">{currentOption.name}</h2>
            
            <div className="space-y-5">
              <ScoreBar 
                label="Dinero" 
                value={currentOption.scores.dinero} 
              />
              <ScoreBar 
                label="Desarrollo" 
                value={currentOption.scores.desarrollo} 
              />
              <ScoreBar 
                label="Diversión" 
                value={currentOption.scores.diversion}
              />
            </div>

            {currentOption.comment && (
              <blockquote className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                "{currentOption.comment}"
              </blockquote>
            )}
          </div>
        )}

        {/* Comparison result */}
        {comparisonOption && (
          <div className="space-y-6 animate-fade-up">
            <ComparisonTable a={currentOption} b={comparisonOption} />
            
            {(currentOption.comment || comparisonOption.comment) && (
              <div className="space-y-3">
                {currentOption.comment && (
                  <blockquote className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                    <span className="font-medium not-italic">{currentOption.name}:</span> "{currentOption.comment}"
                  </blockquote>
                )}
                {comparisonOption.comment && (
                  <blockquote className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                    <span className="font-medium not-italic">{comparisonOption.name}:</span> "{comparisonOption.comment}"
                  </blockquote>
                )}
              </div>
            )}
          </div>
        )}

        {/* Insights */}
        <div className="space-y-3 animate-fade-up opacity-0 stagger-2">
          {!comparisonOption && insights.map((insight, i) => (
            <p key={i} className="text-muted-foreground">{insight}</p>
          ))}
          
          {comparisonOption && comparisonInsight && (
            <p className="text-muted-foreground">{comparisonInsight}</p>
          )}
        </div>

        {/* Save section - inline */}
        <div className="animate-fade-up opacity-0 stagger-3">
          <SaveSection 
            currentOption={currentOption} 
            comparisonOption={comparisonOption} 
          />
        </div>

        {/* Actions */}
        <div className="flex justify-center pt-2 animate-fade-up opacity-0 stagger-4">
          <button onClick={onRestart} className="btn-ghost">
            ← Empezar de nuevo
          </button>
        </div>
      </div>
    </div>
  );
}
