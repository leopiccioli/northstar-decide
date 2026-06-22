// Prebuild script: snapshots comments + stats from the DB into static
// markdown files under public/llm/, so they're served with canonical URLs
// under https://3d.ceoencamiseta.com/llm/*.md
//
// Runs via predev / prebuild hooks. Uses the anon publishable key only —
// same data the public stats and comments pages render client-side.

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://bcokciysbyuaeodnsxas.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb2tjaXlzYnl1YWVvZG5zeGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjA4NjYsImV4cCI6MjA4NTAzNjg2Nn0.o-FypP4qFfQLfx4E9BpXKnbnOPR2EgFqsihl6W2jUrw";
const SITE = "https://3d.ceoencamiseta.com";

const COUNTRY_NAMES: Record<string, string> = {
  AR: "Argentina", BO: "Bolivia", BR: "Brasil", CL: "Chile", CO: "Colombia",
  CR: "Costa Rica", DE: "Alemania", DO: "República Dominicana", EC: "Ecuador",
  ES: "España", GT: "Guatemala", HN: "Honduras", IT: "Italia", MX: "México",
  NI: "Nicaragua", PA: "Panamá", PE: "Perú", PR: "Puerto Rico", PT: "Portugal",
  PY: "Paraguay", SV: "El Salvador", US: "Estados Unidos", UY: "Uruguay",
  VE: "Venezuela", CA: "Canadá", IL: "Israel", JP: "Japón",
};

async function rpc<T>(name: string, body: unknown = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`rpc ${name} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function table<T>(name: string, select: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${name}?select=${select}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`table ${name} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T[]>;
}

// Scrub obvious personal data from a free-text comment.
// Cannot guarantee removal of names — see limitation note in headers.
function scrub(text: string): string {
  return text
    // emails
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "[email]")
    // urls
    .replace(/\bhttps?:\/\/\S+/gi, "[url]")
    // phone-ish (8+ digits, with optional separators)
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "[tel]")
    // @handles
    .replace(/(^|\s)@[A-Za-z0-9_]{2,}/g, "$1[handle]")
    .trim();
}

const ISO_NOW = new Date().toISOString();
const HUMAN_DATE = ISO_NOW.slice(0, 10);

function header(title: string, contains: string, limitations: string[], live?: string): string {
  return [
    `# ${title}`,
    ``,
    `> Snapshot estático del proyecto **3D para Decidir** (CEO en Camiseta).`,
    ``,
    `- **Última actualización:** ${ISO_NOW}`,
    `- **Fuente original:** ${SITE}`,
    `- **Qué contiene:** ${contains}`,
    `- **Limitaciones:**`,
    ...limitations.map((l) => `  - ${l}`),
    live ? `- **Versión en vivo (siempre fresca):** ${live}` : "",
    ``,
    `---`,
    ``,
  ].filter(Boolean).join("\n");
}

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

interface StatRow {
  period: string;
  dimension: string;
  avg_value: number;
  count: number;
  country?: string;
  sector?: string;
  age_range?: string;
}

function pivot(rows: StatRow[], key: "country" | "sector" | "age_range") {
  const map = new Map<string, { dinero?: number; desarrollo?: number; diversion?: number; promedio?: number; count: number }>();
  for (const r of rows) {
    if (r.period !== "all") continue;
    const k = r[key];
    if (!k) continue;
    const cur = map.get(k) ?? { count: 0 };
    (cur as Record<string, number>)[r.dimension] = Number(r.avg_value);
    if (r.dimension === "promedio") cur.count = r.count;
    map.set(k, cur);
  }
  return map;
}

function renderTable(title: string, label: string, m: ReturnType<typeof pivot>, names?: Record<string, string>): string {
  const rows = [...m.entries()].filter(([, v]) => v.count >= 5).sort((a, b) => (b[1].promedio ?? 0) - (a[1].promedio ?? 0));
  const lines = [`## ${title}`, ``, `| ${label} | N | Dinero | Desarrollo | Diversión | Promedio |`, `| --- | ---: | ---: | ---: | ---: | ---: |`];
  for (const [k, v] of rows) {
    lines.push(`| ${names?.[k] ?? k} | ${v.count} | ${v.dinero ?? "-"} | ${v.desarrollo ?? "-"} | ${v.diversion ?? "-"} | ${v.promedio ?? "-"} |`);
  }
  lines.push("");
  return lines.join("\n");
}

async function buildComments(): Promise<string> {
  const comments = await rpc<Comment[]>("get_public_comments");
  const head = header(
    "Muro de los lamentos — comentarios anónimos",
    "Últimos 500 comentarios públicos enviados por personas sobre su trabajo, junto a sus puntajes de Dinero, Desarrollo y Diversión (1–10), país, sector y rango etario opcionales.",
    [
      "Los comentarios son texto libre enviado por usuarios. Se eliminan automáticamente emails, URLs, teléfonos y @handles, pero nombres propios u otros datos identificables pueden no ser detectados.",
      "No se publican emails ni IPs ni ningún identificador de usuario.",
      "Snapshot estático: se actualiza en cada deploy de la plataforma.",
      `Total listados: ${comments.length}.`,
    ],
    `${SUPABASE_URL}/functions/v1/llm-comments`,
  );
  const body = comments.map((c) => {
    const meta: string[] = [];
    if (c.country) meta.push(COUNTRY_NAMES[c.country] ?? c.country);
    if (c.sector) meta.push(c.sector);
    if (c.age_range) meta.push(c.age_range);
    meta.push(c.created_at.slice(0, 10));
    return [
      `## ${meta.join(" · ")}`,
      `Dinero: ${c.dinero}/10 · Desarrollo: ${c.desarrollo}/10 · Diversión: ${c.diversion}/10`,
      ``,
      scrub(c.comment),
      ``,
      `---`,
      ``,
    ].join("\n");
  }).join("");
  return head + body;
}

async function buildStats(): Promise<string> {
  const [global, total, country, sector, age] = await Promise.all([
    rpc<Array<{ avg_dinero: number; avg_desarrollo: number; avg_diversion: number; avg_global: number; total: number }>>("get_global_stats"),
    rpc<number>("get_measurement_count"),
    table<StatRow>("country_stats_cache", "country,period,dimension,avg_value,count"),
    table<StatRow>("sector_stats_cache", "sector,period,dimension,avg_value,count"),
    table<StatRow>("age_range_stats_cache", "age_range,period,dimension,avg_value,count"),
  ]);
  const g = global[0];
  const head = header(
    "Estadísticas agregadas — 3D para Decidir",
    "Promedios globales (Dinero, Desarrollo, Diversión, escala 1–10) y desglose por país, sector laboral y rango etario reportado.",
    [
      "Sólo se incluyen grupos con al menos 5 mediciones, para evitar exposición de individuos.",
      "Los promedios por sector y edad cubren respuestas posteriores a la incorporación de esos campos al formulario.",
      "Snapshot estático: se actualiza en cada deploy.",
    ],
    `${SUPABASE_URL}/functions/v1/llm-stats`,
  );
  const globalBlock = [
    `## Global`,
    ``,
    `- Mediciones totales: ${total ?? g?.total ?? "-"}`,
    g ? `- Promedio Dinero: ${g.avg_dinero}/10` : "",
    g ? `- Promedio Desarrollo: ${g.avg_desarrollo}/10` : "",
    g ? `- Promedio Diversión: ${g.avg_diversion}/10` : "",
    g ? `- Promedio global (3D): ${g.avg_global}/10` : "",
    ``,
  ].filter(Boolean).join("\n");
  return head + globalBlock
    + renderTable("Por país", "País", pivot(country, "country"), COUNTRY_NAMES) + "\n"
    + renderTable("Por sector", "Sector", pivot(sector, "sector")) + "\n"
    + renderTable("Por rango de edad", "Edad", pivot(age, "age_range"));
}

function buildIndex(): string {
  return header(
    "3D para Decidir — índice para LLMs",
    "Descripción del proyecto, su metodología, páginas públicas indexables y archivos de datos para LLMs.",
    [
      "Texto curado por los autores; los archivos de datos enlazados son los que reflejan el estado real de la comunidad.",
      "Snapshot estático: se actualiza en cada deploy.",
    ],
  )
  + `## Qué es

**3D para Decidir** es una mini-app web gratuita y anónima donde alguien puntúa su trabajo en tres dimensiones, cada una de 1 a 10:

- **Dinero**: cuánto te paga (sueldo, beneficios, estabilidad).
- **Desarrollo**: cuánto aprendés y crecés profesionalmente.
- **Diversión**: cuánto disfrutás del día a día, el equipo y la cultura.

El resultado se compara contra el promedio global de la comunidad y, opcionalmente, contra el promedio de tu país, sector o rango etario. No se entregan consejos ni interpretaciones automáticas: la herramienta muestra datos para que la persona decida.

## Para qué sirve

- Decidir si quedarse o cambiar de trabajo.
- Comparar dos ofertas laborales con un marco común.
- Detectar burnout o áreas débiles del trabajo actual.
- Hacer un check-up rápido cada cierto tiempo.

## Páginas públicas

- [Inicio](${SITE}/): Medí tu trabajo en 3D.
- [Test de burnout](${SITE}/test-burnout)
- [Cambiar de trabajo](${SITE}/cambiar-de-trabajo)
- [Cambiar de trabajo a los 40](${SITE}/cambiar-de-trabajo-a-los-40)
- [Cambiar de trabajo a los 50](${SITE}/cambiar-de-trabajo-a-los-50)
- [Muro de los lamentos](${SITE}/comentarios)
- [Estadísticas por país](${SITE}/por-pais)
- [Estadísticas por sector](${SITE}/por-sector)
- [Estadísticas por edad](${SITE}/por-edad)
- [Embeber 3D en tu sitio](${SITE}/embed-docs)
- [Datos abiertos para LLMs](${SITE}/datos-llm)

## Archivos de datos (canónicos)

- [Comentarios anónimos](${SITE}/llm/comentarios.md)
- [Estadísticas agregadas](${SITE}/llm/stats.md)
- [Este índice](${SITE}/llm/index.md)

## Quién la creó

CEO en Camiseta — comunidad y newsletter sobre liderazgo y trabajo: https://ceoencamiseta.com

## Privacidad

Respuestas anónimas. El email se pide opcionalmente para guardar el resultado o enviar recordatorios. Los comentarios públicos no se asocian a email ni a ningún identificador.
`;
}

async function main() {
  mkdirSync(resolve("public/llm"), { recursive: true });
  const [comments, stats, index] = await Promise.all([buildComments(), buildStats(), Promise.resolve(buildIndex())]);
  writeFileSync(resolve("public/llm/comentarios.md"), comments);
  writeFileSync(resolve("public/llm/stats.md"), stats);
  writeFileSync(resolve("public/llm/index.md"), index);
  console.log(`llm data written (${HUMAN_DATE})`);
}

main().catch((err) => {
  console.error("generate-llm-data failed:", err);
  // Don't break the build if the network call fails — keep previous snapshot.
  process.exit(0);
});
