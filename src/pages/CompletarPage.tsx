import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SECTORS, AGE_RANGES, isValidAgeRange, isValidSector } from '@/lib/demographics';
import { SectorCombobox } from '@/components/decision/SectorCombobox';
import { AgeRangeChips } from '@/components/decision/AgeRangeChips';
import { trackFlowEvent, trackCustomEvent } from '@/lib/analytics';


type State =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'form'; record: RecordData; missingAge: boolean; missingSector: boolean }
  | { kind: 'done'; record: RecordData };

interface RecordData {
  email_masked: string;
  sector: string | null;
  age_range: string | null;
  dinero: number;
  desarrollo: number;
  diversion: number;
  created_at: string;
}

const SITE_BASE = 'https://3d.ceoencamiseta.com';

export default function CompletarPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const urlAge = params.get('age') || '';

  const [state, setState] = useState<State>({ kind: 'loading' });
  const [sectorValue, setSectorValue] = useState('');
  const [ageValue, setAgeValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Load record
  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid' });
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-record-for-backfill', {
          body: { token },
        });
        if (error || !data || data.error) {
          setState({ kind: 'invalid' });
          return;
        }
        const record = data as RecordData;
        const missingAge = !record.age_range;
        const missingSector = !record.sector;

        // If both already present
        if (!missingAge && !missingSector) {
          setState({ kind: 'done', record });
          return;
        }

        // Auto-save age from URL if missing
        if (missingAge && urlAge && isValidAgeRange(urlAge)) {
          const { data: upd, error: upErr } = await supabase.functions.invoke('update-demographics', {
            body: { token, ageRange: urlAge },
          });
          if (!upErr && upd && !upd.error) {
            trackFlowEvent('complete_demographics', { source: 'url_auto', has_age: true, has_sector: false });
            const updatedRecord = { ...record, age_range: urlAge };
            if (!missingSector) {
              setState({ kind: 'done', record: updatedRecord });
              return;
            }
            setState({
              kind: 'form',
              record: updatedRecord,
              missingAge: false,
              missingSector: true,
            });
            return;
          }
        }


        setState({ kind: 'form', record, missingAge, missingSector });
      } catch (e) {
        console.error(e);
        setState({ kind: 'invalid' });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submitForm = async () => {
    if (state.kind !== 'form') return;
    const payload: { token: string; sector?: string; ageRange?: string } = { token };
    if (state.missingSector && sectorValue && isValidSector(sectorValue)) payload.sector = sectorValue;
    if (state.missingAge && ageValue && isValidAgeRange(ageValue)) payload.ageRange = ageValue;
    if (!payload.sector && !payload.ageRange) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-demographics', {
        body: payload,
      });
      if (error || !data || data.error) {
        setSaving(false);
        return;
      }
      setState({
        kind: 'done',
        record: {
          ...state.record,
          sector: payload.sector || state.record.sector,
          age_range: payload.ageRange || state.record.age_range,
        },
      });
      trackFlowEvent('complete_demographics', {
        source: 'form',
        has_sector: Boolean(payload.sector),
        has_age: Boolean(payload.ageRange),
      });

    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  // Auto-submit when only one field needed and it changes
  useEffect(() => {
    if (state.kind !== 'form') return;
    if (state.missingSector && !state.missingAge && sectorValue) {
      submitForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectorValue]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-display tracking-tight">3D para Decidir</h1>
        </header>

        {state.kind === 'loading' && (
          <div className="text-muted-foreground text-sm">Cargando…</div>
        )}

        {state.kind === 'invalid' && (
          <div className="space-y-4">
            <p className="text-sm">Link no válido o expirado.</p>
            <Link to="/" className="inline-block text-sm underline underline-offset-4">
              Ir al inicio →
            </Link>
          </div>
        )}

        {state.kind === 'form' && (
          <div className="space-y-6">
            {!state.missingAge && state.record.age_range && (
              <p className="text-sm text-muted-foreground">
                Listo, gracias. Edad <strong className="text-foreground">{state.record.age_range}</strong> guardada.
              </p>
            )}

            <p className="text-sm">
              {state.missingAge && state.missingSector
                ? 'Para que tu medición aparezca en las comparaciones, faltan estos datos:'
                : state.missingSector
                ? 'Solo falta tu sector:'
                : 'Solo falta tu edad:'}
            </p>

            {state.missingAge && (
              <AgeRangeChips value={ageValue} onChange={setAgeValue} />
            )}

            {state.missingSector && (
              <SectorCombobox value={sectorValue} onChange={setSectorValue} />
            )}

            {(state.missingAge || state.missingSector) && !(state.missingSector && !state.missingAge) && (
              <button
                type="button"
                onClick={submitForm}
                disabled={
                  saving ||
                  (state.missingAge && !ageValue) ||
                  (state.missingSector && !sectorValue)
                }
                className="w-full py-3 bg-foreground text-background text-sm rounded-sm
                  disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            )}
          </div>
        )}

        {state.kind === 'done' && (
          <div className="space-y-6">
            <p className="text-sm">Listo. Gracias.</p>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Mirá cómo te comparás</p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`${SITE_BASE}/por-edad?utm_source=completar&utm_medium=app&utm_campaign=demographics_backfill&utm_content=por_edad`}
                  onClick={() => trackFlowEvent('open_stats', { surface: 'completar', target: 'age' })}
                  className="text-center py-2.5 text-xs border border-border rounded-sm hover:border-foreground/50 transition-colors"
                >
                  Por edad
                </a>
                <a
                  href={`${SITE_BASE}/por-sector?utm_source=completar&utm_medium=app&utm_campaign=demographics_backfill&utm_content=por_sector`}
                  onClick={() => trackFlowEvent('open_stats', { surface: 'completar', target: 'sector' })}
                  className="text-center py-2.5 text-xs border border-border rounded-sm hover:border-foreground/50 transition-colors"
                >
                  Por sector
                </a>

              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">¿Pasaron unos meses?</p>
              <Link
                to="/?utm_source=completar&utm_medium=app&utm_campaign=demographics_backfill&utm_content=redo"
                className="block text-center py-3 bg-foreground text-background text-sm rounded-sm"
              >
                Medirme otra vez
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
