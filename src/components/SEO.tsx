import { Helmet } from 'react-helmet-async';
import { SITE_CONFIG } from '@/config/urls';

const DEFAULT_OG_IMAGE = `${SITE_CONFIG.baseUrl}/og-image.png`;

interface SEOProps {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
  /** 'website' for hubs and tools, 'article' for content pages. */
  type?: 'website' | 'article';
  /** Structured data emitted as a single application/ld+json block. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function SEO({ title, description, path, noIndex, type = 'website', jsonLd }: SEOProps) {
  const url = `${SITE_CONFIG.baseUrl}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />

      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Las 3D del Trabajo" />
      <meta property="og:locale" content="es_AR" />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
