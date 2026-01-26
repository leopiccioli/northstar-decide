-- 1. Rename table measurements to records_3d
ALTER TABLE public.measurements RENAME TO records_3d;

-- 2. Add email_sent column to records_3d
ALTER TABLE public.records_3d ADD COLUMN email_sent boolean DEFAULT false;

-- 3. Drop existing RLS policies (they reference old table name internally)
DROP POLICY IF EXISTS "Service role can insert measurements" ON public.records_3d;
DROP POLICY IF EXISTS "Service role can read measurements" ON public.records_3d;

-- 4. Recreate RLS policies for records_3d
CREATE POLICY "Service role can insert records_3d" 
ON public.records_3d 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can read records_3d" 
ON public.records_3d 
FOR SELECT 
TO service_role
USING (true);

CREATE POLICY "Service role can update records_3d" 
ON public.records_3d 
FOR UPDATE 
TO service_role
USING (true);

-- 5. Create outbound_emails table for email auditing
CREATE TABLE public.outbound_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id uuid REFERENCES public.records_3d(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  subject text NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('measurement', 'reminder')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider_id text,
  error_message text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Enable RLS on outbound_emails
ALTER TABLE public.outbound_emails ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for outbound_emails (service_role only)
CREATE POLICY "Service role can insert outbound_emails" 
ON public.outbound_emails 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can read outbound_emails" 
ON public.outbound_emails 
FOR SELECT 
TO service_role
USING (true);

CREATE POLICY "Service role can update outbound_emails" 
ON public.outbound_emails 
FOR UPDATE 
TO service_role
USING (true);

-- 8. Create index for scheduled emails (for future cron jobs)
CREATE INDEX idx_outbound_emails_scheduled ON public.outbound_emails(scheduled_for) 
WHERE status = 'pending' AND scheduled_for IS NOT NULL;

-- 9. Create index for record lookups
CREATE INDEX idx_outbound_emails_record_id ON public.outbound_emails(record_id);