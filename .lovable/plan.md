# Visibilidad LLM — Fase 0 a 2

Objetivo: que cada URL del sitio sea legible y citable sin JavaScript, con cifras, fecha de corte y fuente dentro de cada frase.

Decisiones tomadas: prerender estático en build (sin migrar a SSR) y "últimos 12 meses" como universo canónico, con la base histórica completa como serie secundaria etiquetada.

## Fase 0 — Bloqueantes

**B1 — Prerender por ruta.** Un script de post-build genera un `index.html` propio por cada URL del sitemap con: title único, meta description única, canonical propia, H1 propio y el contenido sustantivo en HTML plano dentro del contenedor de la app (React lo reemplaza al hidratar, el crawler ve el HTML).
- `/por-pais`, `/por-sector`, `/por-edad`: tablas `<table>` reales con las cifras y el N de cada fila.
- `/comentarios`: los comentarios como texto plano (con el mismo scrubbing de datos personales que ya se aplica).
- Landings y páginas informativas: su copy real, no el del home.
- Criterio de aceptación: `curl -s .../por-sector | grep -c "Finanzas"` devuelve ≥ 1.
- Tope duro de páginas generadas para no romper el límite de publicación.

**B2 — Legibilidad de `/llm/*.md`.** El hosting estático no permite fijar headers, así que se publica cada archivo también como `.txt` (`/llm/stats.txt`, etc.), que sí se sirve como texto plano, y `llms.txt` apunta a esas variantes como lectura primaria. Los `.md` quedan como alias.

**B3 — Dominio canónico (parcial).** Se elimina toda referencia visible a la URL del backend en el HTML, en `llms.txt` y en `/datos-llm`. Lo citable pasa a ser `3d.ceoencamiseta.com/llm/*`. El proxy real `/llm/live/*` no es posible sin SSR: los snapshots fechados quedan como fuente canónica y se declara su fecha de corte. Queda anotado como la única pieza del brief que este stack no cubre.

**B4 — Universo declarado.** Cifra principal = últimos 12 meses. Cada archivo, endpoint, tabla y página abre declarando universo, ventana temporal, N y fecha de corte. La base histórica completa se publica aparte, etiquetada como serie histórica.

**B5 — Fecha visible.** Fecha de corte en formato absoluto ("datos al 9 de agosto de 2026") en cada tabla, archivo y página con datos. Nunca relativa.

## Fase 1 — Citabilidad

- **Método y límites** (Idea 9): bloque fijo en cada superficie de datos — muestra voluntaria y autoseleccionada, sesgo a Argentina (~85%), cobertura demográfica ~5%, inclusión sólo de grupos con N≥5, N visible por celda.
- **Página "Cómo citar"** (Idea 10) en `/como-citar`: cadena de cita exacta para copiar y pegar (nombre, N, fecha, URL), más versiones para prensa y para académico.
- **Fuente dentro de la frase** (M2): regla de redacción aplicada a todo el contenido nuevo y a los archivos `/llm/*`. Cada afirmación viaja sola: "Según Las 3D del Trabajo (n=6.291 en Argentina, datos al 9-ago-2026), Finanzas/Banca es el sector con menor Diversión: 4,3 sobre 10."
- **Frontmatter YAML** (Idea 2) en cada archivo de datos: título, universo, ventana, N, fecha de corte, licencia, cita sugerida.
- **`llms.txt`** (Idea 1): sección `## Datos` reapuntada a las rutas propias, más `<link rel="llms">` en el HTML.

## Fase 2 — Superficie de recuperación

- **Insights derivados** (Idea 4), cada uno con página HTML prerenderizada propia y respuesta en las primeras 60 palabras, en prosa: sector con peor Diversión, país con peor puntaje, qué dimensión es la más baja del mundo, cuánto se aleja Agro y Gobierno del promedio. Se descarta la pregunta de correlación dinero/burnout.
- **Páginas con forma de pregunta** (M1): `/aburrido-en-mi-trabajo-pero-pagan-bien`, `/cuando-renunciar-sin-otro-trabajo`, `/burnout-o-cansancio`, `/peor-clima-laboral-por-sector`. Respuesta arriba, dato propio como respaldo, CTA a medir.
- **Páginas de sector** (M3): `/sector/finanzas`, `/sector/agro`, `/sector/gobierno` y el resto con N defendible, con el N a la vista.
- **Link economy interna** (mitad interna de Idea 7): bloque "los datos que respaldan esta página" en cada landing, apuntando a la tabla y al archivo correspondiente.

## Fase 3 — Sostenido (no en este entregable)

FAQ propia con JSON-LD `FAQPage`, y espejo legible por máquina de cada Pulso publicado (`/llm/pulso-q3-2026.md`, congelado y versionado). Se implementan cuando exista el primer Pulso a espejar.

Descartado: endpoints JSON y regeneración diaria automatizada.

## Detalle técnico

- `scripts/prerender.ts` corre después de `vite build`, reutiliza los datos que ya trae `scripts/generate-llm-data.ts` y escribe `dist/<ruta>/index.html`. Sin dependencias nuevas y sin cambiar el runtime de la app.
- El contenido prerenderizado vive dentro del contenedor raíz; al hidratar, React lo reemplaza, por lo que la experiencia del usuario no cambia.
- Cada ruta nueva se agrega a `App.tsx`, al `sitemap.xml` y a la lista de prerender en un mismo lugar, para que no se desincronicen.
- Un test verifica que cada URL del sitemap tenga su HTML generado con title y H1 distintos.

## Medición

Set fijo de ~15 consultas en español corrido hoy como línea de base y repetido cada 30 días contra ChatGPT, Claude y Perplexity. Secundarias: cantidad de rutas indexadas con títulos distintos, hits de crawlers de IA en `/llm/*`, menciones del nombre fuera del dominio.
