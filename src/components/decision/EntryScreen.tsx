import { useEffect, useState } from 'react';

interface EntryScreenProps {
  onStart: () => void;
}

export function EntryScreen({ onStart }: EntryScreenProps) {
  const [isAnimating, setIsAnimating] = useState(false);

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
      <div className="max-w-lg w-full text-center space-y-12 animate-fade-up">
        {/* Main title with compass animation */}
        <div className="space-y-2">
          <h1 className="heading-display">
            {/* The "3" with needle inside */}
            <span className="relative inline-block">
              3
              {/* Needle/dot that oscillates */}
              <span 
                className={`
                  absolute w-1 h-1 bg-foreground rounded-full
                  top-[45%] left-[55%]
                  transition-all duration-300 ease-out
                  ${isAnimating ? 'opacity-100 scale-100' : 'opacity-60 scale-75'}
                `}
                style={{
                  transform: isAnimating 
                    ? 'translate(-50%, -50%) rotate(15deg) translateY(-3px)' 
                    : 'translate(-50%, -50%) rotate(-5deg) translateY(0px)',
                  transformOrigin: 'center bottom',
                }}
              />
            </span>
            {/* The "D" with tick rotation */}
            <span 
              className="inline-block transition-transform duration-200 ease-out"
              style={{
                transform: isAnimating ? 'rotate(3deg)' : 'rotate(0deg)',
              }}
            >
              D
            </span>
            {" "}para decidir
          </h1>
          <p className="text-2xl font-medium text-muted-foreground">tu trabajo</p>
        </div>

        {/* Single line promise */}
        <p className="text-subtle">
          En 20 segundos vas a poder tomar una mejor decisión laboral.
        </p>

        {/* Single CTA */}
        <button
          onClick={onStart}
          className="btn-primary w-full max-w-xs mx-auto"
        >
          Empezar
        </button>
      </div>

      {/* Copyright */}
      <footer className="absolute bottom-6 text-subtle">
        © {new Date().getFullYear()} @leopiccioli
      </footer>
    </div>
  );
}
