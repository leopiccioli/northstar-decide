import { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { DecisionFlow } from '@/components/decision/DecisionFlow';
import { UserContext } from '@/types/decision';
import { getPostHog } from '@/lib/posthog';
import { readThemeFromParams, buildThemeCSS } from '@/lib/embedTheme';

const VALID: UserContext[] = ['improve', 'change', 'compare', 'burnout', 'check'];

export default function EmbedPage() {
  const { ctx, source, themeCSS } = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    const raw = p.get('ctx');
    const tokens = readThemeFromParams(p);
    return {
      ctx: raw && VALID.includes(raw as UserContext) ? (raw as UserContext) : undefined,
      source: p.get('utm_source') || 'embed',
      themeCSS: tokens ? buildThemeCSS(tokens) : '',
    };
  }, []);

  useEffect(() => {
    getPostHog()?.capture('embed_view', {
      source,
      ctx: ctx ?? 'none',
      themed: themeCSS ? 'auto' : 'default',
    });
  }, [ctx, source, themeCSS]);

  useEffect(() => {
    let lastHeight = 0;
    const post = () => {
      const h = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      if (h !== lastHeight) {
        lastHeight = h;
        window.parent.postMessage({ type: '3d:resize', height: h }, '*');
      }
    };
    post();
    const ro = new ResizeObserver(post);
    ro.observe(document.body);
    const interval = window.setInterval(post, 500);
    window.addEventListener('load', post);
    return () => {
      ro.disconnect();
      window.clearInterval(interval);
      window.removeEventListener('load', post);
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>3D para Decidir — Embed</title>
        <meta name="robots" content="noindex,nofollow" />
        <style>{`
          html, body, #root { min-height: 0 !important; height: auto !important; background: transparent; }
          .min-h-screen { min-height: 0 !important; }
        `}</style>
        {themeCSS ? <style>{themeCSS}</style> : null}
      </Helmet>
      <div className="bg-background">
        <DecisionFlow initialContext={ctx} />
      </div>
    </>
  );
}
