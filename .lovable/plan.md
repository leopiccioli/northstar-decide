
## Cambios al popup de comentarios

### 1. Filename con ID rastreable
- `CommentShareCard` recibe `id` del comentario (ya disponible en `Comment`).
- Nombre del archivo: `3d-comentario-{shortId}.png` (primeros 8 chars del uuid).
- También se usa como `utm_content` si agregamos share.

### 2. Imagen compacta + metadata visible
Problema actual: canvas 1080×1350 con mucho aire abajo y sin fecha/país/sector/edad.

Cambios en `generateCommentImage.ts`:
- Recibir `createdAt`, `country`, `sector`, `ageRange` además de los actuales.
- Reducir altura a un canvas **auto-ajustable**: calcular alto según líneas del comentario + meta. Mantener ancho 1080, alto entre 1080 y 1350 según contenido (alto mínimo 1080 para que quede cuadrado-ish y compartible en stories/feed).
- Layout:
  - Título "3D para Decidir" (top, 90px padding)
  - 3 sliders (Dinero / Desarrollo / Diversión)
  - Divider
  - Comentario (`"..."`) en cuerpo
  - **Línea de metadata** (debajo del comentario, gris pequeño): `28 may 2026 · 🇦🇷 Argentina · Tecnología / Software · 35-44` — solo muestra los que existen, separados por ` · `.
  - Footer `3d.ceoencamiseta.com` cerca del final, no flotando lejos.
- Reducir `padding` y huecos para evitar espacio muerto.
- Si el comentario es corto, el canvas queda más bajo (no se rellena con vacío).

Bandera de UTF-8 (emoji) en canvas: usar font stack que soporte emojis (`"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`) o omitir la bandera en la imagen y usar solo el nombre del país (más seguro cross-browser). **Decisión:** omitir bandera en la imagen, mantenerla solo en el dialog. Más limpio y evita problemas de render.

### 3. Compartir por WhatsApp — sí, vale la pena
Razón: la persona que comenta puede querer compartir su propio testimonio, y otros lectores pueden querer compartir un comentario que les resonó. Es coherente con la estrategia de distribución viral existente (`buildWhatsAppShareUrl`).

Implementación:
- Botón secundario "Compartir" al lado de "Descargar imagen" en `CommentShareCard`.
- En mobile (con `navigator.share` y `canShare({ files })`): share nativo con el PNG + texto.
- Fallback: abrir `wa.me` con texto + link al sitio (sin imagen, WhatsApp Web no soporta files vía URL).
- Texto: `"Un comentario de las 3D que me quedó dando vueltas:\n\n\"{comentario corto}\"\n\n{baseUrl}?utm_source=whatsapp&utm_medium=referral&utm_campaign=share_comment&utm_content={shortId}"`.
- Trackear con `trackFlowEvent('share_result', { surface: 'comment', id: shortId })` (reutilizar evento existente, no agregar nuevo tipo).

### Archivos a editar
- `src/components/comments/CommentShareCard.tsx` — recibir `id`, pasar meta a generador, agregar botón share, naming del archivo.
- `src/components/comments/generateCommentImage.ts` — aceptar meta, calcular alto dinámico, dibujar línea de metadata, layout más compacto.
- `src/pages/CommentsPage.tsx` — pasar `id={selected.id}` al `CommentShareCard`.

Sin cambios en DB ni edge functions.
