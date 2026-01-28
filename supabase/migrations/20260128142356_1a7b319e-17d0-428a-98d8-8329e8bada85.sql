-- Allow service role to read from csv bucket
CREATE POLICY "Service role can read csv bucket"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'csv');