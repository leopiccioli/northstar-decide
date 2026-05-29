import { Option, UserContext, contextQuestions } from '@/types/decision';
import { useState, useRef, lazy, Suspense } from 'react';
import { toast } from '@/hooks/use-toast';
import { useTrackingData } from '@/hooks/useTrackingData';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { GlobalScore } from './GlobalScore';
import { Check, ExternalLink, Smartphone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { QRCodeSVG } from 'qrcode.react';
import { SITE_CONFIG, buildBeehiivUrl, buildWhatsAppShareUrl } from '@/config/urls';
import { trackFlowEvent } from '@/lib/analytics';
import { detectEmailTypo } from '@/lib/emailTypo';
import { CompareWithOthers } from './CompareWithOthers';

// Lazy load CountryCombobox - only needed at save step
const CountryCombobox = lazy(() => import('./CountryCombobox').then(m => ({ default: m.CountryCombobox })));
const SectorCombobox = lazy(() => import('./SectorCombobox').then(m => ({ default: m.SectorCombobox })));
import { AgeRangeChips } from './AgeRangeChips';

// Dynamic imports for share functionality - loaded on demand
const loadShareUtils = () => import('./ShareImageGenerator');

interface ResultScreenProps {
  currentOption: Option;
  comparisonOption: Option | null;
  userContext: UserContext;
}

type ReminderPeriod = '1m' | '3m' | 'none';

const reminderOptions: { id: ReminderPeriod; label: string }[] = [
  { id: '1m', label: 'En 1 mes' },
  { id: '3m', label: 'En 3 meses' },
  { id: 'none', label: 'Sin recordatorio' },
];

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
          className="result-bar bg-foreground"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ComparisonTable({ a, b }: { a: Option; b: Option }) {
  const getDiff = (key: keyof typeof a.scores) => {
    const diff = b.scores[key] - a.scores[key];
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return '=';
  };

  const getWinner = (key: keyof typeof a.scores): 'a' | 'b' | 'tie' => {
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

// Success screen shown after saving - now with share capabilities
function SuccessWithShare({ 
  recordId,
  isMobile, 
  onShare,
  email,
}: { 
  recordId: string;
  isMobile: boolean;
  onShare: () => void;
  email: string;
}) {
  const shareUrl = `${SITE_CONFIG.baseUrl}/r/${recordId}`;
  const ceoUrl = buildBeehiivUrl({ email, utmMedium: 'result' });

  return (
    <div className="space-y-6 p-6 bg-secondary rounded-sm border border-border animate-fade-up text-center">
      <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-foreground text-background">
        <Check className="w-6 h-6" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Resultado guardado</h3>
        <p className="text-sm text-muted-foreground">
          Te mandamos un email con tus 3D.<br />
          Revisá tu bandeja de entrada.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {isMobile ? (
          <button
            onClick={onShare}
            className="btn-primary w-full"
          >
            Pedir una segunda opinión
          </button>
        ) : (
          <div className="p-4 bg-background rounded-sm border border-border space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Compartí desde tu celular</span>
            </div>
            <div className="p-2 bg-white rounded-lg inline-block">
              <QRCodeSVG
                value={shareUrl}
                size={100}
                level="M"
                bgColor="white"
                fgColor="black"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Escaneá para abrir y compartir
            </p>
          </div>
        )}
        
        <a
          href={ceoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 text-sm border border-border rounded-sm
                     hover:border-foreground/50 transition-colors
                     flex items-center justify-center gap-2"
        >
          Unirme a CEO en Camiseta
          <ExternalLink className="w-4 h-4" />
        </a>

        <div className="pt-2 space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            ¿Conocés a alguien que debería hacer esto?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={buildWhatsAppShareUrl('friend')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackFlowEvent('whatsapp_share_friend')}
              className="py-2.5 text-xs border border-border rounded-sm
                         hover:border-foreground/50 transition-colors
                         flex items-center justify-center"
            >
              Para un amigo
            </a>
            <a
              href={buildWhatsAppShareUrl('team')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackFlowEvent('whatsapp_share_team')}
              className="py-2.5 text-xs border border-border rounded-sm
                         hover:border-foreground/50 transition-colors
                         flex items-center justify-center"
            >
              Para mi equipo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// CountryCombobox is now lazy loaded from ./CountryCombobox.tsx

// Generate a temporary optimistic ID for immediate UI feedback
function generateOptimisticId(): string {
  return `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function SaveSection({ 
  currentOption, 
  comparisonOption,
  userContext,
  onSaveSuccess,
  onOptimisticSave,
}: { 
  currentOption: Option; 
  comparisonOption: Option | null;
  userContext: UserContext;
  onSaveSuccess: (recordId: string, email: string) => void;
  onOptimisticSave: (email: string) => void;
}) {
  const trackingData = useTrackingData();
  
  const [email, setEmail] = useState(trackingData.email || '');
  const [country, setCountry] = useState('');
  const [sector, setSector] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [reminder, setReminder] = useState<ReminderPeriod>('1m');
  const [emailError, setEmailError] = useState('');
  const [countryError, setCountryError] = useState('');
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailBlur = () => {
    const trimmed = email.trim();
    if (trimmed && !validateEmail(trimmed)) {
      setEmailError('Email inválido');
      setEmailSuggestion(null);
    } else if (trimmed) {
      const suggestion = detectEmailTypo(trimmed);
      setEmailSuggestion(suggestion);
    }
  };

  const handleSave = async () => {
    // Guard against double-click / re-entry
    if (isSavingRef.current) return;

    const trimmedEmail = email.trim();
    let hasError = false;
    
    if (!trimmedEmail) {
      setEmailError('Ingresá tu email');
      hasError = true;
    } else if (!validateEmail(trimmedEmail)) {
      setEmailError('Email inválido');
      hasError = true;
    } else {
      setEmailError('');
    }
    
    if (!country) {
      setCountryError('Seleccioná tu país');
      hasError = true;
    } else {
      setCountryError('');
    }

    if (hasError) return;

    // Lock to prevent duplicate POSTs from a fast second click
    isSavingRef.current = true;

    // OPTIMISTIC UI: Show success immediately
    onOptimisticSave(trimmedEmail);

    // Fire save in background (don't await blocking the UI)
    const payload = {
      email: trimmedEmail,
      country,
      sector: sector || undefined,
      ageRange: ageRange || undefined,
      optionName: currentOption.name,
      scores: currentOption.scores,
      comment: currentOption.comment,
      context: userContext,
      comparison: comparisonOption ? {
        name: comparisonOption.name,
        dinero: comparisonOption.scores.dinero,
        desarrollo: comparisonOption.scores.desarrollo,
        diversion: comparisonOption.scores.diversion,
        comment: comparisonOption.comment,
      } : undefined,
      reminderPeriod: reminder !== 'none' ? reminder : undefined,
      tracking: {
        utm_source: trackingData.utm_source,
        utm_medium: trackingData.utm_medium,
        utm_campaign: trackingData.utm_campaign,
        utm_content: trackingData.utm_content,
        utm_term: trackingData.utm_term,
        gclid: trackingData.gclid,
        fbclid: trackingData.fbclid,
        referrer: trackingData.referrer,
      },
    };

    // Background save - updates the real ID when done
    supabase.functions.invoke('save-result', { body: payload })
      .then(async ({ data, error }) => {
        if (error) {
          throw error;
        }
        if (data?.id) {
          // Update with real record ID for sharing
          onSaveSuccess(data.id, trimmedEmail);
        }
      })
      .catch(async (error) => {
        console.error('Background save error:', error);
        
        let errorMessage = "No pudimos guardar tu resultado, pero podés seguir compartiendo.";
        
        if (error instanceof FunctionsHttpError) {
          // 429 = rate limit: the user already saved recently, UI is already in success state.
          // Suppress the toast — it's just noise.
          if (error.context?.status === 429) {
            return;
          }
          try {
            const errorData = await error.context.json();
            if (errorData?.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // Use default message
          }
        }
        
        // Show non-blocking toast - user already sees success UI
        toast({
          title: "Aviso",
          description: errorMessage,
        });
      });
  };

  return (
    <div className="space-y-5 p-4 bg-secondary rounded-sm border border-border animate-fade-up">
      {/* Microcopy */}
      <p className="text-subtle text-center">
        Esto queda guardado para cuando quieras volver a mirarlo.
      </p>

      <div className="space-y-2">
        <label className="text-sm font-medium">Guardá este resultado para más adelante</label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError('');
            if (emailSuggestion) setEmailSuggestion(null);
          }}
          onBlur={handleEmailBlur}
          placeholder="email@ejemplo.com"
          className={`w-full px-4 py-3 bg-background border rounded-sm
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-1 focus:ring-foreground
                     ${emailError ? 'border-destructive' : 'border-border'}`}
        />
        {emailError && (
          <p className="text-sm text-destructive">{emailError}</p>
        )}
        {emailSuggestion && !emailError && (
          <p className="text-sm text-muted-foreground">
            Quisiste decir{' '}
            <button
              type="button"
              onClick={() => {
                setEmail(emailSuggestion);
                setEmailSuggestion(null);
              }}
              className="font-medium text-foreground underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {emailSuggestion}
            </button>
            ?
          </p>
        )}
      </div>

      <Suspense fallback={<div className="h-[72px] bg-secondary animate-pulse rounded-sm" />}>
        <CountryCombobox
          value={country}
          onChange={(val) => {
            setCountry(val);
            if (countryError) setCountryError('');
          }}
          error={countryError}
        />
      </Suspense>

      <Suspense fallback={<div className="h-[72px] bg-secondary animate-pulse rounded-sm" />}>
        <SectorCombobox value={sector} onChange={setSector} />
      </Suspense>

      <AgeRangeChips value={ageRange} onChange={setAgeRange} />

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Recordatorio</label>
        <div className="flex gap-1.5">
          {reminderOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setReminder(option.id)}
              className={`px-2.5 py-1.5 text-sm rounded-sm border transition-all whitespace-nowrap
                ${reminder === option.id 
                  ? 'bg-foreground text-background border-foreground' 
                  : 'bg-background border-border hover:border-foreground/50'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={!email.trim()}
          className="btn-primary flex-1 text-sm py-2 disabled:opacity-40"
        >
          {reminder === 'none' ? 'Guardar' : 'Guardar y avisarme'}
        </button>
      </div>
    </div>
  );
}

export default function ResultScreen({ 
  currentOption, 
  comparisonOption,
  userContext,
}: ResultScreenProps) {
  // Use optimistic ID initially, then replace with real ID when save completes
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const isMobile = useIsMobile();

  // Optimistic save: show success UI immediately
  const handleOptimisticSave = (email: string) => {
    // Track complete_3d with email for X Ads attribution
    trackFlowEvent('complete_3d', { 
      email,
      dinero: currentOption.scores.dinero, 
      desarrollo: currentOption.scores.desarrollo, 
      diversion: currentOption.scores.diversion 
    });
    trackFlowEvent('save_result', { email });
    const optimisticId = generateOptimisticId();
    setSavedRecordId(optimisticId);
    setSavedEmail(email);
    setShowSuccess(true);
  };

  // Real save completed: update with actual record ID
  const handleSaveSuccess = (realId: string, email: string) => {
    setSavedRecordId(realId);
    setSavedEmail(email);
  };

  const handleShare = async () => {
    trackFlowEvent('share_result');
    // Allow sharing even with optimistic ID (will use fallback text share)
    const isOptimistic = savedRecordId?.startsWith('optimistic-');
    
    setIsSharing(true);
    
    try {
      // Dynamic import share utilities only when sharing
      const { getShareText, generateShareImage } = await loadShareUtils();
      
      const shareText = getShareText(userContext, currentOption, comparisonOption);
      const shareUrl = isOptimistic ? SITE_CONFIG.baseUrl : `${SITE_CONFIG.baseUrl}/r/${savedRecordId}`;
      const fullText = `${shareText}\n${shareUrl}`;

      // Check if we can share files on mobile
      if (isMobile && navigator.share && navigator.canShare) {
        try {
          // Generate image
          const isDark = document.documentElement.classList.contains('dark');
          const imageBlob = await generateShareImage({
            currentOption,
            comparisonOption,
            userContext,
            isDark,
          });
          const file = new File([imageBlob], 'mis-3d-laborales.png', { type: 'image/png' });

          // Check if we can share the file
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              text: shareText,
              url: shareUrl,
            });
            return;
          }
        } catch (err) {
          // User cancelled or failed - try text share
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full space-y-10">
        
        {/* Single option result */}
        {!comparisonOption && (
          <div className="space-y-6 animate-fade-up">
            <h2 className="text-xl font-semibold">{currentOption.name}</h2>
            
            <div className="space-y-5">
              <ScoreBar 
                label="Dinero" 
                value={currentOption.scores.dinero} 
              />
              <ScoreBar 
                label="Desarrollo" 
                value={currentOption.scores.desarrollo} 
              />
              <ScoreBar 
                label="Diversión" 
                value={currentOption.scores.diversion}
              />
            </div>

            {/* Global score */}
            <GlobalScore scores={currentOption.scores} />

            {currentOption.comment && (
              <blockquote className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                {contextQuestions[userContext] && (
                  <span className="block not-italic text-xs text-muted-foreground/70 mb-1">{contextQuestions[userContext]}</span>
                )}
                "{currentOption.comment}"
              </blockquote>
            )}
          </div>
        )}

        {/* Comparison result */}
        {comparisonOption && (
          <div className="space-y-6 animate-fade-up">
            <ComparisonTable a={currentOption} b={comparisonOption} />
            
            {/* Global scores for comparison */}
            <div className="grid grid-cols-2 gap-3">
              <GlobalScore scores={currentOption.scores} label={currentOption.name} />
              <GlobalScore scores={comparisonOption.scores} label={comparisonOption.name} />
            </div>
            
            {(currentOption.comment || comparisonOption.comment) && (
              <div className="space-y-3">
                {currentOption.comment && (
                  <blockquote className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                    {contextQuestions[userContext] && (
                      <span className="block not-italic text-xs text-muted-foreground/70 mb-1">{contextQuestions[userContext]}</span>
                    )}
                    <span className="font-medium not-italic">{currentOption.name}:</span> "{currentOption.comment}"
                  </blockquote>
                )}
                {comparisonOption.comment && (
                  <blockquote className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                    {contextQuestions[userContext] && (
                      <span className="block not-italic text-xs text-muted-foreground/70 mb-1">{contextQuestions[userContext]}</span>
                    )}
                    <span className="font-medium not-italic">{comparisonOption.name}:</span> "{comparisonOption.comment}"
                  </blockquote>
                )}
              </div>
            )}
          </div>
        )}

        {/* Post-save: show success with share options (optimistic UI) */}
        {showSuccess && savedRecordId ? (
          <>
            <SuccessWithShare 
              recordId={savedRecordId}
              isMobile={isMobile}
              onShare={handleShare}
              email={savedEmail}
            />
            {/* Comparate con otros — links a /por-pais, /por-sector, /por-edad (post-save) */}
            <CompareWithOthers />
          </>
        ) : (
          /* Pre-save: show save form as primary CTA */
          <div className="animate-fade-up opacity-0 stagger-1">
            <SaveSection 
              currentOption={currentOption} 
              comparisonOption={comparisonOption}
              userContext={userContext}
              onSaveSuccess={handleSaveSuccess}
              onOptimisticSave={handleOptimisticSave}
            />
          </div>
        )}

      </div>
    </div>
  );
}
