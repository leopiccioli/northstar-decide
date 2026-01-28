import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StatsRequest {
  period: 'month' | 'all';
  dimension: 'dinero' | 'desarrollo' | 'diversion' | 'promedio';
}

interface CountryStat {
  country: string;
  avg: number;
  count: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { period, dimension }: StatsRequest = await req.json();

    console.log(`[get-country-stats] Fetching from cache: period=${period}, dimension=${dimension}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Read from cache table
    const { data, error } = await supabase
      .from('country_stats_cache')
      .select('country, avg_value, count')
      .eq('period', period)
      .eq('dimension', dimension);

    if (error) {
      console.error('[get-country-stats] Query error:', error);
      throw error;
    }

    console.log(`[get-country-stats] Found ${data?.length ?? 0} cached entries`);

    const stats: CountryStat[] = (data || []).map(row => ({
      country: row.country,
      avg: row.avg_value,
      count: row.count,
    }));

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
