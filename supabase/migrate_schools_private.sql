-- Add is_private flag for factions (defaults to false for public factions)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Add Unique School ID (USI) for B2B features (hidden from public)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS usi TEXT UNIQUE;
