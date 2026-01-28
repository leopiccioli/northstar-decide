import { MIN_RESPONSES_THRESHOLD } from '@/config/stats';

export interface QuartileBoundaries {
  min: number;
  q1: number;
  q2: number;
  q3: number;
  max: number;
}

interface StatsLegendProps {
  className?: string;
  quartileBoundaries: QuartileBoundaries | null;
}

function formatValue(value: number): string {
  return value.toFixed(1);
}

export function StatsLegend({ className = '', quartileBoundaries }: StatsLegendProps) {
  // Build legend items based on quartiles
  const legendItems = quartileBoundaries ? [
    { color: '#252525', label: `${formatValue(quartileBoundaries.q3)} - ${formatValue(quartileBoundaries.max)}` },
    { color: '#555555', label: `${formatValue(quartileBoundaries.q2)} - ${formatValue(quartileBoundaries.q3)}` },
    { color: '#858585', label: `${formatValue(quartileBoundaries.q1)} - ${formatValue(quartileBoundaries.q2)}` },
    { color: '#b5b5b5', label: `${formatValue(quartileBoundaries.min)} - ${formatValue(quartileBoundaries.q1)}` },
  ] : [
    { color: '#252525', label: 'Muy alto' },
    { color: '#555555', label: 'Alto' },
    { color: '#858585', label: 'Medio' },
    { color: '#b5b5b5', label: 'Bajo' },
  ];

  const staticItems = [
    { color: '#fcd34d', label: 'Sin datos', border: false },
    { color: '#e5e5e5', label: `< ${MIN_RESPONSES_THRESHOLD} resp.`, border: true },
  ];

  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 text-sm ${className}`}>
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
      {staticItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-sm"
            style={{ 
              backgroundColor: item.color,
              border: item.border ? '1px solid hsl(var(--border))' : undefined
            }}
          />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
