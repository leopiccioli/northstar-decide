import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { detectInAppBrowser, openInExternalBrowser } from '@/lib/inAppBrowser';
import { trackFlowEvent } from '@/lib/analytics';
import { encodeStateToParams } from '@/lib/pendingResult';
import type { Option, UserContext } from '@/types/decision';

interface InAppBrowserBannerProps {
  /** Email already typed — preserved across the browser jump via URL. */
  email?: string;
  /** Current 3D state, serialized into the URL so Safari can hydrate it. */
  userContext: UserContext;
  currentOption: Option;
  comparisonOption: Option | null;
}

/**
 * Minimal banner shown only inside in-app browsers (Twitter/IG/FB/TikTok/…).
 * Opens the current URL in Safari/Chrome so iCloud Keychain / Google autofill work.
 *
 * Crucially, the destination URL carries the full 3D state in query params —
 * because localStorage is NOT shared between WKWebView and Safari on iOS.
 */
export function InAppBrowserBanner({
  email,
  userContext,
  currentOption,
  comparisonOption,
}: InAppBrowserBannerProps) {
  const [info] = useState(() => detectInAppBrowser());

  useEffect(() => {
    if (info.isInApp) {
      trackFlowEvent('inapp_banner_shown', { app: info.name, os: info.os });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!info.isInApp) return null;

  const browserLabel = info.os === 'ios' ? 'Safari' : info.os === 'android' ? 'Chrome' : 'el navegador';

  const handleClick = () => {
    trackFlowEvent('inapp_banner_click', { app: info.name, os: info.os });

    // Preserve current path + UTMs, add scores + email + from=inapp flag
    const url = new URL(window.location.href);
    encodeStateToParams(url, { context: userContext, currentOption, comparisonOption });
    if (email) url.searchParams.set('email', email);
    url.searchParams.set('from', 'inapp');

    openInExternalBrowser(url.toString());
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center justify-between gap-3 px-3 py-2
                 text-xs text-muted-foreground border border-dashed border-border
                 rounded-sm hover:border-foreground/40 hover:text-foreground
                 transition-colors text-left"
      aria-label={`Abrir esta página en ${browserLabel}`}
    >
      <span>
        Para que se complete solo tu email,{' '}
        <span className="text-foreground font-medium underline underline-offset-2">
          abrir en {browserLabel}
        </span>
      </span>
      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
    </button>
  );
}
