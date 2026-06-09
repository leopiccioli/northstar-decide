import { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { DecisionFlow } from '@/components/decision/DecisionFlow';
import { UserContext } from '@/types/decision';
import { getPostHog } from '@/lib/posthog';

const VALID: UserContext[] = ['improve', 'change', 'compare', 'burnout', 'check'];

export default function EmbedPage() {
  const { ctx, source } = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    const raw = p.get('ctx');
    return {
      ctx: raw && VALID.includes(raw as UserContext) ? (raw as UserContext) : undefined,
      source: p.get('utm_source') || 'embed',
    };
  }, []);

  // Track embed view
  useEffect(() => {
    getPostHog()?.capture('embed_view', { source, ctx: ctx ?? 'none' });
  }, [ctx, source]);

  // Post height to parent on every layout change so the wrapper iframe can resize.
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
    const interval = window.setInterval(post, 500); // safety net for late layout shifts
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
          /* Neutralize full-viewport containers inside the embed */
          .min-h-screen { min-height: 0 !important; }
        `}</style>
      </Helmet>
      <div className="bg-background">
        <DecisionFlow initialContext={ctx} />
      </div>
    </>
  );
}
