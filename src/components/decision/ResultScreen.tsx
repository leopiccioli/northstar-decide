import { Option, UserContext } from '@/types/decision';
import { useMemo } from 'react';

interface ResultScreenProps {
  context: UserContext;
  currentOption: Option;
  comparisonOption: Option | null;
  onContinue: () => void;
  onRestart: () => void;
}

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
        <span className="font-mono text-lg">{value}</span>
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

        {/* Actions */}
        <div className="flex gap-4 pt-6 animate-fade-up opacity-0 stagger-3">
          <button onClick={onRestart} className="btn-ghost">
            ← Empezar de nuevo
          </button>
          <button onClick={onContinue} className="btn-primary flex-1">
            Guardar resultado
          </button>
        </div>
      </div>
    </div>
  );
}
