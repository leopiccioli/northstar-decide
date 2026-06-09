## Landings SEO con flujo embebido

Cuatro landings públicas, cada una con su keyword dedicada y el flujo 3D embebido directamente (sin scroll obligado, sin navegación). El usuario llega desde Google → lee 2 líneas → arranca a mover sliders en la misma página.

### Páginas

| Ruta | Keyword principal | Vol/mes | KD | Contexto pre-set |
|---|---|---|---|---|
| `/test-burnout` | test burnout | 110 | 14 | `burnout` |
| `/cambiar-de-trabajo` | cambiar de trabajo | 320 | 15 | `change` |
| `/cambiar-de-trabajo-a-los-40` | cambiar de trabajo a los 40 | 170 | bajo | `change` |
| `/cambiar-de-trabajo-a-los-50` | cambiar de trabajo a los 50 | 210 | bajo | `change` |

Páginas separadas (no anchors) porque:
- Google premia URL exacta = keyword exacta.
- Permite copy específico por edad sin diluir.
- Cada una tiene su `<title>`, canonical, FAQ y JSON-LD propios.

### Estructura de cada landing (mobile-first, fold único)

```text
[H1 corto con keyword exacta]
[Subhead emocional, 1 línea]
[FORM 3D EMBEBIDO — empieza directamente en sliders]
   ↓ usuario completa → mismo ResultScreen del flujo principal
[Bloque secundario debajo del fold: "qué mide", FAQ, contador]
```

El form NO es un CTA que lleva a otro lado: es el contenido principal. Llegás y ya estás midiendo.

### Cómo se embebe el flujo

`DecisionFlow` acepta un nuevo prop opcional `initialContext?: UserContext`. Cuando viene seteado:
- Estado inicial salta directo a `step: 'input'` con el context ya elegido.
- No renderiza EntryScreen ni ContextScreen.
- Mantiene todo lo demás idéntico: ProgressIndicator, InputScreen, ResultScreen, save-result, emails, reminders.

Las 4 landings montan `<DecisionFlow initialContext="burnout" />` o `<DecisionFlow initialContext="change" />` debajo del H1/subhead.

### Copy diferenciado por edad

**`/cambiar-de-trabajo-a-los-40`**
- H1: "Cambiar de trabajo a los 40"
- Sub: "A esta edad cada movimiento pesa más. Medilo antes de decidir."
- FAQ: "¿es tarde para cambiar a los 40?", "¿qué priorizar en esta etapa?", "¿y la estabilidad familiar?".

**`/cambiar-de-trabajo-a-los-50`**
- H1: "Cambiar de trabajo a los 50"
- Sub: "La experiencia es tu activo. Medí si tu trabajo actual la está aprovechando."
- FAQ: "¿conviene cambiar a los 50?", "¿qué buscar a esta edad?", "¿y el riesgo?".

**`/cambiar-de-trabajo`** (página madre)
- H1: "¿Cambiar de trabajo? Medilo antes de decidir"
- Sub: "20 segundos, 3 dimensiones: Dinero, Desarrollo, Diversión."
- FAQ general + links internos a las dos versiones por edad.

**`/test-burnout`**
- H1: "Test de burnout en 20 segundos"
- Sub: "Medí cuánto te está costando tu trabajo."
- FAQ: "¿qué es burnout?", "¿reemplaza un diagnóstico?" (no, disclaimer), "¿es anónimo?".

### Bloque debajo del fold (compartido)

- "Qué mide este test" — 3 bullets cortos (Dinero/Desarrollo/Diversión).
- Contador en vivo de mediciones (mismo RPC `get_measurement_count`).
- FAQ accordion (4–6 preguntas, varía por landing).
- Footer estándar.

Estética: monocromática, Space Grotesk, sin hero images. Densidad de calculadora igual que el resto.

### SEO técnico (por página)

Vía `<SEO>` helmet:
- `<title>` ≤60 chars con keyword exacta
- `<meta description>` ≤160 chars
- Canonical absoluto a la URL propia
- `og:title`, `og:description`, `og:url`, `og:type=website`
- JSON-LD: `WebPage` + `FAQPage` con las Q&A de la página

Linking interno:
- `/cambiar-de-trabajo` linkea a `/cambiar-de-trabajo-a-los-40` y `…-50`.
- Las dos por edad linkean back a `/cambiar-de-trabajo`.

Agregar las 4 rutas a:
- `src/App.tsx` (lazy)
- `public/sitemap.xml` (priority 0.9, changefreq monthly)
- `public/llms.txt`

### Tracking

- Cada landing inyecta UTMs internos al `trackingData` que viaja a `save-result`: `utm_source=seo`, `utm_medium=lp`, `utm_campaign=burnout|change`, `utm_content=40|50|generic`.
- Evento PostHog `lp_view` y `lp_first_slider_move` con `{ landing }` para medir conversión por página.

### Archivos a crear/editar

**Nuevos**
- `src/pages/TestBurnoutPage.tsx`
- `src/pages/CambiarDeTrabajoPage.tsx`
- `src/pages/CambiarDeTrabajo40Page.tsx`
- `src/pages/CambiarDeTrabajo50Page.tsx`
- `src/components/landing/LandingShell.tsx` — hero (H1+sub) + slot del flow + bloque inferior
- `src/components/landing/FAQ.tsx` — accordion + JSON-LD generator

**Editar**
- `src/components/decision/DecisionFlow.tsx` — aceptar `initialContext` y opcionalmente `landingUtms`
- `src/App.tsx` — agregar 4 rutas
- `public/sitemap.xml`, `public/llms.txt`

### Fuera de alcance

- No tocamos home ni flujo existente más allá del prop nuevo.
- No generamos imágenes (sin og:image, mantenemos consistencia con el sitio).
- No agregamos blog ni contenido largo — el form ES el contenido.
