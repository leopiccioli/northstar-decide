# Hacer más rápido el camino "llego y respondo"

Medí el sitio publicado antes de escribir esto. Lo que arrastra hoy a quien entra por primera vez:

- El bundle inicial es **un solo archivo de 694 KB (215 KB comprimido)** que se descarga y se parsea antes de poder tocar nada.
- Adentro de ese archivo, sin necesitarse para responder las 3D, están: **posthog-js** entero, el **cliente de Supabase** entero y **todo el texto de las páginas de contenido** (hallazgos, sectores, países, edades). Verificado buscando `phc_trVH`, `supabase.co` y `sector-con-menos-diversion` dentro del JS publicado.
- En mobile la primera pantalla es **Context**, y está en carga diferida: el visitante ve el spinner y espera un segundo archivo antes de poder elegir su situación.
- El HTML prerenderizado de la home mete un `<article>` con título y muro de links **dentro de `#root`, sin estilos**. Es correcto para buscadores, pero el humano ve ese bloque en blanco y negro hasta que React lo reemplaza.

Abajo, ordenado por impacto sobre el tiempo hasta la primera respuesta.

## Fase 1 — Sacar del arranque lo que no se usa para responder

1. **posthog-js con import dinámico.** Hoy `initPostHog` se difiere, pero la librería igual viaja en el bundle inicial. Pasar a `await import('posthog-js')` dentro de `initPostHog`, y que `getPostHog()` devuelva `null` hasta que cargue (ya está preparado para eso). Es la porción más grande de JS que hoy nadie necesita para puntuar.
2. **Supabase fuera de la pantalla de entrada.** Lo único que pide la entrada es el contador de mediciones (`get_measurement_count`). Reemplazarlo por un `fetch` directo al endpoint RPC con la clave pública ya presente en el entorno. El cliente completo sigue igual, pero se carga recién en la pantalla de resultado, que es donde se guarda.
3. **Contenido editorial fuera del bundle inicial.** `App.tsx` importa `CONTENT_PAGES` sólo para declarar rutas, y eso arrastra todo el texto de las páginas de datos. Dejar en el arranque únicamente la lista de paths y mover el contenido al módulo que ya se carga diferido (`ContentPage`).
4. **Proveedores que no se usan en la home.** `QueryClientProvider` y `TooltipProvider` están en la raíz, pero React Query y el tooltip los usa sólo `/comentarios` (que además ya trae su propio `TooltipProvider`). Bajarlos a esa página.

## Fase 2 — Sacar la espera de la primera pantalla

5. **Invertir qué se carga diferido.** Mobile se saltea la entrada y arranca en Context, que hoy es diferida: spinner garantizado. Poner **Context como import directo** (es una pantalla chica: etiquetas y botones) y dejar **Entry como diferida**, ya que es sólo desktop. Quien entra desde el celular ve la primera pregunta sin un segundo viaje a la red.
6. **Precargar Input antes del click, no después.** Hoy se precarga 500 ms después de que Context aparece. Dispararlo también en el primer `pointerdown` sobre cualquier opción, para que la pantalla de sliders esté lista en el momento del click.

## Fase 3 — Percepción y red

7. **Contador sin salto.** La entrada y las landings muestran "N mediciones" recién cuando responde la base. Pintar de entrada el número del snapshot del build y reemplazarlo cuando llega el dato real: se ve un número desde el primer frame.
8. **Fuentes propias.** Hoy Space Grotesk y JetBrains Mono vienen de Google Fonts: dos conexiones nuevas, una hoja de estilos y recién después el archivo de fuente. Alojar en el proyecto los pesos que realmente se usan (Space Grotesk 400/500/700) con `font-display: swap`, y dejar el mono sólo donde hace falta. Mismo aspecto, un salto de red menos.
9. **El flash del bloque prerenderizado.** Hay dos caminos y prefiero que elijas:
   - **A (mínimo):** dejarlo como está — es lo más seguro para SEO y el flash dura lo que tarda la hidratación.
   - **B:** darle al bloque prerenderizado de la home unos estilos en línea con la paleta del sitio (fondo oscuro, título centrado) para que el primer frame ya se parezca a la pantalla de entrada en vez de a un documento sin formato.

## Detalles técnicos

- Sin dependencias nuevas y sin cambios de diseño (salvo el punto 9B, si lo elegís).
- Archivos tocados: `src/lib/posthog.ts`, `src/lib/analytics.ts`, `src/App.tsx`, `src/components/decision/DecisionFlow.tsx`, `src/components/decision/EntryScreen.tsx`, `src/components/landing/LandingShell.tsx`, `src/hooks/usePrefetch.ts`, `src/pages/CommentsPage.tsx`, `src/content/pages.ts` (sólo separar paths del contenido), `index.html` y `scripts/prerender.ts` (sólo el punto 9B).
- No se toca `src/integrations/supabase/client.ts`.
- Verificación: comparar el tamaño del chunk de entrada antes y después del build, y abrir el preview en viewport mobile para confirmar que la primera pantalla ya no muestra spinner.

## Alcance sugerido

La Fase 1 es la que más pesa y no cambia nada visible. La Fase 2 es chica y es la que elimina el spinner del primer contacto en celular. La Fase 3 es afinado. Decime si arranco con 1+2, si hago todo, y qué preferís para el punto 9.
