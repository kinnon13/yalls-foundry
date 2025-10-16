-- Add screenshot and detailed logging fields to ai_feedback
ALTER TABLE ai_feedback
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS target TEXT,
ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS selector TEXT,
ADD COLUMN IF NOT EXISTS route TEXT DEFAULT '/';

-- Create storage bucket for AI screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ai-screenshots', 'ai-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own screenshots
CREATE POLICY "Users can upload their own AI screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ai-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read of AI screenshots (for debug panel)
CREATE POLICY "AI screenshots are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'ai-screenshots');

-- Allow users to delete their own screenshots
CREATE POLICY "Users can delete their own AI screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ai-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);