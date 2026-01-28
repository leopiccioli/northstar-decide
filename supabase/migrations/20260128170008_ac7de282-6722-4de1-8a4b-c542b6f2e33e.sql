-- 1. Crear tabla cache con periodo
CREATE TABLE IF NOT EXISTS public.country_stats_cache (
  country TEXT NOT NULL,
  period TEXT NOT NULL,
  dimension TEXT NOT NULL,
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