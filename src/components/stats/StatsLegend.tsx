import { MIN_RESPONSES_THRESHOLD, QUARTILE_COLORS } from '@/config/stats';

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
  // Build legend items with stable IDs (not dynamic labels)
  const legendItems = [
    { id: 'q4', color: QUARTILE_COLORS.q4, label: quartileBoundaries ? `${formatValue(quartileBoundaries.q3)} - ${formatValue(quartileBoundaries.max)}` : 'Muy alto' },
    { id: 'q3', color: QUARTILE_COLORS.q3, label: quartileBoundaries ? `${formatValue(quartileBoundaries.q2)} - ${formatValue(quartileBoundaries.q3)}` : 'Alto' },
    { id: 'q2', color: QUARTILE_COLORS.q2, label: quartileBoundaries ? `${formatValue(quartileBoundaries.q1)} - ${formatValue(quartileBoundaries.q2)}` : 'Medio' },
    { id: 'q1', color: QUARTILE_COLORS.q1, label: quartileBoundaries ? `${formatValue(quartileBoundaries.min)} - ${formatValue(quartileBoundaries.q1)}` : 'Bajo' },
  ];

  const staticItems = [
    { id: 'noData', color: QUARTILE_COLORS.noData, label: 'Sin datos', border: false },
    { id: 'insufficient', color: QUARTILE_COLORS.insufficient, label: `< ${MIN_RESPONSES_THRESHOLD} resp.`, border: true },
  ];

  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 text-sm ${className}`}>
      {legendItems.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
      {staticItems.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
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
