# Widget embebible "3D para Decidir"

## Objetivo
Permitir que cualquier página tuya (ceoencamiseta.com, Notion, Substack, WordPress, etc.) muestre el flujo 3D embebido, sin redirigir al usuario y conservando atribución (UTMs) hacia tu dominio.

## Enfoque recomendado: iframe + script auto-resize

La forma estándar, segura y compatible con cualquier CMS. El usuario hace el 3D dentro de tu página; los datos siguen guardándose en tu backend (`3d.ceoencamiseta.com`), por lo que las stats globales, emails y reminders siguen funcionando igual.

### Snippet que vos pegás en cualquier página

```html
<div id="tres-d-embed" style="max-width:560px;margin:0 auto"></div>
<script async src="https://3d.ceoencamiseta.com/embed.js"
        data-target="tres-d-embed"
        data-context="burnout"
        data-source="ceoencamiseta"></script>
```

- `data-context` (opcional): `burnout` | `change` | `improve` | `compare` | `check`. Si se omite, arranca en la pantalla de contexto.
- `data-source` (opcional): se mapea a `utm_source` para atribución.
- `data-height` (opcional): alto fijo en px; por defecto auto-resize.

### Qué hace `embed.js`
1. Inyecta un `<iframe>` apuntando a `https://3d.ceoencamiseta.com/embed?ctx=burnout&utm_source=...&utm_medium=embed`.
2. Escucha `postMessage` desde el iframe para ajustar el alto dinámicamente al contenido (sin scroll interno).
3. Setea `allow="clipboard-write"` y `referrerpolicy="strict-origin-when-cross-origin"`.

## Cambios técnicos

### 1. Nueva ruta `/embed` (frontend)
- Archivo: `src/pages/EmbedPage.tsx`.
- Lee `?ctx=` de la URL y monta `<DecisionFlow initialContext={ctx} />` (ya existe la prop, hecha en las landings).
- Layout simplificado: sin footer fijo, sin banners (in-app banner sigue OK), padding mínimo.
- `useEffect` con `ResizeObserver` que postea `{type:'3d:resize', height}` al `parent` en cada cambio.
- `<SEO>` con `noindex` (no queremos que Google indexe el embed).
- Headers: en `index.html` / hosting no podemos setear `X-Frame-Options` por dominio; en su lugar configuramos `Content-Security-Policy: frame-ancestors` permisivo (`*`) sólo para esta ruta vía `<meta>` no aplica — se documenta que Lovable hosting permite framing por defecto. Si más adelante querés restringir, se hace en config de hosting.
- Ruta agregada en `src/App.tsx` (lazy).

### 2. Script público `public/embed.js`
- Vanilla JS (~1.5 KB), sin dependencias.
- Lee `data-*` del propio `<script>` (`document.currentScript`).
- Crea el iframe dentro del `data-target` (o reemplaza el `<script>` si no se pasa target).
- Listener `window.addEventListener('message', ...)` que valida `event.origin === 'https://3d.ceoencamiseta.com'` antes de aplicar el alto.
- Pasa UTMs por query string: `utm_source=<data-source||embed>`, `utm_medium=embed`, `utm_campaign=widget`.

### 3. Página de documentación `/embed-docs` (opcional pero recomendado)
- Muestra el snippet copy-paste, las opciones (`data-context`, `data-source`, `data-height`), un preview en vivo, y notas sobre privacidad (los datos los guarda 3D, no el sitio host).
- Linkeable desde el footer.

### 4. Tracking
- En `EmbedPage` disparar `trackFlowEvent('embed_view', { source, ctx })` al montar — reutiliza PostHog ya configurado.
- Los UTMs se persisten igual que hoy vía `useTrackingData` al guardar resultado, así sabés qué embed convirtió.

## Alternativas consideradas (descartadas)

- **Web Component (`<tres-d-widget>`)**: más elegante pero exige `<script type="module">` y rompe en editores que sanitizan custom elements (Substack, Notion). El snippet `<script src>` + iframe funciona en todos lados.
- **Reescribir el flujo en JS puro inyectado**: rompería el aislamiento de estilos del host, conflictos de Tailwind/fuentes, y duplicaría mantenimiento.

## Out of scope
- Theming desde el host (colores/fuentes) — el widget mantiene la identidad visual del 3D.
- Callbacks al host con el resultado (`onComplete`) — se puede agregar después vía `postMessage` si lo necesitás.
- Limitar dominios que pueden embeber — abierto por ahora.

## Archivos
- **Nuevos:** `src/pages/EmbedPage.tsx`, `public/embed.js`, `src/pages/EmbedDocsPage.tsx` (opcional).
- **Editados:** `src/App.tsx` (rutas `/embed` y `/embed-docs`), `public/robots.txt` (disallow `/embed`), `public/sitemap.xml` (no incluir embed).
