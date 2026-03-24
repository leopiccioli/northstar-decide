
-- Function para comments (reemplaza get-comments edge function)
CREATE OR REPLACE FUNCTION public.get_public_comments()
RETURNS TABLE(id uuid, comment text, created_at timestamptz, dinero int, desarrollo int, diversion int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT id, comment, created_at, dinero, desarrollo, diversion
  FROM records_3d
  WHERE comment IS NOT NULL AND comment != ''
  ORDER BY created_at DESC
  LIMIT 100;
$$;

-- Function para result por ID (reemplaza get-result edge function)
CREATE OR REPLACE FUNCTION public.get_public_result(result_id uuid)
RETURNS TABLE(option_name text, dinero int, desarrollo int, diversion int, comment text, comparison jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT option_name, dinero, desarrollo, diversion, comment, comparison
  FROM records_3d
  WHERE id = result_id;
$$;
