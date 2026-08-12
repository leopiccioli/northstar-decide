# Quitar PostHog + optimizaciones separadas por riesgo SEO/LLM

## Parte A — Quitar PostHog

PostHog está en 6 archivos y es la librería más grande que hoy viaja en el bundle inicial sin necesitarse para responder las 3D.

- `src/lib/posthog.ts` — se elimina el archivo entero.
- `src/main.tsx` — sacar el `initPostHog` diferido.
- `src/lib/analytics.ts` — sacar el bloque PostHog de `trackEvent` (incluido el `identify` por email en `save_result`). Meta Pixel, X Pixel y GA4 quedan intactos.
- `src/pages/EmbedPage.tsx` — sacar el `capture('embed_view')`.
- `src/components/landing/LandingShell.tsx` — sacar el `capture('lp_view')`.
- `package.json` — desinstalar `posthog-js`.

Nota: los eventos `embed_view` y `lp_view` sólo se mandaban a PostHog. Si querés conservarlos, los puedo redirigir a GA4 en la misma pasada — decime.

## Parte B — Optimizaciones SIN ningún riesgo para SEO ni LLMs

Ninguna de estas toca el HTML prerenderizado, ni el sitemap, ni los `.md`/`.txt` para LLMs, ni el texto visible.

1. **Supabase fuera de la pantalla de entrada.** Lo único que pide es el contador (`get_measurement_count`); pasa a un `fetch` al endpoint RPC. El cliente completo se carga recién al guardar el resultado.
2. **Contenido editorial fuera del bundle inicial.** `App.tsx` importa `CONTENT_PAGES` sólo para declarar rutas y eso arrastra todo el texto de hallazgos, países, sectores y edades al primer archivo. Queda una lista liviana de paths; el contenido se carga con la página. El prerender sigue leyendo el contenido igual que hoy en tiempo de build, así que las 36 rutas estáticas y el sitemap no cambian.
3. **Proveedores que no se usan en la home.** `QueryClientProvider` y `TooltipProvider` están en la raíz pero los usa sólo `/comentarios`. Bajarlos a esa página.
4. **Invertir la carga diferida de las pantallas.** Mobile arranca en Context, que hoy es diferida: spinner garantizado en el grupo más grande. Context pasa a import directo y Entry (sólo desktop) pasa a diferida.
5. **Precargar Input en el `pointerdown`,** no 500 ms después de que aparece Context.
6. **Contador sin salto.** Pintar el número del snapshot del build desde el primer frame y reemplazarlo cuando responde la base.
7. **Fuentes propias.** Space Grotesk y JetBrains Mono hoy vienen de Google Fonts: conexión nueva + hoja de estilos + archivo. Alojarlas en el proyecto con `font-display: swap`. Mismo aspecto, un salto de red menos, y mejora Core Web Vitals (o sea, si algo, ayuda al SEO).

## Parte C — Lo que SÍ toca terreno SEO/LLM (decidir aparte)

8. **Estilar el bloque prerenderizado de la home.** Hoy el `<article>` que inyecta el prerender vive dentro de `#root` sin estilos: el humano ve texto plano hasta que hidrata React.
   - *Riesgo:* cualquier cosa que lo achique, lo oculte o lo mueva fuera del flujo puede leerse como contenido escondido, y es exactamente el bloque que hoy lee un crawler que no ejecuta JS.
   - *Mitigación si lo hacemos:* sólo colores y tipografía en línea, sin `display:none`, sin `height:0`, sin `overflow:hidden`, y el texto queda íntegro.
   - *Mi recomendación:* no tocarlo. La ganancia es estética y dura menos de un segundo; el riesgo cae sobre la pieza que sostiene la indexación.

9. **Diferir el `<script>` de GA4 / píxeles aún más (o cargarlos sólo tras la primera interacción).**
   - *Riesgo:* no es SEO, es de medición — perdés parte de los pageviews de quien rebota rápido.
   - *Mi recomendación:* dejarlo como está ahora que sale PostHog; el peso restante ya es chico.

10. **Partir el bundle por ruta también para las páginas de contenido.**
    - *Riesgo:* ninguno para el crawler (todo está prerenderizado), pero si el `code-splitting` se pasa de fino, las páginas de datos tardan más en hidratar y eso sí puede empeorar los Core Web Vitals medidos en campo.
    - *Mi recomendación:* hacer sólo el corte del punto 2 y no ir más fino.

## Detalles técnicos

- Sin dependencias nuevas; se quita una (`posthog-js`).
- Sin cambios de diseño ni de copy en ninguna página.
- Archivos tocados en A+B: `src/lib/posthog.ts` (borrar), `src/main.tsx`, `src/lib/analytics.ts`, `src/pages/EmbedPage.tsx`, `src/components/landing/LandingShell.tsx`, `src/App.tsx`, `src/components/decision/DecisionFlow.tsx`, `src/components/decision/EntryScreen.tsx`, `src/hooks/usePrefetch.ts`, `src/pages/CommentsPage.tsx`, `src/content/pages.ts` (sólo separar paths de contenido), `index.html` + los archivos de fuente.
- No se toca `src/integrations/supabase/client.ts`, ni `scripts/prerender.ts`, ni `llms.txt`, ni el sitemap.
- Verificación: comparar el tamaño del chunk de entrada contra el actual (694 KB crudos / 215 KB comprimidos), y confirmar en el build que siguen saliendo las 36 rutas estáticas y el sitemap completo.

## Qué necesito de vos

- ¿Redirijo `embed_view` y `lp_view` a GA4, o los dejo morir con PostHog?
- ¿Arranco con A+B (recomendado), o querés incluir alguno de los tres de la Parte C?
