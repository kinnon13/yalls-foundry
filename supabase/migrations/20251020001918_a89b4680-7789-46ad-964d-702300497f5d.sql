-- Create vault storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('vault', 'vault', false, 52428800) -- 50MB limit
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for vault
CREATE POLICY "Users can upload to own vault folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'vault' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own vault files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own vault files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );