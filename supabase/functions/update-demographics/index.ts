import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version",
};

const ALLOWED_SECTORS = new Set([
  'Tecnología / Software',
  'Finanzas / Banca / Seguros',
  'Consultoría',
  'Salud',
  'Educación',
  'Retail / Comercio',
  'Industria / Manufactura',
  'Construcción',
  'Gobierno / Sector público',
  'Medios / Comunicación',
  'Agro',
  'Energía',
  'Hospitalidad / Turismo',
  'ONG / Tercer sector',
  'Otro',
]);
const ALLOWED_AGE_RANGES = new Set(['18-24','25-34','35-44','45-54','55-64','65+']);

const RATE: Map<string, { count: number; ts: number }> = (globalThis as any).__rate_update_demo || new Map();
(globalThis as any).__rate_update_demo = RATE;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = RATE.get(ip);
  if (!entry || now - entry.ts > 60_000) {
    RATE.set(ip, { count: 1, ts: now });
    return false;
  }
  entry.count++;
  return entry.count > 10;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (rateLimited(ip)) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { token, sector, ageRange } = await req.json();
    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ error: 'invalid_token' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const update: Record<string, string> = {};
    if (sector !== undefined && sector !== null && sector !== '') {
      if (!ALLOWED_SECTORS.has(sector)) {
        return new Response(JSON.stringify({ error: 'invalid_sector' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      update.sector = sector;
    }
    if (ageRange !== undefined && ageRange !== null && ageRange !== '') {
      if (!ALLOWED_AGE_RANGES.has(ageRange)) {
        return new Response(JSON.stringify({ error: 'invalid_age_range' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      update.age_range = ageRange;
    }

    if (Object.keys(update).length === 0) {
      return new Response(JSON.stringify({ error: 'nothing_to_update' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Only allow updates for records whose owner received a demographics-backfill email.
    // Prevents anyone with a share URL UUID from overwriting demographics.
    const { data: record } = await supabase
      .from('records_3d')
      .select('id, email')
      .eq('id', token)
      .maybeSingle();

    if (!record) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: emailSent } = await supabase
      .from('outbound_emails')
      .select('id')
      .eq('email_type', 'demographics_backfill')
      .ilike('to_email', record.email)
      .limit(1)
      .maybeSingle();

    if (!emailSent) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: updated, error } = await supabase
      .from('records_3d')
      .update(update)
      .eq('id', token)
      .select('id, sector, age_range')
      .maybeSingle();

    if (error || !updated) {
      console.error('update-demographics error:', error);
      return new Response(JSON.stringify({ error: 'update_failed' }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      sector: updated.sector,
      age_range: updated.age_range,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error('update-demographics error:', err);
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
