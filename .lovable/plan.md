
# Plan: Agregar Filtro de Periodo (Ultimo Mes + Todo)

## Resumen

Modificar la tabla de cache `country_stats_cache` para soportar dos periodos: "ultimo mes" y "todo el tiempo". El cron job calculara ambos periodos cada noche.

---

## Cambios en la Base de Datos

### 1. Nueva estructura de la tabla cache

La clave primaria incluye el periodo:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| country | text | Codigo ISO |
| period | text | 'month' o 'all' |
| dimension | text | dinero, desarrollo, diversion, promedio |
| avg_value | numeric(4,1) | Promedio calculado |
| count | integer | Cantidad de respuestas |
| updated_at | timestamptz | Ultima actualizacion |

**Clave primaria compuesta**: (country, period, dimension)

### 2. Funcion de refresh actualizada

La funcion `refresh_country_stats()` ahora calcula para ambos periodos:

```text
Para cada periodo (month, all):
  Para cada dimension (dinero, desarrollo, diversion, promedio):
    Agregar fila con el promedio y count correspondiente
```

---

## Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| Migracion SQL | Crear tabla cache con periodo + funcion refresh + cron job |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/get-country-stats/index.ts` | Leer de cache filtrando por period y dimension |
| `src/pages/StatsPage.tsx` | Simplificar opciones de periodo a solo 2 (month, all) |

---

## Seccion Tecnica

### Migracion SQL

```sql
-- 1. Crear tabla cache con periodo
CREATE TABLE IF NOT EXISTS public.country_stats_cache (
  country TEXT NOT NULL,
  period TEXT NOT NULL,       -- 'month' o 'all'
  dimension TEXT NOT NULL,    -- dinero, desarrollo, diversion, promedio
  avg_value NUMERIC(4,1),
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (country, period, dimension)
);

-- 2. RLS: lectura publica
ALTER TABLE public.country_stats_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read country_stats_cache"
  ON public.country_stats_cache FOR SELECT
  USING (true);

-- 3. Funcion de refresh
CREATE OR REPLACE FUNCTION public.refresh_country_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  month_ago TIMESTAMPTZ := now() - interval '1 month';
BEGIN
  TRUNCATE public.country_stats_cache;
  
  -- ALL TIME: dinero
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'all', 'dinero', ROUND(AVG(dinero)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE country IS NOT NULL
  GROUP BY country;
  
  -- ALL TIME: desarrollo
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'all', 'desarrollo', ROUND(AVG(desarrollo)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE country IS NOT NULL
  GROUP BY country;
  
  -- ALL TIME: diversion
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'all', 'diversion', ROUND(AVG(diversion)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE country IS NOT NULL
  GROUP BY country;
  
  -- ALL TIME: promedio
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'all', 'promedio', 
         ROUND(((AVG(dinero) + AVG(desarrollo) + AVG(diversion)) / 3)::numeric, 1), 
         COUNT(*)
  FROM public.records_3d WHERE country IS NOT NULL
  GROUP BY country;
  
  -- MONTH: dinero
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'month', 'dinero', ROUND(AVG(dinero)::numeric, 1), COUNT(*)
  FROM public.records_3d 
  WHERE country IS NOT NULL AND created_at >= month_ago
  GROUP BY country;
  
  -- MONTH: desarrollo
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'month', 'desarrollo', ROUND(AVG(desarrollo)::numeric, 1), COUNT(*)
  FROM public.records_3d 
  WHERE country IS NOT NULL AND created_at >= month_ago
  GROUP BY country;
  
  -- MONTH: diversion
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'month', 'diversion', ROUND(AVG(diversion)::numeric, 1), COUNT(*)
  FROM public.records_3d 
  WHERE country IS NOT NULL AND created_at >= month_ago
  GROUP BY country;
  
  -- MONTH: promedio
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'month', 'promedio', 
         ROUND(((AVG(dinero) + AVG(desarrollo) + AVG(diversion)) / 3)::numeric, 1), 
         COUNT(*)
  FROM public.records_3d 
  WHERE country IS NOT NULL AND created_at >= month_ago
  GROUP BY country;
  
  -- Actualizar timestamp
  UPDATE public.country_stats_cache SET updated_at = now();
END;
$$;

-- 4. Poblar inicialmente
SELECT public.refresh_country_stats();

-- 5. Cron diario a las 3am UTC
SELECT cron.schedule(
  'refresh-country-stats-daily',
  '0 3 * * *',
  'SELECT public.refresh_country_stats()'
);
```

### Edge Function Actualizada

```typescript
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { period, dimension }: StatsRequest = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Leer de cache
    const { data, error } = await supabase
      .from('country_stats_cache')
      .select('country, avg_value, count')
      .eq('period', period)
      .eq('dimension', dimension);

    if (error) throw error;

    const stats = (data || []).map(row => ({
      country: row.country,
      avg: row.avg_value,
      count: row.count,
    }));

    return new Response(
      JSON.stringify({ stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // error handling...
  }
});
```

### StatsPage: Simplificar Periodos

Cambiar de 3 opciones a 2:

```typescript
const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'month', label: 'Ultimo mes' },
  { id: 'all', label: 'Todo' },
];
```

---

## Orden de Implementacion

1. Crear migracion SQL (tabla + funcion + cron)
2. Actualizar edge function para leer de cache
3. Simplificar opciones de periodo en StatsPage

---

## Notas

- Se elimina la opcion "3 meses" para simplificar la cache
- El cron corre a las 3am UTC (medianoche en Argentina)
- La funcion puede ejecutarse manualmente: `SELECT public.refresh_country_stats()`
- Si se necesita "3 meses" en el futuro, solo hay que agregar otro bloque de INSERTs
