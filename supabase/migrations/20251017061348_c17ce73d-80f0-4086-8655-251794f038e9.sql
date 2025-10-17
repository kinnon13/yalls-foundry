-- PR#2: Storage buckets for media uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('listing-media', 'listing-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('event-media', 'event-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS for listing media
CREATE POLICY "Anyone can view listing media"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-media');

CREATE POLICY "Authenticated users can upload listing media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listing-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own listing media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'listing-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own listing media"
ON storage.objects FOR DELETE
USING (bucket_id = 'listing-media' AND auth.uid() IS NOT NULL);

-- RLS for event media
CREATE POLICY "Anyone can view event media"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-media');

CREATE POLICY "Authenticated users can upload event media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own event media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own event media"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-media' AND auth.uid() IS NOT NULL);