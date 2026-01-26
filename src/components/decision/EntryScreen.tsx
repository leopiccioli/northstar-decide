interface EntryScreenProps {
  onStart: () => void;
}

function CalibrationBars() {
  return (
    <div className="flex items-end justify-center gap-1.5 h-6 mt-3">
      <div 
        className="w-1 h-3 bg-dinero rounded-sm calibrate-bar calibrate-delay-1 opacity-0"
        style={{ height: '10px' }}
      />
      <div 
        className="w-1 bg-desarrollo rounded-sm calibrate-bar calibrate-delay-2 opacity-0"
        style={{ height: '18px' }}
      />
      <div 
        className="w-1 bg-diversion rounded-sm calibrate-bar calibrate-delay-3 opacity-0"
        style={{ height: '14px' }}
      />
    </div>
  );
}

export function EntryScreen({ onStart }: EntryScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-16">
      <div className="max-w-lg w-full text-center space-y-12 animate-fade-up">
        {/* Main title */}
        <div className="space-y-2">
          <div>
            <h1 className="heading-display">3D para decidir</h1>
            <CalibrationBars />
          </div>
          <p className="text-2xl font-medium text-muted-foreground mt-4">tu trabajo</p>
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
