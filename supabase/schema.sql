-- Revolution Invest POS — skema Supabase
-- Ekzekutoni në Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Klientët (restorante / kafene)
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emri        TEXT NOT NULL,
  adresa      TEXT DEFAULT '',
  telefoni    TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  tipi        TEXT NOT NULL DEFAULT 'restorant'
              CHECK (tipi IN ('restorant', 'kafene', 'tjeter')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_emri ON clients (emri);
CREATE INDEX IF NOT EXISTS idx_clients_tipi ON clients (tipi);

-- Liçensat
CREATE TABLE IF NOT EXISTS licenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  device_id       TEXT DEFAULT '',
  celesi          TEXT NOT NULL UNIQUE,
  statusi         TEXT NOT NULL DEFAULT 'aktive'
                  CHECK (statusi IN ('aktive', 'skaduar', 'revokuar', 'pezulluar')),
  data_fillimit   DATE NOT NULL DEFAULT CURRENT_DATE,
  data_skadimit   DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_licenses_client ON licenses (client_id);
CREATE INDEX IF NOT EXISTS idx_licenses_celesi ON licenses (celesi);
CREATE INDEX IF NOT EXISTS idx_licenses_device ON licenses (device_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses (statusi);

-- Përdoruesit e panelit
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  emri        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  passwordi   TEXT NOT NULL,
  roli        TEXT NOT NULL DEFAULT 'client_admin'
              CHECK (roli IN ('super_admin', 'client_admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_client ON users (client_id);
CREATE INDEX IF NOT EXISTS idx_users_roli ON users (roli);

-- Përditëso updated_at te licenses
CREATE OR REPLACE FUNCTION set_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_licenses_updated ON licenses;
CREATE TRIGGER trg_licenses_updated
  BEFORE UPDATE ON licenses
  FOR EACH ROW EXECUTE FUNCTION set_licenses_updated_at();

-- RLS: çaktivizo për server që përdor service role key
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politikat lejojnë service role (bypass RLS automatikisht me service key)

COMMENT ON TABLE clients IS 'Restorantet dhe kafenet e regjistruara';
COMMENT ON TABLE licenses IS 'Liçensat POS të lidhura me klient dhe pajisje';
COMMENT ON TABLE users IS 'Pronarët dhe super admin për panelin web';
