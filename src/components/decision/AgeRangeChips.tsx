import { AGE_RANGES } from '@/lib/demographics';

interface AgeRangeChipsProps {
  value: string;
  onChange: (value: string) => void;
}

export function AgeRangeChips({ value, onChange }: AgeRangeChipsProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground">Edad (opcional)</label>
      <div className="flex flex-wrap gap-1.5">
        {AGE_RANGES.map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => onChange(range === value ? '' : range)}
            className={`px-2.5 py-1.5 text-sm rounded-sm border transition-all whitespace-nowrap
              ${value === range
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background border-border hover:border-foreground/50'
              }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
}
