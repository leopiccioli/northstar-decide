import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type StatsTab = 'country' | 'sector' | 'age';

const TABS: { id: StatsTab; label: string; path: string }[] = [
  { id: 'country', label: 'Por país', path: '/por-pais' },
  { id: 'sector', label: 'Por sector', path: '/por-sector' },
  { id: 'age', label: 'Por edad', path: '/por-edad' },
];

export function StatsNav({ active }: { active: StatsTab }) {
  return (
    <nav className="border-b border-border bg-secondary/30">
      <div className="max-w-5xl mx-auto px-6 py-2 flex gap-1">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            className={cn(
              'px-3 py-1.5 text-sm rounded-sm border transition-all',
              active === tab.id
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/50'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
