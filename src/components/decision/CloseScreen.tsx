import { useState } from 'react';

interface CloseScreenProps {
  onRestart: () => void;
}

export default function CloseScreen({ onRestart }: CloseScreenProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-32 sm:pb-6">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-up">
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Listo</p>
            <p className="text-muted-foreground">
              Te avisamos cuando quieras repetirlo.
            </p>
          </div>
          
          <button onClick={onRestart} className="btn-ghost">
            ← Hacer otra evaluación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-32 sm:pb-6">
      <div className="max-w-md w-full space-y-8 animate-fade-up">
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">
            ¿Querés guardar tu resultado y volver más adelante?
          </p>
          <p className="text-subtle">
            Te avisamos cuando quieras repetirlo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 bg-secondary border border-border rounded-sm
                       text-foreground placeholder:text-muted-foreground text-center
                       focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          
          <button 
            type="submit" 
            disabled={!email.trim()}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Guardar
          </button>
        </form>

        <div className="text-center">
          <button onClick={onRestart} className="btn-ghost">
            No, gracias
          </button>
        </div>
      </div>
    </div>
  );
}
