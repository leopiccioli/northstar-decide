import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { GlobalScore } from '@/components/decision/GlobalScore';
import { generateShareImage, getShareText } from '@/components/decision/ShareImageGenerator';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, ExternalLink, Loader2 } from 'lucide-react';
import { Option, Scores } from '@/types/decision';
import { SITE_CONFIG, buildBeehiivUrl } from '@/config/urls';
import { SEO } from '@/components/SEO';

interface ResultData {
  optionName: string;
  scores: Scores;
  comment?: string;
  comparison?: {
    name: string;
    dinero: number;
    desarrollo: number;
    diversion: number;
    comment?: string;
  };
}

function ScoreBar({ label, value, maxValue = 10 }: { 
  label: string; 
  value: number; 
  maxValue?: number;
}) {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground tabular-nums">{value}/10</span>
      </div>
      <div className="h-3 bg-secondary rounded-sm overflow-hidden">
        <div 
          className="h-full bg-foreground transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ComparisonTable({ a, b }: { a: Option; b: Option }) {
  const getDiff = (key: keyof Scores) => {
    const diff = b.scores[key] - a.scores[key];
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return '=';
  };

  const getWinner = (key: keyof Scores): 'a' | 'b' | 'tie' => {
    if (a.scores[key] > b.scores[key]) return 'a';
    if (b.scores[key] > a.scores[key]) return 'b';
    return 'tie';
  };

  const rows = [
    { key: 'dinero' as const, label: 'Dinero' },
    { key: 'desarrollo' as const, label: 'Desarrollo' },
    { key: 'diversion' as const, label: 'Diversión' },
  ];

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary">
            <th className="px-4 py-3 text-left font-medium"></th>
            <th className="px-4 py-3 text-center font-medium">{a.name}</th>
            <th className="px-4 py-3 text-center font-medium">{b.name}</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const winner = getWinner(row.key);
            return (
              <tr key={row.key} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{row.label}</td>
                <td className={`px-4 py-3 text-center font-mono ${winner === 'a' ? 'font-bold' : ''}`}>
                  {a.scores[row.key]}
                </td>
                <td className={`px-4 py-3 text-center font-mono ${winner === 'b' ? 'font-bold' : ''}`}>
                  {b.scores[row.key]}
                </td>
                <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                  {getDiff(row.key)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (id) {
      loadResult();
    }
  }, [id]);

  const loadResult = async () => {
    try {
      const { data, error: queryError } = await supabase.rpc('get_public_result', {
        result_id: id,
      });

      if (queryError) {
        setError('Error al buscar resultado');
        return;
      }

      if (!data || data.length === 0) {
        setError('Resultado no encontrado');
        return;
      }

      const row = data[0];
      setResult({
        optionName: row.option_name,
        scores: {
          dinero: row.dinero,
          desarrollo: row.desarrollo,
          diversion: row.diversion,
        },
        comment: row.comment ?? undefined,
        comparison: row.comparison as ResultData['comparison'] ?? undefined,
      });
    } catch (err) {
      console.error('Load error:', err);
      setError('Error al cargar el resultado');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    
    setIsSharing(true);
    
    try {
      const currentOption: Option = {
        name: result.optionName,
        scores: result.scores,
        comment: result.comment,
      };

      const comparisonOption: Option | null = result.comparison ? {
        name: result.comparison.name,
        scores: {
          dinero: result.comparison.dinero,
          desarrollo: result.comparison.desarrollo,
          diversion: result.comparison.diversion,
        },
        comment: result.comparison.comment,
      } : null;

      const shareText = getShareText('check', currentOption, comparisonOption);
      const shareUrl = `${SITE_CONFIG.baseUrl}/r/${id}`;
      const fullText = `${shareText}\n${shareUrl}`;

      // Check if we can share files on mobile
      if (isMobile && navigator.share && navigator.canShare) {
        try {
          const isDark = document.documentElement.classList.contains('dark');
          const imageBlob = await generateShareImage({
            currentOption,
            comparisonOption,
            userContext: 'check',
            isDark,
          });
          const file = new File([imageBlob], 'mis-3d-laborales.png', { type: 'image/png' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              text: shareText,
              url: shareUrl,
            });
            return;
          }
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
        }
      }

      // Try native share with text only
      if (navigator.share) {
        try {
          await navigator.share({ text: fullText });
          return;
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
        }
      }

      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(fullText);
      toast({
        title: "Copiado",
        description: "Pegalo en WhatsApp o donde quieras",
      });
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Error",
        description: "No se pudo compartir",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Cargando resultado...</p>
      </div>
    );
  }

  // Error state
  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold">Resultado no encontrado</h1>
          <p className="text-sm text-muted-foreground">
            {error || 'Este link puede haber expirado o ser inválido.'}
          </p>
          <a href="/" className="btn-primary inline-block px-6 py-3">
            Hacer mi propio 3D
          </a>
        </div>
      </div>
    );
  }

  const currentOption: Option = {
    name: result.optionName,
    scores: result.scores,
    comment: result.comment,
  };

  const comparisonOption: Option | null = result.comparison ? {
    name: result.comparison.name,
    scores: {
      dinero: result.comparison.dinero,
      desarrollo: result.comparison.desarrollo,
      diversion: result.comparison.diversion,
    },
    comment: result.comparison.comment,
  } : null;

  const shareUrl = `${SITE_CONFIG.baseUrl}/r/${id}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <SEO title="Mi resultado 3D" path={`/r/${id}`} noIndex />
      <div className="max-w-md w-full space-y-10">
        <h1 className="sr-only">Resultados de tu medición 3D</h1>
        
        
        {/* Single option result */}
        {!comparisonOption && (
          <div className="space-y-6 animate-fade-up">
            <h2 className="text-xl font-semibold">{currentOption.name}</h2>
            
            <div className="space-y-5">
              <ScoreBar label="Dinero" value={currentOption.scores.dinero} />
              <ScoreBar label="Desarrollo" value={currentOption.scores.desarrollo} />
              <ScoreBar label="Diversión" value={currentOption.scores.diversion} />
            </div>

            <GlobalScore scores={currentOption.scores} />

            {currentOption.comment && (
              <blockquote className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                "{currentOption.comment}"
              </blockquote>
            )}
          </div>
        )}

        {/* Comparison result */}
        {comparisonOption && (
          <div className="space-y-6 animate-fade-up">
            <ComparisonTable a={currentOption} b={comparisonOption} />
            
            <div className="grid grid-cols-2 gap-3">
              <GlobalScore scores={currentOption.scores} label={currentOption.name} />
              <GlobalScore scores={comparisonOption.scores} label={comparisonOption.name} />
            </div>
            
            {(currentOption.comment || comparisonOption.comment) && (
              <div className="space-y-3">
                {currentOption.comment && (
                  <blockquote className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                    <span className="font-medium not-italic">{currentOption.name}:</span> "{currentOption.comment}"
                  </blockquote>
                )}
                {comparisonOption.comment && (
                  <blockquote className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                    <span className="font-medium not-italic">{comparisonOption.name}:</span> "{comparisonOption.comment}"
                  </blockquote>
                )}
              </div>
            )}
          </div>
        )}

        {/* Share actions */}
        <div className="space-y-4 animate-fade-up">
          {isMobile ? (
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isSharing ? 'Compartiendo...' : 'Compartir mi resultado'}
            </button>
          ) : (
            <div className="p-6 bg-secondary rounded-sm border border-border text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Smartphone className="w-5 h-5" />
                <span className="font-medium">Compartí desde tu celular</span>
              </div>
              <div className="p-3 bg-white rounded-lg inline-block">
                <QRCodeSVG
                  value={shareUrl}
                  size={120}
                  level="M"
                  bgColor="white"
                  fgColor="black"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Escaneá para abrir en tu celular y compartir
              </p>
            </div>
          )}

          <a
            href={buildBeehiivUrl({ utmMedium: 'shared' })}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 text-sm border border-border rounded-sm
                       hover:border-foreground/50 transition-colors
                       flex items-center justify-center gap-2"
          >
            Unirme a CEO en Camiseta
            <ExternalLink className="w-4 h-4" />
          </a>

          <a 
            href="/" 
            className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Hacer mi propio 3D →
          </a>
        </div>
      </div>
    </div>
  );
}
