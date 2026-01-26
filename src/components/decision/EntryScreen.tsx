interface EntryScreenProps {
  onStart: () => void;
}

function CalibrationBars() {
  return (
    <span className="relative inline-flex items-end justify-center">
      <span className="text-transparent">3</span>
      <span className="absolute inset-0 flex items-end justify-center gap-0.5 pb-[0.15em]">
        <span 
          className="w-[0.08em] bg-foreground/70 rounded-sm calibrate-bar calibrate-delay-1 opacity-0"
          style={{ height: '0.25em' }}
        />
        <span 
          className="w-[0.08em] bg-foreground/70 rounded-sm calibrate-bar calibrate-delay-2 opacity-0"
          style={{ height: '0.45em' }}
        />
        <span 
          className="w-[0.08em] bg-foreground/70 rounded-sm calibrate-bar calibrate-delay-3 opacity-0"
          style={{ height: '0.35em' }}
        />
      </span>
      <span>3</span>
    </span>
  );
}

export function EntryScreen({ onStart }: EntryScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-16">
      <div className="max-w-lg w-full text-center space-y-12 animate-fade-up">
        {/* Main title */}
        <div className="space-y-2">
          <h1 className="heading-display">
            <CalibrationBars />D para decidir
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
