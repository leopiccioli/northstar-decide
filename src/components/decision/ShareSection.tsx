import { useState } from 'react';
import { Option, Scores } from '@/types/decision';
import { toast } from '@/hooks/use-toast';

const SHARE_URL = 'https://3d.ceoencamiseta.com';

const IDENTITY_LABELS = [
  'Estoy para cambiar',
  'Estoy estancado',
  'Estoy creciendo',
  'Estoy cómodo',
  'Estoy quemado',
] as const;

type IdentityLabel = typeof IDENTITY_LABELS[number];

interface ShareSectionProps {
  currentOption: Option;
  comparisonOption: Option | null;
}

const shareTemplates: Record<IdentityLabel, string> = {
  'Estoy para cambiar': 
    'Estoy para cambiar.\nMi 3D: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Vos cambiarías?',
  'Estoy estancado': 
    'Me siento estancado.\nMi 3D: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Qué harías en mi lugar?',
  'Estoy creciendo': 
    'Creo que voy creciendo.\nMi 3D: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Te cierra o estoy flasheando?',
  'Estoy cómodo': 
    'Estoy cómodo donde estoy.\nMi 3D: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Moverías algo?',
  'Estoy quemado': 
    'Creo que estoy quemado.\nMi 3D: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Hora de cambiar?',
};

function getTradeoff(a: Scores, b: Scores): string {
  const dims: { key: keyof Scores; label: string }[] = [
    { key: 'dinero', label: 'Dinero' },
    { key: 'desarrollo', label: 'Desarrollo' },
    { key: 'diversion', label: 'Diversión' },
  ];
  
  const gains = dims.filter(d => b[d.key] > a[d.key]).map(d => d.label);
  const losses = dims.filter(d => b[d.key] < a[d.key]).map(d => d.label);
  
  if (gains.length && losses.length) {
    return `+${gains.join('/')} / –${losses.join('/')}`;
  }
  return '';
}

function getShareText(
  option: Option,
  label: IdentityLabel,
  comparison: Option | null
): string {
  const { dinero, desarrollo, diversion } = option.scores;
  
  if (comparison) {
    const tradeoff = getTradeoff(option.scores, comparison.scores);
    return `Comparé "${option.name}" vs "${comparison.name}".\n${tradeoff ? tradeoff + '\n' : ''}¿Qué harías vos?`;
  }
  
  return shareTemplates[label]
    .replace('{d}', String(dinero))
    .replace('{dev}', String(desarrollo))
    .replace('{div}', String(diversion));
}

export function ShareSection({ currentOption, comparisonOption }: ShareSectionProps) {
  const [selectedLabel, setSelectedLabel] = useState<IdentityLabel>('Estoy estancado');

  const handleShare = async () => {
    const text = getShareText(currentOption, selectedLabel, comparisonOption);
    const fullText = `${text}\n${SHARE_URL}`;

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({ text: fullText });
        return;
      } catch (err) {
        // User cancelled - do nothing
        if ((err as Error).name === 'AbortError') return;
        // Other error - fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(fullText);
      toast({
        title: "Copiado",
        description: "Pegalo en WhatsApp o donde quieras",
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h3 className="text-lg font-semibold text-center">
        Pedí una segunda opinión
      </h3>

      {/* Identity Labels */}
      <div className="flex flex-wrap gap-2 justify-center">
        {IDENTITY_LABELS.map((label) => (
          <button
            key={label}
            onClick={() => setSelectedLabel(label)}
            className={`px-3 py-1.5 text-sm rounded-sm border transition-all
              ${selectedLabel === label
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background border-border hover:border-foreground/50'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Single CTA */}
      <button
        onClick={handleShare}
        className="btn-primary w-full"
      >
        Pedir una segunda opinión
      </button>
    </div>
  );
}
