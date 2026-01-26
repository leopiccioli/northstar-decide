import { UserContext } from '@/types/decision';

interface ContextScreenProps {
  onSelect: (context: UserContext) => void;
}

const options: { id: UserContext; label: string }[] = [
  { id: 'evaluate', label: 'Evaluar mi situación actual' },
  { id: 'compare', label: 'Comparar dos opciones' },
  { id: 'clarity', label: 'Estoy confundido, necesito claridad' },
];

export function ContextScreen({ onSelect }: ContextScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full space-y-4">
        {options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`card-option animate-fade-up opacity-0`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <span className="text-lg font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
