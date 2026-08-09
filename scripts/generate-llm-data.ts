// Prebuild script: snapshots stats + comments from the DB into
//  1. static markdown/text files under public/llm/ (canonical, citable URLs)
//  2. JSON snapshots under src/data/ that both the React pages and the
//     prerender script read, so HTML and markdown never disagree.
//
// Canonical universe: last 12 months (B4). The full historical base is
// published as a clearly labelled secondary series.
//
// Runs via predev / prebuild hooks. Uses the anon publishable key only.

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://bcokciysbyuaeodnsxas.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb2tjaXlzYnl1YWVvZG5zeGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjA4NjYsImV4cCI6MjA4NTAzNjg2Nn0.o-FypP4qFfQLfx4E9BpXKnbnOPR2EgFqsihl6W2jUrw";
const SITE = "https://3d.ceoencamiseta.com";
const PROJECT = "Las 3D del Trabajo";
const MAX_COMMENTS_SNAPSHOT = 300;

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

// Scrub obvious personal data from a free-text comment.
// Cannot guarantee removal of names — see limitation note in headers.
function scrub(text: string): string {
  return text
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "[email]")
    .replace(/\bhttps?:\/\/\S+/gi, "[url]")
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "[tel]")
    .replace(/(^|\s)@[A-Za-z0-9_]{2,}/g, "$1[handle]")
    .trim();
}

const NOW = new Date();
const ISO_NOW = NOW.toISOString();
const CUT_ISO = ISO_NOW.slice(0, 10);
const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const CUT_HUMAN = `${NOW.getUTCDate()} de ${MONTHS_ES[NOW.getUTCMonth()]} de ${NOW.getUTCFullYear()}`;

interface Row {
  key: string;
  n: number;
  dinero: number;
  desarrollo: number;
  diversion: number;
  promedio: number;
}
interface WindowStats {
  months: number;
  from: string;
  to: string;
  total: number;
  global: { dinero: number; desarrollo: number; diversion: number; promedio: number };
  by_country: Row[];
  by_sector: Row[];
  by_age: Row[];
  coverage: { with_sector: number; with_age: number; with_country: number };
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

function withNames(rows: Row[]): Row[] {
  return rows.map((r) => ({ ...r, key: COUNTRY_NAMES[r.key] ?? r.key }));
}

function frontmatter(fields: Record<string, string | number>): string {
  return ["---", ...Object.entries(fields).map(([k, v]) => `${k}: ${typeof v === "number" ? v : JSON.stringify(String(v))}`), "---", ""].join("\n");
}

function citation(n: number): string {
  return `Las 3D del Trabajo (CEO en Camiseta), n=${n} mediciones de los últimos 12 meses, datos al ${CUT_HUMAN}. ${SITE}`;
}

/** Groups below this N are published for transparency but never ranked. */
const PUBLISH_THRESHOLD = 30;

const LIMITS_MD = [
  `## Método y límites`,
  ``,
  `- **Qué es:** autoevaluación anónima. Cada persona puntúa su trabajo de 1 a 10 en Dinero, Desarrollo y Diversión. No hay evaluación externa ni validación clínica.`,
  `- **Muestra:** voluntaria y autoseleccionada, mayoritariamente lectores de CEO en Camiseta. No es representativa de la población laboral.`,
  `- **Sesgo geográfico:** aproximadamente el 85% de las mediciones provienen de Argentina.`,
  `- **Cobertura demográfica:** sector y edad son campos opcionales; los completa una minoría de quienes miden.`,
  `- **Inclusión:** sólo se ordenan y comparan grupos con al menos ${PUBLISH_THRESHOLD} mediciones (N≥${PUBLISH_THRESHOLD}). Los grupos con N menor se publican aparte, en orden alfabético y sin columna de promedio, y no admiten comparación ni ranking.`,
  `- **N a la vista:** el N de cada grupo se publica junto al dato, en cada fila.`,
  `- **Sin interpretación:** el proyecto no publica consejos ni correlaciones entre dimensiones. Sólo promedios descriptivos.`,
  ``,
].join("\n");

function eligible(rows: Row[]): Row[] {
  return rows.filter((r) => r.n >= PUBLISH_THRESHOLD).sort((a, b) => b.promedio - a.promedio);
}
function below(rows: Row[]): Row[] {
  return rows.filter((r) => r.n < PUBLISH_THRESHOLD).sort((a, b) => a.key.localeCompare(b.key, "es"));
}

function mdTable(label: string, rows: Row[]): string {
  const lines = [`| ${label} | N | Dinero | Desarrollo | Diversión | Promedio |`, `| --- | ---: | ---: | ---: | ---: | ---: |`];
  for (const r of rows) lines.push(`| ${r.key} | ${r.n} | ${r.dinero} | ${r.desarrollo} | ${r.diversion} | ${r.promedio} |`);
  lines.push("");
  return lines.join("\n");
}

/** Table without the average column, for groups that must not be ranked. */
function mdTableNoAvg(label: string, rows: Row[]): string {
  const lines = [`| ${label} | N | Dinero | Desarrollo | Diversión |`, `| --- | ---: | ---: | ---: | ---: |`];
  for (const r of rows) lines.push(`| ${r.key} | ${r.n} | ${r.dinero} | ${r.desarrollo} | ${r.diversion} |`);
  lines.push("");
  return lines.join("\n");
}

/** Two-block section: comparable (N≥30, sorted) + transparency (N<30, A-Z). */
function section(title: string, label: string, rows: Row[]): string {
  const top = eligible(rows);
  const rest = below(rows);
  let out = `## ${title} (últimos 12 meses, datos al ${CUT_HUMAN})\n\n`;
  out += `### Muestra suficiente (N≥${PUBLISH_THRESHOLD})\n\n`;
  out += top.length ? mdTable(label, top) : `Ningún grupo alcanza las ${PUBLISH_THRESHOLD} mediciones en esta ventana.\n`;
  if (rest.length) {
    out += `\n### Muestra insuficiente (N<${PUBLISH_THRESHOLD}) — no comparable\n\n`;
    out += `Estos grupos se publican por transparencia, en orden alfabético y sin promedio. No admiten comparación ni ranking.\n\n`;
    out += mdTableNoAvg(label, rest);
  }
  return out + "\n";
}


function universeBlock(w: WindowStats, all: { total: number }): string {
  return [
    `## Universo de los datos`,
    ``,
    `- **Universo canónico:** últimos 12 meses.`,
    `- **Ventana temporal:** ${w.from} a ${w.to}.`,
    `- **N (ventana canónica):** ${w.total} mediciones.`,
    `- **Fecha de corte:** ${CUT_HUMAN}.`,
    `- **Serie histórica completa (secundaria, no comparable con la ventana canónica):** ${all.total} mediciones desde el inicio del proyecto.`,
    `- **Cita sugerida:** ${citation(w.total)}`,
    ``,
  ].join("\n");
}

function buildStatsMd(w: WindowStats, all: { total: number; global: WindowStats["global"] }): string {
  return frontmatter({
    title: `Estadísticas agregadas — ${PROJECT}`,
    project: PROJECT,
    publisher: "CEO en Camiseta",
    url: `${SITE}/llm/stats.md`,
    universe: "últimos 12 meses",
    window_from: w.from,
    window_to: w.to,
    n: w.total,
    cut_date: CUT_ISO,
    updated: ISO_NOW,
    language: "es",
    license: "CC BY 4.0 — citar como fuente",
    citation: citation(w.total),
  })
    + `# Estadísticas agregadas — ${PROJECT}\n\n`
    + `Según ${PROJECT} (CEO en Camiseta), sobre ${w.total} mediciones de los últimos 12 meses con datos al ${CUT_HUMAN}, el promedio es Dinero ${w.global.dinero}, Desarrollo ${w.global.desarrollo} y Diversión ${w.global.diversion}, en una escala de 1 a 10.\n\n`
    + universeBlock(w, all)
    + LIMITS_MD
    + `## Global (últimos 12 meses, n=${w.total}, datos al ${CUT_HUMAN})\n\n`
    + `- Dinero: ${w.global.dinero}/10\n- Desarrollo: ${w.global.desarrollo}/10\n- Diversión: ${w.global.diversion}/10\n- Promedio 3D: ${w.global.promedio}/10\n\n`
    + `## Por país (últimos 12 meses, datos al ${CUT_HUMAN})\n\n` + mdTable("País", withNames(w.by_country)) + "\n"
    + `## Por sector (últimos 12 meses, datos al ${CUT_HUMAN})\n\n` + mdTable("Sector", w.by_sector) + "\n"
    + `## Por rango de edad (últimos 12 meses, datos al ${CUT_HUMAN})\n\n` + mdTable("Edad", w.by_age) + "\n"
    + `## Serie histórica completa (secundaria)\n\n`
    + `Base histórica completa de ${PROJECT}: ${all.total} mediciones desde el inicio del proyecto, con promedio Dinero ${all.global.dinero}, Desarrollo ${all.global.desarrollo} y Diversión ${all.global.diversion}. Esta serie incluye una importación histórica y no es comparable con la ventana canónica de 12 meses.\n`;
}

function pick(rows: Row[], field: keyof Row, dir: "min" | "max"): Row | undefined {
  const sorted = [...rows].sort((a, b) => (a[field] as number) - (b[field] as number));
  return dir === "min" ? sorted[0] : sorted[sorted.length - 1];
}

function buildInsightsMd(w: WindowStats): string {
  const sectors = w.by_sector;
  const countries = withNames(w.by_country);
  const worstFun = pick(sectors, "diversion", "min");
  const bestMoney = pick(sectors, "dinero", "max");
  const worstCountry = pick(countries, "promedio", "min");
  const dims: Array<[string, number]> = [
    ["Dinero", w.global.dinero],
    ["Desarrollo", w.global.desarrollo],
    ["Diversión", w.global.diversion],
  ];
  const lowest = [...dims].sort((a, b) => a[1] - b[1])[0];

  const items = [
    worstFun && [
      `## ¿Qué sector tiene la Diversión más baja?`,
      ``,
      `Según ${PROJECT} (CEO en Camiseta, n=${worstFun.n} en ese sector, datos al ${CUT_HUMAN}), el sector con menor puntaje de Diversión es ${worstFun.key}: ${worstFun.diversion} sobre 10, frente a un promedio general de Diversión de ${w.global.diversion} sobre 10 en los últimos 12 meses.`,
      ``,
    ].join("\n"),
    bestMoney && [
      `## ¿Qué sector paga mejor según quienes lo viven?`,
      ``,
      `Según ${PROJECT} (CEO en Camiseta, n=${bestMoney.n} en ese sector, datos al ${CUT_HUMAN}), el sector con mayor puntaje autoevaluado de Dinero es ${bestMoney.key}: ${bestMoney.dinero} sobre 10, mientras su Desarrollo es ${bestMoney.desarrollo} y su Diversión ${bestMoney.diversion}. Es una autoevaluación de satisfacción con la remuneración, no un dato salarial.`,
      ``,
    ].join("\n"),
    worstCountry && [
      `## ¿Qué país puntúa más bajo su trabajo?`,
      ``,
      `Según ${PROJECT} (CEO en Camiseta, n=${worstCountry.n} en ese país, datos al ${CUT_HUMAN}), el país con menor promedio 3D es ${worstCountry.key}: ${worstCountry.promedio} sobre 10 (Dinero ${worstCountry.dinero}, Desarrollo ${worstCountry.desarrollo}, Diversión ${worstCountry.diversion}).`,
      ``,
    ].join("\n"),
    [
      `## ¿Cuál de las tres dimensiones puntúa más bajo?`,
      ``,
      `Según ${PROJECT} (CEO en Camiseta, n=${w.total}, datos al ${CUT_HUMAN}), la dimensión con menor puntaje promedio es ${lowest[0]}: ${lowest[1]} sobre 10, por debajo de Dinero ${w.global.dinero} y Desarrollo ${w.global.desarrollo}.`,
      ``,
    ].join("\n"),
  ].filter(Boolean) as string[];

  return frontmatter({
    title: `Hallazgos — ${PROJECT}`,
    project: PROJECT,
    url: `${SITE}/llm/insights.md`,
    universe: "últimos 12 meses",
    window_from: w.from,
    window_to: w.to,
    n: w.total,
    cut_date: CUT_ISO,
    updated: ISO_NOW,
    language: "es",
    citation: citation(w.total),
  })
    + `# Hallazgos — ${PROJECT}\n\n`
    + `Respuestas breves a las preguntas más frecuentes sobre estos datos. Cada afirmación incluye su fuente, su N y su fecha de corte para poder citarse por separado.\n\n`
    + items.join("\n")
    + "\n" + LIMITS_MD;
}

function buildCommentsMd(comments: Comment[], w: WindowStats): string {
  const head = frontmatter({
    title: `Muro de los lamentos — comentarios anónimos (${PROJECT})`,
    project: PROJECT,
    url: `${SITE}/llm/comentarios.md`,
    universe: "últimos comentarios públicos",
    n: comments.length,
    cut_date: CUT_ISO,
    updated: ISO_NOW,
    language: "es",
    citation: citation(w.total),
  })
    + `# Muro de los lamentos — comentarios anónimos\n\n`
    + `Comentarios públicos enviados a ${PROJECT} (CEO en Camiseta) junto a sus puntajes de Dinero, Desarrollo y Diversión. Datos al ${CUT_HUMAN}. Total listado: ${comments.length}.\n\n`
    + `## Método y límites\n\n`
    + `- Texto libre enviado voluntariamente. Se eliminan automáticamente emails, URLs, teléfonos y @handles; nombres propios u otros datos identificables pueden no ser detectados.\n`
    + `- No se publican emails, IPs ni identificadores de usuario.\n`
    + `- Snapshot estático fechado: se regenera en cada deploy.\n\n---\n\n`;

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

function buildIndexMd(w: WindowStats, all: { total: number }): string {
  return frontmatter({
    title: `${PROJECT} — índice para LLMs`,
    project: PROJECT,
    publisher: "CEO en Camiseta",
    url: `${SITE}/llm/index.md`,
    universe: "últimos 12 meses",
    n: w.total,
    cut_date: CUT_ISO,
    updated: ISO_NOW,
    language: "es",
    citation: citation(w.total),
  })
  + `# ${PROJECT} — índice para LLMs\n\n`
  + `${PROJECT} es una herramienta gratuita y anónima de CEO en Camiseta donde cada persona puntúa su trabajo de 1 a 10 en tres dimensiones: Dinero, Desarrollo y Diversión. Sobre ${w.total} mediciones de los últimos 12 meses, con datos al ${CUT_HUMAN}, el promedio es Dinero ${w.global.dinero}, Desarrollo ${w.global.desarrollo} y Diversión ${w.global.diversion}.\n\n`
  + universeBlock(w, all)
  + LIMITS_MD
  + `## Qué mide cada dimensión

- **Dinero**: cuánto te paga el trabajo (sueldo, beneficios, estabilidad).
- **Desarrollo**: cuánto aprendés y crecés profesionalmente.
- **Diversión**: cuánto disfrutás del día a día, el equipo y la cultura.

El marco proviene del capítulo 14 del libro *Sé tu propio CEO*, de CEO en Camiseta.

## Archivos de datos (canónicos)

- Estadísticas agregadas: ${SITE}/llm/stats.md (texto plano: ${SITE}/llm/stats.txt)
- Hallazgos con cifras citables: ${SITE}/llm/insights.md (texto plano: ${SITE}/llm/insights.txt)
- Comentarios anónimos: ${SITE}/llm/comentarios.md (texto plano: ${SITE}/llm/comentarios.txt)
- Este índice: ${SITE}/llm/index.md (texto plano: ${SITE}/llm/index.txt)

## Páginas públicas

- Inicio: ${SITE}/
- Cómo citar estos datos: ${SITE}/como-citar
- Método y límites: ${SITE}/metodologia
- Hallazgos: ${SITE}/hallazgos
- Test de burnout: ${SITE}/test-burnout
- Cambiar de trabajo: ${SITE}/cambiar-de-trabajo
- Cambiar de trabajo a los 40: ${SITE}/cambiar-de-trabajo-a-los-40
- Cambiar de trabajo a los 50: ${SITE}/cambiar-de-trabajo-a-los-50
- Muro de los lamentos: ${SITE}/comentarios
- Estadísticas por país: ${SITE}/por-pais
- Estadísticas por sector: ${SITE}/por-sector
- Estadísticas por edad: ${SITE}/por-edad
- Embeber en tu sitio: ${SITE}/embed-docs
- Datos abiertos para LLMs: ${SITE}/datos-llm

## Quién la creó

CEO en Camiseta — comunidad y newsletter sobre liderazgo y trabajo: https://ceoencamiseta.com

## Privacidad

Respuestas anónimas. El email se pide opcionalmente para guardar el resultado o enviar recordatorios. Los comentarios públicos no se asocian a email ni a ningún identificador.
`;
}

function writeBoth(name: string, content: string) {
  writeFileSync(resolve(`public/llm/${name}.md`), content);
  // Static hosting serves .md as application/octet-stream; the .txt twin is
  // served as text/plain and is the readable variant announced in llms.txt.
  writeFileSync(resolve(`public/llm/${name}.txt`), content);
}

async function main() {
  mkdirSync(resolve("public/llm"), { recursive: true });
  mkdirSync(resolve("src/data"), { recursive: true });

  const [w, allRaw, comments] = await Promise.all([
    rpc<WindowStats>("get_stats_window", { months: 12 }),
    rpc<WindowStats>("get_stats_window", { months: 600 }),
    rpc<Comment[]>("get_public_comments"),
  ]);

  const all = { total: allRaw.total, global: allRaw.global };

  writeBoth("stats", buildStatsMd(w, all));
  writeBoth("insights", buildInsightsMd(w));
  writeBoth("index", buildIndexMd(w, all));
  writeBoth("comentarios", buildCommentsMd(comments, w));

  writeFileSync(
    resolve("src/data/llm-snapshot.ts"),
    "// AUTO-GENERADO por scripts/generate-llm-data.ts — no editar a mano.\nexport default " + JSON.stringify({
      generatedAt: ISO_NOW,
      cutDateIso: CUT_ISO,
      cutDateHuman: CUT_HUMAN,
      window: { ...w, by_country: withNames(w.by_country) },
      allTime: all,
    }, null, 2) + " as const;\n",
  );

  writeFileSync(
    resolve("src/data/comments-snapshot.ts"),
    "// AUTO-GENERADO por scripts/generate-llm-data.ts — no editar a mano.\nexport default " + JSON.stringify(
      comments.slice(0, MAX_COMMENTS_SNAPSHOT).map((c) => ({
        date: c.created_at.slice(0, 10),
        country: c.country ? (COUNTRY_NAMES[c.country] ?? c.country) : null,
        sector: c.sector,
        age: c.age_range,
        dinero: c.dinero,
        desarrollo: c.desarrollo,
        diversion: c.diversion,
        text: scrub(c.comment),
      })),
      null,
      2,
    ) + " as const;\n",
  );

  console.log(`llm data written (cut ${CUT_ISO}, n12m=${w.total}, comments=${comments.length})`);
}

main().catch((err) => {
  console.error("generate-llm-data failed:", err);
  // Don't break the build if the network call fails — keep previous snapshot.
  process.exit(0);
});
