import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const textHeaders = {
  ...corsHeaders,
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=600, s-maxage=1200",
};

const COUNTRY_NAMES: Record<string, string> = {
  AR: "Argentina", BO: "Bolivia", BR: "Brasil", CL: "Chile", CO: "Colombia",
  CR: "Costa Rica", DE: "Alemania", DO: "República Dominicana", EC: "Ecuador",
  ES: "España", GT: "Guatemala", HN: "Honduras", IT: "Italia", MX: "México",
  NI: "Nicaragua", PA: "Panamá", PE: "Perú", PR: "Puerto Rico", PT: "Portugal",
  PY: "Paraguay", SV: "El Salvador", US: "Estados Unidos", UY: "Uruguay",
  VE: "Venezuela", CA: "Canadá", IL: "Israel", JP: "Japón",
};

interface Row {
  period: string;
  dimension: string;
  avg_value: number;
  count: number;
  country?: string;
  sector?: string;
  age_range?: string;
}

function pivot<T extends Row>(rows: T[], keyField: keyof T): Map<string, { dinero?: number; desarrollo?: number; diversion?: number; promedio?: number; count: number }> {
  const map = new Map<string, { dinero?: number; desarrollo?: number; diversion?: number; promedio?: number; count: number }>();
  for (const r of rows) {
    if (r.period !== "all") continue;
    const key = String(r[keyField]);
    if (!key) continue;
    const cur = map.get(key) ?? { count: 0 };
    (cur as Record<string, number>)[r.dimension] = Number(r.avg_value);
    if (r.dimension === "promedio") cur.count = r.count;
    map.set(key, cur);
  }
  return map;
}

function renderTable(title: string, label: string, data: Map<string, { dinero?: number; desarrollo?: number; diversion?: number; promedio?: number; count: number }>, nameMap?: Record<string, string>): string {
  const rows = Array.from(data.entries())
    .filter(([, v]) => v.count >= 5)
    .sort((a, b) => (b[1].promedio ?? 0) - (a[1].promedio ?? 0));
  const lines: string[] = [];
  lines.push(`## ${title}`);
  lines.push("");
  lines.push(`| ${label} | N | Dinero | Desarrollo | Diversión | Promedio |`);
  lines.push(`| --- | ---: | ---: | ---: | ---: | ---: |`);
  for (const [k, v] of rows) {
    const name = nameMap?.[k] ?? k;
    lines.push(`| ${name} | ${v.count} | ${v.dinero ?? "-"} | ${v.desarrollo ?? "-"} | ${v.diversion ?? "-"} | ${v.promedio ?? "-"} |`);
  }
  lines.push("");
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [global, country, sector, age, total] = await Promise.all([
      supabase.rpc("get_global_stats"),
      supabase.from("country_stats_cache").select("country, period, dimension, avg_value, count"),
      supabase.from("sector_stats_cache").select("sector, period, dimension, avg_value, count"),
      supabase.from("age_range_stats_cache").select("age_range, period, dimension, avg_value, count"),
      supabase.rpc("get_measurement_count"),
    ]);

    const lines: string[] = [];
    lines.push("# Estadísticas — Las 3D del Trabajo");
    lines.push("");
    lines.push("> Promedios de Dinero, Desarrollo y Diversión (escala 1–10) reportados por la comunidad. Última actualización: " + new Date().toISOString() + ".");
    lines.push("");

    const g = (global.data as Array<{ avg_dinero: number; avg_desarrollo: number; avg_diversion: number; avg_global: number; total: number }> | null)?.[0];
    lines.push("## Global");
    lines.push("");
    if (g) {
      lines.push(`- Mediciones totales: ${total.data ?? g.total}`);
      lines.push(`- Promedio Dinero: ${g.avg_dinero}/10`);
      lines.push(`- Promedio Desarrollo: ${g.avg_desarrollo}/10`);
      lines.push(`- Promedio Diversión: ${g.avg_diversion}/10`);
      lines.push(`- Promedio global (3D): ${g.avg_global}/10`);
    } else {
      lines.push(`- Mediciones totales: ${total.data ?? "-"}`);
    }
    lines.push("");

    lines.push(renderTable("Por país", "País", pivot((country.data ?? []) as Row[], "country" as keyof Row), COUNTRY_NAMES));
    lines.push(renderTable("Por sector", "Sector", pivot((sector.data ?? []) as Row[], "sector" as keyof Row)));
    lines.push(renderTable("Por rango de edad", "Edad", pivot((age.data ?? []) as Row[], "age_range" as keyof Row)));

    lines.push("---");
    lines.push("Notas: se incluyen sólo grupos con al menos 5 mediciones. Fuente y detalle visual: https://3d.ceoencamiseta.com/por-pais , /por-sector , /por-edad");

    return new Response(lines.join("\n"), { headers: textHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`# Error\n\n${msg}\n`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
});
