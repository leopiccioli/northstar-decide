## Diagnóstico

Hoy todas las rutas comparten el `<title>` y `<meta description>` estáticos de `index.html` ("3D para Decidir - CEO en Camiseta"). Eso significa:

- `/por-pais`, `/por-sector`, `/por-edad`, `/comentarios` no tienen títulos propios → pierden potencial SEO y se ven raras al compartirlas (preview idéntico al home).
- `/r/:id` (resultado compartido) y `/completar` (link privado por email) son privadas y **deberían tener `noindex`** para no contaminar el índice de Google.
- Falta `<link rel="canonical">` en `index.html`.

## Solución

Instalar `react-helmet-async` y agregar `<Helmet>` por página. Mantener el head estático en `index.html` como fallback para crawlers sociales (LinkedIn, Slack) que no ejecutan JS.

### 1. Setup
- `npm install react-helmet-async`
- Envolver `<App />` en `<HelmetProvider>` en `src/main.tsx`.
- Agregar `<link rel="canonical" href="https://3d.ceoencamiseta.com/" />` en `index.html` (canonical sitewide; cada ruta lo sobrescribe).

### 2. Meta por ruta

Crear un componente helper `src/components/SEO.tsx` que reciba `{ title, description, path, noIndex? }` y emita `<Helmet>` con title, description, canonical, og:title, og:description, og:url.

Aplicar en cada página:

| Ruta | Title | Description | Index |
|---|---|---|---|
| `/` | `3D para Decidir — Dinero, Desarrollo, Diversión` | `Tomá mejores decisiones laborales en 20 segundos midiendo tus 3D: Dinero, Desarrollo y Diversión.` | ✅ (ya en index.html, no hace falta Helmet) |
| `/por-pais` | `3D por país — comparativa global de trabajo` | `Cómo puntúan Dinero, Desarrollo y Diversión en el trabajo según el país. Datos de la comunidad CEO en Camiseta.` | ✅ |
| `/por-sector` | `3D por sector — Dinero, Desarrollo y Diversión por industria` | `Comparativa de satisfacción laboral (3D) por sector: tech, salud, finanzas, educación y más.` | ✅ |
| `/por-edad` | `3D por edad — cómo varía la satisfacción laboral por rango etario` | `Cómo cambian Dinero, Desarrollo y Diversión en el trabajo según la edad. Datos de la comunidad.` | ✅ |
| `/comentarios` | `Muro de los lamentos — comentarios sobre el trabajo` | `Qué dice la gente sobre su trabajo: comentarios anónimos junto a sus 3D (Dinero, Desarrollo, Diversión).` | ✅ |
| `/r/:id` | `Mi resultado 3D` | (sin description útil) | ❌ `noindex,nofollow` |
| `/completar` | `Completar tu medición 3D` | — | ❌ `noindex,nofollow` |
| `*` (404) | `Página no encontrada — 3D para Decidir` | — | ❌ `noindex` |

### 3. Otros detalles
- `og:image` queda como está (sitewide en `index.html`) — no inventamos imagen por ruta.
- En `index.html` también agregar `<meta property="og:locale" content="es_AR" />` (faltante).
- No tocamos rutas con datos sensibles (`/r/:id`, `/completar`) más allá del noindex.

## Archivos a modificar
- `index.html` — canonical + og:locale
- `src/main.tsx` — `<HelmetProvider>`
- `src/components/SEO.tsx` — nuevo helper
- `src/pages/StatsPage.tsx`, `SectorStatsPage.tsx`, `AgeStatsPage.tsx`, `CommentsPage.tsx`, `ResultPage.tsx`, `CompletarPage.tsx`, `NotFound.tsx` — agregar `<SEO ... />`

## Lo que **no** voy a tocar
- Funcionalidad, RLS, edge functions, estilos.
- `Index.tsx` (el title/description del home ya están bien en `index.html`).

¿Avanzo con esto, o querés ajustar algún título/description antes?