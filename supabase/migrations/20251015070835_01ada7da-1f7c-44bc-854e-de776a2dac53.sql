-- Create storage bucket for Rocker file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rocker-files', 'rocker-files', true);

-- Create RLS policies for rocker-files bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'rocker-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'rocker-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'rocker-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);