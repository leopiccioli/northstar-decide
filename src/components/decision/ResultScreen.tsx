import { Option } from '@/types/decision';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useTrackingData } from '@/hooks/useTrackingData';
import { supabase } from '@/integrations/supabase/client';
import { GlobalScore } from './GlobalScore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'CL', name: 'Chile' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'ES', name: 'España' },
  { code: 'CO', name: 'Colombia' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'PE', name: 'Perú' },
  { code: 'HN', name: 'Honduras' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'MX', name: 'México' },
  { code: 'IT', name: 'Italia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'EC', name: 'Ecuador' },
];

interface ResultScreenProps {
  currentOption: Option;
  comparisonOption: Option | null;
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

function SaveSection({ 
  currentOption, 
  comparisonOption 
}: { 
  currentOption: Option; 
  comparisonOption: Option | null;
}) {
  const trackingData = useTrackingData();
  
  const [email, setEmail] = useState(trackingData.email || '');
  const [country, setCountry] = useState('');
  const [reminder, setReminder] = useState<ReminderPeriod>('1m');
  const [isSaving, setIsSaving] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [countryError, setCountryError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
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

    setIsSaving(true);

    try {
      const payload = {
        email: trimmedEmail,
        country,
        optionName: currentOption.name,
        scores: currentOption.scores,
        comment: currentOption.comment,
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

      const { data, error } = await supabase.functions.invoke('save-result', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || 'Error al guardar');
      }

      // Success - show appropriate message
      // emailPending means email is being sent in background
      const emailPending = data?.emailPending;
      
      toast({
        title: "Resultado guardado",
        description: reminder !== 'none'
          ? `Te avisaremos ${reminderOptions.find(r => r.id === reminder)?.label.toLowerCase()}. Revisá tu email.`
          : emailPending 
            ? "Revisá tu email en unos segundos."
            : "Tus datos quedaron guardados.",
      });

      setEmail('');
      setCountry('');
      setReminder('1m');
    } catch (error) {
      console.error('Save error:', error);
      // Keep email on error - don't clear it
      toast({
        title: "Error",
        description: "No pudimos guardar tu resultado. Intentá de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 p-4 bg-secondary rounded-sm border border-border animate-fade-up">
      {/* Microcopy */}
      <p className="text-subtle text-center">
        Quienes repiten el 3D suelen mejorar sus puntajes con el tiempo.
      </p>

      <div className="space-y-2">
        <label className="text-sm font-medium">Guardá tu resultado y comparalo después</label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError('');
          }}
          placeholder="email@ejemplo.com"
          className={`w-full px-4 py-3 bg-background border rounded-sm
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-1 focus:ring-foreground
                     ${emailError ? 'border-destructive' : 'border-border'}`}
        />
        {emailError && (
          <p className="text-sm text-destructive">{emailError}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">País</label>
        <Select value={country} onValueChange={(val) => {
          setCountry(val);
          if (countryError) setCountryError('');
        }}>
          <SelectTrigger className={`w-full ${countryError ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="Seleccioná tu país" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {countryError && (
          <p className="text-sm text-destructive">{countryError}</p>
        )}
      </div>

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
          disabled={!email.trim() || isSaving}
          className="btn-primary flex-1 text-sm py-2 disabled:opacity-40"
        >
          {isSaving ? 'Guardando...' : 'Guardar y avisarme'}
        </button>
      </div>
    </div>
  );
}

export function ResultScreen({ 
  currentOption, 
  comparisonOption, 
}: ResultScreenProps) {

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

        {/* Save section - inline */}
        <div className="animate-fade-up opacity-0 stagger-2">
          <SaveSection 
            currentOption={currentOption} 
            comparisonOption={comparisonOption} 
          />
        </div>
      </div>
    </div>
  );
}
