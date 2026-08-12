import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '@/config/urls';
import { Block, ContentPage } from '@/content/pages';
import { breadcrumbJsonLd, datasetJsonLd } from '@/content/schema';
import { CUT_DATE_ISO } from '@/content/facts';
import { SiteFooter } from '@/components/SiteFooter';

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return <p className="text-base leading-relaxed text-foreground/80">{block.text}</p>;
    case 'h2':
      return <h2 className="text-xl font-semibold pt-4">{block.text}</h2>;
    case 'ul':
      return (
        <ul className="list-disc pl-5 space-y-2 text-base leading-relaxed text-foreground/80">
          {block.items.map((i, k) => <li key={k}>{i}</li>)}
        </ul>
      );
    case 'code':
      return (
        <pre className="whitespace-pre-wrap break-words rounded border border-border bg-muted/40 p-4 text-sm leading-relaxed">
          {block.text}
        </pre>
      );
    case 'links':
      return (
        <nav className="space-y-3">
          {block.title && <h2 className="text-xl font-semibold">{block.title}</h2>}
          <ul className="space-y-1">
            {block.items.map((i, k) => (
              <li key={k}>
                {i.href.startsWith('/llm/') ? (
                  <a className="underline underline-offset-4" href={i.href}>{i.label}</a>
                ) : (
                  <Link className="underline underline-offset-4" to={i.href}>{i.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      );
    case 'cta':
      return (
        <p>
          <Link to={block.href} className="inline-block rounded border border-foreground px-5 py-3 text-base font-medium">
            {block.label}
          </Link>
        </p>
      );
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <caption className="text-left text-xs text-foreground/50 pb-2">{block.caption}</caption>
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2 pr-3 font-medium">{block.label}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">N</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Dinero</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Desarrollo</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Diversión</th>
                <th scope="col" className="py-2 text-right font-medium">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r) => (
                <tr key={r.key} className="border-b border-border/50">
                  <th scope="row" className="py-2 pr-3 font-normal text-left">{r.key}</th>
                  <td className="py-2 pr-3 text-right">{r.n}</td>
                  <td className="py-2 pr-3 text-right">{r.dinero}</td>
                  <td className="py-2 pr-3 text-right">{r.desarrollo}</td>
                  <td className="py-2 pr-3 text-right">{r.diversion}</td>
                  <td className="py-2 text-right">{r.promedio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

export function ContentPageView({ page }: { page: ContentPage }) {
  const url = `${SITE_CONFIG.baseUrl}${page.path}`;
  const jsonLd: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: page.h1,
      description: page.description,
      url,
      inLanguage: 'es',
      isAccessibleForFree: true,
      dateModified: CUT_DATE_ISO,
      publisher: { '@type': 'Organization', name: 'CEO en Camiseta', url: 'https://ceoencamiseta.com' },
    },
  ];
  if (page.faq?.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }
  if (page.breadcrumb?.length) jsonLd.push(breadcrumbJsonLd(page.breadcrumb));
  if (page.dataset) jsonLd.push(datasetJsonLd());

  return (
    <>
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Las 3D del Trabajo" />
        <meta property="og:locale" content="es_AR" />
        <meta property="og:image" content={`${SITE_CONFIG.baseUrl}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.title} />
        <meta name="twitter:description" content={page.description} />
        <meta name="twitter:image" content={`${SITE_CONFIG.baseUrl}/og-image.png`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <article className="px-6 py-12 max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">{page.h1}</h1>
          <p className="text-lg leading-relaxed">{page.lead}</p>
          {page.blocks.map((b, i) => <BlockView key={i} block={b} />)}
          {page.faq?.length ? (
            <section className="space-y-4 pt-4">
              <h2 className="text-xl font-semibold">Preguntas frecuentes</h2>
              {page.faq.map((f, i) => (
                <div key={i} className="space-y-1">
                  <h3 className="text-base font-medium">{f.q}</h3>
                  <p className="text-base leading-relaxed text-foreground/80">{f.a}</p>
                </div>
              ))}
            </section>
          ) : null}
        </article>
        <SiteFooter />
      </main>
    </>
  );
}
