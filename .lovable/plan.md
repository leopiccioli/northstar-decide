# README para GitHub de Las 3D del Trabajo

Reemplazar el README.md actual (plantilla de Lovable) por un README centrado en el producto, sin tocar ningún otro archivo del proyecto.

## Contenido propuesto

1. **Encabezado y badge de URL**
   - Título: Las 3D del Trabajo
   - Subtítulo: medí tu trabajo en 20 segundos en tres dimensiones.
   - Link a https://3d.ceoencamiseta.com y a CEO en Camiseta.

2. **Qué es**
   - Mini-app web gratuita y anónima para puntuar el trabajo en Dinero, Desarrollo y Diversión (1–10).
   - No da consejos ni interpretaciones: muestra datos para que la persona decida.

3. **Por qué medir las 3D**
   - Citar la idea del capítulo 14 de *Sé tu propio CEO*: las tres D son Dinero, Desarrollo y Diversión.
   - Resumir la tensión clásica entre elegir por dinero vs. por lo que nos gusta.
   - Explicar que cada D es una variable que evoluciona con el tiempo y que medirlas ayuda a tomar decisiones con menos sesgo.
   - No incluir datos estáticos de la comunidad; solo enlazar a las páginas de estadísticas dinámicas.

4. **Páginas públicas**
   - Inicio: medición principal.
   - Landings SEO: /test-burnout, /cambiar-de-trabajo, /cambiar-de-trabajo-a-los-40, /cambiar-de-trabajo-a-los-50.
   - Muro de los lamentos: /comentarios.
   - Estadísticas: /por-pais, /por-sector, /por-edad.
   - Datos abiertos: /datos-llm, /llm/index.md, /llm/stats.md, /llm/comentarios.md.
   - Widget embebible: /embed-docs.

5. **Stack y cómo correrlo (sección breve al final)**
   - Vite + React + TypeScript + Tailwind CSS + shadcn/ui.
   - Supabase Edge Functions para guardar resultados, emails, recordatorios y endpoints de datos abiertos.
   - Scripts: `npm run dev` (genera snapshots LLM y levanta Vite), `npm run build`, `npm run test`.
   - Nota: el backend corre en Lovable Cloud / Supabase.

6. **Privacidad y créditos**
   - Respuestas anónimas, email opcional, comentarios sin identificadores.
   - Creado por CEO en Camiseta.

## Archivo a modificar

- `README.md` (sobrescribir completo).

## Archivos que NO se tocan

- Ningún archivo fuente, config, edge function ni datos públicos. Solo README.md.
