# Auditoría SEO + LLM: oportunidades y plan

Revisión de `index.html`, `SEO.tsx`, `robots.txt`, `sitemap.xml` (32 URLs), `llms.txt`, `scripts/prerender.ts`, `src/content/pages.ts` y las páginas de datos.

Lo que ya está bien: prerender de 27+ rutas, robots con bots de IA permitidos, archivos `/llm/*.txt` con frontmatter, FAQPage en landings y hallazgos, ventana canónica de 12 meses con N y fecha en cada cifra.

Abajo, lo que falta, ordenado por impacto.

## Fase 1 — Arreglos de metadatos (bajo esfuerzo, alto impacto)

1. **Twitter tags incompletos.** `index.html` define `twitter:card`, `site` e `image`, pero no `twitter:title` ni `twitter:description`. Agregarlos.
2. **`SEO.tsx` no emite `og:type`, `og:image`, `twitter:*` ni `og:locale`.** Toda página que usa el componente (stats, comentarios, hallazgos, datos-llm) queda con preview pobre. Extender el componente con esos tags, tomando la imagen por defecto de `/og-image.png`.
3. **`lastmod` en el sitemap.** Hoy ninguna URL lo tiene. Agregarlo sólo en las páginas cuyo contenido deriva del snapshot (stats por país/sector/edad, hallazgos, `/llm/*.txt`, `/datos-llm`, `/comentarios`), usando `CUT_DATE_ISO` — una fecha real y específica del contenido. Las páginas estáticas (inicio, origen, metodología, embeber) quedan sin `lastmod`.

## Fase 2 — Schema estructurado para datos (clave para LLMs y Google Dataset Search)

4. **JSON-LD `Dataset`** en `/datos-llm` y `/metodologia`: nombre, descripción, `creator` (CEO en Camiseta), `temporalCoverage` (ventana de 12 meses), `variableMeasured` (Dinero, Desarrollo, Diversión), `license`, y `distribution` apuntando a los cuatro `/llm/*.txt` y `.md`. Es el formato que Google y los crawlers de IA usan para reconocer un corpus citable.
5. **JSON-LD `Dataset` + `Table`** en `/por-pais`, `/por-sector`, `/por-edad`: cada tabla declarada con su N y fecha de corte.
6. **`BreadcrumbList`** en rutas anidadas (`/hallazgos/*`, `/sector/*`) — mejora el snippet en SERP y la jerarquía que ve un LLM.
7. **`ItemList` de comentarios** en `/comentarios`: los comentarios anónimos son el contenido más único del sitio y hoy sólo viven como texto plano; declararlos con schema los hace citables.

Todo esto se alimenta de `src/content/facts.ts`, así que no se puede desincronizar.

## Fase 3 — Cobertura de contenido (escalable, mismo patrón ya existente)

8. **Páginas por país**, espejando el patrón de `/sector/*`: `/pais/argentina`, `/pais/espana`, `/pais/mexico`, etc., sólo para países con N≥30. Hoy existen 5 páginas de sector y cero de país, pese a que el país es el corte con más datos.
9. **Páginas por rango etario**: `/edad/30-39`, `/edad/40-49`, `/edad/50-59` (con N≥30), conectando con las landings de "cambiar de trabajo a los 40/50" que ya rankean para ese cluster.
10. **Nuevos hallazgos citables** derivados del snapshot, sin datos nuevos: "¿Dinero o Diversión: cuál puntúa más alto?", "¿Cómo puntúa España su trabajo?", "¿Mejora el trabajo con la edad?".

Cada página nueva entra sola al prerender, al sitemap y a `llms.txt` porque esos tres se generan desde `src/content/pages.ts`.

## Fase 4 — Enlazado interno y descubrimiento

11. **Footer del sitio unificado.** Hoy sólo `/origen` tiene footer con navegación; el resto del sitio no linkea a hallazgos, estadísticas, metodología ni cómo citar. Reutilizar exactamente ese footer (mismo estilo, sin cambios visuales de diseño) en todas las páginas de contenido, agregando hallazgos y estadísticas.
12. **`llms-full.txt`**: un único archivo con todo el contenido concatenado (índice + stats + insights + comentarios). Varios crawlers de IA prefieren un solo fetch.
13. **`llms.txt`**: agregar los archivos `.md` faltantes y las páginas nuevas de las fases anteriores.

## Detalles técnicos

- Sin dependencias nuevas. Todo pasa por `src/components/SEO.tsx`, `src/content/facts.ts`, `src/content/pages.ts`, `scripts/prerender.ts` y `scripts/generate-llm-data.ts`.
- Las páginas de país y edad reutilizan `ContentPageView` y el mismo generador de rutas que `/sector/*`, con el umbral `PUBLISH_THRESHOLD` (30) ya definido.
- No se toca el diseño de ninguna página existente; el punto 11 reutiliza el footer que ya existe en `/origen`.

## Sugerencia de alcance

Fases 1 y 2 son las de mejor relación esfuerzo/impacto y se pueden hacer de una. La 3 es la que más tráfico nuevo puede traer pero agrega páginas. Decime si arranco por 1+2, si hago todo, o si preferís otro orden.
