DROP FUNCTION IF EXISTS public.get_public_comments();

CREATE OR REPLACE FUNCTION public.get_public_comments()
RETURNS TABLE(
  id uuid,
  comment text,
  created_at timestamp with time zone,
  dinero integer,
  desarrollo integer,
  diversion integer,
  country text,
  sector text,
  age_range text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, comment, created_at, dinero, desarrollo, diversion, country, sector, age_range
  FROM public.records_3d
  WHERE comment IS NOT NULL AND length(trim(comment)) > 0
  ORDER BY created_at DESC
  LIMIT 500;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_comments() TO anon, authenticated;