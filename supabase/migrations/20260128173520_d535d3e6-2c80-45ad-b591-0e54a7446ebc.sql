-- Actualizar función para usar trimestre en lugar de mes
CREATE OR REPLACE FUNCTION public.refresh_country_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quarter_ago TIMESTAMPTZ := now() - interval '3 months';
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
  
  -- QUARTER: dinero
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'quarter', 'dinero', ROUND(AVG(dinero)::numeric, 1), COUNT(*)
  FROM public.records_3d 
  WHERE country IS NOT NULL AND created_at >= quarter_ago
  GROUP BY country;
  
  -- QUARTER: desarrollo
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'quarter', 'desarrollo', ROUND(AVG(desarrollo)::numeric, 1), COUNT(*)
  FROM public.records_3d 
  WHERE country IS NOT NULL AND created_at >= quarter_ago
  GROUP BY country;
  
  -- QUARTER: diversion
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'quarter', 'diversion', ROUND(AVG(diversion)::numeric, 1), COUNT(*)
  FROM public.records_3d 
  WHERE country IS NOT NULL AND created_at >= quarter_ago
  GROUP BY country;
  
  -- QUARTER: promedio
  INSERT INTO public.country_stats_cache (country, period, dimension, avg_value, count)
  SELECT country, 'quarter', 'promedio', 
         ROUND(((AVG(dinero) + AVG(desarrollo) + AVG(diversion)) / 3)::numeric, 1), 
         COUNT(*)
  FROM public.records_3d 
  WHERE country IS NOT NULL AND created_at >= quarter_ago
  GROUP BY country;
  
  -- Actualizar timestamp
  UPDATE public.country_stats_cache SET updated_at = now();
END;
$$;

-- Borrar datos viejos de 'month' y regenerar cache con quarter
DELETE FROM public.country_stats_cache WHERE period = 'month';
SELECT public.refresh_country_stats();