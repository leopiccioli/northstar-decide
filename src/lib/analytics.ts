// Analytics module for Meta Pixel, X Pixel, and GA4
// IDs are configured via environment variables (VITE_META_PIXEL_ID, VITE_X_PIXEL_ID, VITE_GA4_ID)

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    twq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

// Flow events that map to platform-specific events
export type FlowEvent = 
  | 'start_flow'      // Click "Empezar"
  | 'select_context'  // Elige situación
  | 'complete_3d'     // Termina de puntuar sliders
  | 'save_result'     // Guarda con email
  | 'share_result';   // Comparte resultado

// Meta Pixel event mapping
const metaEvents: Record<FlowEvent, string> = {
  start_flow: 'InitiateCheckout',
  select_context: 'ViewContent',
  complete_3d: 'Lead',
  save_result: 'CompleteRegistration',
  share_result: 'Share',
};

// X (Twitter) Pixel event mapping
const xEvents: Record<FlowEvent, string> = {
  start_flow: 'StartTrial',
  select_context: 'ViewContent',
  complete_3d: 'tw-o1ve0-r2y9y',
  save_result: 'Signup',
  share_result: 'Share',
};

// GA4 event mapping
const ga4Events: Record<FlowEvent, string> = {
  start_flow: 'begin_checkout',
  select_context: 'select_content',
  complete_3d: 'generate_lead',
  save_result: 'sign_up',
  share_result: 'share',
};

/**
 * Track a flow event across all configured analytics platforms
 * Safe to call even if pixels aren't loaded - will silently skip
 */
export function trackFlowEvent(event: FlowEvent, data?: Record<string, unknown>) {
  // Meta Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', metaEvents[event], data);
    } catch (e) {
      console.warn('Meta Pixel error:', e);
    }
  }

  // X (Twitter) Pixel
  if (typeof window !== 'undefined' && window.twq) {
    try {
      window.twq('event', xEvents[event], data);
    } catch (e) {
      console.warn('X Pixel error:', e);
    }
  }

  // GA4
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', ga4Events[event], data);
    } catch (e) {
      console.warn('GA4 error:', e);
    }
  }
}

/**
 * Track a custom event (for future extensibility)
 */
export function trackCustomEvent(
  eventName: string, 
  data?: Record<string, unknown>
) {
  // Meta Pixel - custom events
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('trackCustom', eventName, data);
    } catch (e) {
      console.warn('Meta Pixel error:', e);
    }
  }

  // GA4 - custom events
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', eventName, data);
    } catch (e) {
      console.warn('GA4 error:', e);
    }
  }
}
