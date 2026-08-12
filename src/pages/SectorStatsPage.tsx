import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MIN_RESPONSES_THRESHOLD } from '@/config/stats';
import logoImage from '@/assets/3d-logo.svg';
import { SEO } from '@/components/SEO';
import { SiteFooter } from '@/components/SiteFooter';
import { statsDatasetJsonLd } from '@/content/schema';
import { CUT_DATE_HUMAN, ELIGIBLE_SECTORS, WINDOW } from '@/content/facts';
import { StatsNav } from '@/components/stats/StatsNav';
import { StatsFreshness } from '@/components/stats/StatsFreshness';
import { BelowThresholdTable } from '@/components/stats/BelowThresholdTable';

type Period = 'quarter' | 'all';
type SortColumn = 'sector' | 'dinero' | 'desarrollo' | 'diversion' | 'promedio' | 'count';
type SortDirection = 'asc' | 'desc';

interface SectorStat {
  sector: string;
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

function formatValue(value: number): string {
  return value.toFixed(1);
}

export default function SectorStatsPage() {
  const [searchParams] = useSearchParams();
  const [period, setPeriod] = useState<Period>(
    searchParams.get('periodo') === 'trimestre' ? 'quarter' : 'all'
  );
  const [stats, setStats] = useState<SectorStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('promedio');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('sector_stats_cache')
          .select('sector, dimension, avg_value, count, updated_at')
          .eq('period', period);

        if (queryError) throw queryError;

        const bySector = new Map<string, SectorStat>();
        let latestUpdated: string | null = null;

        for (const row of data || []) {
          if (!latestUpdated || row.updated_at > latestUpdated) latestUpdated = row.updated_at;
          if (!bySector.has(row.sector)) {
            bySector.set(row.sector, {
              sector: row.sector,
              dinero: 0, desarrollo: 0, diversion: 0, promedio: 0,
              count: row.count,
            });
          }
          const stat = bySector.get(row.sector)!;
          if (row.dimension === 'dinero') stat.dinero = Number(row.avg_value ?? 0);
          else if (row.dimension === 'desarrollo') stat.desarrollo = Number(row.avg_value ?? 0);
          else if (row.dimension === 'diversion') stat.diversion = Number(row.avg_value ?? 0);
          else if (row.dimension === 'promedio') stat.promedio = Number(row.avg_value ?? 0);
        }

        setStats(Array.from(bySector.values()));
        if (latestUpdated) setLastUpdated(latestUpdated);
      } catch (err) {
        console.error('Error fetching sector stats:', err);
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
      if (sortColumn === 'sector') {
        return sortDirection === 'asc'
          ? a.sector.localeCompare(b.sector)
          : b.sector.localeCompare(a.sector);
      }
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [stats, sortColumn, sortDirection]);

  const belowStats = useMemo(
    () =>
      stats
        .filter((s) => s.count < MIN_RESPONSES_THRESHOLD)
        .map((s) => ({ key: s.sector, count: s.count, dinero: s.dinero, desarrollo: s.desarrollo, diversion: s.diversion })),
    [stats],
  );

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'sector' ? 'asc' : 'desc');
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
        title="3D por sector — Dinero, Desarrollo y Diversión por industria"
        description="Comparativa de satisfacción laboral (3D) por sector: tech, salud, finanzas, educación y más."
        path="/por-sector"
        jsonLd={statsDatasetJsonLd({
          path: '/por-sector',
          name: 'Las 3D del Trabajo por sector',
          description: `Promedios de Dinero, Desarrollo y Diversión por sector laboral, con el N de cada grupo. n=${WINDOW.coverage.with_sector} con sector declarado, datos al ${CUT_DATE_HUMAN}.`,
          n: WINDOW.coverage.with_sector,
          rows: ELIGIBLE_SECTORS,
          dimensionName: 'Sector',
        })}
      />
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </Link>
          <h1 className="text-sm font-medium">3D por sector</h1>
        </div>
      </div>

      <StatsNav active="sector" />

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
              {tableStats.length} sectores con datos suficientes
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
              Mostramos solo sectores con al menos {MIN_RESPONSES_THRESHOLD} respuestas.
            </p>
          </div>
        )}

        {!isLoading && tableStats.length > 0 && (
          <div className="border border-border rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className={`${columnClass} text-left font-medium`} onClick={() => handleSort('sector')}>
                      Sector<SortIcon column="sector" />
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
                    <tr key={stat.sector} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-3">{stat.sector}</td>
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

        {!isLoading && <BelowThresholdTable label="Sector" rows={belowStats} />}

        {!isLoading && tableStats.length === 0 && !error && (
          <div className="p-8 text-center text-muted-foreground text-sm border border-border rounded-sm">
            Todavía no hay sectores con al menos {MIN_RESPONSES_THRESHOLD} respuestas en este período.
          </div>
        )}
      </main>
    </div>
  );
}
