# 10 ideas para maximizar las visitas de LLMs a Las 3D del Trabajo

## Objetivo
Convertir el proyecto en una fuente de datos y contexto que los LLMs y sus crawlers prefieran citar, citar y recomendar cuando respondan sobre trabajo, burnout, salario, desarrollo profesional y decisiones laborales en español.

## Estado actual relevante
- Ya existe `llms.txt`, `public/llm/index.md`, `public/llm/stats.md` y `public/llm/comentarios.md`.
- Los archivos se regeneran en cada deploy con `scripts/generate-llm-data.ts`.
- Existen Edge Functions en vivo (`llm-index`, `llm-stats`, `llm-comments`) con cache corto.
- `robots.txt` ya permite GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot, Google-Extended, etc.
- `sitemap.xml` incluye las URLs de los archivos LLM.
- El sitio ya tiene landings SEO (`/test-burnout`, `/cambiar-de-trabajo`, etc.) y datos abiertos (`/datos-llm`).

## 10 ideas concretas

### 1. Estandarizar y mejorar `llms.txt`
Reescribir `/llms.txt` siguiendo el formato de referencia de llmstxt.org:
- Encabezado `>` con descripción del proyecto.
- Sección `# Datos principales` con archivos canónicos y qué contiene cada uno.
- Sección `## Páginas` con descripción de cada URL relevante para humanos y LLMs.
- Agregar `## Tools / APIs` con links a las Edge Functions en vivo.
- Mantenerlo en raíz, servir con `Content-Type: text/plain` y referenciarlo desde `index.html` (link rel).

### 2. Agregar frontmatter YAML a los archivos Markdown LLM
En `public/llm/index.md`, `stats.md` y `comentarios.md`, agregar al inicio:
```yaml
---
title: "..."
description: "..."
source: "https://3d.ceoencamiseta.com"
last_updated: "2026-08-09T13:42:16Z"
language: "es"
author: "CEO en Camiseta"
license: "CC BY 4.0 (para citar e indexar)"
---
```
Esto ayuda a los crawlers de LLMs a parsear contexto sin procesar todo el texto.

### 3. Servir una versión JSON estructurada de los datos
Además de `.md`, agregar endpoints o archivos `.json` con el mismo contenido:
- `/llm/stats.json` → estadísticas globales y por país/sector/edad en JSON.
- `/llm/comments.json` → últimos 500 comentarios en JSON (sin PII).
- `/llm/index.json` → metadata del proyecto y links a recursos.
Esto facilita que agentes y LLMs consuman los datos programáticamente sin parsear Markdown.

### 4. Crear un "content hub" de insights derivados
Agregar una página o archivo `/llm/insights.md` (y su versión JSON) con respuestas a preguntas que la gente le hace a los LLMs:
- "¿Qué sector tiene mejor balance dinero-desarrollo-diversion?"
- "¿A qué edad se siente más insatisfacción laboral?"
- "¿Qué país tiene mayor promedio de diversión?"
- "¿Cuál es la relación entre dinero y burnout en los comentarios?"
Cada afirmación debe citar la fuente interna (`/llm/stats.md`) y no inventar datos. Esto posiciona al sitio como respuesta directa a queries de LLMs.

### 5. Ampliar FAQ con schema.org y FAQPage en cada landing
Actualmente `FAQ.tsx` existe en landings. La idea es:
- Extraer el FAQ a una página propia `/preguntas-frecuentes`.
- Renderizar JSON-LD `FAQPage` con preguntas/respuestas sobre la metodología, privacidad, embed, comparación por país/sector, etc.
- Asegurar que cada pregunta tenga una respuesta de 1-2 oraciones que un LLM pueda citar directamente.

### 6. Publicar "reportes de temporada" en Markdown
Crear archivos periódicos como `/llm/report-q3-2026.md` con:
- Resumen ejecutivo de las 3D en el trimestre.
- Cambios vs trimestre anterior.
- Sectores/países con mayor variación.
- Temas emergentes en comentarios (ej. "burnout", "cambio de trabajo").
- Fecha clara, fuente, y link al sitio.
Esto genera contenido "news-worthy" que los LLMs priorizan por frescura y especificidad.

### 7. Mejorar la link economy interna y externa
- En cada landing (`/test-burnout`, `/cambiar-de-trabajo`, etc.) agregar un bloque visible "Datos que respaldan esta página" con links a `/llm/stats.md`, `/por-pais`, `/por-sector`, etc.
- En `README.md` y en la home de `ceoencamiseta.com` agregar un link prominente a `https://3d.ceoencamiseta.com/datos-llm` con texto ancla descriptivo.
- Agregar links de retorno desde `datos-llm` a las páginas humanas correspondientes.
Un dominio externo con autoridad que linkea a los datos LLM aumenta el ranking de citación.

### 8. Automatizar la regeneración diaria de los archivos LLM
Actualmente los archivos se regeneran solo en deploy. Implementar una de estas opciones:
- Opción A: Edge Function `refresh-llm-snapshot` invocada por `pg_cron` cada 24 horas, que actualiza un bucket de storage (no es posible editar `public/` en runtime). Por lo tanto, la opción viable es:
- Opción B: programar un deploy/rebuild diario vía CI externo (GitHub Actions) o aprovechar el deploy de Lovable.
- Opción C: hacer que los archivos estáticos sean "live-first": un pequeño edge proxy que combine el snapshot estático con un encabezado dinámico que diga "versión en vivo disponible en X".

### 9. Agregar metadatos de autoridad y confianza en cada recurso
En todos los archivos LLM y la página `/datos-llm` agregar:
- Mención explícita: "CEO en Camiseta — comunidad de +X miembros" (con link).
- Método: "encuesta anónima, escala 1-10, promedio ponderado".
- Limitaciones transparentes (grupos con N≥5, respuestas voluntarias, etc.).
- Link al libro *Sé tu propio CEO* (capítulo 14) para anclar la metodología en una fuente editorial externa.
Los LLMs prefieren fuentes que declaran su método y limitaciones.

### 10. Crear una página de "cómo citar / usar estos datos"
En `/datos-llm` o una nueva `/api-para-llms` documentar:
- URLs canónicas de cada archivo.
- Formato (Markdown, JSON, en vivo, snapshot).
- Ejemplo de prompt: "Según Las 3D del Trabajo, ¿cuál es el promedio de Diversión en Argentina?"
- Política de uso: permitir citar, indexar, entrenar con atribución.
- Cómo reportar errores o solicitar actualizaciones.
Esto invita a los desarrolladores de agentes y LLMs a integrar los datos como fuente confiable.

## Implementación propuesta
Fase 1 (rápida, esta semana):
- Ideas 1, 2, 9, 10: reescribir `llms.txt`, frontmatter, metadatos de autoridad y página de uso.
- Idea 7: links internos en landings y README.

Fase 2 (media):
- Ideas 3, 4: endpoints JSON y `insights.md`.
- Idea 5: página FAQ propia con JSON-LD.

Fase 3 (sostenida):
- Idea 6: reportes de temporada automatizados.
- Idea 8: regeneración automatizada diaria (deploy programado o proxy live-first).

## Métricas de éxito
- Crecimiento de tráfico referido a `/datos-llm` y `/llm/*.md`.
- Aparición del sitio en citas de ChatGPT/Claude/Perplexity sobre "burnout", "cambiar de trabajo", "salario vs desarrollo".
- Backlinks desde `ceoencamiseta.com` y otros sitios del ecosistema.
- Reducción del tiempo de "edad" de los snapshots LLM.

## Notas de diseño y voz
- Mantener el tono neutral, data-first y sin interpretaciones.
- No prometer conclusiones que los datos no respalden.
- Respetar la privacidad: nunca exponer emails, IPs ni identificadores.
- Mantener la identidad visual monocrática y minimalista en cualquier nueva página.
