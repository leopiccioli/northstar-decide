import { UserContext, contextLabels } from '@/types/decision';
import { usePrefetchInputScreen } from '@/hooks/usePrefetch';
import { trackFlowEvent } from '@/lib/analytics';

interface ContextScreenProps {
  onSelect: (context: UserContext) => void;
}

// Display order (intentionally curated, not alphabetical)
const orderedIds: UserContext[] = ['improve', 'change', 'compare', 'burnout', 'check'];

export default function ContextScreen({ onSelect }: ContextScreenProps) {
  // Prefetch next screen while user chooses context
  usePrefetchInputScreen();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Hook header */}
        <div className="space-y-2 text-center animate-fade-up">
          <h2 className="text-2xl font-semibold">¿Cuál es tu situación hoy?</h2>
          <p className="text-subtle">Elegí la que más se parezca. No hay respuesta correcta.</p>
        </div>

        <div className="space-y-3">
          {orderedIds.map((id, index) => (
            <button
              key={id}
              onClick={() => {
                trackFlowEvent('select_context', { context: id });
                onSelect(id);
              }}
              className={`card-option animate-fade-up opacity-0`}
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <span className="text-base font-medium">{contextLabels[id]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
