import { Helmet } from 'react-helmet-async';
import { SITE_CONFIG } from '@/config/urls';

interface SEOProps {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
}

export function SEO({ title, description, path, noIndex }: SEOProps) {
  const url = `${SITE_CONFIG.baseUrl}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
    </Helmet>
  );
}
