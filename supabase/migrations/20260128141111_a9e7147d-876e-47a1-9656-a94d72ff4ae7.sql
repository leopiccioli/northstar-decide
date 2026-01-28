-- Staging table for legacy CSV import
CREATE TABLE staging_legacy_3d (
  legacy_id INTEGER,
  email TEXT NOT NULL,
  fecha TEXT,
  dinero INTEGER,
  desarrollo INTEGER,
  diversion INTEGER,
  comentario TEXT,
  pais TEXT
);

-- No RLS needed - this is a temporary admin-only table
-- Will be dropped after migration is complete