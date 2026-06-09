import { ReactNode, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { DecisionFlow } from '@/components/decision/DecisionFlow';
import { UserContext } from '@/types/decision';
import { FAQ, FAQItem } from './FAQ';
import { SITE_CONFIG } from '@/config/urls';
import { trackFlowEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

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
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    trackFlowEvent('lp_view' as any, { landing: landingId });
  }, [landingId]);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('get_measurement_count').then(({ data, error }) => {
      if (cancelled || error || data == null) return;
      setCount(Number(data));
    });
    return () => { cancelled = true; };
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

          {/* Footer */}
          <footer className="text-center text-xs text-foreground/40 pt-8 border-t">
            <a href={SITE_CONFIG.mainSiteUrl} className="hover:text-foreground/70">
              CEO en Camiseta
            </a>
          </footer>
        </section>
      </main>
    </>
  );
}
