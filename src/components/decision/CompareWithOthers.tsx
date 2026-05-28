import { ArrowUpRight } from 'lucide-react';
import { trackFlowEvent } from '@/lib/analytics';

type Target = 'country' | 'sector' | 'age';

const LINKS: { id: Target; label: string; path: string }[] = [
  { id: 'country', label: 'Por país', path: '/por-pais' },
  { id: 'sector', label: 'Por sector', path: '/por-sector' },
  { id: 'age', label: 'Por edad', path: '/por-edad' },
];

/**
 * Bloque "Comparate con otros" que se muestra debajo de los resultados.
 * 3 chips → abren las stats pages en una pestaña nueva (no rompe el flujo de guardado).
 */
export function CompareWithOthers() {
  const handleClick = (target: Target) => {
    trackFlowEvent('open_stats', { surface: 'result', target });
  };

  return (
    <div className="space-y-3 animate-fade-up opacity-0 stagger-1">
      <h3 className="text-sm font-medium text-muted-foreground">
        Comparate con otros
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {LINKS.map((link) => (
          <a
            key={link.id}
            href={`${link.path}?utm_source=result&utm_medium=compare&utm_campaign=stats_discovery`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClick(link.id)}
            className="flex items-center justify-center gap-1 py-2.5 text-xs border border-border rounded-sm
                       hover:border-foreground/50 transition-colors"
          >
            {link.label}
            <ArrowUpRight className="w-3 h-3" />
          </a>
        ))}
      </div>
    </div>
  );
}
