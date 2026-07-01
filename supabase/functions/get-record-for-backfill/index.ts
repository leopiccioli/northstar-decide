import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version",
};

// Naive in-memory rate limit per IP (10 req/min)
const RATE: Map<string, { count: number; ts: number }> = (globalThis as any).__rate_get_record || new Map();
(globalThis as any).__rate_get_record = RATE;

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

    const { token } = await req.json();
    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ error: 'invalid_token' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: record, error } = await supabase
      .from('records_3d')
      .select('id, email, sector, age_range, dinero, desarrollo, diversion, created_at')
      .eq('id', token)
      .maybeSingle();

    if (error || !record) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only accept tokens that were sent out in a demographics-backfill email,
    // so the public share URL (same UUID) cannot be used to enumerate demographics.
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

    return new Response(JSON.stringify({
      sector: record.sector,
      age_range: record.age_range,
      dinero: record.dinero,
      desarrollo: record.desarrollo,
      diversion: record.diversion,
      created_at: record.created_at,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error('get-record-for-backfill error:', err);
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
