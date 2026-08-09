// Facts derived from the build-time snapshot (src/data/llm-snapshot.json).
// Canonical universe: last 12 months (see plan B4). Every citable sentence
// must carry the project name, the N and the cut date.

import snapshot from '@/data/llm-snapshot.json';

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

/** Standard attribution fragment to embed inside a sentence. */
export function source(n: number = N, extra?: string): string {
  return `${PROJECT_NAME} (${PUBLISHER}, n=${n}${extra ? ` ${extra}` : ''}, datos al ${CUT_DATE_HUMAN})`;
}

export const CITATION = `${PROJECT_NAME} (${PUBLISHER}), n=${N} mediciones de los últimos 12 meses, datos al ${CUT_DATE_HUMAN}. https://3d.ceoencamiseta.com`;

export const UNIVERSE_LINE = `Universo: últimos 12 meses (${WINDOW.from} a ${WINDOW.to}) · n=${N} · datos al ${CUT_DATE_HUMAN}.`;

export const LIMITS: string[] = [
  'Autoevaluación anónima: cada persona puntúa su propio trabajo de 1 a 10. No hay evaluación externa ni validación clínica.',
  'Muestra voluntaria y autoseleccionada, mayoritariamente lectores de CEO en Camiseta. No es representativa de la población laboral.',
  'Sesgo geográfico: aproximadamente el 85% de las mediciones provienen de Argentina.',
  'Sector y edad son campos opcionales, completados por una minoría de quienes miden.',
  'Sólo se publican grupos con al menos 5 mediciones (N≥5) y el N va siempre junto al dato.',
  'No se publican correlaciones entre dimensiones ni interpretaciones: sólo promedios descriptivos.',
];

function byField(rows: StatRow[], field: keyof StatRow, dir: 'min' | 'max'): StatRow {
  const sorted = [...rows].sort((a, b) => (a[field] as number) - (b[field] as number));
  return dir === 'min' ? sorted[0] : sorted[sorted.length - 1];
}

export const SECTORS: StatRow[] = WINDOW.by_sector;
export const COUNTRIES: StatRow[] = WINDOW.by_country;
export const AGES: StatRow[] = WINDOW.by_age;

export const worstFunSector = byField(SECTORS, 'diversion', 'min');
export const bestMoneySector = byField(SECTORS, 'dinero', 'max');
export const worstAvgCountry = byField(COUNTRIES, 'promedio', 'min');
export const bestAvgSector = byField(SECTORS, 'promedio', 'max');
export const worstAvgSector = byField(SECTORS, 'promedio', 'min');

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

/** Sectors with a defensible N get their own page. */
export const SECTOR_PAGES: StatRow[] = SECTORS.filter((s) => s.n >= 10 && s.key !== 'Otro')
  .sort((a, b) => b.n - a.n);

export function fmt(n: number): string {
  return n.toLocaleString('es-AR');
}
