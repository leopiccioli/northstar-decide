

# Plan: Cambiar a Trimestre + Umbral Configurable (30)

## Resumen

1. Cambiar periodo de "mes" a "trimestre" (3 meses)
2. Crear constante `MIN_RESPONSES_THRESHOLD = 30` y usarla en todos lados
3. Actualizar la funcion de base de datos para calcular trimestre en lugar de mes

---

## Lugares a Modificar

### Umbral (10 -> 30)

| Archivo | Linea | Cambio |
|---------|-------|--------|
| `src/config/stats.ts` (NUEVO) | - | Crear constante `MIN_RESPONSES_THRESHOLD = 30` |
| `src/pages/StatsPage.tsx` | 52 | Importar y usar constante |
| `src/components/stats/CountryMap.tsx` | 33, 145 | Importar y usar constante |
| `src/components/stats/StatsLegend.tsx` | 12 | Importar y usar constante |

### Periodo (mes -> trimestre)

| Archivo | Linea | Cambio |
|---------|-------|--------|
| `src/pages/StatsPage.tsx` | 10-14 | Cambiar tipo a `'quarter' \| 'all'`, label a "Ultimo trimestre" |
| `supabase/functions/get-country-stats/index.ts` | 11 | Cambiar tipo a `'quarter' \| 'all'` |
| Base de datos | funcion | Nueva migracion: cambiar `interval '1 month'` a `'3 months'` y `period = 'month'` a `'quarter'` |

---

## Archivos Nuevos

### src/config/stats.ts

```typescript
// Umbral minimo de respuestas para mostrar datos
export const MIN_RESPONSES_THRESHOLD = 30;
```

---

## Cambios en Codigo

### 1. StatsPage.tsx

```typescript
import { MIN_RESPONSES_THRESHOLD } from '@/config/stats';

type Period = 'quarter' | 'all';  // Cambiado de 'month'

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'quarter', label: 'Ultimo trimestre' },  // Cambiado
  { id: 'all', label: 'Todo' },
];

// Linea 52
const tableStats = stats
  .filter(s => s.count >= MIN_RESPONSES_THRESHOLD)  // Antes: 10
  .sort((a, b) => b.promedio - a.promedio);
```

### 2. CountryMap.tsx

```typescript
import { MIN_RESPONSES_THRESHOLD } from '@/config/stats';

function getCountryColor(stat: CountryFullStat | undefined): string {
  if (!stat) return '#fcd34d';
  if (stat.count < MIN_RESPONSES_THRESHOLD) return '#e5e5e5';  // Antes: 10
  // ...
}

// Linea 145 en popover
{selectedStat && selectedStat.count >= MIN_RESPONSES_THRESHOLD ? (
  // ...
)}
```

### 3. StatsLegend.tsx

```typescript
import { MIN_RESPONSES_THRESHOLD } from '@/config/stats';

const LEGEND_ITEMS = [
  // ...
  { color: '#e5e5e5', label: `< ${MIN_RESPONSES_THRESHOLD} respuestas`, border: true },
];
```

### 4. Edge Function get-country-stats/index.ts

```typescript
interface StatsRequest {
  period: 'quarter' | 'all';  // Cambiado de 'month'
}
```

---

## Migracion de Base de Datos

Actualizar la funcion `refresh_country_stats()` para usar trimestre:

```sql
CREATE OR REPLACE FUNCTION public.refresh_country_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quarter_ago TIMESTAMPTZ := now() - interval '3 months';  -- Antes: 1 month
BEGIN
  TRUNCATE public.country_stats_cache;
  
  -- ALL TIME (sin cambios)
  -- ...
  
  -- QUARTER: dinero (antes era MONTH)
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'quarter', 'dinero', ROUND(AVG(dinero)::numeric, 1), COUNT(*)
  FROM public.records_3d 
  WHERE country IS NOT NULL AND created_at >= quarter_ago
  GROUP BY country;
  
  -- (repetir para desarrollo, diversion, promedio con period='quarter')
  
  -- Actualizar timestamp
  UPDATE public.country_stats_cache SET updated_at = now();
END;
$$;

-- Borrar datos viejos de 'month' y regenerar con 'quarter'
DELETE FROM public.country_stats_cache WHERE period = 'month';
SELECT public.refresh_country_stats();
```

---

## Orden de Implementacion

1. Crear `src/config/stats.ts` con la constante
2. Actualizar frontend (StatsPage, CountryMap, StatsLegend)
3. Actualizar edge function
4. Crear migracion de base de datos
5. Ejecutar refresh del cache

---

## Resultado Esperado

- Selector muestra "Ultimo trimestre" en lugar de "Ultimo mes"
- Umbral de 30 respuestas en todos lados
- Leyenda muestra "< 30 respuestas"
- Datos del trimestre tienen mas volumen que los del mes

