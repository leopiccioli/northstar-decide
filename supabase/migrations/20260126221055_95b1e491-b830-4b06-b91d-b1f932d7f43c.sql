-- Explicit deny for anonymous users on records_3d (all operations)
CREATE POLICY "Block public access to records_3d" 
ON public.records_3d 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- Explicit deny for anonymous users on outbound_emails (all operations)
CREATE POLICY "Block public access to outbound_emails"
ON public.outbound_emails
FOR ALL
TO anon
USING (false)
WITH CHECK (false);