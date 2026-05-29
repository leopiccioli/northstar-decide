
# Agregar PostHog

Para entender qué hacen (o no hacen) las visitas de Twitter, integro PostHog con session recording + autocapture + eventos del flow.

## Qué se agrega

1. **SDK** `posthog-js` instalado vía bun.
2. **Inicialización** en `src/main.tsx` con:
   - `autocapture: true` (clics, formularios)
   - `capture_pageview: true` + pageviews en cambios de ruta (router de React) vía un hook en `App.tsx`
   - `session_recording` habilitado (ver qué hacen visualmente las visitas de Twitter)
   - `capture_performance: true`
   - Carga diferida (después del `load` event, como ya hacemos con Meta/GA) para no afectar LCP
3. **Identificación pasiva**: cuando el usuario ingresa email (al guardar), llamar `posthog.identify(email, { utm_source, utm_medium, utm_campaign, country, sector, age_range })`.
4. **Eventos de flow**: extender `src/lib/analytics.ts` `trackFlowEvent` para enviar también a PostHog usando el mismo nombre del evento (`start_flow`, `select_context`, `complete_3d`, `save_result`, `share_result`, etc.). Sin cambiar la API actual.
5. **Propiedades super globales**: registrar UTMs + referrer al cargar para que aparezcan en todos los eventos (clave para segmentar "visitas de Twitter").

## Configuración

PostHog necesita 2 valores públicos (no son secretos, van en código):
- **Project API key** (empieza con `phc_...`)
- **Host**: `https://us.i.posthog.com` o `https://eu.i.posthog.com` según la región de tu proyecto

Los pongo en `src/config/urls.ts` (`SITE_CONFIG.posthog = { key, host }`) siguiendo la convención centralizada del proyecto.

## Lo que NO cambia

- No toco backend, edge functions, ni RLS.
- No reemplazo Meta/X/GA — PostHog se suma.
- No cambio el flow ni la UI.

## Lo que necesito de vos

1. **Project API key** de PostHog (`phc_...`)
2. **Host/región**: US (`https://us.i.posthog.com`) o EU (`https://eu.i.posthog.com`)
3. **Session recording**: ¿lo activo? (recomendado para tu caso de Twitter, pero graba video de las sesiones — confirmá que estás ok)

Con esos 3 datos arranco.
