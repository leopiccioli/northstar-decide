import { UserContext } from '@/types/decision';
import { usePrefetchInputScreen } from '@/hooks/usePrefetch';
import { trackFlowEvent } from '@/lib/analytics';

interface ContextScreenProps {
  onSelect: (context: UserContext) => void;
}

const options: { id: UserContext; label: string }[] = [
  { id: 'improve', label: 'Quiero mejorar mi trabajo actual' },
  { id: 'change', label: 'Estoy pensando en cambiar de trabajo' },
  { id: 'compare', label: 'Comparar dos opciones (oferta / ascenso / cambio)' },
  { id: 'burnout', label: 'Me siento estancado o agotado' },
  { id: 'check', label: 'Solo quiero chequear cómo estoy' },
];

export default function ContextScreen({ onSelect }: ContextScreenProps) {
  // Prefetch next screen while user chooses context
  usePrefetchInputScreen();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full space-y-3">
        {options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => {
              trackFlowEvent('select_context', { context: option.id });
              onSelect(option.id);
            }}
            className={`card-option animate-fade-up opacity-0`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <span className="text-base font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
