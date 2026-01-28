import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StatsRequest {
  period: 'quarter' | 'all';
}

interface CountryFullStat {
  country: string;
  dinero: number;
  desarrollo: number;
  diversion: number;
  promedio: number;
  count: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { period }: StatsRequest = await req.json();

    console.log(`[get-country-stats] Fetching all dimensions for period=${period}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all dimensions for the period
    const { data, error } = await supabase
      .from('country_stats_cache')
      .select('country, dimension, avg_value, count')
      .eq('period', period);

    if (error) {
      console.error('[get-country-stats] Query error:', error);
      throw error;
    }

    console.log(`[get-country-stats] Found ${data?.length ?? 0} cached entries`);

    // Group by country
    const byCountry = new Map<string, CountryFullStat>();
    
    for (const row of data || []) {
      if (!byCountry.has(row.country)) {
        byCountry.set(row.country, {
          country: row.country,
          dinero: 0,
          desarrollo: 0,
          diversion: 0,
          promedio: 0,
          count: row.count,
        });
      }
      const stat = byCountry.get(row.country)!;
      if (row.dimension === 'dinero') stat.dinero = row.avg_value ?? 0;
      else if (row.dimension === 'desarrollo') stat.desarrollo = row.avg_value ?? 0;
      else if (row.dimension === 'diversion') stat.diversion = row.avg_value ?? 0;
      else if (row.dimension === 'promedio') stat.promedio = row.avg_value ?? 0;
    }

    const stats = Array.from(byCountry.values());
    console.log(`[get-country-stats] Returning ${stats.length} countries`);

    return new Response(
      JSON.stringify({ stats }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[get-country-stats] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
