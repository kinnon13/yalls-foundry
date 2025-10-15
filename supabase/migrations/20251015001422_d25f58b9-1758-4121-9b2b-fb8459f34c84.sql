-- Fix RLS on Events Partition Tables

-- Enable RLS on partition tables (inherits policies from parent)
ALTER TABLE entity_profiles_2025_01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_profiles_2025_02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_profiles_2025_03 ENABLE ROW LEVEL SECURITY;

-- Note: Policies are inherited from parent entity_profiles table
-- No additional policies needed on partition tables
