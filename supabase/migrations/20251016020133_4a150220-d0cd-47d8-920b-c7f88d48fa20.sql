-- Create storage buckets for post media
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('post-images', 'post-images', true),
  ('post-videos', 'post-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for post-images
CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own post images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for post-videos
CREATE POLICY "Anyone can view post videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-videos');

CREATE POLICY "Authenticated users can upload post videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own post videos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'post-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-videos' AND auth.uid()::text = (storage.foldername(name))[1]);