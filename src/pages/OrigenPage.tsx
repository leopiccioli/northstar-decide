import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '@/config/urls';
import notaAsset from '@/assets/iprofesional-2007.png.asset.json';
import {
  ALL_TIME_ROUNDED_LABEL, CUT_DATE_HUMAN, CUT_DATE_ISO, CUT_MONTH_HUMAN, N_LABEL,
} from '@/content/facts';

/**
 * Static content page. Every figure comes from the data snapshot
 * (src/content/facts.ts), so the copy, the meta tags, the JSON-LD and the
 * prerendered HTML can never drift apart. Only the historical narrative
 * (2007, Officenet, iProfesional) is hand-written.
 */
export const ORIGEN_DATA = {
  respuestas: `Más de ${ALL_TIME_ROUNDED_LABEL} respuestas históricas desde el lanzamiento. Los informes y estadísticas publicados usan una ventana canónica de los últimos 12 meses (n=${N_LABEL} al ${CUT_DATE_HUMAN}). Actualizado: ${CUT_MONTH_HUMAN}.`,
  actualizado: CUT_MONTH_HUMAN,
};

export const ORIGEN_META = {
  path: '/origen',
  title: 'El origen de las 3D: Dinero, Desarrollo y Diversión (desde 2007)',
  description: `Las 3D las creó Leo Piccioli en 2007. Hoy son un termómetro con más de ${ALL_TIME_ROUNDED_LABEL} respuestas.`,
  h1: 'El origen de las 3D',
  lead: `Las 3D —Dinero, Desarrollo y Diversión— es un marco creado por Leo Piccioli en 2007 para evaluar qué le dan las empresas a su gente. Desde 2025 cualquiera puede medir su empresa en 3d.ceoencamiseta.com. Ya lo hicieron más de ${ALL_TIME_ROUNDED_LABEL} personas desde el lanzamiento.`,
  quote: 'Las compañías le dan a la gente tres D: dinero, desarrollo y diversión.',
  attribution: 'Leo Piccioli, gerente general de Officenet — iProfesional, 10 de diciembre de 2007',
  notaUrl: 'https://www.iprofesional.com/management/58267-las-companias-tienen-que-dar-dinero-desarrollo-y-diversion',
  notaAlt: 'Entrevista a Leo Piccioli en iProfesional, 10 de diciembre de 2007',
  comoSeMide: [
    'Es una autoevaluación anónima: nadie pide nombre ni empresa.',
    'Cada persona califica su empresa en las tres dimensiones por separado.',
    'Las dimensiones no se combinan en un índice único.',
    'Los resultados se publican trimestralmente.',
  ],
  faq: [
    {
      q: '¿Qué son las 3D?',
      a: 'Las 3D son Dinero, Desarrollo y Diversión: un marco para evaluar qué le dan las empresas a su gente. Cada dimensión se califica por separado.',
    },
    {
      q: '¿Quién creó las 3D?',
      a: 'Las creó Leo Piccioli en 2007, cuando era gerente general de Officenet, y las describió en una entrevista con iProfesional.',
    },
    {
      q: '¿Cuántas personas respondieron?',
      a: `Más de ${ALL_TIME_ROUNDED_LABEL} personas midieron su empresa con las 3D desde el lanzamiento. Las estadísticas publicadas usan los últimos 12 meses de datos (actualizado: ${CUT_MONTH_HUMAN}).`,
    },
    {
      q: '¿Cómo respondo las 3D de mi empresa?',
      a: 'Entrá a la página principal de 3d.ceoencamiseta.com y calificá tu empresa en Dinero, Desarrollo y Diversión. Es anónimo y toma menos de un minuto.',
    },
  ],
};

export default function OrigenPage() {
  const url = `${SITE_CONFIG.baseUrl}${ORIGEN_META.path}`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: ORIGEN_META.h1,
      description: ORIGEN_META.description,
      url,
      inLanguage: 'es',
      isAccessibleForFree: true,
      author: { '@type': 'Person', name: 'Leo Piccioli' },
      datePublished: '2007-12-10',
      dateModified: CUT_DATE_ISO,
      publisher: { '@type': 'Organization', name: 'CEO en Camiseta', url: 'https://ceoencamiseta.com' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: ORIGEN_META.faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ];

  return (
    <>
      <Helmet>
        <title>{ORIGEN_META.title}</title>
        <meta name="description" content={ORIGEN_META.description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={ORIGEN_META.title} />
        <meta property="og:description" content={ORIGEN_META.description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <article className="px-6 py-12 max-w-2xl mx-auto space-y-8">
          <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">{ORIGEN_META.h1}</h1>
          <p className="text-lg leading-relaxed">{ORIGEN_META.lead}</p>

          <figure className="space-y-4">
            <blockquote className="border-l-2 border-foreground pl-4 text-xl leading-snug font-medium">
              “{ORIGEN_META.quote}”
            </blockquote>
            <figcaption className="text-sm text-foreground/60">{ORIGEN_META.attribution}</figcaption>
            <a
              href={ORIGEN_META.notaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded border border-border overflow-hidden hover:opacity-90 transition-opacity"
            >
              <img
                src={notaAsset.url}
                alt={ORIGEN_META.notaAlt}
                loading="lazy"
                className="w-full h-auto"
              />
            </a>
          </figure>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Cómo se mide</h2>
            <ul className="list-disc pl-5 space-y-2 text-base leading-relaxed text-foreground/80">
              {ORIGEN_META.comoSeMide.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Los datos</h2>
            <p className="text-base leading-relaxed text-foreground/80">
              {ORIGEN_DATA.respuestas}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Preguntas frecuentes</h2>
            {ORIGEN_META.faq.map((f, i) => (
              <div key={i} className="space-y-1">
                <h3 className="text-base font-medium">{f.q}</h3>
                <p className="text-base leading-relaxed text-foreground/80">
                  {f.q === '¿Cómo respondo las 3D de mi empresa?' ? (
                    <>
                      Entrá a <Link to="/" className="underline underline-offset-4">la página principal</Link> y calificá
                      tu empresa en Dinero, Desarrollo y Diversión. Es anónimo y toma menos de un minuto.
                    </>
                  ) : f.a}
                </p>
              </div>
            ))}
          </section>

          <p>
            <Link to="/" className="inline-block rounded border border-foreground px-5 py-3 text-base font-medium">
              Medí las 3D de tu empresa
            </Link>
          </p>
        </article>

        <footer className="border-t border-border">
          <nav className="max-w-2xl mx-auto px-6 py-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link to="/origen" className="hover:text-foreground transition-colors">Origen</Link>
            <Link to="/metodologia" className="hover:text-foreground transition-colors">Método y límites</Link>
            <Link to="/como-citar" className="hover:text-foreground transition-colors">Cómo citar</Link>
            <Link to="/embed-docs" className="hover:text-foreground transition-colors">Embeber</Link>
          </nav>
        </footer>
      </main>
    </>
  );
}
