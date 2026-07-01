## Rebrand: "3D para Decidir" → "Las 3D del Trabajo"

Cambio de nombre puro, sin tocar dominio, DB, ni tracking IDs. El dominio `3d.ceoencamiseta.com` se mantiene (el "3D" del subdominio sigue siendo coherente).

### 1. Título en el hero (EntryScreen)

Actualmente el H1 hace un truco visual: "3**D** para Decidir" con la "D" que tickea como brújula. Hay dos formas de mantener ese gesto:

- **Opción A (recomendada):** "Las 3**D** del Trabajo" — la "D" de "3D" sigue tickeando, y "del Trabajo" reemplaza "para Decidir". El sublabel actual `tu trabajo` se elimina (queda redundante).
- **Opción B:** dejar el sublabel como "para decidir" en gris debajo, si querés conservar el guiño.

Ir con A salvo que digas lo contrario.

### 2. Copys, títulos y metadata (buscar/reemplazar global)

Reemplazar **"3D para Decidir" → "Las 3D del Trabajo"** en:

- `index.html`: `<title>`, `og:title`, JSON-LD `WebSite.name`, `<h1>` del `<noscript>`.
- SEO por ruta: `src/pages/Index.tsx`, `TestBurnoutPage.tsx`, `NotFound.tsx`, `DatosLlmPage.tsx`, `EmbedPage.tsx`, `EmbedDocsPage.tsx`.
- Header: `src/components/SiteHeader.tsx` (aria-label).
- Comentarios/imágenes compartibles: `CommentShareCard.tsx`, `generateCommentImage.ts` (card visual + og de comentarios).
- Widget embebible: `public/embed.js` (comentario + `iframe.title`).
- Emails/LLM data: `scripts/generate-llm-data.ts` (regenera los `.md` estáticos) y edge functions `llm-index`, `llm-stats`, `llm-comments` (redeploy).
- Archivos estáticos: `public/llms.txt`, `public/llm/index.md`, `public/llm/stats.md`, `public/llm/comentarios.md` — se regeneran corriendo `generate-llm-data.ts`.

### 3. Cosas que NO cambian

- Dominio `3d.ceoencamiseta.com` y todas las URLs canónicas/sitemap.
- Nombres de tablas, RPCs, edge functions, cron jobs, Event IDs de pixels (X, Meta, GA).
- Copys internos que dicen solo "3D" o "las 3D" (dimensiones) — ya son consistentes con el nombre nuevo.
- Landing pages `/test-burnout`, `/cambiar-de-trabajo*` — el H1 propio de cada una se mantiene; solo cambia la mención al producto en subtítulos/FAQs si aparece.
- Memoria del proyecto: actualizo el `mem://index.md` Core rule que hoy dice "3D para Decidir".

### 4. Emails ya enviados / cache social

- Emails ya despachados (Resend) mantienen el nombre viejo — no se pueden reescribir. Los futuros salen con el nombre nuevo (los templates viven en `send-reminders` y `resend-measurement` — reviso si mencionan el nombre y actualizo).
- Previews de LinkedIn/Slack/X van a seguir mostrando el título viejo hasta que refresquen su cache (24-48h típicamente, o forzando en el debugger de cada plataforma).

### 5. Pregunta abierta antes de ejecutar

- **Tagline / sublabel del hero:** hoy dice `tu trabajo` debajo. Con el nombre nuevo "Las 3D del **Trabajo**" queda redundante. Propongo eliminarlo y dejar el hook `La mayoría tolera un trabajo mediocre…` como único texto de apoyo. ¿OK, o preferís otro subtítulo (ej. "Medí, decidí")?

---

### Detalle técnico

Ejecución en una sola tanda:

1. Reemplazo literal `3D para Decidir` → `Las 3D del Trabajo` en los 19 archivos listados por `rg`.
2. Edit puntual en `EntryScreen.tsx` líneas 48-58 para el H1 nuevo + quitar sublabel.
3. Correr `bun run scripts/generate-llm-data.ts` para regenerar los 3 `.md` bajo `public/llm/`.
4. Redeploy de las 3 edge functions `llm-*`.
5. Update de `mem://index.md`.
6. Review rápido de templates en `send-reminders/index.ts` y `resend-measurement/index.ts` por si mencionan el nombre del producto.

No hay migraciones de DB, ni cambios de rutas, ni cambios de sitemap.
