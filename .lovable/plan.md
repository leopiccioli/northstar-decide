# Sector y edad: captura + páginas de comparación

## 1. Captura (en el flujo nuevo)

Ambos campos **opcionales**, ubicados en el **Result Screen**, junto a email y país (no en el InputScreen para no recargarlo).

UI consistente con la estética monocromática:
- **Sector**: combobox buscable (15 opciones) — patrón clon de `CountryCombobox`.
- **Edad**: 6 chips inline (`18-24`, `25-34`, `35-44`, `45-54`, `55-64`, `65+`) — más rápido que un select en mobile.
- Microcopy: `Opcional — para comparar con perfiles parecidos.`

Listas exactas (consistencia con Quiz Master Pro), en `src/lib/demographics.ts`:
- `SECTORS`: Tecnología / Software, Finanzas / Banca / Seguros, Consultoría, Salud, Educación, Retail / Comercio, Industria / Manufactura, Construcción, Gobierno / Sector público, Medios / Comunicación, Agro, Energía, Hospitalidad / Turismo, ONG / Tercer sector, Otro.
- `AGE_RANGES`: 18-24, 25-34, 35-44, 45-54, 55-64, 65+.

## 2. Schema y guardado

Migration sobre `records_3d`:
- `sector text` (nullable)
- `age_range text` (nullable)
- Índices: `idx_records_sector`, `idx_records_age_range` para las stats.
- Validación con trigger (no CHECK, para poder evolucionar listas sin romper restore).

`save-result` edge function:
- Acepta `sector` y `age_range` opcionales; valida contra las listas; si vienen inválidos, los ignora silenciosamente (no rompe el guardado).

## 3. Páginas de comparación (espejo de `/por-pais`)

Dos páginas nuevas privadas (mismo nivel de privacidad que `/por-pais`):

### `/por-sector`
- Tabla con: Sector | Dinero | Desarrollo | Diversión | Promedio | Cantidad.
- Selector de período: **Todo** / **Último trimestre** (mismo patrón actual).
- Mismo umbral mínimo de respuestas (`MIN_RESPONSES_THRESHOLD`) para mostrar fila.
- Sin mapa (no aplica) — solo tabla ordenable + leyenda + última actualización.
- Visual: idéntico estilo a `StatsPage`, sin banderas/emoji; el "ícono" puede ser solo texto.

### `/por-edad`
- Misma tabla, columna izquierda: rango etáreo, ordenado naturalmente (18-24 → 65+) por defecto.
- Mismas dimensiones, mismos períodos, mismo umbral.

### Infra de cache (igual patrón que `country_stats_cache`)

Dos tablas nuevas:
- `sector_stats_cache(sector, period, dimension, avg_value, count, updated_at)`
- `age_range_stats_cache(age_range, period, dimension, avg_value, count, updated_at)`

Con RLS público de solo lectura, idéntico a `country_stats_cache`.

Dos funciones DB nuevas (espejo de `refresh_country_stats`):
- `refresh_sector_stats()`
- `refresh_age_range_stats()`

Y una función paraguas `refresh_all_stats()` que llama a las tres, para simplificar el cron.

Cron: si ya hay job para `refresh_country_stats`, lo cambio a llamar `refresh_all_stats`. Si no hay, lo creo (cada 1h, ajustable).

## 4. Navegación

Agregar links a las páginas privadas — mantengo el patrón actual de URLs no listadas públicamente. Si querés algún ingreso desde footer/menú, lo definimos aparte.

## 5. Campaña retroactiva → diferida

La dejo documentada en `.lovable/backfill-demographics.md` con todo listo para ejecutar después:
- Asunto: **¡Novedades en 3D! ¿Cómo te comparás con otros sectores?**
- Audiencia: emails únicos en `records_3d` sin `sector` o `age_range`.
- Mecánica: email único (no reintentos), link a `/completar?token=<id>` con landing minimal que actualiza el último record.
- Edge functions a crear cuando se ejecute: `get-record-for-backfill`, `update-demographics`, `send-demographics-backfill`.
- Registro en `outbound_emails` con `email_type = 'demographics_backfill'` (sumar al CHECK constraint en ese momento).
- UTMs: `utm_source=3d&utm_medium=email&utm_campaign=demographics_backfill`.

No se crean edge functions, ni schema, ni emails para esta campaña ahora. Solo el documento.

## Detalle técnico (resumen)

**Archivos nuevos:**
- `src/lib/demographics.ts`
- `src/components/decision/SectorCombobox.tsx`
- `src/components/decision/AgeRangeChips.tsx`
- `src/pages/SectorStatsPage.tsx`
- `src/pages/AgeStatsPage.tsx`
- `.lovable/backfill-demographics.md`

**Archivos editados:**
- `src/components/decision/ResultScreen.tsx` (sumar inputs sector/edad al bloque de guardado)
- `src/App.tsx` (rutas `/por-sector`, `/por-edad`)
- `supabase/functions/save-result/index.ts` (aceptar + validar)

**Migrations:**
1. ALTER `records_3d` + índices + trigger de validación.
2. CREATE `sector_stats_cache`, `age_range_stats_cache` (con GRANTs y RLS).
3. CREATE `refresh_sector_stats`, `refresh_age_range_stats`, `refresh_all_stats`.
4. (Vía insert tool) actualizar/crear cron job para `refresh_all_stats`.

Memoria a crear al final: `mem://features/demographics` con criterios de captura y páginas de stats.
