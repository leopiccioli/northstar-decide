interface EntryScreenProps {
  onStart: () => void;
}

export function EntryScreen({ onStart }: EntryScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full text-center space-y-12 animate-fade-up">
        {/* Main title */}
        <h1 className="heading-display">
          3D para decidir<br />tu trabajo
        </h1>

        {/* Single line promise */}
        <p className="text-subtle">
          En 20 segundos vas a poder tomar una mejor decisión.
        </p>

        {/* Single CTA */}
        <button
          onClick={onStart}
          className="btn-primary w-full max-w-xs mx-auto"
        >
          Empezar
        </button>
      </div>
    </div>
  );
}
