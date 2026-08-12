// Structured data shared by the React pages and the build-time prerender, so
// the JSON-LD a crawler sees is always the same object, built from the same
// snapshot constants (src/content/facts.ts).

import {
  CITATION, CUT_DATE_ISO, N, PROJECT_NAME, PUBLISHER, WINDOW, type StatRow,
} from './facts';

const SITE = 'https://3d.ceoencamiseta.com';

const PUBLISHER_NODE = {
  '@type': 'Organization',
  name: PUBLISHER,
  url: 'https://ceoencamiseta.com',
};

const VARIABLES = [
  { '@type': 'PropertyValue', name: 'Dinero', description: 'Autoevaluación de la remuneración, de 1 a 10.', minValue: 1, maxValue: 10 },
  { '@type': 'PropertyValue', name: 'Desarrollo', description: 'Autoevaluación del aprendizaje y el crecimiento, de 1 a 10.', minValue: 1, maxValue: 10 },
  { '@type': 'PropertyValue', name: 'Diversión', description: 'Autoevaluación del disfrute del día a día, de 1 a 10.', minValue: 1, maxValue: 10 },
];

const DISTRIBUTIONS = ['index', 'stats', 'insights', 'comentarios'].flatMap((f) => [
  { '@type': 'DataDownload', encodingFormat: 'text/plain', contentUrl: `${SITE}/llm/${f}.txt` },
  { '@type': 'DataDownload', encodingFormat: 'text/markdown', contentUrl: `${SITE}/llm/${f}.md` },
]);

/** The whole open dataset: used on /datos-llm, /metodologia and /como-citar. */
export function datasetJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${SITE}/datos-llm#dataset`,
    name: `${PROJECT_NAME} — autoevaluación laboral en tres dimensiones`,
    alternateName: 'Las 3D: Dinero, Desarrollo y Diversión',
    description: `Promedios de autoevaluación laboral en tres dimensiones (Dinero, Desarrollo y Diversión, de 1 a 10), publicados por ${PUBLISHER}. Universo canónico: últimos 12 meses, n=${N}, datos al ${CUT_DATE_ISO}. Incluye desgloses por país, sector y rango etario, con el N de cada grupo.`,
    url: `${SITE}/datos-llm`,
    sameAs: `${SITE}/metodologia`,
    inLanguage: 'es',
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: PUBLISHER_NODE,
    publisher: PUBLISHER_NODE,
    dateModified: CUT_DATE_ISO,
    temporalCoverage: `${WINDOW.from}/${WINDOW.to}`,
    measurementTechnique: 'Autoevaluación anónima voluntaria en una escala de 1 a 10 por dimensión.',
    variableMeasured: VARIABLES,
    citation: CITATION,
    keywords: [
      'satisfacción laboral', 'trabajo', 'Dinero Desarrollo Diversión',
      'burnout', 'cambio de trabajo', 'encuesta laboral', 'datos abiertos',
    ],
    distribution: DISTRIBUTIONS,
  };
}

/** A single stats cut (country / sector / age) declared as its own dataset. */
export function statsDatasetJsonLd(opts: {
  path: string;
  name: string;
  description: string;
  n: number;
  rows: StatRow[];
  dimensionName: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${SITE}${opts.path}#dataset`,
    name: opts.name,
    description: opts.description,
    url: `${SITE}${opts.path}`,
    inLanguage: 'es',
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: PUBLISHER_NODE,
    publisher: PUBLISHER_NODE,
    dateModified: CUT_DATE_ISO,
    temporalCoverage: `${WINDOW.from}/${WINDOW.to}`,
    isPartOf: { '@id': `${SITE}/datos-llm#dataset` },
    citation: CITATION,
    variableMeasured: [
      ...VARIABLES,
      {
        '@type': 'PropertyValue',
        name: opts.dimensionName,
        description: `Grupos publicados: ${opts.rows.map((r) => `${r.key} (n=${r.n})`).join(', ')}.`,
      },
    ],
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'text/plain', contentUrl: `${SITE}/llm/stats.txt` },
      { '@type': 'DataDownload', encodingFormat: 'text/markdown', contentUrl: `${SITE}/llm/stats.md` },
    ],
  };
}

/** Breadcrumbs for any nested route; the home crumb is always first. */
export function breadcrumbJsonLd(
  trail: { name: string; path: string }[],
): Record<string, unknown> {
  const items = [{ name: 'Inicio', path: '/' }, ...trail];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((i, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: i.name,
      item: `${SITE}${i.path === '/' ? '/' : i.path}`,
    })),
  };
}

export interface CommentLike {
  date: string;
  country: string | null;
  sector: string | null;
  age: string | null;
  dinero: number;
  desarrollo: number;
  diversion: number;
  text: string;
}

/** The anonymous comment wall as a citable ItemList of Comment nodes. */
export function commentsJsonLd(comments: readonly CommentLike[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Muro de los lamentos — ${PROJECT_NAME}`,
    description: `Comentarios anónimos sobre el trabajo, publicados junto a los puntajes de Dinero, Desarrollo y Diversión de quien los escribió. ${PUBLISHER}, datos al ${CUT_DATE_ISO}.`,
    url: `${SITE}/comentarios`,
    inLanguage: 'es',
    numberOfItems: comments.length,
    itemListElement: comments.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Comment',
        text: c.text,
        datePublished: c.date,
        inLanguage: 'es',
        author: { '@type': 'Person', name: 'Anónimo' },
        about: [c.country, c.sector, c.age].filter(Boolean).join(' · ') || undefined,
        // The three scores travel with the comment so a citation keeps context.
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Dinero', value: c.dinero, minValue: 1, maxValue: 10 },
          { '@type': 'PropertyValue', name: 'Desarrollo', value: c.desarrollo, minValue: 1, maxValue: 10 },
          { '@type': 'PropertyValue', name: 'Diversión', value: c.diversion, minValue: 1, maxValue: 10 },
        ],
      },
    })),
  };
}
