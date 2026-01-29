-- Function to get pending legacy notifications (bypasses 1000 record limit)
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
    -- Obtener todos los emails únicos de legacy con su conteo
    SELECT 
      r.email,
      COUNT(*) as record_count
    FROM records_3d r
    WHERE r.option_name = 'legacy'
    GROUP BY r.email
  ),
  notified_emails AS (
    -- Emails que ya fueron notificados (exitosamente o no)
    SELECT DISTINCT to_email 
    FROM outbound_emails 
    WHERE email_type = 'legacy_notification'
  ),
  pending_emails AS (
    -- Emails legacy que NO están en notificados
    SELECT le.email, le.record_count
    FROM legacy_emails le
    LEFT JOIN notified_emails ne ON le.email = ne.to_email
    WHERE ne.to_email IS NULL
    LIMIT batch_limit
  ),
  latest_records AS (
    -- Para cada email pendiente, obtener su registro más reciente
    SELECT DISTINCT ON (r.email)
      r.email,
      r.dinero,
      r.desarrollo,
      r.diversion,
      r.created_at
    FROM records_3d r
    INNER JOIN pending_emails pe ON r.email = pe.email
    WHERE r.option_name = 'legacy'
    ORDER BY r.email, r.created_at DESC
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

-- Function to count pending legacy notifications
CREATE OR REPLACE FUNCTION count_pending_legacy_notifications()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT r.email)
  FROM records_3d r
  LEFT JOIN outbound_emails oe 
    ON r.email = oe.to_email 
    AND oe.email_type = 'legacy_notification'
  WHERE r.option_name = 'legacy'
    AND oe.to_email IS NULL;
$$;