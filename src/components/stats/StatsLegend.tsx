import { MIN_RESPONSES_THRESHOLD } from '@/config/stats';

interface StatsLegendProps {
  className?: string;
}

const LEGEND_ITEMS = [
  { color: '#252525', label: '8-10 (muy alto)' },
  { color: '#555555', label: '6-8 (alto)' },
  { color: '#858585', label: '4-6 (medio)' },
  { color: '#b5b5b5', label: '2-4 (bajo)' },
  { color: '#d5d5d5', label: '0-2 (muy bajo)' },
  { color: '#fcd34d', label: 'Sin datos' },
  { color: '#e5e5e5', label: `< ${MIN_RESPONSES_THRESHOLD} respuestas`, border: true },
];

export function StatsLegend({ className = '' }: StatsLegendProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 text-sm ${className}`}>
      {LEGEND_ITEMS.map((item) => (
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
