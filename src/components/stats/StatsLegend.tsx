interface StatsLegendProps {
  className?: string;
}

const LEGEND_ITEMS = [
  { color: '#252525', label: 'Q5 (más alto)' },
  { color: '#555555', label: 'Q4' },
  { color: '#858585', label: 'Q3' },
  { color: '#b5b5b5', label: 'Q2' },
  { color: '#e5e5e5', label: 'Q1 (más bajo)' },
  { color: '#f5f5f5', label: 'Sin datos', border: true },
  { color: '#fcd34d', label: '< 10 respuestas' },
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
