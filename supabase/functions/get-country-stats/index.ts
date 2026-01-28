import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StatsRequest {
  period: 'month' | '3months' | 'all';
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

    console.log(`[get-country-stats] Fetching stats for period=${period}, dimension=${dimension}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Build date filter
    let dateFilter: Date | null = null;
    if (period === 'month') {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else if (period === '3months') {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 3);
    }

    // Fetch all records with country
    let query = supabase
      .from('records_3d')
      .select('country, dinero, desarrollo, diversion')
      .not('country', 'is', null);

    if (dateFilter) {
      query = query.gte('created_at', dateFilter.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('[get-country-stats] Query error:', error);
      throw error;
    }

    console.log(`[get-country-stats] Found ${data?.length ?? 0} records`);

    // Aggregate by country
    const byCountry: Record<string, { sum: number; count: number }> = {};
    
    for (const row of data || []) {
      if (!row.country) continue;
      
      if (!byCountry[row.country]) {
        byCountry[row.country] = { sum: 0, count: 0 };
      }

      let value: number;
      if (dimension === 'promedio') {
        value = (row.dinero + row.desarrollo + row.diversion) / 3;
      } else {
        value = row[dimension];
      }

      byCountry[row.country].sum += value;
      byCountry[row.country].count++;
    }

    const stats: CountryStat[] = Object.entries(byCountry).map(([country, data]) => ({
      country,
      avg: Math.round((data.sum / data.count) * 10) / 10,
      count: data.count,
    }));

    console.log(`[get-country-stats] Aggregated ${stats.length} countries`);

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
