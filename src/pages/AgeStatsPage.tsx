import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MIN_RESPONSES_THRESHOLD } from '@/config/stats';
import { AGE_RANGES } from '@/lib/demographics';
import logoImage from '@/assets/3d-logo.svg';
import { SEO } from '@/components/SEO';
import { StatsNav } from '@/components/stats/StatsNav';
import { StatsFreshness } from '@/components/stats/StatsFreshness';

type Period = 'quarter' | 'all';
type SortColumn = 'age_range' | 'dinero' | 'desarrollo' | 'diversion' | 'promedio' | 'count';
type SortDirection = 'asc' | 'desc';

interface AgeStat {
  age_range: string;
  dinero: number;
  desarrollo: number;
  diversion: number;
  promedio: number;
  count: number;
}

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'quarter', label: 'Último trimestre' },
  { id: 'all', label: 'Todo' },
];

const AGE_ORDER: Record<string, number> = AGE_RANGES.reduce((acc, range, idx) => {
  acc[range] = idx;
  return acc;
}, {} as Record<string, number>);

function formatValue(value: number): string {
  return value.toFixed(1);
}

export default function AgeStatsPage() {
  const [searchParams] = useSearchParams();
  const [period, setPeriod] = useState<Period>(
    searchParams.get('periodo') === 'trimestre' ? 'quarter' : 'all'
  );
  const [stats, setStats] = useState<AgeStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('age_range');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('age_range_stats_cache')
          .select('age_range, dimension, avg_value, count, updated_at')
          .eq('period', period);

        if (queryError) throw queryError;

        const byAge = new Map<string, AgeStat>();
        let latestUpdated: string | null = null;

        for (const row of data || []) {
          if (!latestUpdated || row.updated_at > latestUpdated) latestUpdated = row.updated_at;
          if (!byAge.has(row.age_range)) {
            byAge.set(row.age_range, {
              age_range: row.age_range,
              dinero: 0, desarrollo: 0, diversion: 0, promedio: 0,
              count: row.count,
            });
          }
          const stat = byAge.get(row.age_range)!;
          if (row.dimension === 'dinero') stat.dinero = Number(row.avg_value ?? 0);
          else if (row.dimension === 'desarrollo') stat.desarrollo = Number(row.avg_value ?? 0);
          else if (row.dimension === 'diversion') stat.diversion = Number(row.avg_value ?? 0);
          else if (row.dimension === 'promedio') stat.promedio = Number(row.avg_value ?? 0);
        }

        setStats(Array.from(byAge.values()));
        if (latestUpdated) setLastUpdated(latestUpdated);
      } catch (err) {
        console.error('Error fetching age stats:', err);
        setError('No se pudieron cargar las estadísticas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  const globalAverages = useMemo(() => {
    if (stats.length === 0) return null;
    let totalCount = 0, sumD = 0, sumDe = 0, sumDi = 0;
    for (const s of stats) {
      totalCount += s.count;
      sumD += s.dinero * s.count;
      sumDe += s.desarrollo * s.count;
      sumDi += s.diversion * s.count;
    }
    if (totalCount === 0) return null;
    const dinero = sumD / totalCount;
    const desarrollo = sumDe / totalCount;
    const diversion = sumDi / totalCount;
    return { dinero, desarrollo, diversion, promedio: (dinero + desarrollo + diversion) / 3, count: totalCount };
  }, [stats]);

  const tableStats = useMemo(() => {
    const filtered = stats.filter(s => s.count >= MIN_RESPONSES_THRESHOLD);
    return filtered.sort((a, b) => {
      if (sortColumn === 'age_range') {
        const ai = AGE_ORDER[a.age_range] ?? 999;
        const bi = AGE_ORDER[b.age_range] ?? 999;
        return sortDirection === 'asc' ? ai - bi : bi - ai;
      }
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [stats, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'age_range' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  const columnClass = "px-4 py-3 cursor-pointer hover:bg-secondary/80 transition-colors select-none";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="3D por edad — satisfacción laboral por rango etario"
        description="Cómo cambian Dinero, Desarrollo y Diversión en el trabajo según la edad. Datos de la comunidad."
        path="/por-edad"
      />
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </Link>
          <h1 className="text-sm font-medium">3D por edad</h1>
        </div>
      </div>

      <StatsNav active="age" />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <StatsFreshness updatedAt={lastUpdated} />
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Período:</span>
            <div className="flex gap-1">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPeriod(option.id)}
                  className={`px-3 py-1.5 text-sm rounded-sm border transition-all
                    ${period === option.id
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background border-border hover:border-foreground/50'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {!isLoading && (
            <div className="text-sm text-muted-foreground">
              {tableStats.length} rangos con datos suficientes
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-sm text-center">{error}</div>
        )}

        {!isLoading && globalAverages && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">Promedios globales</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border border-border rounded-sm p-3 bg-secondary/30">
                <div className="text-xs text-muted-foreground">Dinero</div>
                <div className="text-xl font-mono font-medium">{formatValue(globalAverages.dinero)}</div>
              </div>
              <div className="border border-border rounded-sm p-3 bg-secondary/30">
                <div className="text-xs text-muted-foreground">Desarrollo</div>
                <div className="text-xl font-mono font-medium">{formatValue(globalAverages.desarrollo)}</div>
              </div>
              <div className="border border-border rounded-sm p-3 bg-secondary/30">
                <div className="text-xs text-muted-foreground">Diversión</div>
                <div className="text-xl font-mono font-medium">{formatValue(globalAverages.diversion)}</div>
              </div>
              <div className="border border-border rounded-sm p-3 bg-foreground text-background">
                <div className="text-xs opacity-70">General</div>
                <div className="text-xl font-mono font-medium">{formatValue(globalAverages.promedio)}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Mostramos solo rangos con al menos {MIN_RESPONSES_THRESHOLD} respuestas.
            </p>
          </div>
        )}

        {!isLoading && tableStats.length > 0 && (
          <div className="border border-border rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className={`${columnClass} text-left font-medium`} onClick={() => handleSort('age_range')}>
                      Edad<SortIcon column="age_range" />
                    </th>
                    <th className={`${columnClass} text-right font-medium`} onClick={() => handleSort('dinero')}>
                      Dinero<SortIcon column="dinero" />
                    </th>
                    <th className={`${columnClass} text-right font-medium`} onClick={() => handleSort('desarrollo')}>
                      Desarrollo<SortIcon column="desarrollo" />
                    </th>
                    <th className={`${columnClass} text-right font-medium`} onClick={() => handleSort('diversion')}>
                      Diversión<SortIcon column="diversion" />
                    </th>
                    <th className={`${columnClass} text-right font-medium`} onClick={() => handleSort('promedio')}>
                      Promedio<SortIcon column="promedio" />
                    </th>
                    <th className={`${columnClass} text-right font-medium`} onClick={() => handleSort('count')}>
                      n<SortIcon column="count" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableStats.map((stat) => (
                    <tr key={stat.age_range} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-3 font-mono">{stat.age_range}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatValue(stat.dinero)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatValue(stat.desarrollo)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatValue(stat.diversion)}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{formatValue(stat.promedio)}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{stat.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && tableStats.length === 0 && !error && (
          <div className="p-8 text-center text-muted-foreground text-sm border border-border rounded-sm">
            Todavía no hay rangos etarios con al menos {MIN_RESPONSES_THRESHOLD} respuestas en este período.
          </div>
        )}
      </main>
    </div>
  );
}
