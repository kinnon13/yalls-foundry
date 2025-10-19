-- Add is_mock flag to entities for testing
ALTER TABLE entities ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT false;

-- Create index for mock filtering
CREATE INDEX IF NOT EXISTS idx_entities_is_mock ON entities(is_mock);

-- Add some mock entities for testing
INSERT INTO entities (
  id,
  kind,
  display_name,
  handle,
  status,
  is_mock,
  metadata,
  created_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000010'::uuid,
    'person',
    'Jane Rider',
    'jane-rider-mock',
    'verified',
    true,
    jsonb_build_object(
      'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
      'bio', 'Mock test rider profile'
    ),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000011'::uuid,
    'business',
    'Sunset Stables',
    'sunset-stables-mock',
    'verified',
    true,
    jsonb_build_object(
      'logo_url', 'https://api.dicebear.com/7.x/shapes/svg?seed=Sunset',
      'bio', 'Mock equestrian facility'
    ),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000012'::uuid,
    'horse',
    'Thunder',
    'thunder-mock',
    'verified',
    true,
    jsonb_build_object(
      'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=Thunder',
      'bio', 'Mock show horse'
    ),
    now()
  )
ON CONFLICT (id) DO NOTHING;