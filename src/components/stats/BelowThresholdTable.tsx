import { MIN_RESPONSES_THRESHOLD } from '@/config/stats';

export interface BelowThresholdRow {
  key: string;
  count: number;
  dinero: number;
  desarrollo: number;
  diversion: number;
}

interface Props {
  /** Column header for the group name, e.g. "Sector". */
  label: string;
  rows: BelowThresholdRow[];
}

function fmt(value: number): string {
  return value.toFixed(1);
}

/**
 * Groups below the publication threshold: published for transparency only,
 * in alphabetical order and without an average column, so the block can never
 * be read as a ranking.
 */
export function BelowThresholdTable({ label, rows }: Props) {
  if (rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => a.key.localeCompare(b.key, 'es'));

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">
        Muestra insuficiente (n&lt;{MIN_RESPONSES_THRESHOLD}) — no comparable
      </h2>
      <p className="text-xs text-muted-foreground">
        Se publican por transparencia, en orden alfabético y sin promedio. No admiten
        comparación ni ranking.
      </p>
      <div className="border border-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-4 py-3 text-left font-medium">{label}</th>
                <th className="px-4 py-3 text-right font-medium">Dinero</th>
                <th className="px-4 py-3 text-right font-medium">Desarrollo</th>
                <th className="px-4 py-3 text-right font-medium">Diversión</th>
                <th className="px-4 py-3 text-right font-medium">n</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.key} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{r.key}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(r.dinero)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(r.desarrollo)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(r.diversion)}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
