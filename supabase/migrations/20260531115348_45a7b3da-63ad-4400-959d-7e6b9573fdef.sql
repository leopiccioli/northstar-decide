WITH latest_sector AS (
  SELECT DISTINCT ON (LOWER(email)) LOWER(email) AS email_lc, sector
  FROM public.records_3d
  WHERE email IS NOT NULL AND sector IS NOT NULL
  ORDER BY LOWER(email), created_at DESC
),
latest_age AS (
  SELECT DISTINCT ON (LOWER(email)) LOWER(email) AS email_lc, age_range
  FROM public.records_3d
  WHERE email IS NOT NULL AND age_range IS NOT NULL
  ORDER BY LOWER(email), created_at DESC
),
merged AS (
  SELECT COALESCE(ls.email_lc, la.email_lc) AS email_lc, ls.sector, la.age_range
  FROM latest_sector ls
  FULL OUTER JOIN latest_age la ON ls.email_lc = la.email_lc
)
UPDATE public.records_3d r
SET sector    = COALESCE(r.sector, m.sector),
    age_range = COALESCE(r.age_range, m.age_range)
FROM merged m
WHERE LOWER(r.email) = m.email_lc
  AND (
    (r.sector    IS NULL AND m.sector    IS NOT NULL) OR
    (r.age_range IS NULL AND m.age_range IS NOT NULL)
  );

SELECT public.refresh_all_stats();