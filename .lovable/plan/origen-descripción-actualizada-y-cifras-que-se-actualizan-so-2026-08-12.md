# /origen: descripción actualizada y cifras que se actualizan solas

## Qué se ve hoy

La página `/origen` tiene tres cifras escritas a mano y ya inconsistentes entre sí:

- meta description: "más de 10.000 respuestas"
- texto de entrada y FAQ: "más de 11.000"
- bloque "Los datos": "n=1.563 al 12 de agosto de 2026 · Actualizado: agosto 2026"

El snapshot de datos del proyecto (`src/data/llm-snapshot.ts`, regenerado por el script de datos) ya sabe el número real: **12.923 respuestas históricas**, ventana de 12 meses **n=1.563**, corte **12 de agosto de 2026**. Nadie lo estaba usando en `/origen`.

## Qué se hace

1. **Cifra redondeada automática.** Se agrega en el módulo de hechos (`src/content/facts.ts`) un valor derivado del total histórico, redondeado hacia abajo al millar y formateado en español: hoy da "12.000". Cuando el snapshot pase de 13.000, la frase pasa sola a "más de 13.000".

2. **`/origen` deja de tener números escritos a mano.** La description, el texto de entrada, el bloque "Los datos" y la FAQ "¿Cuántas personas respondieron?" se arman con esa cifra + el n de 12 meses + la fecha de corte del snapshot. El texto pedido queda exactamente así hoy:

   > Las 3D las creó Leo Piccioli en 2007. Hoy son un termómetro con más de 12.000 respuestas.

3. **Coherencia en todos los lugares donde aparece la description**: meta description, `og:description`, `twitter:description` (hoy falta en la página) y el campo `description` del JSON-LD `Article`. Los cuatro salen de la misma constante, así que no pueden divergir.

4. **Prerender y sitemap** ya importan `ORIGEN_META` desde la página, así que el HTML estático que ven los crawlers y los LLMs hereda el mismo texto sin tocar nada más. Se elimina el string duplicado "10.000" que quedó copiado en el script de prerender.

5. **`dateModified` del JSON-LD** pasa a usar la fecha de corte del snapshot en vez de estar fija.

No se toca el diseño: mismos componentes, mismo layout, mismas clases.

## Cómo queda el mantenimiento

Al regenerar el snapshot de datos (el paso que ya se corre cuando se actualizan las estadísticas), `/origen`, su meta description, sus tags sociales, su JSON-LD, el HTML prerenderizado y los archivos para LLMs quedan alineados con la base sin edición manual. La única frase que sigue siendo editable a mano es la narrativa histórica (2007, Officenet, iProfesional), que no depende de datos.

## Detalle técnico

- `src/content/facts.ts`: exportar `ALL_TIME_TOTAL`, `ALL_TIME_ROUNDED_LABEL` (floor a millar, formato `es-AR`) y reutilizar `CUT_DATE_HUMAN` / `N`.
- `src/pages/OrigenPage.tsx`: `ORIGEN_META.description`, `lead`, `faq[2].a` y `ORIGEN_DATA.respuestas` pasan a ser template strings sobre esas constantes; agregar `<meta name="twitter:description">` y `twitter:card`/`twitter:title`; `dateModified` desde `CUT_DATE_ISO`.
- `scripts/prerender.ts`: usar `ORIGEN_META.description` en lugar del literal de la línea 289.
- Sin cambios de estilos, rutas ni lógica de datos.
