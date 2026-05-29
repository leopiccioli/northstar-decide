import { useEffect, useState, lazy, Suspense } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { usePrefetchContextScreen } from '@/hooks/usePrefetch';
import { supabase } from '@/integrations/supabase/client';

// Lazy load QR code - only needed on desktop
const MobileQRCard = lazy(() => import('./MobileQRCard').then(m => ({ default: m.MobileQRCard })));
import { useTrackingData } from '@/hooks/useTrackingData';
import { buildBeehiivUrl } from '@/config/urls';
import { trackFlowEvent } from '@/lib/analytics';

interface EntryScreenProps {
  onStart: () => void;
}

export function EntryScreen({ onStart }: EntryScreenProps) {
  const [didTick, setDidTick] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const trackingData = useTrackingData();

  // Build Beehiiv URL with tracking
  const beehiivUrl = buildBeehiivUrl({
    email: trackingData.email || undefined,
    utmMedium: 'home',
  });

  // Prefetch next screen while user reads entry
  usePrefetchContextScreen();

  // One-shot "D" tick (no infinite loop — faster perceived load on slow WebViews)
  useEffect(() => {
    const t = setTimeout(() => {
      setDidTick(true);
      setTimeout(() => setDidTick(false), 800);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // Fetch measurement count (social proof) — non-blocking
  useEffect(() => {
    let cancelled = false;
    supabase.rpc('get_measurement_count').then(({ data, error }) => {
      if (cancelled || error || data == null) return;
      setCount(Number(data));
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-foreground text-background flex flex-col items-center justify-center px-6 pb-16">
      <div className="max-w-lg w-full text-center space-y-10 animate-fade-up">
        {/* Main title with one-shot compass tick */}
        <div className="space-y-2">
          <h1 className="heading-display">
            3
            <span
              className="inline-block transition-transform duration-200 ease-out"
              style={{ transform: didTick ? 'rotate(3deg)' : 'rotate(0deg)' }}
            >
              D
            </span>
            {" "}para Decidir
          </h1>
          <p className="text-2xl font-medium text-background/60">tu trabajo</p>
        </div>

        {/* Persuasive hook */}
        <p className="text-base sm:text-lg text-background/80 max-w-md mx-auto leading-relaxed">
          La mayoría tolera un trabajo mediocre<br className="hidden sm:inline" />
          {' '}porque nunca se detiene a medirlo.
        </p>

        {/* Social proof: live measurement count */}
        {count !== null && count > 0 && (
          <p className="text-sm text-background/50 tabular-nums">
            {count.toLocaleString('es-AR')} mediciones
          </p>
        )}

        {/* Single CTA */}
        <button
          onClick={() => {
            trackFlowEvent('start_flow');
            onStart();
          }}
          className="btn-primary-inverted w-full max-w-xs mx-auto"
        >
          Empezar
        </button>

        {/* QR Card - only on desktop, compact, secondary */}
        {!isMobile && (
          <Suspense fallback={<div className="h-[160px]" />}>
            <div className="pt-4 opacity-70 hover:opacity-100 transition-opacity">
              <MobileQRCard originalTracking={trackingData} compact />
            </div>
          </Suspense>
        )}
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 flex flex-col items-center gap-2">
        <a
          href={beehiivUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-background/40 hover:text-background transition-colors"
        >
          Hecho con ❤️ para la comunidad de CEO en Camiseta
        </a>
      </footer>
    </div>
  );
}
