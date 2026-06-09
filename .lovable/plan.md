## Qué se construye

1. **Header global minimalista** presente en todas las páginas (excepto el embed, que debe quedarse limpio para no romper sitios externos).
2. **Quitar el "Hecho con ❤️ para la comunidad de CEO en Camiseta"** del InputScreen y de cualquier footer equivalente.

## Header

Componente nuevo `src/components/SiteHeader.tsx`:
- Fondo neutro, borde inferior sutil, altura compacta, alineado al lenguaje monocromático del 3D.
- Izquierda: logo "3D" (texto, Space Grotesk) que linkea a `/`.
- Derecha: dos links de texto, pequeños:
  - "CEO en Camiseta" → `https://ceoencamiseta.com` (target _blank, con UTM `utm_source=3d&utm_medium=header`)
  - "Embeber" → `/embed-docs`
- En mobile, los dos links se mantienen visibles (son cortos); si no caben, el primero se acorta a "ceoencamiseta.com".
- Sticky opcional (mantengo no-sticky por simplicidad y consistencia con el tono "calculadora").

Montaje:
- Se inserta en `src/App.tsx` envolviendo `<Routes>`, con una excepción para la ruta `/embed`: el header NO se renderiza ahí (el embed debe permanecer aislado).
- Las páginas de stats (`/por-pais`, `/por-sector`, `/por-edad`) y `/completar` ya tienen sus propios headers internos con logo + título; se simplificarán quitando el bloque duplicado del logo/título y dejando solo el `<Link>Volver</Link>` cuando aplique, para no duplicar identidad.

## Texto "Hecho con ❤️"

- Eliminar el `<footer>` final de `src/components/decision/InputScreen.tsx` (líneas 180–190).
- `src/components/landing/LandingShell.tsx` ya tiene un footer con "CEO en Camiseta" — se elimina (queda cubierto por el header global).
- No hay otras instancias del texto literal "Hecho con amor"/"Hecho con ❤️" en el código.

## Detalles técnicos

- Archivo nuevo: `src/components/SiteHeader.tsx`.
- Editar: `src/App.tsx` (montaje condicional según `location.pathname !== '/embed'`).
- Editar: `src/components/decision/InputScreen.tsx` (quitar footer).
- Editar: `src/components/landing/LandingShell.tsx` (quitar footer de "CEO en Camiseta").
- Editar: `src/pages/StatsPage.tsx`, `src/pages/SectorStatsPage.tsx`, `src/pages/AgeStatsPage.tsx`, `src/pages/CompletarPage.tsx` (quitar el header local con logo+título para evitar duplicación; conservar la fila con "Volver" si existe).
- Los botones existentes "Unirme a CEO en Camiseta" en ResultPage e InputScreen permanecen — son CTAs de conversión, distintos del footer de crédito.
- Sin cambios en routing, datos ni edge functions.
