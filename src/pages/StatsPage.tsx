import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getCountryName, getCountryFlag } from '@/lib/countries';
import { CountryMap } from '@/components/stats/CountryMap';
import { StatsLegend } from '@/components/stats/StatsLegend';
import { MIN_RESPONSES_THRESHOLD } from '@/config/stats';
import type { CountryFullStat } from '@/types/stats';
import logoImage from '@/assets/3d-logo.svg';

type Period = 'quarter' | 'all';
type SortColumn = 'country' | 'dinero' | 'desarrollo' | 'diversion' | 'promedio' | 'count';
type SortDirection = 'asc' | 'desc';

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'quarter', label: 'Último trimestre' },
  { id: 'all', label: 'Todo' },
];

function formatValue(value: number): string {
  return value.toFixed(1);
}

export default function StatsPage() {
  const [searchParams] = useSearchParams();
  const [period, setPeriod] = useState<Period>(
    searchParams.get('periodo') === 'trimestre' ? 'quarter' : 'all'
  );
  const [stats, setStats] = useState<CountryFullStat[]>([]);
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
          .from('country_stats_cache')
          .select('country, dimension, avg_value, count, updated_at')
          .eq('period', period);

        if (queryError) throw queryError;

        // Group by country (same logic as the old edge function)
        const byCountry = new Map<string, CountryFullStat>();
        let latestUpdated: string | null = null;

        for (const row of data || []) {
          if (!latestUpdated || row.updated_at > latestUpdated) latestUpdated = row.updated_at;
          if (!byCountry.has(row.country)) {
            byCountry.set(row.country, {
              country: row.country,
              dinero: 0, desarrollo: 0, diversion: 0, promedio: 0,
              count: row.count,
            });
          }
          const stat = byCountry.get(row.country)!;
          if (row.dimension === 'dinero') stat.dinero = row.avg_value ?? 0;
          else if (row.dimension === 'desarrollo') stat.desarrollo = row.avg_value ?? 0;
          else if (row.dimension === 'diversion') stat.diversion = row.avg_value ?? 0;
          else if (row.dimension === 'promedio') stat.promedio = row.avg_value ?? 0;
        }

        setStats(Array.from(byCountry.values()));
        if (latestUpdated) {
          setLastUpdated(latestUpdated);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('No se pudieron cargar las estadísticas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  // Calculate global weighted averages
  const globalAverages = useMemo(() => {
    if (stats.length === 0) return null;
    
    let totalCount = 0;
    let sumDinero = 0;
    let sumDesarrollo = 0;
    let sumDiversion = 0;
    
    for (const s of stats) {
      totalCount += s.count;
      sumDinero += s.dinero * s.count;
      sumDesarrollo += s.desarrollo * s.count;
      sumDiversion += s.diversion * s.count;
    }
    
    if (totalCount === 0) return null;
    
    const dinero = sumDinero / totalCount;
    const desarrollo = sumDesarrollo / totalCount;
    const diversion = sumDiversion / totalCount;
    const promedio = (dinero + desarrollo + diversion) / 3;
    
    return { dinero, desarrollo, diversion, promedio, count: totalCount };
  }, [stats]);

  // Calculate total responses
  const totalResponses = globalAverages?.count ?? 0;

  // Filter and sort countries
  const tableStats = useMemo(() => {
    const filtered = stats.filter(s => s.count >= MIN_RESPONSES_THRESHOLD);
    
    return filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      
      if (sortColumn === 'country') {
        aVal = getCountryName(a.country);
        bVal = getCountryName(b.country);
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      aVal = a[sortColumn];
      bVal = b[sortColumn];
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [stats, sortColumn, sortDirection]);

  // Calculate quartile boundaries for the legend
  const quartileBoundaries = useMemo(() => {
    const validStats = stats.filter(s => s.count >= MIN_RESPONSES_THRESHOLD);
    if (validStats.length === 0) return null;
    
    const values = validStats.map(s => s.promedio).sort((a, b) => a - b);
    const q1 = values[Math.floor(values.length * 0.25)] ?? values[0];
    const q2 = values[Math.floor(values.length * 0.5)] ?? values[0];
    const q3 = values[Math.floor(values.length * 0.75)] ?? values[0];
    const min = values[0];
    const max = values[values.length - 1];
    
    return { min, q1, q2, q3, max };
  }, [stats]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'country' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  const columnClass = "px-4 py-3 cursor-pointer hover:bg-secondary/80 transition-colors select-none";

  // Format last updated date for display
  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return null;
    const date = new Date(lastUpdated);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    });
  }, [lastUpdated]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Volver</span>
            </Link>
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="3D Logo" className="w-6 h-6" />
              <h1 className="text-lg font-semibold">3D para Decidir</h1>
            </div>
          </div>
          {formattedLastUpdated && (
            <div className="text-xs text-muted-foreground">
              Actualizado: {formattedLastUpdated}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            {/* Period filter */}
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
          </div>

          {/* Stats summary */}
          {!isLoading && (
            <div className="text-sm text-muted-foreground">
              {totalResponses.toLocaleString()} respuestas en {stats.length} países
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-sm text-center">
            {error}
          </div>
        )}

        {/* Global Averages */}
        {!isLoading && globalAverages && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">Promedios Globales</h2>
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
          </div>
        )}

        {/* Map */}
        <div className="border border-border rounded-sm overflow-hidden bg-secondary/30">
          <CountryMap stats={stats} isLoading={isLoading} quartileBoundaries={quartileBoundaries} />
        </div>

        {/* Legend */}
        <StatsLegend className="pt-2" quartileBoundaries={quartileBoundaries} />

        {/* Country table with all dimensions */}
        {!isLoading && tableStats.length > 0 && (
          <div className="border border-border rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th 
                      className={`${columnClass} text-left font-medium`}
                      onClick={() => handleSort('country')}
                    >
                      País<SortIcon column="country" />
                    </th>
                    <th 
                      className={`${columnClass} text-right font-medium`}
                      onClick={() => handleSort('dinero')}
                    >
                      Dinero<SortIcon column="dinero" />
                    </th>
                    <th 
                      className={`${columnClass} text-right font-medium`}
                      onClick={() => handleSort('desarrollo')}
                    >
                      Desarrollo<SortIcon column="desarrollo" />
                    </th>
                    <th 
                      className={`${columnClass} text-right font-medium`}
                      onClick={() => handleSort('diversion')}
                    >
                      Diversión<SortIcon column="diversion" />
                    </th>
                    <th 
                      className={`${columnClass} text-right font-medium`}
                      onClick={() => handleSort('promedio')}
                    >
                      Promedio<SortIcon column="promedio" />
                    </th>
                    <th 
                      className={`${columnClass} text-right font-medium`}
                      onClick={() => handleSort('count')}
                    >
                      Resp.<SortIcon column="count" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableStats.map((stat) => (
                    <tr
                      key={stat.country}
                      className="border-b border-border last:border-0 hover:bg-secondary/50"
                    >
                      <td className="px-4 py-3">
                        {getCountryFlag(stat.country)} {getCountryName(stat.country)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatValue(stat.dinero)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatValue(stat.desarrollo)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatValue(stat.diversion)}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{formatValue(stat.promedio)}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {stat.count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}