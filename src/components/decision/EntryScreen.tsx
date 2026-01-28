import { useEffect, useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { MobileQRCard } from './MobileQRCard';
import { usePrefetchContextScreen } from '@/hooks/usePrefetch';

interface EntryScreenProps {
  onStart: () => void;
}

export function EntryScreen({ onStart }: EntryScreenProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();
  
  // Prefetch next screen while user reads entry
  usePrefetchContextScreen();

  useEffect(() => {
    // Start animation cycle every 4 seconds
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 800);
    }, 4000);

    // Trigger first animation after a short delay
    const initialTimeout = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 800);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-16">
      <div className="max-w-lg w-full text-center space-y-10 animate-fade-up">
        {/* Main title with compass animation */}
        <div className="space-y-2">
          <h1 className="heading-display">
            3
            {/* The "D" with tick rotation */}
            <span 
              className="inline-block transition-transform duration-200 ease-out"
              style={{
                transform: isAnimating ? 'rotate(3deg)' : 'rotate(0deg)',
              }}
            >
              D
            </span>
            {" "}para Decidir
          </h1>
          <p className="text-2xl font-medium text-muted-foreground">tu trabajo</p>
        </div>

        {/* Single line promise */}
        <p className="text-subtle">
          En 20 segundos vas a poder tomar una mejor decisión laboral.
        </p>

        {/* QR Card - only on desktop */}
        {!isMobile && <MobileQRCard />}

        {/* Single CTA */}
        <button
          onClick={onStart}
          className="btn-primary w-full max-w-xs mx-auto"
        >
          Empezar
        </button>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 flex flex-col items-center gap-2">
        <a 
          href="https://ceoencamiseta.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-subtle hover:text-foreground transition-colors"
        >
          Hecho con ❤️ para la comunidad de CEO en Camiseta
        </a>
      </footer>
    </div>
  );
}
