// Data-driven content pages. The same definitions feed the React routes and
// the build-time prerender script, so the HTML a crawler sees and the HTML a
// browser renders never diverge.

import {
  AGE_PAGES, ageSlug, ALL_TIME, BELOW_AGES, BELOW_COUNTRIES, BELOW_SECTORS, bestMoneySector,
  CITATION, COUNTRY_PAGES, countrySlug, CUT_DATE_HUMAN, ELIGIBLE_AGES, ELIGIBLE_COUNTRIES,
  ELIGIBLE_SECTORS, LIMITS, lowestDimension, mainCountry, N, NOT_COMPARABLE_NOTE, PROJECT_NAME,
  PUBLISH_THRESHOLD, PUBLISHER, secondCountry, SECTOR_PAGES, sectorSlug, source, StatRow,
  UNIVERSE_LINE, WINDOW, worstFunSector,
} from './facts';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'table'; label: string; caption: string; rows: StatRow[]; comparable?: boolean }
  | { type: 'links'; title?: string; items: { href: string; label: string }[] }
  | { type: 'code'; text: string }
  | { type: 'cta'; href: string; label: string };

export interface FAQEntry { q: string; a: string }

export interface ContentPage {
  path: string;
  title: string;
  description: string;
  h1: string;
  /** Answer in the first ~60 words, in prose, before anything else. */
  lead: string;
  blocks: Block[];
  faq?: FAQEntry[];
  /** Ancestors for BreadcrumbList, without the "Inicio" crumb. */
  breadcrumb?: { name: string; path: string }[];
  /** Pages whose whole content is the open dataset carry the Dataset schema. */
  dataset?: boolean;
}

const measure: Block = { type: 'cta', href: '/', label: 'Medir mi trabajo en 20 segundos' };

const backingData: Block = {
  type: 'links',
  title: 'Los datos que respaldan esta página',
  items: [
    { href: '/por-sector', label: 'Promedios por sector' },
    { href: '/por-pais', label: 'Promedios por país' },
    { href: '/por-edad', label: 'Promedios por rango de edad' },
    { href: '/metodologia', label: 'Método y límites' },
    { href: '/como-citar', label: 'Cómo citar estos datos' },
  ],
};

const limitsBlocks: Block[] = [
  { type: 'h2', text: 'Método y límites' },
  { type: 'p', text: UNIVERSE_LINE },
  { type: 'ul', items: LIMITS },
];

/**
 * Every ranked table is published in two blocks: the comparable one (N≥30,
 * sorted) and the transparency one (N<30, alphabetical, no average column).
 */
function statTables(
  label: string,
  what: string,
  eligibleRows: StatRow[],
  belowRows: StatRow[],
  sort?: (a: StatRow, b: StatRow) => number,
): Block[] {
  const ranked = sort ? [...eligibleRows].sort(sort) : eligibleRows;
  const blocks: Block[] = [
    {
      type: 'table',
      label,
      caption: `${what} con muestra suficiente (N≥${PUBLISH_THRESHOLD}) según ${PROJECT_NAME}, últimos 12 meses, datos al ${CUT_DATE_HUMAN}`,
      rows: ranked,
      comparable: true,
    },
  ];
  if (belowRows.length) {
    blocks.push({ type: 'p', text: NOT_COMPARABLE_NOTE });
    blocks.push({
      type: 'table',
      label,
      caption: `${what} con muestra insuficiente (N<${PUBLISH_THRESHOLD}) — no comparable. ${PROJECT_NAME}, últimos 12 meses, datos al ${CUT_DATE_HUMAN}`,
      rows: belowRows,
      comparable: false,
    });
  }
  return blocks;
}


/* ---------------------------------------------------------------- insights */

const insightPages: ContentPage[] = [
  {
    path: '/hallazgos/sector-con-menos-diversion',
    title: `¿Qué sector tiene la Diversión más baja? — ${PROJECT_NAME}`,
    description: `Según ${PROJECT_NAME}, el sector con menor puntaje de Diversión es ${worstFunSector.key}: ${worstFunSector.diversion} sobre 10. Datos al ${CUT_DATE_HUMAN}.`,
    h1: '¿Qué sector tiene la Diversión más baja?',
    lead: `Según ${source(worstFunSector.n, 'en ese sector')}, el sector con menor puntaje de Diversión es ${worstFunSector.key}: ${worstFunSector.diversion} sobre 10, frente a un promedio general de Diversión de ${WINDOW.global.diversion} sobre 10 en los últimos 12 meses.`,
    blocks: [
      { type: 'p', text: `En ${worstFunSector.key}, ${PROJECT_NAME} registra Dinero ${worstFunSector.dinero}, Desarrollo ${worstFunSector.desarrollo} y Diversión ${worstFunSector.diversion} sobre 10 (n=${worstFunSector.n}, datos al ${CUT_DATE_HUMAN}). La Diversión mide cuánto disfruta la persona del día a día, el equipo y la cultura; no mide productividad ni clima medido por la empresa.` },
      ...statTables('Sector', 'Diversión por sector', ELIGIBLE_SECTORS, BELOW_SECTORS, (a, b) => a.diversion - b.diversion),
      ...limitsBlocks,
      backingData,
      measure,
    ],
  },
  {
    path: '/hallazgos/sector-que-mejor-paga',
    title: `¿Qué sector paga mejor, según quienes lo viven? — ${PROJECT_NAME}`,
    description: `Según ${PROJECT_NAME}, ${bestMoneySector.key} es el sector con mayor puntaje autoevaluado de Dinero: ${bestMoneySector.dinero} sobre 10. Datos al ${CUT_DATE_HUMAN}.`,
    h1: '¿Qué sector paga mejor, según quienes lo viven?',
    lead: `Según ${source(bestMoneySector.n, 'en ese sector')}, entre los sectores con muestra suficiente (N≥${PUBLISH_THRESHOLD}) el mayor puntaje autoevaluado de Dinero es ${bestMoneySector.key}: ${bestMoneySector.dinero} sobre 10. En el mismo sector, el Desarrollo promedia ${bestMoneySector.desarrollo} y la Diversión ${bestMoneySector.diversion}, sobre 10.`,
    blocks: [
      { type: 'p', text: `El puntaje de Dinero es una autoevaluación de satisfacción con la remuneración, no un dato salarial: ${PROJECT_NAME} no recoge sueldos. Un puntaje alto de Dinero puede convivir con puntajes bajos en las otras dos dimensiones, y eso es justamente lo que el marco busca hacer visible.` },
      ...statTables('Sector', 'Dinero por sector', ELIGIBLE_SECTORS, BELOW_SECTORS, (a, b) => b.dinero - a.dinero),
      ...limitsBlocks,
      backingData,
      measure,
    ],
  },
  {
    path: '/hallazgos/como-puntua-argentina',
    title: `¿Cómo puntúa su trabajo ${mainCountry.key}? — ${PROJECT_NAME}`,
    description: `Según ${PROJECT_NAME} (n=${mainCountry.n} en ${mainCountry.key}), el promedio 3D es ${mainCountry.promedio} sobre 10. Datos al ${CUT_DATE_HUMAN}.`,
    h1: `¿Cómo puntúa su trabajo ${mainCountry.key}?`,
    lead: `Según ${source(mainCountry.n, `en ${mainCountry.key}`)}, en ${mainCountry.key} el promedio 3D es ${mainCountry.promedio} sobre 10, con Dinero ${mainCountry.dinero}, Desarrollo ${mainCountry.desarrollo} y Diversión ${mainCountry.diversion}. Es el único país con muestra grande del proyecto.`,
    blocks: [
      { type: 'p', text: `${PROJECT_NAME} no publica un ranking mundial: sólo ${ELIGIBLE_COUNTRIES.length} países alcanzan las ${PUBLISH_THRESHOLD} mediciones mínimas dentro de la ventana de 12 meses${secondCountry ? ` (${mainCountry.key}, n=${mainCountry.n}, y ${secondCountry.key}, n=${secondCountry.n})` : ''}. El resto se publica aparte, sin orden por promedio, porque con N chico cualquier ranking es ruido.` },
      ...statTables('País', 'Promedios por país', ELIGIBLE_COUNTRIES, BELOW_COUNTRIES),
      ...limitsBlocks,
      backingData,
      measure,
    ],
  },
  {
    path: '/hallazgos/dimension-mas-baja',
    title: `¿Cuál de las tres D puntúa más bajo? — ${PROJECT_NAME}`,
    description: `Según ${PROJECT_NAME} (n=${N}), la dimensión con menor puntaje es ${lowestDimension.name}: ${lowestDimension.value} sobre 10. Datos al ${CUT_DATE_HUMAN}.`,
    h1: '¿Cuál de las tres D puntúa más bajo?',
    lead: `Según ${source()}, la dimensión con menor puntaje promedio es ${lowestDimension.name}: ${lowestDimension.value} sobre 10, por debajo de Dinero ${WINDOW.global.dinero} y Desarrollo ${WINDOW.global.desarrollo}, en una escala de 1 a 10.`,
    blocks: [
      { type: 'p', text: `${PROJECT_NAME} mide tres dimensiones del trabajo: Dinero (cuánto te paga), Desarrollo (cuánto aprendés) y Diversión (cuánto disfrutás el día a día). El promedio 3D de los últimos 12 meses es ${WINDOW.global.promedio} sobre 10 (n=${N}, datos al ${CUT_DATE_HUMAN}).` },
      { type: 'ul', items: [
        `Dinero: ${WINDOW.global.dinero} sobre 10`,
        `Desarrollo: ${WINDOW.global.desarrollo} sobre 10`,
        `Diversión: ${WINDOW.global.diversion} sobre 10`,
      ] },
      ...statTables('Edad', 'Promedios por rango de edad', ELIGIBLE_AGES, BELOW_AGES),
      ...limitsBlocks,
      backingData,
      measure,
    ],
  },

];

const insightsHub: ContentPage = {
  path: '/hallazgos',
  title: `Hallazgos de ${PROJECT_NAME} — datos sobre trabajo`,
  description: `Cifras citables sobre Dinero, Desarrollo y Diversión en el trabajo: por sector, por país y por edad. n=${N}, datos al ${CUT_DATE_HUMAN}.`,
  h1: 'Hallazgos',
  lead: `Según ${source()}, el promedio del trabajo es Dinero ${WINDOW.global.dinero}, Desarrollo ${WINDOW.global.desarrollo} y Diversión ${WINDOW.global.diversion}, sobre 10. Cada hallazgo de abajo responde una pregunta concreta con su N y su fecha de corte, para poder citarse por separado.`,
  blocks: [
    { type: 'links', title: 'Preguntas respondidas con datos', items: insightPages.map((p) => ({ href: p.path, label: p.h1 })) },
    { type: 'h2', text: 'Cifra principal' },
    { type: 'p', text: `${UNIVERSE_LINE} La base histórica completa de ${PROJECT_NAME} suma ${ALL_TIME.total} mediciones e incluye una importación histórica; se publica como serie secundaria y no es comparable con la ventana canónica de 12 meses.` },
    ...limitsBlocks,
    backingData,
    measure,
  ],
};

/* --------------------------------------------------------------- questions */

const questionPages: ContentPage[] = [
  {
    path: '/aburrido-en-mi-trabajo-pero-pagan-bien',
    title: 'Aburrido en mi trabajo pero pagan bien: cómo decidir',
    description: `Si el sueldo es bueno pero el día a día no, medí las tres dimensiones por separado. Datos de ${PROJECT_NAME}, n=${N}, al ${CUT_DATE_HUMAN}.`,
    h1: 'Estoy aburrido en mi trabajo, pero pagan bien',
    lead: `Que paguen bien y aburra a la vez no es una contradicción: son dimensiones distintas. Según ${source()}, el promedio de Dinero es ${WINDOW.global.dinero} sobre 10 mientras el de Diversión es ${WINDOW.global.diversion}, la más baja de las tres. Medir cada D por separado muestra qué estás comprando con ese sueldo.`,
    blocks: [
      { type: 'h2', text: 'Qué mirar antes de decidir' },
      { type: 'ul', items: [
        'Dinero: cuánto te paga hoy y cuánto vale eso para tu vida actual.',
        'Desarrollo: si seguís aprendiendo o estás repitiendo el mismo año.',
        'Diversión: si el día a día te da o te saca energía.',
      ] },
      { type: 'p', text: `El riesgo del trabajo bien pago y aburrido es sostener una sola D en 8 y las otras dos en 4. Según ${source(bestMoneySector.n, `en ${bestMoneySector.key}`)}, ${bestMoneySector.key} tiene el mayor puntaje de Dinero (${bestMoneySector.dinero} sobre 10) y a la vez Desarrollo ${bestMoneySector.desarrollo} y Diversión ${bestMoneySector.diversion}: pagar bien no arrastra a las otras dos.` },
      backingData,
      measure,
    ],
    faq: [
      { q: '¿El sueldo compensa el aburrimiento?', a: 'Depende de cuánto valga cada dimensión para vos hoy. Las 3D no responden por vos: muestran los tres números por separado para que la decisión no dependa de un solo día malo.' },
      { q: '¿Cuánto tarda medirlo?', a: '20 segundos: tres sliders, anónimo, sin registro obligatorio.' },
    ],
  },
  {
    path: '/cuando-renunciar-sin-otro-trabajo',
    title: 'Cuándo renunciar sin tener otro trabajo',
    description: `Cómo evaluar renunciar sin otra oferta usando las tres dimensiones del trabajo. Datos de ${PROJECT_NAME}, n=${N}, al ${CUT_DATE_HUMAN}.`,
    h1: 'Cuándo renunciar sin tener otro trabajo',
    lead: `No hay un umbral universal. Lo que se puede hacer es medir: puntuar Dinero, Desarrollo y Diversión de 1 a 10 hoy, y repetir la medición en uno y tres meses. Según ${source()}, el promedio 3D es ${WINDOW.global.promedio} sobre 10; tener dos dimensiones sostenidamente por debajo de ese promedio es la señal que la mayoría describe antes de irse.`,
    blocks: [
      { type: 'h2', text: 'Tres preguntas concretas' },
      { type: 'ul', items: [
        '¿Cuál de las tres D está más baja, y hace cuánto?',
        '¿Existe una acción dentro de este trabajo que la suba, y ya la intentaste?',
        '¿Cuántos meses de colchón tenés si el Dinero se corta?',
      ] },
      { type: 'p', text: `Medir dos veces con distancia de semanas evita decidir con el peor día. ${PROJECT_NAME} guarda tu medición y te la puede recordar en uno o tres meses para comparar contra vos mismo, no contra un promedio.` },
      backingData,
      measure,
    ],
    faq: [
      { q: '¿Es mejor renunciar con otro trabajo cerrado?', a: 'Casi siempre reduce el riesgo financiero, pero no resuelve el problema de fondo si Desarrollo y Diversión siguen bajos en el trabajo nuevo. Medir ambas situaciones con el mismo marco vuelve comparable la decisión.' },
      { q: '¿Las 3D me dicen si renunciar?', a: 'No. Muestran los tres números y su evolución. La decisión es tuya: el proyecto no entrega consejos ni interpretaciones automáticas.' },
    ],
  },
  {
    path: '/burnout-o-cansancio',
    title: '¿Es burnout o solo cansancio? Cómo distinguirlo',
    description: `Diferencia entre cansancio y burnout, y cómo medir las tres dimensiones del trabajo. Datos de ${PROJECT_NAME}, n=${N}, al ${CUT_DATE_HUMAN}.`,
    h1: '¿Es burnout o solo cansancio?',
    lead: `El cansancio se va con descanso; el burnout no. La diferencia práctica es la persistencia: si después de un fin de semana o unas vacaciones seguís igual, y aparece distancia o cinismo con tu trabajo, ya no es cansancio. Según ${source()}, la dimensión más baja es ${lowestDimension.name}: ${lowestDimension.value} sobre 10.`,
    blocks: [
      { type: 'h2', text: 'Señales que se describen con más frecuencia' },
      { type: 'ul', items: [
        'Cansancio que no se recupera con descanso.',
        'Distancia emocional o cinismo hacia el trabajo y el equipo.',
        'Sensación sostenida de no rendir como antes.',
      ] },
      { type: 'p', text: 'Esto no es un diagnóstico clínico y ningún test online lo es. Si te sentís mal, consultá con un profesional de la salud. Medir las 3D sirve para ver en qué dimensión está el problema y desde cuándo.' },
      { type: 'links', title: 'También te puede servir', items: [{ href: '/test-burnout', label: 'Test de burnout en 20 segundos' }] },
      backingData,
      measure,
    ],
    faq: [
      { q: '¿Un test online puede diagnosticar burnout?', a: 'No. Es una herramienta de auto-medición para ordenar la cabeza, no un diagnóstico clínico.' },
      { q: '¿Qué dimensión suele estar más baja?', a: `Según ${PROJECT_NAME} (n=${N}, datos al ${CUT_DATE_HUMAN}), la dimensión con menor puntaje promedio es ${lowestDimension.name}: ${lowestDimension.value} sobre 10.` },
    ],
  },
  {
    path: '/peor-clima-laboral-por-sector',
    title: `Qué sector tiene peor clima laboral, según ${PROJECT_NAME}`,
    description: `Ranking de sectores por Diversión (clima del día a día). ${worstFunSector.key} es el más bajo: ${worstFunSector.diversion} sobre 10. Datos al ${CUT_DATE_HUMAN}.`,
    h1: '¿Qué sector tiene peor clima laboral?',
    lead: `Según ${source(worstFunSector.n, 'en ese sector')}, el sector con menor puntaje de Diversión —la dimensión que mide el día a día, el equipo y la cultura— es ${worstFunSector.key}: ${worstFunSector.diversion} sobre 10, contra un promedio general de ${WINDOW.global.diversion}.`,
    blocks: [
      ...statTables('Sector', 'Clima del día a día (Diversión) por sector', ELIGIBLE_SECTORS, BELOW_SECTORS, (a, b) => a.diversion - b.diversion),
      { type: 'p', text: 'Diversión no significa pasarla bien todo el tiempo: mide si el trabajo suma o resta energía. Es una autoevaluación individual, no una encuesta de clima organizacional.' },
      ...limitsBlocks,
      backingData,
      measure,
    ],
  },
];

/* ------------------------------------------------------------ sector pages */

const sectorPages: ContentPage[] = SECTOR_PAGES.map((s) => ({
  path: `/sector/${sectorSlug(s.key)}`,
  title: `${s.key}: Dinero, Desarrollo y Diversión — ${PROJECT_NAME}`,
  description: `Promedios de ${s.key}: Dinero ${s.dinero}, Desarrollo ${s.desarrollo}, Diversión ${s.diversion} sobre 10 (n=${s.n}). Datos al ${CUT_DATE_HUMAN}.`,
  h1: `${s.key}: cómo puntúa su trabajo`,
  lead: `Según ${source(s.n, `en ${s.key}`)}, quienes trabajan en ${s.key} puntúan su trabajo con Dinero ${s.dinero}, Desarrollo ${s.desarrollo} y Diversión ${s.diversion} sobre 10, con un promedio 3D de ${s.promedio}. El promedio general de todos los sectores es ${WINDOW.global.promedio} sobre 10.`,
  blocks: [
    { type: 'h2', text: `Comparación contra el promedio general` },
    { type: 'ul', items: [
      `Dinero: ${s.dinero} en ${s.key} vs ${WINDOW.global.dinero} en general.`,
      `Desarrollo: ${s.desarrollo} en ${s.key} vs ${WINDOW.global.desarrollo} en general.`,
      `Diversión: ${s.diversion} en ${s.key} vs ${WINDOW.global.diversion} en general.`,
    ] },
    { type: 'p', text: `Esta página se apoya en ${s.n} mediciones de ${s.key} dentro de la ventana canónica de 12 meses de ${PROJECT_NAME}, con datos al ${CUT_DATE_HUMAN}. Supera el umbral de publicación (N≥${PUBLISH_THRESHOLD}), pero describe a quienes midieron y no representa al sector completo.` },
    ...statTables('Sector', 'Todos los sectores', ELIGIBLE_SECTORS, BELOW_SECTORS),

    ...limitsBlocks,
    backingData,
    measure,
  ],
}));

/* ------------------------------------------------------ method & how to cite */

const methodPage: ContentPage = {
  path: '/metodologia',
  title: `Método y límites — ${PROJECT_NAME}`,
  description: `Cómo se recogen los datos de ${PROJECT_NAME}, qué universo se publica (últimos 12 meses, n=${N}) y qué límites tiene la muestra. Datos al ${CUT_DATE_HUMAN}.`,
  h1: 'Método y límites',
  lead: `${PROJECT_NAME} (${PUBLISHER}) publica promedios de autoevaluación laboral en tres dimensiones —Dinero, Desarrollo y Diversión, de 1 a 10—. El universo canónico son los últimos 12 meses: ${N} mediciones entre ${WINDOW.from} y ${WINDOW.to}, con datos al ${CUT_DATE_HUMAN}.`,
  blocks: [
    { type: 'h2', text: 'Universo publicado' },
    { type: 'ul', items: [
      `Universo canónico: últimos 12 meses (${WINDOW.from} a ${WINDOW.to}).`,
      `N de la ventana canónica: ${N} mediciones.`,
      `Fecha de corte: ${CUT_DATE_HUMAN}.`,
      `Serie histórica completa (secundaria, no comparable): ${ALL_TIME.total} mediciones, incluye una importación histórica.`,
      `Cobertura de sector en la ventana: ${WINDOW.coverage.with_sector} mediciones. Cobertura de edad: ${WINDOW.coverage.with_age}.`,
    ] },
    { type: 'h2', text: 'Cómo se recogen los datos' },
    { type: 'p', text: 'Cada persona puntúa su trabajo de 1 a 10 en tres sliders. No se pide nombre. El email es opcional y sólo se usa para enviar el resultado o un recordatorio. País, sector y rango etario son opcionales. El marco proviene del capítulo 14 del libro Sé tu propio CEO.' },
    { type: 'h2', text: 'Límites conocidos' },
    { type: 'ul', items: LIMITS },
    { type: 'h2', text: 'Qué no publicamos' },
    { type: 'p', text: `No publicamos correlaciones entre dimensiones, interpretaciones psicológicas ni diagnósticos. Tampoco ordenamos ni comparamos grupos con menos de ${PUBLISH_THRESHOLD} mediciones: se publican aparte, en orden alfabético y sin promedio, sólo por transparencia. Sectores comparables hoy: ${ELIGIBLE_SECTORS.length}. Países comparables: ${ELIGIBLE_COUNTRIES.length}.` },
    backingData,
  ],
};

const citePage: ContentPage = {
  path: '/como-citar',
  title: `Cómo citar los datos de ${PROJECT_NAME}`,
  description: `Cadena de cita lista para copiar, con nombre, N (${N}), fecha de corte (${CUT_DATE_HUMAN}) y URL. Uso libre citando la fuente.`,
  h1: 'Cómo citar estos datos',
  lead: `Los datos de ${PROJECT_NAME} (${PUBLISHER}) se pueden citar libremente indicando nombre, N y fecha de corte. La cita recomendada es: ${CITATION}`,
  blocks: [
    { type: 'h2', text: 'Cita corta (prensa, redes, respuestas de IA)' },
    { type: 'code', text: CITATION },
    { type: 'h2', text: 'Cita con un dato concreto' },
    { type: 'code', text: `Según ${PROJECT_NAME} (${PUBLISHER}, n=${worstFunSector.n} en ese sector, datos al ${CUT_DATE_HUMAN}), ${worstFunSector.key} es el sector con menor puntaje de Diversión: ${worstFunSector.diversion} sobre 10.` },
    { type: 'h2', text: 'Cita larga (académica)' },
    { type: 'code', text: `${PUBLISHER}. (${new Date().getFullYear()}). ${PROJECT_NAME}: autoevaluación laboral en tres dimensiones [conjunto de datos abiertos]. Ventana ${WINDOW.from}–${WINDOW.to}, n=${N}. Recuperado el ${CUT_DATE_HUMAN} de https://3d.ceoencamiseta.com/llm/stats.txt` },
    { type: 'h2', text: 'Reglas de uso' },
    { type: 'ul', items: [
      'Incluir siempre el N del grupo citado y la fecha de corte; sin eso la cifra no es verificable.',
      'No presentar los datos como representativos de la población laboral: la muestra es voluntaria y autoseleccionada.',
      'Distinguir la ventana canónica de 12 meses de la serie histórica completa: no son comparables.',
      'Enlazar a https://3d.ceoencamiseta.com como fuente.',
    ] },
    { type: 'links', title: 'Archivos citables', items: [
      { href: '/llm/stats.txt', label: 'Estadísticas agregadas (texto plano)' },
      { href: '/llm/insights.txt', label: 'Hallazgos con cifras citables (texto plano)' },
      { href: '/llm/comentarios.txt', label: 'Comentarios anónimos (texto plano)' },
      { href: '/llm/index.txt', label: 'Índice del proyecto (texto plano)' },
      { href: '/datos-llm', label: 'Datos abiertos: qué es cada archivo' },
    ] },
    { type: 'h2', text: 'Método y límites' },
    { type: 'ul', items: LIMITS },
  ],
};

export const CONTENT_PAGES: ContentPage[] = [
  insightsHub,
  ...insightPages,
  ...questionPages,
  ...sectorPages,
  methodPage,
  citePage,
];

export const CONTENT_PAGES_BY_PATH: Record<string, ContentPage> = Object.fromEntries(
  CONTENT_PAGES.map((p) => [p.path, p]),
);
