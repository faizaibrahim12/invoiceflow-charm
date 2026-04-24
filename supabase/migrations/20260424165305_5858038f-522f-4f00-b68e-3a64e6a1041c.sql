
ALTER FUNCTION public.set_updated_at() SET search_path = public;

DROP POLICY "logos public read" ON storage.objects;
CREATE POLICY "logos owner read" ON storage.objects FOR SELECT
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

UPDATE storage.buckets SET public = true WHERE id = 'logos';
