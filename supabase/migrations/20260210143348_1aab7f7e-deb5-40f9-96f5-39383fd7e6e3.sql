ALTER TABLE outbound_emails 
  ADD COLUMN reminder_attempt integer NOT NULL DEFAULT 1;