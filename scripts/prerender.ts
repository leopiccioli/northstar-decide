// Build-time prerender (plan B1).
//
// Vite ships a single index.html; every route would otherwise return the same
// HTML to a crawler that does not run JavaScript. This script writes one
// dist/<route>/index.html per route with its own <title>, meta description,
// canonical, <h1> and substantive content in plain HTML. React replaces the
// injected markup on hydration, so the browser experience is unchanged.
//
// It also regenerates dist/sitemap.xml and dist/llms.txt from the same route
// list, so the three can never drift apart.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

import { CONTENT_PAGES, type Block, type ContentPage } from '../src/content/pages';
import { LANDINGS } from '../src/content/landings';
import {
  ALL_TIME, BELOW_AGES, BELOW_COUNTRIES, BELOW_SECTORS, CITATION, CUT_DATE_HUMAN,
  ELIGIBLE_AGES, ELIGIBLE_COUNTRIES, ELIGIBLE_SECTORS, LIMITS, N, NOT_COMPARABLE_NOTE,
  PROJECT_NAME, PUBLISH_THRESHOLD, UNIVERSE_LINE, WINDOW, type StatRow,
} from '../src/content/facts';
import COMMENTS from '../src/data/comments-snapshot';

const SITE = 'https://3d.ceoencamiseta.com';
const DIST = resolve('dist');
/** Hard cap so the published output can never blow past hosting limits. */
const MAX_PRERENDER_PAGES = 300;
const MAX_COMMENTS_RENDERED = 150;

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Groups below the publication threshold are rendered without the average
 * column so they can never be read as a ranking.
 */
function table(label: string, caption: string, rows: StatRow[], comparable = true): string {
  return [
    '<table>',
    `<caption>${esc(caption)}</caption>`,
    `<thead><tr><th>${esc(label)}</th><th>N</th><th>Dinero</th><th>Desarrollo</th><th>Diversión</th>${comparable ? '<th>Promedio</th>' : ''}</tr></thead>`,
    '<tbody>',
    ...rows.map((r) => `<tr><th scope="row">${esc(r.key)}</th><td>${r.n}</td><td>${r.dinero}</td><td>${r.desarrollo}</td><td>${r.diversion}</td>${comparable ? `<td>${r.promedio}</td>` : ''}</tr>`),
    '</tbody></table>',
  ].join('');
}

/** Comparable block + transparency block, matching src/content/pages.ts. */
function statSection(label: string, what: string, eligibleRows: StatRow[], belowRows: StatRow[]): string {
  let out = table(
    label,
    `${what} con muestra suficiente (N≥${PUBLISH_THRESHOLD}) según ${PROJECT_NAME}, últimos 12 meses, datos al ${CUT_DATE_HUMAN}`,
    eligibleRows,
  );
  if (belowRows.length) {
    out += `<p>${esc(NOT_COMPARABLE_NOTE)}</p>`;
    out += table(
      label,
      `${what} con muestra insuficiente (N<${PUBLISH_THRESHOLD}) — no comparable. ${PROJECT_NAME}, últimos 12 meses, datos al ${CUT_DATE_HUMAN}`,
      belowRows,
      false,
    );
  }
  return out;
}


function ul(items: string[]): string {
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

function links(items: { href: string; label: string }[], title?: string): string {
  return `${title ? `<h2>${esc(title)}</h2>` : ''}<ul>${items
    .map((i) => `<li><a href="${esc(i.href)}">${esc(i.label)}</a></li>`)
    .join('')}</ul>`;
}

function renderBlock(b: Block): string {
  switch (b.type) {
    case 'p': return `<p>${esc(b.text)}</p>`;
    case 'h2': return `<h2>${esc(b.text)}</h2>`;
    case 'ul': return ul(b.items);
    case 'code': return `<pre>${esc(b.text)}</pre>`;
    case 'links': return links(b.items, b.title);
    case 'cta': return `<p><a href="${esc(b.href)}">${esc(b.label)}</a></p>`;
    case 'table': return table(b.label, b.caption, b.rows, b.comparable !== false);
    default: return '';
  }
}

function faqJsonLd(faq: { q: string; a: string }[]): string {
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  })}</script>`;
}

function faqHtml(faq: { q: string; a: string }[]): string {
  return `<h2>Preguntas frecuentes</h2>${faq
    .map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`)
    .join('')}`;
}

interface Route {
  path: string;
  title: string;
  description: string;
  h1: string;
  body: string;
  jsonLd?: string;
  changefreq?: string;
  priority?: string;
}

const methodHtml = `<h2>Método y límites</h2><p>${esc(UNIVERSE_LINE)}</p>${ul(LIMITS)}`;

const backing = links(
  [
    { href: '/hallazgos', label: 'Hallazgos con cifras citables' },
    { href: '/por-sector', label: 'Promedios por sector' },
    { href: '/por-pais', label: 'Promedios por país' },
    { href: '/por-edad', label: 'Promedios por rango de edad' },
    { href: '/metodologia', label: 'Método y límites' },
    { href: '/como-citar', label: 'Cómo citar estos datos' },
  ],
  'Los datos que respaldan esta página',
);

/* ---------------------------------------------------------------- routes */

const contentRoutes: Route[] = CONTENT_PAGES.map((p: ContentPage) => ({
  path: p.path,
  title: p.title,
  description: p.description,
  h1: p.h1,
  body: `<p>${esc(p.lead)}</p>${p.blocks.map(renderBlock).join('')}${p.faq?.length ? faqHtml(p.faq) : ''}`,
  jsonLd: p.faq?.length ? faqJsonLd(p.faq) : undefined,
  changefreq: 'weekly',
  priority: '0.7',
}));

const landingRoutes: Route[] = LANDINGS.map((l) => ({
  path: l.path,
  title: l.title,
  description: l.description,
  h1: l.h1,
  body: [
    `<p>${esc(l.subhead)}</p>`,
    `<p>${esc(`${PROJECT_NAME} (CEO en Camiseta) mide el trabajo en tres dimensiones de 1 a 10: Dinero, Desarrollo y Diversión. Sobre ${N} mediciones de los últimos 12 meses, con datos al ${CUT_DATE_HUMAN}, el promedio es Dinero ${WINDOW.global.dinero}, Desarrollo ${WINDOW.global.desarrollo} y Diversión ${WINDOW.global.diversion}.`)}</p>`,
    `<h2>Qué mide el test</h2>`,
    ul([
      'Dinero: cuánto te paga y cuánto vale eso para tu vida hoy.',
      'Desarrollo: si estás creciendo, estancado o retrocediendo.',
      'Diversión: si tu trabajo te suma energía o te la chupa.',
    ]),
    faqHtml(l.faq),
    backing,
  ].join(''),
  jsonLd: faqJsonLd(l.faq),
  changefreq: 'monthly',
  priority: '0.9',
}));

const statsRoutes: Route[] = [
  {
    path: '/por-pais',
    title: `Satisfacción laboral por país — ${PROJECT_NAME}`,
    description: `Promedios de Dinero, Desarrollo y Diversión por país. n=${N} en los últimos 12 meses, datos al ${CUT_DATE_HUMAN}.`,
    h1: 'Las 3D por país',
    body: `<p>${esc(`Según ${PROJECT_NAME} (CEO en Camiseta, n=${N}, datos al ${CUT_DATE_HUMAN}), así puntúa su trabajo cada país en Dinero, Desarrollo y Diversión, sobre 10. Sólo se ordenan y comparan países con al menos ${PUBLISH_THRESHOLD} mediciones.`)}</p>`
      + statSection('País', 'Países', ELIGIBLE_COUNTRIES, BELOW_COUNTRIES)
      + methodHtml + backing,
    changefreq: 'weekly',
    priority: '0.8',
  },
  {
    path: '/por-sector',
    title: `Satisfacción laboral por sector — ${PROJECT_NAME}`,
    description: `Promedios de Dinero, Desarrollo y Diversión por sector laboral. Datos al ${CUT_DATE_HUMAN}, sólo se ordenan grupos con N≥${PUBLISH_THRESHOLD}.`,
    h1: 'Las 3D por sector',
    body: `<p>${esc(`Según ${PROJECT_NAME} (CEO en Camiseta, n=${WINDOW.coverage.with_sector} con sector declarado, datos al ${CUT_DATE_HUMAN}), así puntúa su trabajo cada sector en Dinero, Desarrollo y Diversión, sobre 10.`)}</p>`
      + statSection('Sector', 'Sectores', ELIGIBLE_SECTORS, BELOW_SECTORS)
      + methodHtml + backing,
    changefreq: 'weekly',
    priority: '0.8',
  },
  {
    path: '/por-edad',
    title: `Satisfacción laboral por edad — ${PROJECT_NAME}`,
    description: `Promedios de Dinero, Desarrollo y Diversión por rango de edad. Datos al ${CUT_DATE_HUMAN}, sólo se ordenan grupos con N≥${PUBLISH_THRESHOLD}.`,
    h1: 'Las 3D por rango de edad',
    body: `<p>${esc(`Según ${PROJECT_NAME} (CEO en Camiseta, n=${WINDOW.coverage.with_age} con edad declarada, datos al ${CUT_DATE_HUMAN}), así puntúa su trabajo cada rango etario en Dinero, Desarrollo y Diversión, sobre 10.`)}</p>`
      + statSection('Edad', 'Rangos de edad', ELIGIBLE_AGES, BELOW_AGES)
      + methodHtml + backing,
    changefreq: 'weekly',
    priority: '0.8',
  },
];

const commentsRoute: Route = {
  path: '/comentarios',
  title: `Muro de los lamentos — comentarios sobre el trabajo | ${PROJECT_NAME}`,
  description: `Comentarios anónimos sobre el trabajo junto a sus puntajes de Dinero, Desarrollo y Diversión. Datos al ${CUT_DATE_HUMAN}.`,
  h1: 'Muro de los lamentos',
  body: `<p>${esc(`Comentarios anónimos enviados a ${PROJECT_NAME} (CEO en Camiseta) junto a los puntajes de Dinero, Desarrollo y Diversión de quien los escribió. Datos al ${CUT_DATE_HUMAN}.`)}</p>`
    + (COMMENTS as ReadonlyArray<{ date: string; country: string | null; sector: string | null; age: string | null; dinero: number; desarrollo: number; diversion: number; text: string }>)
      .slice(0, MAX_COMMENTS_RENDERED)
      .map((c) => `<article><h2>${esc([c.country, c.sector, c.age, c.date].filter(Boolean).join(' · '))}</h2><p>Dinero: ${c.dinero}/10 · Desarrollo: ${c.desarrollo}/10 · Diversión: ${c.diversion}/10</p><blockquote><p>${esc(c.text)}</p></blockquote></article>`)
      .join('')
    + methodHtml + backing,
  changefreq: 'daily',
  priority: '0.8',
};

const homeRoute: Route = {
  path: '/',
  title: `${PROJECT_NAME} — medí tu trabajo en Dinero, Desarrollo y Diversión`,
  description: `Test anónimo de 20 segundos para medir tu trabajo en tres dimensiones y compararlo con ${N} mediciones. Datos al ${CUT_DATE_HUMAN}.`,
  h1: PROJECT_NAME,
  body: [
    `<p>${esc(`${PROJECT_NAME} es una herramienta gratuita y anónima de CEO en Camiseta: puntuás tu trabajo de 1 a 10 en Dinero, Desarrollo y Diversión, y comparás tu resultado contra el de la comunidad. Sobre ${N} mediciones de los últimos 12 meses, con datos al ${CUT_DATE_HUMAN}, el promedio es Dinero ${WINDOW.global.dinero}, Desarrollo ${WINDOW.global.desarrollo} y Diversión ${WINDOW.global.diversion}.`)}</p>`,
    `<p>Muchos toleran algo porque no lo miden.</p>`,
    `<h2>Las tres dimensiones</h2>`,
    ul([
      'Dinero: cuánto te paga el trabajo (sueldo, beneficios, estabilidad).',
      'Desarrollo: cuánto aprendés y crecés profesionalmente.',
      'Diversión: cuánto disfrutás del día a día, el equipo y la cultura.',
    ]),
    `<p>${esc('El marco proviene del capítulo 14 del libro Sé tu propio CEO, de CEO en Camiseta.')}</p>`,
    methodHtml,
    links([
      ...CONTENT_PAGES.map((p) => ({ href: p.path, label: p.h1 })),
      ...LANDINGS.map((l) => ({ href: l.path, label: l.h1 })),
      { href: '/comentarios', label: 'Muro de los lamentos' },
      { href: '/datos-llm', label: 'Datos abiertos para LLMs' },
      { href: '/embed-docs', label: 'Embeber Las 3D en tu sitio' },
    ], 'Todo el sitio'),
  ].join(''),
  changefreq: 'weekly',
  priority: '1.0',
};

const miscRoutes: Route[] = [
  {
    path: '/datos-llm',
    title: `Datos abiertos para LLMs — ${PROJECT_NAME}`,
    description: `Archivos de datos de ${PROJECT_NAME} listos para leer y citar: promedios por país, sector y edad. n=${N}, datos al ${CUT_DATE_HUMAN}.`,
    h1: 'Datos abiertos para LLMs',
    body: `<p>${esc(`${PROJECT_NAME} (CEO en Camiseta) publica sus datos agregados y comentarios anónimos como archivos de texto fechados. Sobre ${N} mediciones de los últimos 12 meses, con datos al ${CUT_DATE_HUMAN}, el promedio es Dinero ${WINDOW.global.dinero}, Desarrollo ${WINDOW.global.desarrollo} y Diversión ${WINDOW.global.diversion}.`)}</p>`
      + links([
        { href: '/llm/index.txt', label: 'Índice del proyecto (texto plano)' },
        { href: '/llm/stats.txt', label: 'Estadísticas agregadas (texto plano)' },
        { href: '/llm/insights.txt', label: 'Hallazgos citables (texto plano)' },
        { href: '/llm/comentarios.txt', label: 'Comentarios anónimos (texto plano)' },
      ], 'Archivos')
      + `<h2>Cómo citar</h2><p>${esc(CITATION)}</p>`
      + `<p>${esc(`Serie histórica completa (secundaria, no comparable con la ventana canónica): ${ALL_TIME.total} mediciones.`)}</p>`
      + methodHtml + backing,
    changefreq: 'weekly',
    priority: '0.6',
  },
  {
    path: '/embed-docs',
    title: `Embeber Las 3D en tu sitio — ${PROJECT_NAME}`,
    description: 'Código para embeber el test de Las 3D del Trabajo en cualquier página con un script y un div. Gratis y anónimo.',
    h1: 'Embeber Las 3D en tu sitio',
    body: `<p>${esc(`Podés embeber ${PROJECT_NAME} en tu propio sitio con un div y un script. El widget se ajusta de alto automáticamente y admite contexto inicial, email precargado y herencia de estilos del sitio anfitrión.`)}</p>`
      + `<pre>&lt;div id="tres-d"&gt;&lt;/div&gt;\n&lt;script src="${SITE}/embed.js" data-target="tres-d"&gt;&lt;/script&gt;</pre>`
      + backing,
    changefreq: 'monthly',
    priority: '0.5',
  },
];

const ROUTES: Route[] = [homeRoute, ...landingRoutes, ...statsRoutes, commentsRoute, ...contentRoutes, ...miscRoutes];

/* --------------------------------------------------------------- emitting */

function pageHtml(shell: string, r: Route): string {
  const url = `${SITE}${r.path}`;
  const head = [
    `<title>${esc(r.title)}</title>`,
    `<meta name="description" content="${esc(r.description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(r.title)}" />`,
    `<meta property="og:description" content="${esc(r.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    r.jsonLd ?? '',
  ].join('\n    ');

  let html = shell;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '__TITLE__');
  html = html.replace(/<meta\s+name="description"[^>]*>/i, '');
  html = html.replace(/<link\s+rel="canonical"[^>]*>/i, '');
  html = html.replace(/<meta\s+property="og:(title|description|url|type)"[^>]*>/gi, '');
  html = html.replace('__TITLE__', head);

  const content = `<article><h1>${esc(r.h1)}</h1>${r.body}</article>`;
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${content}</div>`);
  return html;
}

function sitemap(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...ROUTES.map((r) => [
      '  <url>',
      `    <loc>${SITE}${r.path === '/' ? '/' : r.path}</loc>`,
      `    <changefreq>${r.changefreq ?? 'weekly'}</changefreq>`,
      `    <priority>${r.priority ?? '0.5'}</priority>`,
      '  </url>',
    ].join('\n')),
    ...['index', 'stats', 'insights', 'comentarios'].flatMap((f) => [
      `  <url>\n    <loc>${SITE}/llm/${f}.txt</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.4</priority>\n  </url>`,
    ]),
    '</urlset>',
    '',
  ].join('\n');
}

function llmsTxt(): string {
  return `# ${PROJECT_NAME}

> Herramienta anónima y gratuita de CEO en Camiseta para puntuar el trabajo de 1 a 10 en tres dimensiones: Dinero, Desarrollo y Diversión. Publica sus datos agregados como texto abierto y citable.

${UNIVERSE_LINE}
Cita sugerida: ${CITATION}

## Datos

- [Índice del proyecto](${SITE}/llm/index.txt): qué mide, universo, método y límites.
- [Estadísticas agregadas](${SITE}/llm/stats.txt): promedios por país, sector y edad, con el N de cada grupo.
- [Hallazgos citables](${SITE}/llm/insights.txt): preguntas frecuentes respondidas con una cifra, su N y su fecha.
- [Comentarios anónimos](${SITE}/llm/comentarios.txt): texto libre enviado por personas junto a sus 3D.

## Cómo citar

- [Cómo citar estos datos](${SITE}/como-citar): cadena de cita lista para copiar.
- [Método y límites](${SITE}/metodologia): universo, sesgos y criterios de inclusión.

## Páginas

- [Inicio](${SITE}/): medí tu trabajo en 3D.
${[...LANDINGS.map((l) => `- [${l.h1}](${SITE}${l.path})`),
  ...CONTENT_PAGES.map((p) => `- [${p.h1}](${SITE}${p.path})`)].join('\n')}
- [Muro de los lamentos](${SITE}/comentarios): comentarios anónimos con sus 3D.
- [Estadísticas por país](${SITE}/por-pais)
- [Estadísticas por sector](${SITE}/por-sector)
- [Estadísticas por edad](${SITE}/por-edad)
- [Datos abiertos para LLMs](${SITE}/datos-llm)
- [Embeber en tu sitio](${SITE}/embed-docs)

## Opcional

- [Archivos en Markdown](${SITE}/llm/stats.md): mismos contenidos con extensión .md.
`;
}

function main() {
  const shellPath = join(DIST, 'index.html');
  const shell = readFileSync(shellPath, 'utf8');

  if (ROUTES.length > MAX_PRERENDER_PAGES) {
    throw new Error(`prerender: ${ROUTES.length} rutas supera el tope de ${MAX_PRERENDER_PAGES}`);
  }

  for (const r of ROUTES) {
    const html = pageHtml(shell, r);
    if (r.path === '/') {
      writeFileSync(shellPath, html);
      continue;
    }
    const dir = join(DIST, r.path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
  }

  writeFileSync(join(DIST, 'sitemap.xml'), sitemap());
  writeFileSync(join(DIST, 'llms.txt'), llmsTxt());
  writeFileSync(resolve('public/llms.txt'), llmsTxt());

  console.log(`prerender: ${ROUTES.length} rutas escritas`);
}

main();
