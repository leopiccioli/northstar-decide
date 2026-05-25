
CREATE TABLE public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_email_id text NOT NULL,
  event_type text NOT NULL,
  to_email text,
  link_url text,
  user_agent text,
  ip_address text,
  raw_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_events_resend_id ON public.email_events(resend_email_id);
CREATE INDEX idx_email_events_type_created ON public.email_events(event_type, created_at DESC);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block public access to email_events"
  ON public.email_events FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Service role can read email_events"
  ON public.email_events FOR SELECT TO service_role
  USING (true);

CREATE POLICY "Service role can insert email_events"
  ON public.email_events FOR INSERT TO service_role
  WITH CHECK (true);
