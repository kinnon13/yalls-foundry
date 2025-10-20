-- Fix rocker_dm with correct schema (payload, read_at)
CREATE OR REPLACE FUNCTION public.rocker_dm(
  p_user_id uuid,
  p_text text,
  p_channel text DEFAULT 'web'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert using actual schema: type, payload, read_at
  INSERT INTO rocker_notifications (user_id, type, payload)
  VALUES (
    p_user_id,
    'rocker_message',
    jsonb_build_object(
      'text', p_text,
      'channel', p_channel,
      'source', 'proactive'
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rocker_dm TO authenticated, service_role;

-- Test notification!
SELECT rocker_dm(
  'f6952613-af22-467d-b790-06dfc7efbdbd'::uuid,
  '🎉 Success! Your Rocker AI proactivity is fully activated.',
  'web'
);

-- Verify notification was created
SELECT 
  type, 
  payload->>'text' as message,
  created_at
FROM rocker_notifications
WHERE user_id = 'f6952613-af22-467d-b790-06dfc7efbdbd'
ORDER BY created_at DESC
LIMIT 1;