# Plan: rediseño persuasivo del flujo

Tres movidas: (1) reescritura de copy en voz más afilada, (2) narrativa visual oscuro → claro → resultado, (3) micro-tácticas de growth en cada pantalla.

---

## Pantalla 1 — Entrada (rediseño dark, en todos los devices)

**Fondo negro, texto blanco, una sola idea, mucho aire.** Rompe con el feed de Twitter al entrar.

```text
                  3D
        para Decidir tu trabajo

   La mayoría tolera un trabajo mediocre
   porque nunca se detiene a medirlo.

   ────────────────────────────────────
              47.382 mediciones
   ────────────────────────────────────

           [  Empezar  ]   ← botón blanco sobre negro

   (en desktop, abajo y chico: QR para mobile)
```

- Mantenemos pantalla 1 **en todos los devices** (no saltamos en mobile). Es el activo persuasivo del flujo; saltarla nos hace perder el contraste visual.
- **Mobile-first reescrito:** sin animación "D" en loop (ahorra 1s de espera). El tick de la "D" sucede **una sola vez** al cargar, después queda quieta. Mejora bounces cortos.
- **Contador de mediciones en vivo**: query simple a la DB (`count` de la tabla principal), cacheado 5min. Si la query tarda > 200ms, no se muestra (no bloquea).
- **QR a mobile**: en desktop, abajo y chico (no como bloque protagonista). El protagonista es el hook.
- Botón "Empezar" blanco sobre negro, mismo `btn-primary` con variante invertida.

### Archivos
- `src/components/decision/EntryScreen.tsx`: rediseño completo, fondo `bg-foreground`, texto `text-background`.
- `src/components/decision/MobileQRCard.tsx`: pasa a versión compacta.
- `src/index.css`: nueva clase `.btn-primary-inverted` (blanco sobre negro).
- Nuevo edge function `get-measurement-count` (lectura simple, cache 5min).

---

## Pantalla 2 — Contexto (claro, con gancho arriba)

Transición oscuro → claro = "entraste a algo". Titular punzante arriba, opciones reescritas en tu voz.

```text
   ¿Cuál es tu situación hoy?
   Elegí la que más se parezca.

   ┌──────────────────────────────────────┐
   │ Estoy bien, pero podría estar mejor  │
   ├──────────────────────────────────────┤
   │ Estoy mirando para otro lado         │
   ├──────────────────────────────────────┤
   │ Tengo que elegir entre dos caminos   │
   ├──────────────────────────────────────┤
   │ Estoy quemado                        │
   ├──────────────────────────────────────┤
   │ Solo quiero ver cómo estoy parado    │
   └──────────────────────────────────────┘
```

**Labels finales** (ids intactos — no rompe DB/analytics/emails):

| id | Nuevo label |
|---|---|
| `improve` | Estoy bien, pero podría estar mejor |
| `change` | Estoy mirando para otro lado |
| `compare` | Tengo que elegir entre dos caminos |
| `burnout` | Estoy quemado |
| `check` | Solo quiero ver cómo estoy parado |

### Archivos
- `src/components/decision/ContextScreen.tsx`: titular arriba + nuevos labels.
- Actualizar memoria `mem://features/user-contexts`.

---

## Pantalla 3 — Input (sliders en 1, microcopy de honestidad)

- **Sliders empiezan en 1** (no 5). El gesto de "subir desde abajo" es más honesto y deliberado que "ajustar desde el medio".
- **Microcopy arriba del primer slider** (reemplaza "Respondé intuitivo. No lo pienses mucho." que está abajo):
  > **Respondé lo que sentís hoy, no lo que quisieras sentir.**
- **Sliders visualmente activos**: handle blanco sobre track gris oscuro, fill izquierdo blanco. Sin ámbar (rompe la paleta monocromática), pero **mismo efecto** de "esto es un acto" gracias al alto contraste.
- **Haptic feedback ya existe** — mantener.

### Archivos
- `src/components/decision/InputScreen.tsx`: scores iniciales `{1,1,1}`, hint arriba.
- `src/components/decision/DimensionSlider.tsx`: track más oscuro, handle blanco con borde.
- `src/index.css`: ajustar `.slider-track`.

### Nota técnica importante
- Cambiar a inicio en 1 sesga la mediana histórica. La query del promedio global filtra **solo registros posteriores a la fecha del cambio** (variable de entorno `STATS_BASELINE_DATE`) para que las comparaciones sean coherentes en el tiempo.

---

## Pantalla 4 — Resultado (cierre del loop emocional + comparación inline)

Hoy todo pesa lo mismo. Le damos jerarquía y cerramos el hook.

```text
   Ya te detuviste. Esto es lo que tenés.

           6.0 / 10                       ← número gigante
        ▔▔▔▔▔▔░░░░  (semáforo gris)

   Dinero       6/10  ▔▔▔▔▔▔░░░░   global 5.8
   Desarrollo   4/10  ▔▔▔▔░░░░░░   global 6.1  ↓   ← negrita (la más baja)
   Diversión    8/10  ▔▔▔▔▔▔▔▔░░   global 5.4  ↑   ← negrita (la más alta)

   [  Guardá tu medición  ]

   ─── Comparate con otros ───
   [Por país]  [Por sector]  [Por edad]
```

- **Titular emocional arriba** que cierra el loop con pantalla 1: "Ya te detuviste. Esto es lo que tenés."
- **Score global como héroe**: número gigante (Space Grotesk, 80px+), arriba de todo.
- **Comparación inline con promedio global** al lado de cada barra. Dato puro, sin interpretación. Flechas grises sutiles (↑/↓) si la diferencia es ≥1 punto.
- **Bolding doble**: la D más alta y la más baja en negrita (hoy solo se destaca la winning). Ver tu peor D es lo que dispara la decisión.
- **Animación progresiva**: las 3 barras animan de 0 a su valor escalonadas (600ms total). Crea tensión.
- Resto del bloque (guardar, recordatorios, compartir, chips a stats pages) se mantiene.

### Archivos
- `src/components/decision/ResultScreen.tsx`: titular, jerarquía, bolding doble, animación.
- `src/components/decision/GlobalScore.tsx`: tamaño hero.
- Nuevo edge function `get-global-stats` (devuelve avg por dimensión + mediana global, filtrado por `STATS_BASELINE_DATE`, cacheado 1h).

---

## Tracking adicional

- `entry_view` (ya existe como `view_entry` probablemente; verificar) con prop `is_mobile`.
- `slider_first_move` — primer drag de un slider. Identifica si la gente abandona antes de tocar.
- `result_compare_dim` cuando el bloque de comparación inline carga (para medir si el dato global cambia la conversión a guardar).

---

## Lo que NO hacemos (descartado a propósito)

- **Saltar pantalla 1 en mobile** → perdíamos el activo persuasivo. La rediseñamos para que sea rápida en su lugar.
- **Acento ámbar/naranja en sliders** → rompe paleta monocromática y "neutral, avoiding positive/negative color semantics".
- **Sliders en 0** → mantenemos `min=1` (ya estaba). "0" implica "inexistente" lo cual es semánticamente raro en una escala de satisfacción.
- **Insights/consejos en resultado** → choca con `data-first-results`. La sorpresa la genera el contraste numérico.

---

## Orden de implementación

1. Pantalla 1 dark + contador + QR compacto + botón inverted.
2. Pantalla 2 titular + 5 nuevos labels.
3. Pantalla 3 sliders en 1 + microcopy arriba + visual con más contraste.
4. Edge function `get-global-stats` + comparación inline en resultado.
5. Pantalla 4 titular emocional + jerarquía hero + bolding doble + animación progresiva.
6. Edge function `get-measurement-count` para el contador de pantalla 1.
7. Tracking events nuevos.
8. Actualizar memorias (`user-contexts`, `result-screen-layout`, sumar `entry-screen-dark-redesign`).

---

## Decisiones pendientes (responder antes de implementar)

- ¿Confirmás **mantener pantalla 1 en mobile** (rediseñada dark + ultra-rápida) en vez de saltarla?
- ¿Confirmás **handle blanco sobre track oscuro** en vez de ámbar para los sliders?
- ¿El **filtro temporal** en el promedio global (`STATS_BASELINE_DATE`) te cierra, o preferís mostrar el promedio histórico aún sabiendo que va a haber drift?
