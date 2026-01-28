
-- Drop the existing constraint and recreate with new value
ALTER TABLE outbound_emails DROP CONSTRAINT outbound_emails_email_type_check;
ALTER TABLE outbound_emails ADD CONSTRAINT outbound_emails_email_type_check 
  CHECK (email_type = ANY (ARRAY['measurement'::text, 'reminder'::text, 'legacy_notification'::text]));
