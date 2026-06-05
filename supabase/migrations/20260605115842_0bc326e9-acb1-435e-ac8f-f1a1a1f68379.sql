
-- Lock down admin-only SECURITY DEFINER functions so anon/authenticated cannot call them via RPC
REVOKE EXECUTE ON FUNCTION public.get_pending_legacy_notifications(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.count_pending_legacy_notifications() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_pending_demographics_backfill(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_country_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_sector_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_age_range_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_all_stats() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_pending_legacy_notifications(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.count_pending_legacy_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_demographics_backfill(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_country_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_sector_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_age_range_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_all_stats() TO service_role;
