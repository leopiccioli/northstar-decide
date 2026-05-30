// In-app browser detection (Twitter/X, Instagram, Facebook, TikTok, LinkedIn, Line).
// Used to surface "Abrir en navegador" CTA where autofill/Keychain don't work.

export type InAppBrowserName =
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'linkedin'
  | 'line'
  | 'snapchat'
  | 'pinterest'
  | 'wechat'
  | 'other';

export interface InAppBrowserInfo {
  isInApp: boolean;
  name: InAppBrowserName | null;
  os: 'ios' | 'android' | 'other';
}

let cached: InAppBrowserInfo | null = null;

export function detectInAppBrowser(): InAppBrowserInfo {
  if (cached) return cached;
  if (typeof navigator === 'undefined') {
    cached = { isInApp: false, name: null, os: 'other' };
    return cached;
  }

  const ua = navigator.userAgent || '';
  const os: InAppBrowserInfo['os'] = /iPhone|iPad|iPod/i.test(ua)
    ? 'ios'
    : /Android/i.test(ua)
      ? 'android'
      : 'other';

  let name: InAppBrowserName | null = null;
  if (/Twitter/i.test(ua) || /TwitterAndroid/i.test(ua)) name = 'twitter';
  else if (/Instagram/i.test(ua)) name = 'instagram';
  else if (/FBAN|FBAV|FB_IAB|FB4A/i.test(ua)) name = 'facebook';
  else if (/TikTok|musical_ly|Bytedance/i.test(ua)) name = 'tiktok';
  else if (/LinkedInApp/i.test(ua)) name = 'linkedin';
  else if (/Line\//i.test(ua)) name = 'line';
  else if (/Snapchat/i.test(ua)) name = 'snapchat';
  else if (/Pinterest/i.test(ua)) name = 'pinterest';
  else if (/MicroMessenger/i.test(ua)) name = 'wechat';

  cached = { isInApp: name !== null, name, os };
  return cached;
}

/**
 * Try to open `url` in the device's external default browser.
 * iOS: x-safari-https:// scheme (works from user gesture on iOS 16+).
 * Android: intent:// with Chrome package.
 * Falls back to window.open on a normal anchor.
 */
export function openInExternalBrowser(url: string): void {
  const info = detectInAppBrowser();

  try {
    if (info.os === 'ios') {
      // Strip scheme then prepend x-safari-https://
      const stripped = url.replace(/^https?:\/\//, '');
      window.location.href = `x-safari-https://${stripped}`;
      // Fallback after a short delay in case the scheme isn't handled
      setTimeout(() => {
        window.location.href = url;
      }, 800);
      return;
    }

    if (info.os === 'android') {
      const stripped = url.replace(/^https?:\/\//, '');
      const intent = `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end;`;
      window.location.href = intent;
      setTimeout(() => {
        window.location.href = url;
      }, 800);
      return;
    }
  } catch {
    // ignore and fall through
  }

  window.open(url, '_blank', 'noopener');
}
