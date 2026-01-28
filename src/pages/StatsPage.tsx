import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getCountryName, getCountryFlag } from '@/lib/countries';
import { CountryMap } from '@/components/stats/CountryMap';
import { StatsLegend } from '@/components/stats/StatsLegend';
import { MIN_RESPONSES_THRESHOLD } from '@/config/stats';
import type { CountryFullStat } from '@/types/stats';

type Period = 'quarter' | 'all';

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'quarter', label: 'Último trimestre' },
  { id: 'all', label: 'Todo' },
];

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>('all');
  const [stats, setStats] = useState<CountryFullStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('get-country-stats', {
          body: { period },
        });

        if (fnError) throw fnError;

        setStats(data?.stats || []);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('No se pudieron cargar las estadísticas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  // Calculate total responses
  const totalResponses = stats.reduce((sum, s) => sum + s.count, 0);

  // Filter countries with threshold+ responses for the table
  const tableStats = stats
    .filter(s => s.count >= MIN_RESPONSES_THRESHOLD)
    .sort((a, b) => b.promedio - a.promedio);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </Link>
          <h1 className="text-lg font-semibold">Estadísticas por País</h1>
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

        {/* Map */}
        <div className="border border-border rounded-sm overflow-hidden bg-secondary/30">
          <CountryMap stats={stats} isLoading={isLoading} />
        </div>

        {/* Legend */}
        <StatsLegend className="pt-2" />

        {/* Country table with all dimensions */}
        {!isLoading && tableStats.length > 0 && (
          <div className="border border-border rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="px-4 py-3 text-left font-medium">País</th>
                    <th className="px-4 py-3 text-right font-medium">Dinero</th>
                    <th className="px-4 py-3 text-right font-medium">Desarrollo</th>
                    <th className="px-4 py-3 text-right font-medium">Diversión</th>
                    <th className="px-4 py-3 text-right font-medium">Promedio</th>
                    <th className="px-4 py-3 text-right font-medium">Resp.</th>
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
                      <td className="px-4 py-3 text-right font-mono">{stat.dinero}</td>
                      <td className="px-4 py-3 text-right font-mono">{stat.desarrollo}</td>
                      <td className="px-4 py-3 text-right font-mono">{stat.diversion}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{stat.promedio}</td>
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
