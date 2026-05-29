import { Scores } from '@/types/decision';

interface GlobalScoreProps {
  scores: Scores;
  globalAvg?: number | null;
  label?: string;
  compact?: boolean;
}

function getScoreLevel(average: number): { level: 'low' | 'medium' | 'high'; color: string } {
  if (average <= 4) return { level: 'low', color: 'bg-foreground/30' };
  if (average <= 6) return { level: 'medium', color: 'bg-foreground/60' };
  return { level: 'high', color: 'bg-foreground' };
}

/**
 * Score summary used in two modes:
 *  - hero (default): giant tabular number with traffic light + optional global avg
 *  - compact: row card used in side-by-side comparison view
 */
export function GlobalScore({ scores, globalAvg, label, compact = false }: GlobalScoreProps) {
  const average = Math.round(((scores.dinero + scores.desarrollo + scores.diversion) / 3) * 10) / 10;
  const { level, color } = getScoreLevel(average);

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 bg-secondary rounded-sm border border-border">
        <div className="space-y-1">
          {label && <p className="text-sm text-muted-foreground">{label}</p>}
          <p className="text-sm font-medium">Promedio</p>
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

  return (
    <div className="flex flex-col items-center text-center space-y-3 py-2">
      {label && <p className="text-sm text-muted-foreground">{label}</p>}

      {/* Hero number */}
      <div className="flex items-baseline justify-center gap-2">
        <span className="font-mono text-7xl sm:text-8xl font-medium tabular-nums leading-none">
          {average.toFixed(1)}
        </span>
        <span className="font-mono text-2xl text-muted-foreground tabular-nums">/10</span>
      </div>

      {/* Traffic light */}
      <div className="flex gap-1.5">
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

      {/* Global comparison line — pure data, no interpretation */}
      {globalAvg != null && (
        <p className="text-sm text-muted-foreground tabular-nums">
          Mediana global: {globalAvg.toFixed(1)}
        </p>
      )}
    </div>
  );
}

