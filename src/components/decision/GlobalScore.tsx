import { Scores } from '@/types/decision';

interface GlobalScoreProps {
  scores: Scores;
  label?: string;
}

function getScoreLevel(average: number): { level: 'low' | 'medium' | 'high'; color: string } {
  if (average <= 4) return { level: 'low', color: 'bg-foreground/30' };
  if (average <= 6) return { level: 'medium', color: 'bg-foreground/60' };
  return { level: 'high', color: 'bg-foreground' };
}

export function GlobalScore({ scores, label }: GlobalScoreProps) {
  const average = Math.round(((scores.dinero + scores.desarrollo + scores.diversion) / 3) * 10) / 10;
  const { level, color } = getScoreLevel(average);

  const levelLabels = {
    low: 'Hay trabajo por hacer',
    medium: 'Vas por buen camino',
    high: 'Muy buen balance',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-secondary rounded-sm border border-border">
      <div className="space-y-1">
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
        <p className="text-sm font-medium">{levelLabels[level]}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                (level === 'low' && i === 1) ||
                (level === 'medium' && i <= 2) ||
                (level === 'high')
                  ? color
                  : 'bg-border'
              }`}
            />
          ))}
        </div>
        <span className="font-mono text-lg tabular-nums">{average.toFixed(1)}</span>
      </div>
    </div>
  );
}
