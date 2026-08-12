import { Link } from 'react-router-dom';

const LINKS: { to: string; label: string }[] = [
  { to: '/hallazgos', label: 'Hallazgos' },
  { to: '/por-pais', label: 'Por país' },
  { to: '/por-sector', label: 'Por sector' },
  { to: '/por-edad', label: 'Por edad' },
  { to: '/comentarios', label: 'Comentarios' },
  { to: '/origen', label: 'Origen' },
  { to: '/metodologia', label: 'Método y límites' },
  { to: '/como-citar', label: 'Cómo citar' },
  { to: '/datos-llm', label: 'Datos abiertos' },
  { to: '/embed-docs', label: 'Embeber' },
];

/** Same markup and spacing as the footer already used on /origen. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <nav className="max-w-2xl mx-auto px-6 py-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="hover:text-foreground transition-colors">
            {l.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
