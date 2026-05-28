## 1. Nav superior en páginas de stats (`/por-pais`, `/por-sector`, `/por-edad`)

Nuevo componente `src/components/stats/StatsNav.tsx` con 3 pills:
- "Por país" → `/por-pais`
- "Por sector" → `/por-sector`
- "Por edad" → `/por-edad`

La pill activa se muestra resaltada (border/foreground), las otras dos como links neutros. Se renderiza arriba de todo en `StatsPage.tsx`, `SectorStatsPage.tsx` y `AgeStatsPage.tsx` (debajo del header existente / antes del selector de período). Sigue la estética monocromática actual: Space Grotesk, sin colores semánticos positivos/negativos.

## 2. Comentarios: modal compartible al clickear una tarjeta

Nuevo componente `src/components/comments/CommentShareCard.tsx` + modal usando `Dialog` de shadcn.

**Comportamiento:**
- En `CommentsPage.tsx`, tanto en vista feed como mosaico, hacer cada `<article>` clickeable (no envolver con `<Link>` para no romper navegación). Al click → abre Dialog con el contenido.
- Para hacerlo, la query necesita los nombres reales de las dimensiones del comentario (ya vienen: `dinero`, `desarrollo`, `diversion`). No requiere nuevos datos del backend.

**Contenido del modal (la "imagen compartible"):**
Un card cuadrado/4:5 con fondo `bg-background`, padding generoso, pensado para captura/screenshot:
1. Título pequeño arriba: "3D para Decidir"
2. Las 3 dimensiones renderizadas con `DimensionSlider` en modo **read-only** (sin interacción) mostrando los valores de esa persona — Dinero (rojo), Desarrollo (navy), Diversión (gris). Se reutiliza `DimensionSlider` pasándole `onChange={() => {}}` y deshabilitando pointer-events vía wrapper `pointer-events-none`.
3. El comentario en texto grande debajo.
4. Footer: `3d.ceoencamiseta.com` (desde `SITE_CONFIG.domain`) en tipografía discreta.

**Acciones bajo la card (fuera de la zona "compartible"):**
- Botón "Descargar imagen" → usa el patrón de `ShareImageGenerator.ts` (Canvas API) para generar PNG 1080x1350 con sliders dibujados a mano y el comentario + dominio. Se descarga directo (no share nativo, porque el caso de uso es "pegarlo en un artículo").
- Cerrar.

**Generación PNG:** Nuevo helper `src/components/comments/generateCommentImage.ts` siguiendo el estilo de `ShareImageGenerator.ts` — dibuja título, 3 barras horizontales monocromáticas con labels Dinero/Desarrollo/Diversión y valor X/10, comentario centrado (con wrap), dominio al pie.

## Archivos

**Nuevos:**
- `src/components/stats/StatsNav.tsx`
- `src/components/comments/CommentShareCard.tsx`
- `src/components/comments/generateCommentImage.ts`

**Editados:**
- `src/pages/StatsPage.tsx`, `SectorStatsPage.tsx`, `AgeStatsPage.tsx` — montar `<StatsNav active="..." />`
- `src/pages/CommentsPage.tsx` — `onClick` en cada `<article>` que abre `Dialog` con `<CommentShareCard>`

Sin cambios de base de datos, edge functions ni memorias nuevas (la memoria de comentarios sigue válida).