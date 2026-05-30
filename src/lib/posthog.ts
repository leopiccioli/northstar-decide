// PostHog initialization — loaded after page load to not affect LCP.
// Public project API key + host are safe to ship in client code.
import posthog from 'posthog-js';
import { detectInAppBrowser } from './inAppBrowser';

const POSTHOG_KEY = 'phc_trVH4CdGyvfoakPZuQkMkT6A943zrbJHup7hLXHX4GCr';
const POSTHOG_HOST = 'https://us.i.posthog.com';

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    capture_performance: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-private], input[type="email"]',
    },
    loaded: (ph) => {
      try {
        // Register UTMs + referrer as super-properties on every event.
        const params = new URLSearchParams(window.location.search);
        const utms: Record<string, string> = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach((k) => {
          const v = params.get(k);
          if (v) utms[k] = v;
        });
        if (document.referrer) utms.referrer = document.referrer;
        // In-app browser context as super-properties for funnel segmentation
        const inApp = detectInAppBrowser();
        utms.is_inapp_browser = String(inApp.isInApp);
        if (inApp.name) utms.inapp_browser_name = inApp.name;
        utms.device_os = inApp.os;
        if (Object.keys(utms).length) ph.register(utms);
      } catch (e) {
        // noop
      }
    },
  });
}

export function getPostHog() {
  return initialized ? posthog : null;
}
