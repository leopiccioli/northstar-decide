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
