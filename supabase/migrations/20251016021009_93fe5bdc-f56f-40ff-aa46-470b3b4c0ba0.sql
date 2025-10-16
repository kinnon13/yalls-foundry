-- Create storage bucket for stream recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stream-recordings', 'stream-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for stream recordings
CREATE POLICY "Anyone can view stream recordings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stream-recordings');

CREATE POLICY "Authenticated users can upload stream recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stream-recordings' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own stream recordings"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'stream-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own stream recordings"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'stream-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);