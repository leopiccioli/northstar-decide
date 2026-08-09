CREATE OR REPLACE FUNCTION public.get_stats_window(months integer DEFAULT 12)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
WITH params AS (
  SELECT (now() - make_interval(months => GREATEST(1, LEAST(COALESCE(months, 12), 600))))::timestamptz AS from_ts
),
base AS (
  SELECT r.* FROM public.records_3d r, params p WHERE r.created_at >= p.from_ts
)
SELECT jsonb_build_object(
  'months', GREATEST(1, LEAST(COALESCE(months, 12), 600)),
  'from', (SELECT from_ts::date FROM params),
  'to', current_date,
  'total', (SELECT count(*) FROM base),
  'global', (SELECT jsonb_build_object(
      'dinero', ROUND(AVG(dinero)::numeric, 1),
      'desarrollo', ROUND(AVG(desarrollo)::numeric, 1),
      'diversion', ROUND(AVG(diversion)::numeric, 1),
      'promedio', ROUND(((AVG(dinero) + AVG(desarrollo) + AVG(diversion)) / 3)::numeric, 1)
    ) FROM base),
  'by_country', COALESCE((SELECT jsonb_agg(x ORDER BY (x->>'promedio')::numeric DESC) FROM (
      SELECT jsonb_build_object('key', country, 'n', count(*),
        'dinero', ROUND(AVG(dinero)::numeric,1),
        'desarrollo', ROUND(AVG(desarrollo)::numeric,1),
        'diversion', ROUND(AVG(diversion)::numeric,1),
        'promedio', ROUND(((AVG(dinero)+AVG(desarrollo)+AVG(diversion))/3)::numeric,1)) AS x
      FROM base WHERE country IS NOT NULL GROUP BY country HAVING count(*) >= 5
    ) q), '[]'::jsonb),
  'by_sector', COALESCE((SELECT jsonb_agg(x ORDER BY (x->>'promedio')::numeric DESC) FROM (
      SELECT jsonb_build_object('key', sector, 'n', count(*),
        'dinero', ROUND(AVG(dinero)::numeric,1),
        'desarrollo', ROUND(AVG(desarrollo)::numeric,1),
        'diversion', ROUND(AVG(diversion)::numeric,1),
        'promedio', ROUND(((AVG(dinero)+AVG(desarrollo)+AVG(diversion))/3)::numeric,1)) AS x
      FROM base WHERE sector IS NOT NULL GROUP BY sector HAVING count(*) >= 5
    ) q), '[]'::jsonb),
  'by_age', COALESCE((SELECT jsonb_agg(x ORDER BY (x->>'promedio')::numeric DESC) FROM (
      SELECT jsonb_build_object('key', age_range, 'n', count(*),
        'dinero', ROUND(AVG(dinero)::numeric,1),
        'desarrollo', ROUND(AVG(desarrollo)::numeric,1),
        'diversion', ROUND(AVG(diversion)::numeric,1),
        'promedio', ROUND(((AVG(dinero)+AVG(desarrollo)+AVG(diversion))/3)::numeric,1)) AS x
      FROM base WHERE age_range IS NOT NULL GROUP BY age_range HAVING count(*) >= 5
    ) q), '[]'::jsonb),
  'coverage', (SELECT jsonb_build_object(
      'with_sector', count(*) FILTER (WHERE sector IS NOT NULL),
      'with_age', count(*) FILTER (WHERE age_range IS NOT NULL),
      'with_country', count(*) FILTER (WHERE country IS NOT NULL)
    ) FROM base)
)
$function$;

REVOKE ALL ON FUNCTION public.get_stats_window(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_stats_window(integer) TO anon, authenticated, service_role;