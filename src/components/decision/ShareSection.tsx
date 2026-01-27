import { useState } from 'react';
import { Option, Scores } from '@/types/decision';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Twitter, Link2, Download, Share2 } from 'lucide-react';

const SHARE_URL = 'https://3d.ceoencamiseta.com?ref=share';

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
    return `Comparé "${option.name}" vs "${comparison.name}".
${tradeoff ? tradeoff + '.' : ''}
¿Qué harías vos?
${SHARE_URL}`;
  }
  
  return `Me salió esto en mi 3D (Dinero ${dinero} | Desarrollo ${desarrollo} | Diversión ${diversion}).
${label}.
¿Vos qué harías?
${SHARE_URL}`;
}

function getTwitterText(
  option: Option,
  label: IdentityLabel,
  comparison: Option | null
): string {
  const { dinero, desarrollo, diversion } = option.scores;
  
  if (comparison) {
    const a = option.scores;
    const b = comparison.scores;
    const tradeoff = getTradeoff(a, b);
    return `Mi dilema 3D:
${option.name}: D$${a.dinero} Dev${a.desarrollo} Div${a.diversion}
${comparison.name}: D$${b.dinero} Dev${b.desarrollo} Div${b.diversion}
${tradeoff}
¿Cuál elegirías?
${SHARE_URL}`;
  }
  
  return `Mi 3D hoy: Dinero ${dinero} | Desarrollo ${desarrollo} | Diversión ${diversion}
${label}.
¿Cambiarías de trabajo con esto?
${SHARE_URL}`;
}

export function ShareSection({ currentOption, comparisonOption }: ShareSectionProps) {
  const [selectedLabel, setSelectedLabel] = useState<IdentityLabel>('Estoy estancado');
  const [showFallback, setShowFallback] = useState(false);
  const [imageFormat, setImageFormat] = useState<'feed' | 'story'>('feed');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNativeShare = async () => {
    const shareData = {
      title: '3D para decidir',
      text: getShareText(currentOption, selectedLabel, comparisonOption),
    };

    try {
      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        setShowFallback(true);
      }
    } catch (error) {
      // User cancelled or error
      if ((error as Error).name !== 'AbortError') {
        setShowFallback(true);
      }
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(getShareText(currentOption, selectedLabel, comparisonOption));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(getTwitterText(currentOption, selectedLabel, comparisonOption));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      toast({
        title: "Link copiado",
        description: "Pegalo donde quieras",
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar",
        variant: "destructive",
      });
    }
  };

  const generateImage = async (format: 'feed' | 'story') => {
    setIsGenerating(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Dimensions
      canvas.width = 1080;
      canvas.height = format === 'feed' ? 1350 : 1920;

      // Check dark mode
      const isDark = document.documentElement.classList.contains('dark');
      
      // Background
      ctx.fillStyle = isDark ? '#0f0f0f' : '#fafafa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Text color
      const textColor = isDark ? '#fafafa' : '#0f0f0f';
      const mutedColor = isDark ? '#a1a1aa' : '#71717a';
      const barBg = isDark ? '#27272a' : '#e4e4e7';

      const centerX = canvas.width / 2;
      let y = format === 'feed' ? 180 : 320;

      // Identity label badge
      ctx.fillStyle = textColor;
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.textAlign = 'center';
      
      // Draw label with border
      const labelText = selectedLabel;
      const labelMetrics = ctx.measureText(labelText);
      const labelPadding = 40;
      const labelWidth = labelMetrics.width + labelPadding * 2;
      const labelHeight = 80;
      
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(centerX - labelWidth / 2, y - 55, labelWidth, labelHeight, 12);
      ctx.stroke();
      
      ctx.fillText(labelText, centerX, y);
      y += 120;

      if (comparisonOption) {
        // Comparison mode
        ctx.font = 'bold 36px system-ui, sans-serif';
        ctx.fillText(`${currentOption.name}  vs  ${comparisonOption.name}`, centerX, y);
        y += 100;

        const dims: { label: string; key: keyof Scores }[] = [
          { label: 'Dinero', key: 'dinero' },
          { label: 'Desarrollo', key: 'desarrollo' },
          { label: 'Diversión', key: 'diversion' },
        ];

        const barWidth = 320;
        const barHeight = 50;
        const gap = 60;

        for (const dim of dims) {
          const aVal = currentOption.scores[dim.key];
          const bVal = comparisonOption.scores[dim.key];

          // Label
          ctx.font = '32px system-ui, sans-serif';
          ctx.fillStyle = mutedColor;
          ctx.textAlign = 'center';
          ctx.fillText(dim.label, centerX, y);
          y += 50;

          // Left bar (A)
          const leftX = centerX - gap - barWidth;
          ctx.fillStyle = barBg;
          ctx.beginPath();
          ctx.roundRect(leftX, y, barWidth, barHeight, 8);
          ctx.fill();
          
          ctx.fillStyle = textColor;
          ctx.beginPath();
          ctx.roundRect(leftX, y, barWidth * (aVal / 10), barHeight, 8);
          ctx.fill();

          // Right bar (B)
          const rightX = centerX + gap;
          ctx.fillStyle = barBg;
          ctx.beginPath();
          ctx.roundRect(rightX, y, barWidth, barHeight, 8);
          ctx.fill();
          
          ctx.fillStyle = textColor;
          ctx.beginPath();
          ctx.roundRect(rightX, y, barWidth * (bVal / 10), barHeight, 8);
          ctx.fill();

          // Scores
          ctx.font = 'bold 36px system-ui, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(String(aVal), leftX - 20, y + 38);
          ctx.textAlign = 'left';
          ctx.fillText(String(bVal), rightX + barWidth + 20, y + 38);

          y += barHeight + 60;
        }

        // Trade-off
        const tradeoff = getTradeoff(currentOption.scores, comparisonOption.scores);
        if (tradeoff) {
          y += 20;
          ctx.fillStyle = mutedColor;
          ctx.font = '36px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(tradeoff, centerX, y);
        }
      } else {
        // Single option mode
        const dims: { label: string; value: number }[] = [
          { label: 'Dinero', value: currentOption.scores.dinero },
          { label: 'Desarrollo', value: currentOption.scores.desarrollo },
          { label: 'Diversión', value: currentOption.scores.diversion },
        ];

        const barWidth = 700;
        const barHeight = 60;

        for (const dim of dims) {
          // Label
          ctx.font = '36px system-ui, sans-serif';
          ctx.fillStyle = mutedColor;
          ctx.textAlign = 'left';
          ctx.fillText(dim.label, centerX - barWidth / 2, y);
          y += 50;

          // Bar background
          ctx.fillStyle = barBg;
          ctx.beginPath();
          ctx.roundRect(centerX - barWidth / 2, y, barWidth, barHeight, 10);
          ctx.fill();

          // Bar fill
          ctx.fillStyle = textColor;
          ctx.beginPath();
          ctx.roundRect(centerX - barWidth / 2, y, barWidth * (dim.value / 10), barHeight, 10);
          ctx.fill();

          // Score
          ctx.font = 'bold 40px system-ui, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(String(dim.value), centerX + barWidth / 2 + 60, y + 45);

          y += barHeight + 70;
        }
      }

      // URL at bottom
      ctx.fillStyle = mutedColor;
      ctx.font = '28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('3d.ceoencamiseta.com', centerX, canvas.height - 80);

      // Download
      const link = document.createElement('a');
      link.download = `mi-3d-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: "Imagen descargada",
        description: format === 'feed' ? "Lista para Feed" : "Lista para Stories",
      });
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold">Pedí una segunda opinión</h3>
        <p className="text-sm text-muted-foreground">
          Mandáselo a alguien y preguntale qué haría
        </p>
      </div>

      {/* Identity Labels */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Elegí cómo te sentís:</p>
        <div className="flex flex-wrap gap-2">
          {IDENTITY_LABELS.map((label) => (
            <button
              key={label}
              onClick={() => setSelectedLabel(label)}
              className={`px-3 py-2 text-sm rounded-sm border transition-all
                ${selectedLabel === label
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background border-border hover:border-foreground/50'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Share Button */}
      <button
        onClick={handleNativeShare}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Share2 size={18} />
        Compartir...
      </button>

      {/* Fallback Buttons (always shown on desktop or after failed native share) */}
      <div className={`flex gap-2 ${showFallback ? '' : 'hidden sm:flex'}`}>
        <button
          onClick={shareWhatsApp}
          className="flex-1 px-4 py-2.5 text-sm border border-border rounded-sm 
                     hover:bg-secondary transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle size={16} />
          WhatsApp
        </button>
        <button
          onClick={shareTwitter}
          className="flex-1 px-4 py-2.5 text-sm border border-border rounded-sm 
                     hover:bg-secondary transition-colors flex items-center justify-center gap-2"
        >
          <Twitter size={16} />
          Twitter
        </button>
        <button
          onClick={copyLink}
          className="flex-1 px-4 py-2.5 text-sm border border-border rounded-sm 
                     hover:bg-secondary transition-colors flex items-center justify-center gap-2"
        >
          <Link2 size={16} />
          Copiar
        </button>
      </div>

      {/* Image Download */}
      <div className="space-y-3 pt-2">
        <div className="flex gap-2">
          <button
            onClick={() => setImageFormat('feed')}
            className={`flex-1 px-3 py-1.5 text-xs rounded-sm border transition-all
              ${imageFormat === 'feed'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background border-border hover:border-foreground/50'
              }`}
          >
            Feed (1080×1350)
          </button>
          <button
            onClick={() => setImageFormat('story')}
            className={`flex-1 px-3 py-1.5 text-xs rounded-sm border transition-all
              ${imageFormat === 'story'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background border-border hover:border-foreground/50'
              }`}
          >
            Story (1080×1920)
          </button>
        </div>
        <button
          onClick={() => generateImage(imageFormat)}
          disabled={isGenerating}
          className="w-full px-4 py-2.5 text-sm border border-border rounded-sm 
                     hover:bg-secondary transition-colors flex items-center justify-center gap-2
                     disabled:opacity-50"
        >
          <Download size={16} />
          {isGenerating ? 'Generando...' : 'Descargar imagen'}
        </button>
      </div>
    </div>
  );
}
