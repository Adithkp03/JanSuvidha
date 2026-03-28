-- Migration 004: Broadcast Alerts table
-- Stores admin-broadcast alerts server-side so they are visible across all
-- devices / kiosks regardless of which browser created them.

CREATE TABLE IF NOT EXISTS broadcast_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL DEFAULT 'Information',
  department  TEXT NOT NULL DEFAULT 'All Departments',
  message     TEXT NOT NULL,
  duration    TEXT NOT NULL DEFAULT '1 hour',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ          -- NULL = "Until manually cleared"
);

CREATE INDEX IF NOT EXISTS idx_broadcast_alerts_expires_at ON broadcast_alerts (expires_at);

-- Idempotent: add expires_at if table already existed without it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'broadcast_alerts' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE broadcast_alerts ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END $$;
