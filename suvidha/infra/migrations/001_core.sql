-- This migration defines the core JanSuvidha Phase 1 schema with civic kiosk-ready tables and seed data.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      VARCHAR(15) UNIQUE NOT NULL,
  name       TEXT,
  role       TEXT NOT NULL CHECK (role IN ('citizen', 'admin', 'operator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kiosks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location   TEXT NOT NULL,
  public_key TEXT,
  status     TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_id    UUID REFERENCES kiosks(id),
  user_id     UUID REFERENCES users(id),
  department  TEXT NOT NULL,
  service_type TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'normal',
  status      TEXT NOT NULL DEFAULT 'submitted',
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID REFERENCES requests(id),
  filename     TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type    TEXT,
  size         INT,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID REFERENCES requests(id),
  amount      NUMERIC NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'INR',
  gateway     TEXT,
  gateway_ref TEXT,
  status      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offline_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_event_id TEXT UNIQUE NOT NULL,
  kiosk_id       UUID REFERENCES kiosks(id),
  payload        JSONB NOT NULL DEFAULT '{}'::jsonb,
  signature      TEXT,
  processed      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  actor_id   UUID,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  UUID,
  details    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill missing columns for existing installations (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN
    ALTER TABLE users ADD COLUMN name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='department') THEN
    ALTER TABLE requests ADD COLUMN department TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='service_type') THEN
    ALTER TABLE requests ADD COLUMN service_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='priority') THEN
    ALTER TABLE requests ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='actor_id') THEN
    ALTER TABLE audit_logs ADD COLUMN actor_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='action') THEN
    ALTER TABLE audit_logs ADD COLUMN action TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='entity') THEN
    ALTER TABLE audit_logs ADD COLUMN entity TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='entity_id') THEN
    ALTER TABLE audit_logs ADD COLUMN entity_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='details') THEN
    ALTER TABLE audit_logs ADD COLUMN details JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='created_at') THEN
    ALTER TABLE audit_logs ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Indexes for common filters.
CREATE INDEX IF NOT EXISTS idx_requests_department ON requests (department);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON requests (priority);
CREATE INDEX IF NOT EXISTS idx_offline_events_client_event_id ON offline_events (client_event_id);

-- Seed data: one kiosk and an admin user.
INSERT INTO kiosks (id, location, status)
VALUES (
  gen_random_uuid(),
  'Demo Kiosk - Ward 1 Office',
  'active'
)
ON CONFLICT DO NOTHING;

INSERT INTO users (phone, name, role)
VALUES ('9990002222', 'Demo Admin', 'admin')
ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- Seed a small departments catalog using a simple lookup table via audit log metadata.
INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
VALUES (
  NULL,
  'seed_departments',
  'system',
  NULL,
  jsonb_build_object(
    'departments',
    jsonb_build_array('electricity', 'water', 'gas', 'grievance')
  )
)
ON CONFLICT DO NOTHING;

