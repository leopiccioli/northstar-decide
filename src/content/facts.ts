// Facts derived from the build-time snapshot (src/data/llm-snapshot.json).
// Canonical universe: last 12 months (see plan B4). Every citable sentence
// must carry the project name, the N and the cut date.

import snapshot from '../data/llm-snapshot';

export interface StatRow {
  key: string;
  n: number;
  dinero: number;
  desarrollo: number;
  diversion: number;
  promedio: number;
}

export const PROJECT_NAME = 'Las 3D del Trabajo';
export const PUBLISHER = 'CEO en Camiseta';

export const CUT_DATE_HUMAN: string = snapshot.cutDateHuman;
export const CUT_DATE_ISO: string = snapshot.cutDateIso;

export const WINDOW = snapshot.window as unknown as {
  months: number;
  from: string;
  to: string;
  total: number;
  global: { dinero: number; desarrollo: number; diversion: number; promedio: number };
  by_country: StatRow[];
  by_sector: StatRow[];
  by_age: StatRow[];
  coverage: { with_sector: number; with_age: number; with_country: number };
};

export const ALL_TIME = snapshot.allTime as unknown as {
  total: number;
  global: { dinero: number; desarrollo: number; diversion: number; promedio: number };
};

export const N = WINDOW.total;

/** Formatted with Spanish thousands separators, e.g. "1.563". */
export const N_LABEL = N.toLocaleString('es-AR');

/** Historical total across all time (not the 12-month window). */
export const ALL_TIME_TOTAL: number = ALL_TIME.total;

/**
 * Historical total floored to the thousand, for "más de X" claims that stay
 * true as the snapshot grows. 12.923 -> "12.000".
 */
export const ALL_TIME_ROUNDED_LABEL = (Math.floor(ALL_TIME_TOTAL / 1000) * 1000).toLocaleString('es-AR');

/** "agosto de 2026", derived from the cut date so it never drifts. */
export const CUT_MONTH_HUMAN = CUT_DATE_HUMAN.split(' de ').slice(1).join(' de ');

/** Standard attribution fragment to embed inside a sentence. */
export function source(n: number = N, extra?: string): string {
  return `${PROJECT_NAME} (${PUBLISHER}, n=${n}${extra ? ` ${extra}` : ''}, datos al ${CUT_DATE_HUMAN})`;
}

export const CITATION = `${PROJECT_NAME} (${PUBLISHER}), n=${N} mediciones de los últimos 12 meses, datos al ${CUT_DATE_HUMAN}. https://3d.ceoencamiseta.com`;

export const UNIVERSE_LINE = `Universo: últimos 12 meses (${WINDOW.from} a ${WINDOW.to}) · n=${N} · datos al ${CUT_DATE_HUMAN}.`;

/** Groups below this N are published for transparency but never ranked. */
export const PUBLISH_THRESHOLD = 30;

export const NOT_COMPARABLE_NOTE = `Los grupos con menos de ${PUBLISH_THRESHOLD} mediciones se publican por transparencia, en orden alfabético y sin promedio: no admiten comparación ni ranking.`;

export const LIMITS: string[] = [
  'Autoevaluación anónima: cada persona puntúa su propio trabajo de 1 a 10. No hay evaluación externa ni validación clínica.',
  'Muestra voluntaria y autoseleccionada, mayoritariamente lectores de CEO en Camiseta. No es representativa de la población laboral.',
  'Sesgo geográfico: aproximadamente el 85% de las mediciones provienen de Argentina.',
  'Sector y edad son campos opcionales, completados por una minoría de quienes miden.',
  `Inclusión: sólo se ordenan y comparan grupos con al menos ${PUBLISH_THRESHOLD} mediciones (N≥${PUBLISH_THRESHOLD}). Los grupos con N menor se publican aparte, en orden alfabético y sin promedio, y no admiten ranking.`,
  'El N va siempre junto al dato, en cada fila de cada tabla.',
  'No se publican correlaciones entre dimensiones ni interpretaciones: sólo promedios descriptivos.',
];

export const SECTORS: StatRow[] = WINDOW.by_sector;
export const COUNTRIES: StatRow[] = WINDOW.by_country;
export const AGES: StatRow[] = WINDOW.by_age;

const byAvg = (a: StatRow, b: StatRow) => b.promedio - a.promedio;
const byName = (a: StatRow, b: StatRow) => a.key.localeCompare(b.key, 'es');

function eligible(rows: StatRow[]): StatRow[] {
  return rows.filter((r) => r.n >= PUBLISH_THRESHOLD).sort(byAvg);
}
function belowThreshold(rows: StatRow[]): StatRow[] {
  return rows.filter((r) => r.n < PUBLISH_THRESHOLD).sort(byName);
}

export const ELIGIBLE_SECTORS = eligible(SECTORS);
export const ELIGIBLE_COUNTRIES = eligible(COUNTRIES);
export const ELIGIBLE_AGES = eligible(AGES);
export const BELOW_SECTORS = belowThreshold(SECTORS);
export const BELOW_COUNTRIES = belowThreshold(COUNTRIES);
export const BELOW_AGES = belowThreshold(AGES);

/** "Otro" is a residual bucket, never a superlative. */
const RANKABLE_SECTORS = ELIGIBLE_SECTORS.filter((s) => s.key !== 'Otro');

function byField(rows: StatRow[], field: keyof StatRow, dir: 'min' | 'max'): StatRow {
  const sorted = [...rows].sort((a, b) => (a[field] as number) - (b[field] as number));
  return dir === 'min' ? sorted[0] : sorted[sorted.length - 1];
}

export const worstFunSector = byField(RANKABLE_SECTORS, 'diversion', 'min');
export const bestMoneySector = byField(RANKABLE_SECTORS, 'dinero', 'max');
export const bestAvgSector = byField(RANKABLE_SECTORS, 'promedio', 'max');
export const worstAvgSector = byField(RANKABLE_SECTORS, 'promedio', 'min');
/** Country with the largest sample: the only one that carries the country story. */
export const mainCountry = [...ELIGIBLE_COUNTRIES].sort((a, b) => b.n - a.n)[0];
export const secondCountry = [...ELIGIBLE_COUNTRIES].sort((a, b) => b.n - a.n)[1];

export const lowestDimension: { name: string; value: number } = (() => {
  const dims = [
    { name: 'Dinero', value: WINDOW.global.dinero },
    { name: 'Desarrollo', value: WINDOW.global.desarrollo },
    { name: 'Diversión', value: WINDOW.global.diversion },
  ].sort((a, b) => a.value - b.value);
  return dims[0];
})();

/** URL-safe slug for a sector name. */
export function sectorSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split('/')[0]
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Only sectors above the publication threshold get their own page. */
export const SECTOR_PAGES: StatRow[] = RANKABLE_SECTORS.slice().sort((a, b) => b.n - a.n);

/** URL-safe slug for a country name ("México" -> "mexico"). */
export function countrySlug(name: string): string {
  return sectorSlug(name);
}

/** Age ranges are already slug-safe ("35-44"), but normalise just in case. */
export function ageSlug(range: string): string {
  return range.replace(/[^0-9+-]/g, '');
}

/** Only groups above the publication threshold get their own page. */
export const COUNTRY_PAGES: StatRow[] = ELIGIBLE_COUNTRIES.slice().sort((a, b) => b.n - a.n);
export const AGE_PAGES: StatRow[] = ELIGIBLE_AGES.slice().sort((a, b) => b.n - a.n);

/**
 * Path of the detail page of a group, or null when it has none (N<30).
 * Derived from the same lists that build the pages, so a link can never 404.
 */
const SECTOR_PAGE_KEYS = new Set(SECTOR_PAGES.map((s) => s.key));
const COUNTRY_PAGE_KEYS = new Set(COUNTRY_PAGES.map((c) => c.key));
const AGE_PAGE_KEYS = new Set(AGE_PAGES.map((a) => a.key));

export const sectorPath = (key: string): string | null =>
  SECTOR_PAGE_KEYS.has(key) ? `/sector/${sectorSlug(key)}` : null;
export const countryPath = (key: string): string | null =>
  COUNTRY_PAGE_KEYS.has(key) ? `/pais/${countrySlug(key)}` : null;
export const agePath = (key: string): string | null =>
  AGE_PAGE_KEYS.has(key) ? `/edad/${ageSlug(key)}` : null;


export function fmt(n: number): string {
  return n.toLocaleString('es-AR');
}

