import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '@/config/urls';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
        <Link
          to="/"
          className="text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity"
          aria-label="Las 3D del Trabajo — inicio"
        >
          3D
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
          <a
            href={`${SITE_CONFIG.mainSiteUrl}?utm_source=3d&utm_medium=header`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            CEO en Camiseta
          </a>
          <Link
            to="/embed-docs"
            className="hover:text-foreground transition-colors"
          >
            Embeber
          </Link>
        </nav>
      </div>
    </header>
  );
}
