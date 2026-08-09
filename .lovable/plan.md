# Fase 0.1 — Umbral N≥30, limpieza del fallback y cierre de B3

Las tres correcciones son correctas y las tomo tal cual. La 1 es la que cambia contenido publicado; las 2 y 3 se resuelven juntas con un solo borrado; la 4 es un ajuste de frontmatter.

## 1. Umbral de publicación N≥30 en toda tabla ordenada

Nuevo criterio único, aplicado en las páginas HTML, en el prerender y en `/llm/*.txt` y `/llm/*.md`:

- **Muestra suficiente (N≥30):** tabla ordenada por promedio, como hoy.
- **Muestra insuficiente (N<30) — no comparable:** orden alfabético, sin columna Promedio, precedida por una línea que aclara que se publican por transparencia y no admiten comparación ni ranking.

Con la ventana de 12 meses el corte queda: países Argentina (1.295) y México (79); sectores Consultoría (69), Otro (51), Industria/Manufactura (47), Salud (43), Retail/Comercio (37), Tecnología/Software (32); las cuatro franjas de edad pasan todas.

Consecuencias:

- El dato destacado de `/por-pais` pasa a ser Argentina, no un ranking mundial. Se elimina cualquier "mejor país" global.
- Los hallazgos derivados de grupos bajo umbral se retiran o se reescriben: "sector con Diversión más baja" (Gobierno, n=24), "sector que mejor paga" (Agro, n=18) y "país que puntúa más bajo" (Colombia, n=20) hoy no aguantan el umbral. Se reemplazan por hallazgos calculados sólo sobre grupos N≥30 (por ejemplo, dimensión global más baja, sector con mayor y menor promedio entre los seis elegibles, y el contraste Argentina vs. México).
- Las páginas de sector individuales quedan limitadas a sectores con N≥30.
- El bullet de "Método y límites" pasa de "al menos 5 mediciones (N≥5)" a la redacción nueva con los dos bloques, en todas las superficies (páginas, snapshots, edge functions de datos).

Criterio de aceptación: ninguna tabla ordenada por promedio tiene filas con N<30, y ninguna página afirma un "mejor"/"peor" apoyado en un grupo bajo umbral.

## 2 y 3. Fallback heredado y URLs del backend

El bloque `<noscript>` de `index.html` (segundo H1, "necesita JavaScript", y los dos links a la URL del backend) se arrastra a las doce páginas prerenderizadas porque el prerender reusa ese HTML base. Se elimina el bloque entero; con todas las rutas del sitemap prerenderizadas ya no cumple ninguna función. También se quitan los `preconnect`/`dns-prefetch` visibles hacia el backend del `<head>` sólo si no afectan el tiempo de carga; si afectan, se conservan (no son contenido citable, pero igual reviso que no aparezcan en llms.txt ni en `/datos-llm`).

Criterio de aceptación: cada página prerenderizada tiene exactamente un `<h1>`; "necesita JavaScript" no aparece en ninguna ruta del sitemap; la cadena del host del backend no aparece en el cuerpo de ninguna ruta ni en `llms.txt`.

## 4. Frontmatter de `/llm/*`

El campo `url:` de cada archivo pasa a apuntar a la variante `.txt` (lectura primaria servida como texto plano); la `.md` queda mencionada como espejo secundario dentro del cuerpo.

## Detalle técnico

- `src/config/stats.ts`: umbral publicable a 30, conservando un umbral inferior de inclusión (5) para el bloque "no comparable".
- Nueva migración: `get_stats_window` devuelve las filas con su N y una marca de elegibilidad; el corte por promedio se hace en la capa de presentación, no en SQL, para poder mostrar los dos bloques.
- `src/content/facts.ts`: expone `ELIGIBLE_*` y `BELOW_THRESHOLD_*`; los helpers `worst*`/`best*` pasan a calcularse sólo sobre los elegibles; se actualiza `LIMITS`.
- `src/content/pages.ts`: hallazgos y páginas de sector regenerados desde los conjuntos elegibles; el bloque de tabla acepta una variante "no comparable" sin columna Promedio.
- `scripts/prerender.ts`: renderiza los dos bloques por tabla y deja de heredar el `<noscript>`.
- `scripts/generate-llm-data.ts`: misma partición en `.md`/`.txt`, texto de inclusión nuevo, `url:` apuntando al `.txt`.
- `src/pages/StatsPage.tsx`, `SectorStatsPage.tsx`, `AgeStatsPage.tsx`: partición en dos tablas y aviso de no comparabilidad; el ordenamiento por columnas queda restringido al bloque elegible.
- `supabase/functions/llm-stats`: mismo umbral y mismo texto de notas, redeploy.
- Verificación final por `curl` sobre el build: conteo de `<h1>`, ausencia de "necesita JavaScript" y del host del backend, y que ninguna tabla ordenada incluya N<30.
