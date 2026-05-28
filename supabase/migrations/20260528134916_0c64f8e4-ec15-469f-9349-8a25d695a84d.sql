
-- 1) Add sector and age_range to records_3d
ALTER TABLE public.records_3d
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS age_range text;

CREATE INDEX IF NOT EXISTS idx_records_sector ON public.records_3d(sector) WHERE sector IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_records_age_range ON public.records_3d(age_range) WHERE age_range IS NOT NULL;

-- Validation trigger (allow evolving the lists without restore-breaking CHECK constraints)
CREATE OR REPLACE FUNCTION public.validate_demographics()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  allowed_sectors text[] := ARRAY[
    'Tecnología / Software',
    'Finanzas / Banca / Seguros',
    'Consultoría',
    'Salud',
    'Educación',
    'Retail / Comercio',
    'Industria / Manufactura',
    'Construcción',
    'Gobierno / Sector público',
    'Medios / Comunicación',
    'Agro',
    'Energía',
    'Hospitalidad / Turismo',
    'ONG / Tercer sector',
    'Otro'
  ];
  allowed_ages text[] := ARRAY['18-24','25-34','35-44','45-54','55-64','65+'];
BEGIN
  IF NEW.sector IS NOT NULL AND NOT (NEW.sector = ANY(allowed_sectors)) THEN
    NEW.sector := NULL;
  END IF;
  IF NEW.age_range IS NOT NULL AND NOT (NEW.age_range = ANY(allowed_ages)) THEN
    NEW.age_range := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_demographics_trigger ON public.records_3d;
CREATE TRIGGER validate_demographics_trigger
BEFORE INSERT OR UPDATE OF sector, age_range ON public.records_3d
FOR EACH ROW
EXECUTE FUNCTION public.validate_demographics();

-- 2) Sector stats cache
CREATE TABLE IF NOT EXISTS public.sector_stats_cache (
  sector text NOT NULL,
  period text NOT NULL,
  dimension text NOT NULL,
  avg_value numeric,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sector, period, dimension)
);

GRANT SELECT ON public.sector_stats_cache TO anon, authenticated;
GRANT ALL ON public.sector_stats_cache TO service_role;

ALTER TABLE public.sector_stats_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read sector_stats_cache" ON public.sector_stats_cache;
CREATE POLICY "Public read sector_stats_cache"
ON public.sector_stats_cache
FOR SELECT
TO public
USING (true);

-- 3) Age range stats cache
CREATE TABLE IF NOT EXISTS public.age_range_stats_cache (
  age_range text NOT NULL,
  period text NOT NULL,
  dimension text NOT NULL,
  avg_value numeric,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (age_range, period, dimension)
);

GRANT SELECT ON public.age_range_stats_cache TO anon, authenticated;
GRANT ALL ON public.age_range_stats_cache TO service_role;

ALTER TABLE public.age_range_stats_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read age_range_stats_cache" ON public.age_range_stats_cache;
CREATE POLICY "Public read age_range_stats_cache"
ON public.age_range_stats_cache
FOR SELECT
TO public
USING (true);

-- 4) Refresh functions
CREATE OR REPLACE FUNCTION public.refresh_sector_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quarter_ago timestamptz := now() - interval '3 months';
BEGIN
  TRUNCATE public.sector_stats_cache;

  INSERT INTO public.sector_stats_cache (sector, period, dimension, avg_value, count)
  SELECT sector, 'all', 'dinero', ROUND(AVG(dinero)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE sector IS NOT NULL GROUP BY sector;

  INSERT INTO public.sector_stats_cache (sector, period, dimension, avg_value, count)
  SELECT sector, 'all', 'desarrollo', ROUND(AVG(desarrollo)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE sector IS NOT NULL GROUP BY sector;

  INSERT INTO public.sector_stats_cache (sector, period, dimension, avg_value, count)
  SELECT sector, 'all', 'diversion', ROUND(AVG(diversion)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE sector IS NOT NULL GROUP BY sector;

  INSERT INTO public.sector_stats_cache (sector, period, dimension, avg_value, count)
  SELECT sector, 'all', 'promedio',
         ROUND(((AVG(dinero) + AVG(desarrollo) + AVG(diversion)) / 3)::numeric, 1),
         COUNT(*)
  FROM public.records_3d WHERE sector IS NOT NULL GROUP BY sector;

  INSERT INTO public.sector_stats_cache (sector, period, dimension, avg_value, count)
  SELECT sector, 'quarter', 'dinero', ROUND(AVG(dinero)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE sector IS NOT NULL AND created_at >= quarter_ago GROUP BY sector;

  INSERT INTO public.sector_stats_cache (sector, period, dimension, avg_value, count)
  SELECT sector, 'quarter', 'desarrollo', ROUND(AVG(desarrollo)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE sector IS NOT NULL AND created_at >= quarter_ago GROUP BY sector;

  INSERT INTO public.sector_stats_cache (sector, period, dimension, avg_value, count)
  SELECT sector, 'quarter', 'diversion', ROUND(AVG(diversion)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE sector IS NOT NULL AND created_at >= quarter_ago GROUP BY sector;

  INSERT INTO public.sector_stats_cache (sector, period, dimension, avg_value, count)
  SELECT sector, 'quarter', 'promedio',
         ROUND(((AVG(dinero) + AVG(desarrollo) + AVG(diversion)) / 3)::numeric, 1),
         COUNT(*)
  FROM public.records_3d WHERE sector IS NOT NULL AND created_at >= quarter_ago GROUP BY sector;

  UPDATE public.sector_stats_cache SET updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_age_range_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quarter_ago timestamptz := now() - interval '3 months';
BEGIN
  TRUNCATE public.age_range_stats_cache;

  INSERT INTO public.age_range_stats_cache (age_range, period, dimension, avg_value, count)
  SELECT age_range, 'all', 'dinero', ROUND(AVG(dinero)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE age_range IS NOT NULL GROUP BY age_range;

  INSERT INTO public.age_range_stats_cache (age_range, period, dimension, avg_value, count)
  SELECT age_range, 'all', 'desarrollo', ROUND(AVG(desarrollo)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE age_range IS NOT NULL GROUP BY age_range;

  INSERT INTO public.age_range_stats_cache (age_range, period, dimension, avg_value, count)
  SELECT age_range, 'all', 'diversion', ROUND(AVG(diversion)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE age_range IS NOT NULL GROUP BY age_range;

  INSERT INTO public.age_range_stats_cache (age_range, period, dimension, avg_value, count)
  SELECT age_range, 'all', 'promedio',
         ROUND(((AVG(dinero) + AVG(desarrollo) + AVG(diversion)) / 3)::numeric, 1),
         COUNT(*)
  FROM public.records_3d WHERE age_range IS NOT NULL GROUP BY age_range;

  INSERT INTO public.age_range_stats_cache (age_range, period, dimension, avg_value, count)
  SELECT age_range, 'quarter', 'dinero', ROUND(AVG(dinero)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE age_range IS NOT NULL AND created_at >= quarter_ago GROUP BY age_range;

  INSERT INTO public.age_range_stats_cache (age_range, period, dimension, avg_value, count)
  SELECT age_range, 'quarter', 'desarrollo', ROUND(AVG(desarrollo)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE age_range IS NOT NULL AND created_at >= quarter_ago GROUP BY age_range;

  INSERT INTO public.age_range_stats_cache (age_range, period, dimension, avg_value, count)
  SELECT age_range, 'quarter', 'diversion', ROUND(AVG(diversion)::numeric, 1), COUNT(*)
  FROM public.records_3d WHERE age_range IS NOT NULL AND created_at >= quarter_ago GROUP BY age_range;

  INSERT INTO public.age_range_stats_cache (age_range, period, dimension, avg_value, count)
  SELECT age_range, 'quarter', 'promedio',
         ROUND(((AVG(dinero) + AVG(desarrollo) + AVG(diversion)) / 3)::numeric, 1),
         COUNT(*)
  FROM public.records_3d WHERE age_range IS NOT NULL AND created_at >= quarter_ago GROUP BY age_range;

  UPDATE public.age_range_stats_cache SET updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_all_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_country_stats();
  PERFORM public.refresh_sector_stats();
  PERFORM public.refresh_age_range_stats();
END;
$$;
