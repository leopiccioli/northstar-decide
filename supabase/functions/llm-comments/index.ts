import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const textHeaders = {
  ...corsHeaders,
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=600",
};

const COUNTRY_NAMES: Record<string, string> = {
  AR: "Argentina", BO: "Bolivia", BR: "Brasil", CL: "Chile", CO: "Colombia",
  CR: "Costa Rica", DE: "Alemania", DO: "República Dominicana", EC: "Ecuador",
  ES: "España", GT: "Guatemala", HN: "Honduras", IT: "Italia", MX: "México",
  NI: "Nicaragua", PA: "Panamá", PE: "Perú", PR: "Puerto Rico", PT: "Portugal",
  PY: "Paraguay", SV: "El Salvador", US: "Estados Unidos", UY: "Uruguay",
  VE: "Venezuela", CA: "Canadá", IL: "Israel", JP: "Japón",
};

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  dinero: number;
  desarrollo: number;
  diversion: number;
  country: string | null;
  sector: string | null;
  age_range: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("get_public_comments");
    if (error) throw error;

    const comments = (data ?? []) as Comment[];
    const lines: string[] = [];
    lines.push("# Muro de los lamentos — Las 3D del Trabajo");
    lines.push("");
    lines.push(`> Comentarios anónimos sobre el trabajo, junto a sus puntajes en las 3D: Dinero, Desarrollo y Diversión (escala 1–10). Fuente: https://3d.ceoencamiseta.com/comentarios`);
    lines.push("");
    lines.push(`Total de comentarios listados: ${comments.length}. Última actualización: ${new Date().toISOString()}.`);
    lines.push("");
    lines.push("---");
    lines.push("");

    for (const c of comments) {
      const meta: string[] = [];
      if (c.country) meta.push(COUNTRY_NAMES[c.country] ?? c.country);
      if (c.sector) meta.push(c.sector);
      if (c.age_range) meta.push(c.age_range);
      meta.push(new Date(c.created_at).toISOString().slice(0, 10));

      lines.push(`## ${meta.join(" · ")}`);
      lines.push(`Dinero: ${c.dinero}/10 · Desarrollo: ${c.desarrollo}/10 · Diversión: ${c.diversion}/10`);
      lines.push("");
      lines.push(c.comment.trim());
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    return new Response(lines.join("\n"), { headers: textHeaders });
  } catch (err) {
    console.error("llm-comments error:", err);
    return new Response(`# Error\n\nTemporary error, please retry.\n`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
});
