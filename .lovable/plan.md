## Objetivo

Subir la conversión de `complete_3d_signup` en tráfico de la campaña de X, especialmente en WKWebView (in-app browser de Twitter/IG/FB/TikTok) donde no funciona el autofill ni el llavero de iCloud.

## Cambios

### 1. Atributos de autofill en el input de email (ResultScreen.tsx)

Envolver el input + botón en un `<form onSubmit>` y agregar:
- `name="email"`
- `autoComplete="email"`
- `inputMode="email"`
- `enterKeyHint="go"`
- `autoCapitalize="off"`, `spellCheck={false}`

Esto activa el chip "From iCloud Keychain" arriba del teclado en iOS WKWebView y permite submit con Enter desde el teclado del celu.

### 2. Banner "Abrir en navegador" para in-app browsers

Nuevo componente `InAppBrowserBanner.tsx` que se monta en `ResultScreen` (solo cuando aparece el form de email, no antes — para no agregar fricción al `complete_3d`).

Detección por user-agent: Twitter, Instagram, FBAN/FBAV (Facebook), Line, TikTok, LinkedInApp. Chrome/Safari quedan afuera aunque sean iOS.

UI minimalista, consistente con el resto: una línea de texto + link "Abrir en Safari/Chrome →" arriba del form. Al tocarlo:
- iOS: abre `x-safari-https://3d.ceoencamiseta.com/?...` (deep link a Safari) con fallback a la URL normal.
- Android: usa `intent://` para forzar Chrome con fallback.

La URL incluye los params actuales (UTMs preservados) + `email=` si ya lo escribieron + un flag `from=inapp` para tracking.

Tracking: `trackFlowEvent` nuevo `inapp_banner_shown` y `inapp_banner_click` (mapeados a `ViewContent` en pixels, no consumen Event ID de X).

### 3. Persistir scores entre sesiones para "abrir en Safari"

Si el usuario clickea el banner, perdería el progreso al saltar de navegador. Guardar los scores actuales en `localStorage` con TTL de 10 min y, al cargar la app, si existen y no hay `step` previo, saltar directo al resultado con esos scores (mismo email prefill por URL ya existe).

Clave: `3d:pending_result` con `{currentOption, comparisonOption, context, email?, ts}`.

### 4. Mejoras chicas que también ayudan en in-app

- En el otro `<input>` de email/name de InputScreen (option name) y CloseScreen, agregar `autoComplete`/`enterKeyHint` apropiados.
- `enterKeyHint="next"` en el input de nombre de opción para que el teclado muestre "Siguiente" en vez de "OK".
- Verificar que el form de email no quede tapado por el teclado: agregar `scroll-margin-bottom: 120px` al input para que el scroll automático de iOS lo deje visible arriba del teclado.

### 5. Tracking adicional para diagnosticar

Agregar property `is_inapp_browser: true/false` y `inapp_browser_name` ('twitter'|'instagram'|...) en todos los `trackFlowEvent` (vía PostHog `register_once`). Así en PostHog podés segmentar `complete_3d` vs `complete_3d_signup` por WKWebView y ver el lift real del cambio.

## Detalles técnicos

- Util nuevo `src/lib/inAppBrowser.ts` con `detectInAppBrowser()` que devuelve `{ isInApp, name, os }`.
- Util `openInExternalBrowser(url)` con la lógica de `x-safari-https://` / `intent://` y fallback.
- Persistencia en `src/lib/pendingResult.ts` con `save/load/clear` y TTL.
- DecisionFlow.tsx: al montar, leer `pendingResult`; si existe y es < 10min, hidratar el state y saltar a `step: 'result'`.
- analytics.ts: agregar `inapp_banner_shown` e `inapp_banner_click` al `FlowEvent` union y a los 3 mappings.
- Memoria nueva: `mem://features/inapp-browser-conversion` con la estrategia.

## Archivos a tocar

- `src/components/decision/ResultScreen.tsx` — form wrapper + atributos + banner + scroll-margin
- `src/components/decision/InputScreen.tsx` — atributos en input de nombre
- `src/components/decision/CloseScreen.tsx` — atributos en input de email
- `src/components/decision/DecisionFlow.tsx` — hidratar pendingResult al montar
- `src/components/InAppBrowserBanner.tsx` (nuevo)
- `src/lib/inAppBrowser.ts` (nuevo)
- `src/lib/pendingResult.ts` (nuevo)
- `src/lib/analytics.ts` — eventos + property `is_inapp_browser`

## Lo que NO va a hacer

- No agrega "Continuar con Google" (otra decisión, requiere OAuth setup).
- No fuerza nada al usuario de Chrome o Safari nativo — el banner solo aparece en WKWebView in-app.
- No toca el flujo si no estás en WKWebView: cero cambios visibles para el 100% del tráfico desktop y para mobile fuera de in-app.
