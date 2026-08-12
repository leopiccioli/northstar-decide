import { ReactNode, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { DecisionFlow } from '@/components/decision/DecisionFlow';
import { UserContext } from '@/types/decision';
import { FAQ, FAQItem } from './FAQ';
import { SITE_CONFIG } from '@/config/urls';
import { fetchMeasurementCount, FALLBACK_MEASUREMENT_COUNT } from '@/lib/measurementCount';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UNIVERSE_LINE } from '@/content/facts';

interface LandingShellProps {
  // SEO
  title: string;
  description: string;
  path: string;
  // Content
  h1: string;
  subhead: string;
  initialContext: UserContext;
  landingId: string; // tracking identifier
  faq: FAQItem[];
  belowForm?: ReactNode; // optional internal-link section, etc.
}

export function LandingShell({
  title,
  description,
  path,
  h1,
  subhead,
  initialContext,
  landingId,
  faq,
  belowForm,
}: LandingShellProps) {
  const url = `${SITE_CONFIG.baseUrl}${path}`;
  const [count, setCount] = useState<number | null>(FALLBACK_MEASUREMENT_COUNT);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', 'lp_view', { landing: landingId });
      } catch (e) {
        console.warn('GA4 error:', e);
      }
    }
  }, [landingId]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchMeasurementCount(ctrl.signal).then((value) => {
      if (value != null) setCount(value);
    });
    return () => ctrl.abort();
  }, []);

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          description,
          url,
        })}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Hero — compact, mobile-first */}
        <header className="px-6 pt-10 pb-2 max-w-md mx-auto text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">{h1}</h1>
          <p className="text-base text-foreground/70 leading-relaxed">{subhead}</p>
          {count !== null && count > 0 && (
            <p className="text-xs text-foreground/40 tabular-nums pt-1">
              {count.toLocaleString('es-AR')} mediciones
            </p>
          )}
        </header>

        {/* Embedded 3D flow — drops user straight into sliders */}
        <section aria-label="Test 3D">
          <DecisionFlow initialContext={initialContext} />
        </section>

        {/* Below-fold content */}
        <section className="px-6 py-16 max-w-2xl mx-auto space-y-16">
          {/* What it measures */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center">Qué mide el test</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide">Dinero</p>
                <p className="text-sm text-foreground/70">Cuánto te paga y cuánto vale eso para tu vida hoy.</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide">Desarrollo</p>
                <p className="text-sm text-foreground/70">Si estás creciendo, estancado o retrocediendo.</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide">Diversión</p>
                <p className="text-sm text-foreground/70">Si tu trabajo te suma energía o te la chupa.</p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center">Preguntas frecuentes</h2>
            <FAQ items={faq} />
          </div>

          {belowForm}

          {/* Internal link economy: data that backs this page */}
          <nav className="space-y-3 text-center" aria-label="Datos que respaldan esta página">
            <h2 className="text-xl font-semibold">Los datos que respaldan esta página</h2>
            <p className="text-sm text-foreground/60">{UNIVERSE_LINE}</p>
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
              <li><Link to="/hallazgos" className="underline underline-offset-4">Hallazgos</Link></li>
              <li><Link to="/por-sector" className="underline underline-offset-4">Por sector</Link></li>
              <li><Link to="/por-pais" className="underline underline-offset-4">Por país</Link></li>
              <li><Link to="/por-edad" className="underline underline-offset-4">Por edad</Link></li>
              <li><Link to="/metodologia" className="underline underline-offset-4">Método y límites</Link></li>
              <li><Link to="/como-citar" className="underline underline-offset-4">Cómo citar</Link></li>
            </ul>
          </nav>

        </section>
      </main>
    </>
  );
}
