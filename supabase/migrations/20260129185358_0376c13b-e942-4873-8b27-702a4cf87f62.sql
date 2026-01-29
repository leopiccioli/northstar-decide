-- Actualizar funcion get_pending_legacy_notifications con comparacion case-insensitive
CREATE OR REPLACE FUNCTION get_pending_legacy_notifications(batch_limit INTEGER DEFAULT 15)
RETURNS TABLE (
  email TEXT,
  record_count BIGINT,
  dinero INTEGER,
  desarrollo INTEGER,
  diversion INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH legacy_emails AS (
    SELECT 
      LOWER(r.email) as email,
      COUNT(*) as record_count
    FROM records_3d r
    WHERE r.option_name = 'legacy'
    GROUP BY LOWER(r.email)
  ),
  notified_emails AS (
    SELECT DISTINCT LOWER(to_email) as email
    FROM outbound_emails 
    WHERE email_type = 'legacy_notification'
  ),
  pending_emails AS (
    SELECT le.email, le.record_count
    FROM legacy_emails le
    LEFT JOIN notified_emails ne ON le.email = ne.email
    WHERE ne.email IS NULL
    LIMIT batch_limit
  ),
  latest_records AS (
    SELECT DISTINCT ON (LOWER(r.email))
      LOWER(r.email) as email,
      r.dinero,
      r.desarrollo,
      r.diversion,
      r.created_at
    FROM records_3d r
    INNER JOIN pending_emails pe ON LOWER(r.email) = pe.email
    WHERE r.option_name = 'legacy'
    ORDER BY LOWER(r.email), r.created_at DESC
  )
  SELECT 
    lr.email,
    pe.record_count,
    lr.dinero,
    lr.desarrollo,
    lr.diversion,
    lr.created_at
  FROM latest_records lr
  INNER JOIN pending_emails pe ON lr.email = pe.email;
$$;

-- Actualizar funcion count_pending_legacy_notifications
CREATE OR REPLACE FUNCTION count_pending_legacy_notifications()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT LOWER(r.email))
  FROM records_3d r
  LEFT JOIN outbound_emails oe 
    ON LOWER(r.email) = LOWER(oe.to_email) 
    AND oe.email_type = 'legacy_notification'
  WHERE r.option_name = 'legacy'
    AND oe.to_email IS NULL;
$$;