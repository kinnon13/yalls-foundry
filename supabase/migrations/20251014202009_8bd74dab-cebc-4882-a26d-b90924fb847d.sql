-- Enable required extensions for yalls.ai
-- pgcrypto: UUID generation and cryptographic functions
-- vector: Vector similarity search capabilities
-- postgis: Geospatial data support

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "postgis";