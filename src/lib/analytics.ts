// Analytics module for Meta Pixel, X Pixel, GA4, and PostHog
import { getPostHog } from './posthog';

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
  | 'slider_first_move' // Primer drag de un slider (funnel signal)
  | 'complete_3d'     // Termina de puntuar sliders
  | 'save_result'     // Guarda con email
  | 'complete_3d_signup' // Guarda con email (evento custom dedicado de X Sales con scores)
  | 'share_result'    // Comparte resultado propio
  | 'whatsapp_share_friend'  // Recomienda a un amigo via WhatsApp
  | 'whatsapp_share_team'    // Recomienda al equipo via WhatsApp
  | 'open_stats'      // Abre una página de stats (país/sector/edad) desde otra surface
  | 'view_global_compare' // Carga la comparación inline con promedio global en resultado
  | 'complete_demographics' // Completa sector y/o edad en /completar (backfill)
  | 'inapp_banner_shown'    // Banner "Abrir en navegador" se mostró
  | 'inapp_banner_click';   // Usuario tocó "Abrir en Safari/Chrome"

// Meta Pixel event mapping
const metaEvents: Record<FlowEvent, string> = {
  start_flow: 'InitiateCheckout',
  select_context: 'ViewContent',
  slider_first_move: 'ViewContent',
  complete_3d: 'Lead',
  save_result: 'CompleteRegistration',
  complete_3d_signup: 'CompleteRegistration',
  share_result: 'Share',
  whatsapp_share_friend: 'Share',
  whatsapp_share_team: 'Share',
  open_stats: 'ViewContent',
  view_global_compare: 'ViewContent',
  complete_demographics: 'CompleteRegistration',
  inapp_banner_shown: 'ViewContent',
  inapp_banner_click: 'ViewContent',
};

// X (Twitter) Pixel event mapping
const xEvents: Record<FlowEvent, string> = {
  start_flow: 'StartTrial',
  select_context: 'ViewContent',
  slider_first_move: 'ViewContent',
  complete_3d: 'tw-o1ve0-r2y9y',
  save_result: 'Signup',
  complete_3d_signup: 'tw-o1ve0-rcoua',
  share_result: 'Share',
  whatsapp_share_friend: 'Share',
  whatsapp_share_team: 'Share',
  open_stats: 'ViewContent',
  view_global_compare: 'ViewContent',
  complete_demographics: 'Signup',
  inapp_banner_shown: 'ViewContent',
  inapp_banner_click: 'ViewContent',
};

// GA4 event mapping
const ga4Events: Record<FlowEvent, string> = {
  start_flow: 'begin_checkout',
  select_context: 'select_content',
  slider_first_move: 'select_content',
  complete_3d: 'generate_lead',
  save_result: 'sign_up',
  complete_3d_signup: 'sign_up',
  share_result: 'share',
  whatsapp_share_friend: 'share',
  whatsapp_share_team: 'share',
  open_stats: 'select_content',
  view_global_compare: 'select_content',
  complete_demographics: 'complete_demographics',
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
      // Format data for X Ads (uses specific field names)
      const xData: Record<string, unknown> = {};
      if (data?.email) {
        xData.email_address = data.email;
      }
      // Si vienen scores, los mandamos como `contents` (formato X) para poder
      // usarlos en optimización/segmentación de campañas Sales.
      if (
        typeof data?.dinero === 'number' ||
        typeof data?.desarrollo === 'number' ||
        typeof data?.diversion === 'number'
      ) {
        const d = data.dinero as number | undefined;
        const de = data.desarrollo as number | undefined;
        const di = data.diversion as number | undefined;
        const avg =
          typeof d === 'number' && typeof de === 'number' && typeof di === 'number'
            ? Math.round(((d + de + di) / 3) * 10) / 10
            : null;
        xData.contents = [
          {
            content_type: '3d_scores',
            content_id: avg !== null ? `avg_${avg}` : null,
            content_name: `D${d ?? '-'}_Dev${de ?? '-'}_Div${di ?? '-'}`,
            content_price: avg,
            num_items: 1,
            content_group_id: null,
          },
        ];
      }
      window.twq('event', xEvents[event], xData);
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

  // PostHog
  try {
    const ph = getPostHog();
    if (ph) {
      // On save_result, identify the user by email so we can join sessions across devices.
      if (event === 'save_result' && data?.email && typeof data.email === 'string') {
        const { email, ...rest } = data;
        ph.identify(email, { email, ...rest });
      }
      ph.capture(event, data);
    }
  } catch (e) {
    console.warn('PostHog error:', e);
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
