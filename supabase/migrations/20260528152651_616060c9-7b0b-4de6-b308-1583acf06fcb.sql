CREATE OR REPLACE FUNCTION public.get_pending_demographics_backfill(batch_limit integer DEFAULT 100)
RETURNS TABLE(
  record_id uuid,
  email text,
  dinero integer,
  desarrollo integer,
  diversion integer,
  created_at timestamptz,
  has_sector boolean,
  has_age boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest AS (
    SELECT DISTINCT ON (LOWER(r.email))
      r.id,
      LOWER(r.email) AS email_lc,
      r.email,
      r.dinero,
      r.desarrollo,
      r.diversion,
      r.created_at,
      r.sector,
      r.age_range
    FROM public.records_3d r
    WHERE r.email IS NOT NULL
    ORDER BY LOWER(r.email), r.created_at DESC
  ),
  pending AS (
    SELECT * FROM latest l
    WHERE (l.sector IS NULL OR l.age_range IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM public.outbound_emails oe
        WHERE LOWER(oe.to_email) = l.email_lc
          AND oe.email_type = 'demographics_backfill'
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.email_events ee
        WHERE LOWER(ee.to_email) = l.email_lc
          AND ee.event_type IN ('bounced','complained','unsubscribed')
      )
  )
  SELECT
    p.id AS record_id,
    p.email,
    p.dinero,
    p.desarrollo,
    p.diversion,
    p.created_at,
    (p.sector IS NOT NULL) AS has_sector,
    (p.age_range IS NOT NULL) AS has_age
  FROM pending p
  ORDER BY p.created_at DESC
  LIMIT batch_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_demographics_backfill(integer) TO service_role;