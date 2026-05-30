import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { detectInAppBrowser, openInExternalBrowser } from '@/lib/inAppBrowser';
import { trackFlowEvent } from '@/lib/analytics';

interface InAppBrowserBannerProps {
  /** Optional email already typed — preserved across the browser jump via URL. */
  email?: string;
}

/**
 * Minimal banner shown only inside in-app browsers (Twitter/IG/FB/TikTok/…).
 * Opens the current URL in Safari/Chrome so iCloud Keychain / Google autofill work.
 */
export function InAppBrowserBanner({ email }: InAppBrowserBannerProps) {
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

    // Build URL preserving current path + query, append email + from=inapp
    const url = new URL(window.location.href);
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
