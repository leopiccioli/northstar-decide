# Plan: hacer la plataforma legible para LLMs

## Problema

Los crawlers/LLMs sin renderizado JS hoy no ven:
- Los comentarios del **Muro de los lamentos** (`/comentarios`) — se cargan con React Query vía RPC.
- Las **estadísticas por país, sector y edad** (`/por-pais`, `/por-sector`, `/por-edad`) — todo client-side.
- Las **estadísticas globales** (`get_global_stats`, `get_measurement_count`).

El HTML inicial sólo tiene el shell de la app y meta tags. Eso es invisible para la mayoría de bots de IA.

## Solución

Edge functions **dinámicas** que devuelven **texto plano (Markdown)** consultando los datos en vivo, con `Cache-Control` corto. Estas URLs se referencian desde `llms.txt`, un nuevo `llms-full.txt` y el `sitemap.xml`, y se permiten explícitamente en `robots.txt`.

Ventajas: siempre fresco, sin paso de build, sin tocar la arquitectura de las páginas existentes, sin riesgo de romper la UI.

## Entregables

### 1. Nuevas edge functions (públicas, `verify_jwt = false`, CORS abierto)

Todas devuelven `text/plain; charset=utf-8` + `Cache-Control: public, max-age=300, s-maxage=600` (5–10 min).

- **`llm-comments`** → lista los últimos 500 comentarios vía `get_public_comments()`. Formato:
  ```text
  # Muro de los lamentos — 3D para Decidir

  > Comentarios anónimos de personas sobre su trabajo, junto a sus puntajes de Dinero, Desarrollo y Diversión (0–10). Última actualización: <ISO>.

  ## <fecha relativa> · <país> · <sector> · <rango edad>
  Dinero: X/10 · Desarrollo: Y/10 · Diversión: Z/10
  "<comentario>"

  ---
  ```
- **`llm-stats`** → un solo archivo con stats globales + por país + por sector + por edad (lee de `country_stats_cache`, `sector_stats_cache`, `age_range_stats_cache` y `get_global_stats`). Tablas Markdown simples.
- **`llm-index`** → versión expandida tipo `llms-full.txt`: descripción del proyecto, las 3D, la metodología, links a todas las páginas públicas y a los dos endpoints anteriores.

### 2. Rewrites en `public/_redirects` (Netlify-style, soportado por hosting de Lovable)

Para que las URLs públicas sean limpias y estables:

```
/llm/comentarios.txt   https://<proj>.functions.supabase.co/llm-comments   200
/llm/stats.txt         https://<proj>.functions.supabase.co/llm-stats      200
/llms-full.txt         https://<proj>.functions.supabase.co/llm-index      200
```

Si los rewrites no aplican en este hosting, fallback: enlazar directamente las URLs `*.functions.supabase.co` desde `llms.txt` (menos lindo pero funcional). Decisión final al implementar tras probar.

### 3. Actualizar `public/llms.txt`

Agregar al final:

```
## Datos en texto plano (para LLMs)

- [Comentarios](/llm/comentarios.txt): Últimos 500 comentarios anónimos con sus 3D, actualizados cada minutos.
- [Estadísticas](/llm/stats.txt): Promedios globales y por país/sector/edad.
- [Índice extendido](/llms-full.txt): Descripción completa del proyecto, metodología y rutas.
```

### 4. Actualizar `public/robots.txt`

- Quitar el bloqueo de `/embed-docs` (es contenido público útil) — opcional, confirmar.
- Agregar explícitamente:
  ```
  Allow: /llm/
  Allow: /llms.txt
  Allow: /llms-full.txt
  ```
- Agregar `User-agent` específicos para los bots de IA principales (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `CCBot`) con `Allow: /` para señal explícita.

### 5. Actualizar `scripts/generate-sitemap.ts`

Agregar entradas para `/comentarios`, `/por-pais`, `/por-sector`, `/por-edad`, `/llms-full.txt`, `/llm/comentarios.txt`, `/llm/stats.txt` (si no están). Verificar que todas las landings de uso (`/test-burnout`, `/cambiar-de-trabajo*`) estén incluidas.

### 6. Mejora menor de `<noscript>` en `index.html`

Agregar dentro de `<body>` un `<noscript>` con un resumen breve del proyecto y links a `/comentarios`, `/llm/comentarios.txt` y `/llms-full.txt`. Esto sirve a crawlers que sí renderizan algo pero no JS.

## Fuera de alcance

- SSR/prerender de las páginas React (más invasivo, no pedido).
- Cambios visuales o de UX en las páginas existentes.
- Nuevas tablas o cambios de esquema en la DB (todo lee de funciones/caches existentes).

## Validación

1. `curl` a cada edge function y verificar status 200 + `Content-Type` correcto + cuerpo Markdown legible.
2. `curl https://3d.ceoencamiseta.com/llm/comentarios.txt` para confirmar rewrites (o fallback).
3. Abrir `llms.txt` y `llms-full.txt` en el browser.
4. Verificar `robots.txt` y `sitemap.xml` finales.
