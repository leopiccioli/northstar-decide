
-- Public function: total measurement count (for entry screen social proof)
CREATE OR REPLACE FUNCTION public.get_measurement_count()
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*) FROM public.records_3d;
$$;

GRANT EXECUTE ON FUNCTION public.get_measurement_count() TO anon, authenticated;

-- Public function: global averages per dimension + overall median
-- Returned as a single row for cheap caching.
-- NOTE: includes ALL historical records. Initial slider was 5; this changes to 1
-- on 2026-05-29. Expect small downward drift; revisit with a baseline filter
-- if drift becomes material.
CREATE OR REPLACE FUNCTION public.get_global_stats()
RETURNS TABLE(
  avg_dinero numeric,
  avg_desarrollo numeric,
  avg_diversion numeric,
  avg_global numeric,
  total bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ROUND(AVG(dinero)::numeric, 1)     AS avg_dinero,
    ROUND(AVG(desarrollo)::numeric, 1) AS avg_desarrollo,
    ROUND(AVG(diversion)::numeric, 1)  AS avg_diversion,
    ROUND(((AVG(dinero) + AVG(desarrollo) + AVG(diversion)) / 3)::numeric, 1) AS avg_global,
    COUNT(*) AS total
  FROM public.records_3d;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_stats() TO anon, authenticated;
