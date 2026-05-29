## Plan: refrescar memorias + QA antes de publicar

### 1. Refrescar memorias afectadas

Actualizar estos archivos `mem://` con lo que quedó implementado en la última ronda:

- **`mem://features/user-contexts`** — Nuevas labels viscerales:
  - improve → "Estoy bien, pero podría estar mejor"
  - change → "Estoy mirando para otro lado"
  - compare → "Tengo que elegir entre dos caminos"
  - burnout → "Estoy quemado"
  - check → "Solo quiero ver cómo estoy parado"

- **`mem://features/input-screen-copy-updates`** — Sliders arrancan en **1** (no 5). Primer slider con microcopy de honestidad: "Respondé lo que sentís hoy, no lo que quisieras sentir." Handle blanco sobre track oscuro (sin amber). Haptic feedback al mover.

- **`mem://features/result-screen-layout`** — Hero score gigante (Space Grotesk 80px+), headline "Ya te detuviste. Esto es lo que tenés.", comparación inline por dimensión (`Global: X.X`), doble bolding (mayor + menor), animación progresiva de barras (~600ms).

- **`mem://features/global-scoring`** — Comparación global vía RPC `get_global_stats()` con filtro `STATS_BASELINE_DATE` (apples-to-apples desde el cambio de sliders=1). Cache 1h.

- **NUEVA: `mem://features/entry-screen`** — Pantalla 1 dark en todos los devices (no se saltea en mobile). Hook: "La mayoría tolera un trabajo mediocre porque nunca se detiene a medirlo." Contador en vivo vía RPC `get_measurement_count()` (cache 5min, oculto si tarda >200ms). QR compacto en desktop. Botón blanco sobre negro.

- **`mem://technical/analytics-pixels-tracking`** — Agregar eventos `slider_first_move` y `view_global_compare` al mapping de PostHog/Meta/X/GA4.

- **`mem://index.md`** — Actualizar referencias y, en Core, agregar:
  - "Sliders arrancan en 1, no 5"
  - "Entry screen dark en todos los devices"

### 2. QA antes de publicar

Recorrer el flujo completo en preview (desktop + mobile 390px) verificando:

1. Entry screen carga rápido, contador aparece o queda oculto si lentea, QR visible solo en desktop, botón funciona.
2. Context screen muestra las 5 labels nuevas.
3. Input screen: sliders en 1, microcopy de honestidad visible sobre el primero, handle blanco sin amber.
4. Result screen: hero score grande, comparación global inline por dimensión, bolding mayor+menor, animación de barras.
5. Console sin errores, network: RPCs `get_measurement_count` y `get_global_stats` responden 200.
6. Eventos `slider_first_move` y `view_global_compare` se disparan (verificar en console/network de PostHog).

Si algo falla, fixearlo antes de sugerir publicar.

### 3. Cierre

Una vez verde, sugerir publish con `<presentation-open-publish>`.