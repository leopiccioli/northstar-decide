// Configuración centralizada de URLs del proyecto
// Modificar aquí cuando cambie el dominio

export const SITE_CONFIG = {
  // Dominio principal de la app
  baseUrl: 'https://3d.ceoencamiseta.com',
  domain: '3d.ceoencamiseta.com',
  
  // Email para notificaciones
  emailFrom: '3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>',
  emailReplyTo: 'leopiccioli@gmail.com',
  
  // Links externos
  mainSiteUrl: 'https://ceoencamiseta.com',
  beehiivBaseUrl: 'https://magic.beehiiv.com/v1/9ef68cad-af28-49b0-8639-5562f3e7954e',
  beehiivRedirectUrl: 'https://www.ceoencamiseta.com/3d-dinero-desarrollo-diversion',

  // Libros (referenciados en el P.S. del email de medicion, segun la D mas baja).
  // Mantener sincronizados con supabase/functions/save-result/index.ts (BOOKS).
  books: {
    rajar: 'https://comorajaratujefe.com',
    ceo: 'https://setupropioceo.com',
    finanzas: 'https://finanzasellibro.com',
  },
} as const;

// Helper para construir URL de Beehiiv con tracking
export function buildBeehiivUrl(options: {
  email?: string;
  utmMedium: 'home' | 'result' | 'shared';
}): string {
  const params = new URLSearchParams();
  
  if (options.email) {
    params.set('email', options.email);
  }
  params.set('utm_source', '3d');
  params.set('utm_medium', options.utmMedium);
  params.set('redirect_to', SITE_CONFIG.beehiivRedirectUrl);
  
  return `${SITE_CONFIG.beehiivBaseUrl}?${params.toString()}`;
}

// WhatsApp share — recomendar la herramienta (no el resultado propio).
// Mantener sincronizado con duplicados en edge functions (save-result, resend-measurement, send-reminders).
export type WhatsAppShareVariant =
  | 'friend'
  | 'team'
  | 'email'
  | 'reminder_1m'
  | 'reminder_2m'
  | 'reminder_3m';

const WA_MESSAGES: Record<WhatsAppShareVariant, { message: string; campaign: string; content?: string }> = {
  friend: {
    message: 'Acabo de hacer las 3D y me quedé pensando. Hacelas vos también — si querés después me contás qué te salió.',
    campaign: 'share_friend',
  },
  team: {
    message: '¿Podés hacer esto antes de que hablemos? 2 minutos. No me mostrás el resultado, solo me decís qué te movió.',
    campaign: 'share_team',
  },
  email: {
    message: 'Te mando esto porque creo que te puede servir. Son 2 minutos y te ordena la cabeza.',
    campaign: 'share_email',
    content: 'ps_recommend',
  },
  reminder_1m: {
    message: 'Yo uso esto cada tanto para ver cómo estoy en el trabajo. Puede servirte.',
    campaign: 'share_reminder',
    content: '1m',
  },
  reminder_2m: {
    message: 'Yo uso esto cada tanto para ver cómo estoy en el trabajo. Puede servirte.',
    campaign: 'share_reminder',
    content: '2m',
  },
  reminder_3m: {
    message: 'Yo uso esto cada tanto para ver cómo estoy en el trabajo. Puede servirte.',
    campaign: 'share_reminder',
    content: '3m',
  },
};

export function buildWhatsAppShareUrl(variant: WhatsAppShareVariant): string {
  const m = WA_MESSAGES[variant];
  const url = new URL(SITE_CONFIG.baseUrl);
  url.searchParams.set('utm_source', 'whatsapp');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', m.campaign);
  if (m.content) url.searchParams.set('utm_content', m.content);
  const text = `${m.message}\n${url.toString()}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

