-- Create composite indexes for rate limiting queries
-- These indexes will speed up the parallel queries in save-result edge function

-- Index for IP-based rate limiting (ip_address + created_at)
CREATE INDEX IF NOT EXISTS idx_records_3d_ip_rate_limit 
ON public.records_3d (ip_address, created_at DESC);

-- Index for email-based rate limiting (email + created_at)
CREATE INDEX IF NOT EXISTS idx_records_3d_email_rate_limit 
ON public.records_3d (email, created_at DESC);

-- Index for history lookup (email + comparison IS NULL + created_at)
-- This uses a partial index since we only query non-comparison records
CREATE INDEX IF NOT EXISTS idx_records_3d_email_history 
ON public.records_3d (email, created_at DESC) 
WHERE comparison IS NULL;