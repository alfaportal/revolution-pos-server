-- ============================================================
-- Revolution POS — SQL i plotë për projekt të ri Supabase
-- Rendi: tabela BAZË së pari; 043/044 skip nëse BABYLON mungon
-- Gjeneruar: 2026-07-21 19:07
-- ============================================================

-- ========== FAZA 0: extension ==========
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== FAZA 1: tabela bazë ==========
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emri        TEXT NOT NULL,
  adresa      TEXT DEFAULT '',
  telefoni    TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  tipi        TEXT NOT NULL DEFAULT 'restorant'
              CHECK (tipi IN (
                'kafene', 'restorant', 'bar', 'pub_lounge', 'piceri',
                'fast_food', 'kebab', 'pasticeri', 'akullore', 'gjeltore',
                'furre_buke', 'hotel_restorant', 'bar_nate', 'klub',
                'market', 'minimarket', 'dyqan_rroba', 'dyqan_kepuce', 'dyqan',
                'farmaci', 'optike', 'berber', 'sallon_bukurie', 'tjeter'
              )),
  kitchen_slug TEXT,
  kitchen_key  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clients_emri ON clients (emri);
CREATE INDEX IF NOT EXISTS idx_clients_tipi ON clients (tipi);

CREATE TABLE IF NOT EXISTS licenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  app_type        TEXT NOT NULL DEFAULT 'restorant'
                  CHECK (app_type IN ('restorant', 'kafene')),
  device_id       TEXT DEFAULT '',
  device_hostname TEXT DEFAULT '',
  last_activated_at TIMESTAMPTZ,
  last_ip         TEXT DEFAULT '',
  last_validation_at TIMESTAMPTZ,
  last_validation_error TEXT DEFAULT '',
  celesi          TEXT NOT NULL UNIQUE,
  statusi         TEXT NOT NULL DEFAULT 'aktive'
                  CHECK (statusi IN ('aktive', 'skaduar', 'revokuar', 'pezulluar')),
  data_fillimit   DATE NOT NULL DEFAULT CURRENT_DATE,
  data_skadimit   DATE NOT NULL,
  max_terminals   INTEGER NOT NULL DEFAULT 1,
  terminal_price  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  base_price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  terminal_limit_grace_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_licenses_client ON licenses (client_id);
CREATE INDEX IF NOT EXISTS idx_licenses_app_type ON licenses (app_type);
CREATE INDEX IF NOT EXISTS idx_licenses_celesi ON licenses (celesi);
CREATE INDEX IF NOT EXISTS idx_licenses_device ON licenses (device_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses (statusi);
CREATE INDEX IF NOT EXISTS idx_licenses_last_activated ON licenses (last_activated_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS license_terminals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id         UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  device_id          TEXT NOT NULL,
  device_hostname    TEXT NOT NULL DEFAULT '',
  last_ip            TEXT NOT NULL DEFAULT '',
  first_activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (license_id, device_id)
);

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  emri        TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  passwordi         TEXT,
  invite_token      TEXT,
  invite_expires_at TIMESTAMPTZ,
  password_set_at   TIMESTAMPTZ,
  roli        TEXT NOT NULL DEFAULT 'client_admin'
              CHECK (roli IN ('super_admin', 'client_admin')),
  aktiv       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_client ON users (client_id);
CREATE INDEX IF NOT EXISTS idx_users_roli ON users (roli);
CREATE INDEX IF NOT EXISTS idx_users_aktiv ON users (aktiv);

-- ========== FAZA 2: katalog POS (para sales_orders) ==========
CREATE TABLE IF NOT EXISTS pos_settings (
  client_id         UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  restaurant_name   TEXT DEFAULT '',
  address           TEXT DEFAULT '',
  phone             TEXT DEFAULT '',
  nui               TEXT DEFAULT '',
  tvsh_nr           TEXT DEFAULT '',
  receipt_width_mm  INTEGER NOT NULL DEFAULT 80 CHECK (receipt_width_mm IN (58, 80)),
  table_count       INTEGER NOT NULL DEFAULT 10,
  fiscal_nr         TEXT DEFAULT '',
  fiscal_com_port   TEXT DEFAULT '',
  fiscal_enabled    BOOLEAN NOT NULL DEFAULT true,
  fiscal_operator_name TEXT DEFAULT '',
  fiscal_device_model  TEXT DEFAULT '',
  synced_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  public_enabled    BOOLEAN NOT NULL DEFAULT true,
  public_description TEXT NOT NULL DEFAULT '',
  public_hours      JSONB NOT NULL DEFAULT '{}',
  public_logo       TEXT NOT NULL DEFAULT '',
  public_theme_color TEXT NOT NULL DEFAULT '#c2410c'
);

CREATE TABLE IF NOT EXISTS pos_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (client_id, name)
);

CREATE TABLE IF NOT EXISTS pos_menu_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  local_id    INTEGER NOT NULL DEFAULT 0,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT '',
  price       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  photo       TEXT NOT NULL DEFAULT '',
  stock_quantity INTEGER,
  stock_alert_threshold INTEGER NOT NULL DEFAULT 5,
  track_stock BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (client_id, local_id)
);

CREATE TABLE IF NOT EXISTS pos_staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'waiter' CHECK (role IN ('waiter', 'kitchen')),
  source      TEXT NOT NULL DEFAULT 'owner' CHECK (source IN ('owner', 'pos')),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  pin_hash    TEXT,
  web_token   TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (client_id, name)
);
CREATE INDEX IF NOT EXISTS idx_pos_staff_role ON pos_staff (client_id, role, active);

CREATE TABLE IF NOT EXISTS pos_areas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  table_count   INTEGER NOT NULL DEFAULT 1 CHECK (table_count >= 0 AND table_count <= 30),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, name)
);
CREATE INDEX IF NOT EXISTS idx_pos_areas_client ON pos_areas (client_id, sort_order);

-- ========== FAZA 3: shitjet & fiskale ==========
CREATE TABLE IF NOT EXISTS sales_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  license_id      UUID REFERENCES licenses(id) ON DELETE SET NULL,
  local_order_id  TEXT NOT NULL DEFAULT '',
  device_id       TEXT NOT NULL DEFAULT '',
  table_number    INTEGER DEFAULT 0,
  waiter_name     TEXT DEFAULT '',
  waiter_id       UUID REFERENCES pos_staff(id) ON DELETE SET NULL,
  items_json      JSONB NOT NULL DEFAULT '[]'::jsonb,
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  receipt_number  TEXT DEFAULT '',
  payment_status  TEXT NOT NULL DEFAULT 'pending'
                  CHECK (payment_status IN ('pending', 'paid', 'manual', 'failed', 'refunded')),
  payment_method  TEXT NOT NULL DEFAULT 'cash',
  paid_at         TIMESTAMPTZ,
  fiscal_receipt_id UUID,
  status          TEXT NOT NULL DEFAULT 'closed'
                  CHECK (status IN ('ordered', 'ready', 'closed', 'cancelled')),
  ordered_at      TIMESTAMPTZ,
  ready_at        TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, local_order_id, device_id)
);
CREATE INDEX IF NOT EXISTS idx_sales_client ON sales_orders (client_id);
CREATE INDEX IF NOT EXISTS idx_sales_closed ON sales_orders (closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_client_closed ON sales_orders (client_id, closed_at DESC);

CREATE TABLE IF NOT EXISTS fiscal_receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sale_order_id   UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  local_order_id  TEXT DEFAULT '',
  device_id       TEXT DEFAULT '',
  fiscal_nr       TEXT DEFAULT '',
  coupon_nr       TEXT DEFAULT '',
  serial_nr       TEXT DEFAULT '',
  total_gross     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_net       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_vat       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cash_given      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method  TEXT NOT NULL DEFAULT 'cash',
  vat_breakdown   JSONB NOT NULL DEFAULT '{}'::jsonb,
  items_json      JSONB NOT NULL DEFAULT '[]'::jsonb,
  status          TEXT NOT NULL DEFAULT 'printed'
                  CHECK (status IN ('printed', 'manual', 'failed', 'pending')),
  com_port        TEXT DEFAULT '',
  register_connected BOOLEAN NOT NULL DEFAULT true,
  raw_response    JSONB NOT NULL DEFAULT '{}'::jsonb,
  printed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS daily_z_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_date         DATE NOT NULL,
  coupon_count        INTEGER NOT NULL DEFAULT 0,
  turnover_total      NUMERIC(14, 2) NOT NULL DEFAULT 0,
  turnover_net        NUMERIC(14, 2) NOT NULL DEFAULT 0,
  turnover_vat        NUMERIC(14, 2) NOT NULL DEFAULT 0,
  vat_breakdown       JSONB NOT NULL DEFAULT '{}'::jsonb,
  cash_register_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cumulative_turnover NUMERIC(14, 2) NOT NULL DEFAULT 0,
  responsible_person  TEXT DEFAULT '',
  fiscal_nr           TEXT DEFAULT '',
  sales_json          JSONB NOT NULL DEFAULT '[]'::jsonb,
  closed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, report_date)
);


CREATE TABLE IF NOT EXISTS stock_alert_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES pos_menu_items(id) ON DELETE CASCADE,
  notified_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, menu_item_id)
);

-- ========== FAZA 4: trigger + RLS bazë ==========
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
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

-- Politikat lejojnë service role (bypass RLS automatikisht me service key)

COMMENT ON TABLE clients IS 'Restorantet dhe kafenet e regjistruara';
COMMENT ON TABLE licenses IS 'Liçensat POS të lidhura me klient dhe pajisje';
COMMENT ON TABLE users IS 'Pronarët dhe super admin për panelin web';
COMMENT ON TABLE sales_orders IS 'Shitjet e dërguara nga POS Electron në kohë reale';
COMMENT ON COLUMN users.aktiv IS 'false = pronari nuk mund të hyjë në panel';

-- ========== FAZA 5: migrimet 002 → 056 ==========

-- ---------- 002_owners_sales.sql ----------
-- Migrimi 002: pronarë aktiv/çaktiv + shitjet nga POS
-- Ekzekutoni në Supabase SQL Editor (pas schema.sql)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS aktiv BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_users_aktiv ON users (aktiv);

-- Porositë / shitjet e sinkronizuara nga POS
CREATE TABLE IF NOT EXISTS sales_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  license_id      UUID REFERENCES licenses(id) ON DELETE SET NULL,
  local_order_id  TEXT NOT NULL DEFAULT '',
  device_id       TEXT NOT NULL DEFAULT '',
  table_number    INTEGER DEFAULT 0,
  waiter_name     TEXT DEFAULT '',
  items_json      JSONB NOT NULL DEFAULT '[]'::jsonb,
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  receipt_number  TEXT DEFAULT '',
  closed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, local_order_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_sales_client ON sales_orders (client_id);
CREATE INDEX IF NOT EXISTS idx_sales_closed ON sales_orders (closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_client_closed ON sales_orders (client_id, closed_at DESC);

COMMENT ON TABLE sales_orders IS 'Shitjet e dërguara nga POS Electron në kohë reale';
COMMENT ON COLUMN users.aktiv IS 'false = pronari nuk mund të hyjë në panel';


-- ---------- 003_kitchen_kds.sql ----------
-- KDS: kitchen slug/key te klientët, status porosish

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS kitchen_slug TEXT,
  ADD COLUMN IF NOT EXISTS kitchen_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_kitchen_slug
  ON clients (kitchen_slug) WHERE kitchen_slug IS NOT NULL AND kitchen_slug <> '';

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'closed',
  ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;

ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check;
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check
  CHECK (status IN ('ordered', 'ready', 'closed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_sales_kitchen_queue
  ON sales_orders (client_id, status, ordered_at DESC NULLS LAST);

COMMENT ON COLUMN clients.kitchen_slug IS 'Slug për URL /kitchen/:slug';
COMMENT ON COLUMN clients.kitchen_key IS 'Çelës sekret për ekranin e kuzhinës (?k=)';


-- ---------- 004_pos_catalog.sql ----------
-- Katalog POS (menu, tavolina, stafi) — sync nga Electron

CREATE TABLE IF NOT EXISTS pos_settings (
  client_id         UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  restaurant_name   TEXT DEFAULT '',
  table_count       INTEGER NOT NULL DEFAULT 10,
  synced_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pos_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (client_id, name)
);

CREATE INDEX IF NOT EXISTS idx_pos_categories_client ON pos_categories (client_id);

CREATE TABLE IF NOT EXISTS pos_menu_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  local_id    INTEGER NOT NULL DEFAULT 0,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT '',
  price       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (client_id, local_id)
);

CREATE INDEX IF NOT EXISTS idx_pos_menu_client ON pos_menu_items (client_id);
CREATE INDEX IF NOT EXISTS idx_pos_menu_active ON pos_menu_items (client_id, active);

CREATE TABLE IF NOT EXISTS pos_staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (client_id, name)
);

CREATE INDEX IF NOT EXISTS idx_pos_staff_client ON pos_staff (client_id);


-- ---------- 005_license_app_type.sql ----------
-- Tipi i aplikacionit POS për çdo liçencë (restorant / kafene)
ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS app_type TEXT NOT NULL DEFAULT 'restorant'
  CHECK (app_type IN ('restorant', 'kafene'));

CREATE INDEX IF NOT EXISTS idx_licenses_app_type ON licenses (app_type);

-- Mbush nga tipi i klientit për liçensat ekzistuese
UPDATE licenses l
SET app_type = c.tipi
FROM clients c
WHERE l.client_id = c.id
  AND c.tipi IN ('restorant', 'kafene');

COMMENT ON COLUMN licenses.app_type IS 'Aplikacioni POS: restorant ose kafene';


-- ---------- 006_owner_invite.sql ----------
-- Ftesë pronari: vendos fjalëkalimin vetë përmes linkut /owner/setup?token=...

ALTER TABLE users
  ALTER COLUMN passwordi DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS invite_token TEXT,
  ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_token
  ON users (invite_token) WHERE invite_token IS NOT NULL AND invite_token <> '';

COMMENT ON COLUMN users.invite_token IS 'Token i ftesës — pronari vendos fjalëkalimin në /owner/setup';
COMMENT ON COLUMN users.invite_expires_at IS 'Skadimi i linkut të ftesës (zakonisht 48 orë)';
COMMENT ON COLUMN users.password_set_at IS 'Kur pronari aktivizoi llogarinë me fjalëkalim';


-- ---------- 007_license_device_meta.sql ----------
-- Meta pajisjeje POS — hostname, IP, aktivizimi, gabimet e validimit

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS device_hostname TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_ip TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_validation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_validation_error TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_licenses_last_activated ON licenses (last_activated_at DESC NULLS LAST);

COMMENT ON COLUMN licenses.device_hostname IS 'Emri i kompjuterit (hostname) nga POS';
COMMENT ON COLUMN licenses.last_activated_at IS 'Koha e aktivizimit/validimit të suksesshëm të fundit';
COMMENT ON COLUMN licenses.last_ip IS 'IP e fundit e raportuar nga POS';
COMMENT ON COLUMN licenses.last_validation_error IS 'Gabimi i fundit i validimit (p.sh. DEVICE_MISMATCH)';


-- ---------- 008_owner_password_reset.sql ----------
-- Rivendosje fjalëkalimi pronar (kod OTP në email)
CREATE TABLE IF NOT EXISTS owner_password_resets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_owner_password_resets_email
  ON owner_password_resets (email, expires_at DESC);


-- ---------- 009_saas_features.sql ----------
-- Pakot SaaS, trial, kitchen access, login fail count në DB

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS package_tier TEXT;

-- Klientët ekzistues marrin Pako 2 (mos blloko KDS/kamarier që përdoret tashmë)
UPDATE clients SET package_tier = 'pako_2' WHERE package_tier IS NULL;

ALTER TABLE clients
  ALTER COLUMN package_tier SET DEFAULT 'pako_1';

ALTER TABLE clients
  ALTER COLUMN package_tier SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_package_tier_check'
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_package_tier_check
      CHECK (package_tier IN ('pako_1', 'pako_1_1', 'pako_2', 'pako_2_1'));
  END IF;
END $$;

-- Kitchen access për klientët pa slug/key
UPDATE clients
SET kitchen_key = encode(gen_random_bytes(24), 'hex')
WHERE kitchen_key IS NULL OR kitchen_key = '';

UPDATE clients c
SET kitchen_slug = 'loc-' || substr(replace(c.id::text, '-', ''), 1, 10)
WHERE kitchen_slug IS NULL OR kitchen_slug = '';

CREATE INDEX IF NOT EXISTS idx_clients_package_tier ON clients (package_tier);

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_licenses_trial_ends ON licenses (trial_ends_at);

-- Numërim gabimesh login pronar (persistente, jo in-memory)
CREATE TABLE IF NOT EXISTS owner_login_failures (
  email             TEXT PRIMARY KEY,
  fail_count        INTEGER NOT NULL DEFAULT 0,
  window_expires_at TIMESTAMPTZ NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_login_failures_window
  ON owner_login_failures (window_expires_at);


-- ---------- 010_admin_controls.sql ----------
-- Log aktiviteti Super Admin + force logout licencash

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email   TEXT NOT NULL DEFAULT '',
  action        TEXT NOT NULL,
  target_type   TEXT NOT NULL DEFAULT '',
  target_id     TEXT DEFAULT '',
  target_label  TEXT DEFAULT '',
  details       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created
  ON admin_activity_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action
  ON admin_activity_log (action, created_at DESC);

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS force_logout_at TIMESTAMPTZ;

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;


-- ---------- 011_receipt_business_profile.sql ----------
-- Profili i biznesit për fatura termale (header, NUI, TVSH)

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS nui TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tvsh_nr TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS receipt_width_mm INTEGER NOT NULL DEFAULT 80;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_settings_receipt_width_mm_check'
  ) THEN
    ALTER TABLE pos_settings
      ADD CONSTRAINT pos_settings_receipt_width_mm_check
      CHECK (receipt_width_mm IN (58, 80));
  END IF;
END $$;

-- Klientët ekzistues — kopjo emër/adresë/telefon nga clients
UPDATE pos_settings ps
SET
  restaurant_name = COALESCE(NULLIF(ps.restaurant_name, ''), c.emri),
  address = COALESCE(NULLIF(ps.address, ''), c.adresa, ''),
  phone = COALESCE(NULLIF(ps.phone, ''), c.telefoni, '')
FROM clients c
WHERE ps.client_id = c.id;

-- Klientë pa pos_settings — krijo rresht default
INSERT INTO pos_settings (client_id, restaurant_name, address, phone, table_count, synced_at)
SELECT c.id, c.emri, COALESCE(c.adresa, ''), COALESCE(c.telefoni, ''), 10, now()
FROM clients c
WHERE NOT EXISTS (SELECT 1 FROM pos_settings ps WHERE ps.client_id = c.id);


-- ---------- 012_fiscal_zreport.sql ----------
-- Arkë fiskale (ATK Kosovo) + Raporti Ditor (Z-Report) për çdo biznes

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS fiscal_nr TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS fiscal_com_port TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS fiscal_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS fiscal_operator_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS fiscal_device_model TEXT DEFAULT '';

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fiscal_receipt_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_orders_payment_status_check'
  ) THEN
    ALTER TABLE sales_orders
      ADD CONSTRAINT sales_orders_payment_status_check
      CHECK (payment_status IN ('pending', 'paid', 'manual', 'failed', 'refunded'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS fiscal_receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sale_order_id   UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  local_order_id  TEXT DEFAULT '',
  device_id       TEXT DEFAULT '',
  fiscal_nr       TEXT DEFAULT '',
  coupon_nr       TEXT DEFAULT '',
  serial_nr       TEXT DEFAULT '',
  total_gross     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_net       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_vat       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cash_given      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method  TEXT NOT NULL DEFAULT 'cash',
  vat_breakdown   JSONB NOT NULL DEFAULT '{}'::jsonb,
  items_json      JSONB NOT NULL DEFAULT '[]'::jsonb,
  status          TEXT NOT NULL DEFAULT 'printed'
                  CHECK (status IN ('printed', 'manual', 'failed', 'pending')),
  com_port        TEXT DEFAULT '',
  register_connected BOOLEAN NOT NULL DEFAULT true,
  raw_response    JSONB NOT NULL DEFAULT '{}'::jsonb,
  printed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_receipts_client_date
  ON fiscal_receipts (client_id, printed_at DESC);

CREATE INDEX IF NOT EXISTS idx_fiscal_receipts_sale
  ON fiscal_receipts (sale_order_id);

CREATE TABLE IF NOT EXISTS daily_z_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_date         DATE NOT NULL,
  coupon_count        INTEGER NOT NULL DEFAULT 0,
  turnover_total      NUMERIC(14, 2) NOT NULL DEFAULT 0,
  turnover_net        NUMERIC(14, 2) NOT NULL DEFAULT 0,
  turnover_vat        NUMERIC(14, 2) NOT NULL DEFAULT 0,
  vat_breakdown       JSONB NOT NULL DEFAULT '{}'::jsonb,
  cash_register_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cumulative_turnover NUMERIC(14, 2) NOT NULL DEFAULT 0,
  responsible_person  TEXT DEFAULT '',
  fiscal_nr           TEXT DEFAULT '',
  sales_json          JSONB NOT NULL DEFAULT '[]'::jsonb,
  closed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_z_reports_client
  ON daily_z_reports (client_id, report_date DESC);

-- Shitjet e mbyllura para migrimit = të paguara (legacy)
UPDATE sales_orders
SET payment_status = 'paid', paid_at = COALESCE(closed_at, created_at)
WHERE status = 'closed' AND payment_status = 'pending';

-- Default fiscal_nr nga TVSH/NUI ku ekziston
UPDATE pos_settings ps
SET fiscal_nr = COALESCE(NULLIF(ps.fiscal_nr, ''), NULLIF(ps.tvsh_nr, ''), NULLIF(ps.nui, ''))
WHERE fiscal_nr IS NULL OR fiscal_nr = '';


-- ---------- 013_pos_areas_staff_roles.sql ----------
-- Hapësira (terasa, sallë) dhe rolet e stafit

CREATE TABLE IF NOT EXISTS pos_areas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  table_count   INTEGER NOT NULL DEFAULT 1 CHECK (table_count >= 0 AND table_count <= 30),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, name)
);

CREATE INDEX IF NOT EXISTS idx_pos_areas_client ON pos_areas (client_id, sort_order);

ALTER TABLE pos_staff
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'waiter';

ALTER TABLE pos_staff
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'owner';

ALTER TABLE pos_staff
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_staff_role_check'
  ) THEN
    ALTER TABLE pos_staff
      ADD CONSTRAINT pos_staff_role_check
      CHECK (role IN ('waiter', 'kitchen'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_staff_source_check'
  ) THEN
    ALTER TABLE pos_staff
      ADD CONSTRAINT pos_staff_source_check
      CHECK (source IN ('owner', 'pos'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pos_staff_role ON pos_staff (client_id, role, active);


-- ---------- 014_waiter_pin.sql ----------
-- PIN kamarierësh dhe lidhja e porosive me stafin

ALTER TABLE pos_staff
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS waiter_id UUID REFERENCES pos_staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_waiter_id ON sales_orders (client_id, waiter_id);


-- ---------- 015_public_restaurant_page.sql ----------
-- Public restaurant page (/r/:slug) — owner-configurable profile fields

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_description TEXT NOT NULL DEFAULT '';

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_hours JSONB NOT NULL DEFAULT '{}';

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_logo TEXT NOT NULL DEFAULT '';

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_theme_color TEXT NOT NULL DEFAULT '#c2410c';

COMMENT ON COLUMN pos_settings.public_enabled IS 'When false, /r/:slug returns not found';
COMMENT ON COLUMN pos_settings.public_description IS 'Short about text on public restaurant page';
COMMENT ON COLUMN pos_settings.public_hours IS 'Opening hours JSON keyed by mon..sun';
COMMENT ON COLUMN pos_settings.public_logo IS 'Logo as data URL (base64) for PWA icon and header';


-- ---------- 015_waiter_web_token.sql ----------
-- Link personal për çdo kamarier (tablet) — ?w=token

ALTER TABLE pos_staff
  ADD COLUMN IF NOT EXISTS web_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_staff_web_token
  ON pos_staff (client_id, web_token)
  WHERE web_token IS NOT NULL AND web_token <> '';


-- ---------- 016_menu_item_photos.sql ----------
-- Menu item photos for public restaurant page

ALTER TABLE pos_menu_items
  ADD COLUMN IF NOT EXISTS photo TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN pos_menu_items.photo IS 'Item photo as data URL (base64) for public menu display';


-- ---------- 017_trial_notifications.sql ----------
-- Regjistër njoftimesh trial (email pronari / admin) — një herë për licencë dhe lloj.

CREATE TABLE IF NOT EXISTS trial_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id    UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL
    CHECK (notification_type IN ('owner_7d', 'owner_1d', 'owner_expired', 'admin_7d')),
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (license_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_trial_notifications_license
  ON trial_notifications (license_id);

CREATE INDEX IF NOT EXISTS idx_trial_notifications_type
  ON trial_notifications (notification_type);


-- ---------- 018_stock_management.sql ----------
-- Stock / inventory tracking for menu items

ALTER TABLE pos_menu_items
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS stock_alert_threshold INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS track_stock BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN pos_menu_items.stock_quantity IS 'Remaining units when track_stock is true; NULL means not set yet';
COMMENT ON COLUMN pos_menu_items.stock_alert_threshold IS 'Email alert when quantity drops to this level or below';
COMMENT ON COLUMN pos_menu_items.track_stock IS 'When true, stock_quantity is decremented on each sale';

CREATE TABLE IF NOT EXISTS stock_alert_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES pos_menu_items(id) ON DELETE CASCADE,
  notified_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, menu_item_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_alert_notifications_client
  ON stock_alert_notifications (client_id);

CREATE INDEX IF NOT EXISTS idx_pos_menu_track_stock
  ON pos_menu_items (client_id, track_stock)
  WHERE track_stock = true;


-- ---------- 019_multi_terminal.sql ----------
-- Multi-terminal licensing: max devices per license + terminal registry

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS max_terminals INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS terminal_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS terminal_limit_grace_at TIMESTAMPTZ;

COMMENT ON COLUMN licenses.max_terminals IS 'Maximum simultaneous POS terminals for this license';
COMMENT ON COLUMN licenses.terminal_price IS 'Extra monthly cost per terminal beyond the first';
COMMENT ON COLUMN licenses.base_price IS 'Base package price for billing display';
COMMENT ON COLUMN licenses.terminal_limit_grace_at IS 'When terminal limit was first exceeded (24h grace before block)';

CREATE TABLE IF NOT EXISTS license_terminals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id         UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  device_id          TEXT NOT NULL,
  device_hostname    TEXT NOT NULL DEFAULT '',
  last_ip            TEXT NOT NULL DEFAULT '',
  first_activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (license_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_license_terminals_license
  ON license_terminals (license_id);

CREATE INDEX IF NOT EXISTS idx_license_terminals_last_seen
  ON license_terminals (license_id, last_seen_at DESC);

-- Seed registry from legacy single device_id
INSERT INTO license_terminals (license_id, device_id, device_hostname, last_ip, first_activated_at, last_seen_at)
SELECT
  id,
  UPPER(TRIM(device_id)),
  COALESCE(device_hostname, ''),
  COALESCE(last_ip, ''),
  COALESCE(last_activated_at, now()),
  COALESCE(last_validation_at, last_activated_at, now())
FROM licenses
WHERE TRIM(COALESCE(device_id, '')) <> ''
ON CONFLICT (license_id, device_id) DO NOTHING;


-- ---------- 020_sales_payment_method.sql ----------
-- Metoda e pagesës në sales_orders (kërkohet nga kamarieri/KDS/POS cloud sync)

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';

COMMENT ON COLUMN sales_orders.payment_method IS 'cash ose karte — vendoset kur mbyllet tavolina';


-- ---------- 021_order_acceptance.sql ----------
-- Kush e pranoi porosinë QR / web / online
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS accepted_by_waiter_id UUID REFERENCES pos_staff(id) ON DELETE SET NULL;

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS accepted_by_waiter_name TEXT DEFAULT '';

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sales_accepted_by
  ON sales_orders (client_id, accepted_by_waiter_id)
  WHERE accepted_by_waiter_id IS NOT NULL;


-- ---------- 021_package_tiers_v2.sql ----------
-- Pakot 1–4 (heq pako_1_1 dhe pako_2_1)
-- REND I RËNDËSISHËM: së pari hiq constraint-in e vjetër, pastaj UPDATE, pastaj constraint i ri.

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_package_tier_check;

UPDATE clients SET package_tier = 'pako_3' WHERE package_tier = 'pako_1_1';
UPDATE clients SET package_tier = 'pako_4' WHERE package_tier = 'pako_2_1';

ALTER TABLE clients
  ADD CONSTRAINT clients_package_tier_check
  CHECK (package_tier IN ('pako_1', 'pako_2', 'pako_3', 'pako_4'));


-- ---------- 022_public_page_profile.sql ----------
-- Faqja publike — cover, galeri, ofertë, vlerësime, rrjete sociale, WhatsApp

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_cover TEXT NOT NULL DEFAULT '';

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_gallery JSONB NOT NULL DEFAULT '[]';

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_daily_offer TEXT NOT NULL DEFAULT '';

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_reviews JSONB NOT NULL DEFAULT '[]';

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_social_instagram TEXT NOT NULL DEFAULT '';

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_social_facebook TEXT NOT NULL DEFAULT '';

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_social_tiktok TEXT NOT NULL DEFAULT '';

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS public_whatsapp TEXT NOT NULL DEFAULT '';


-- ---------- 023_ai_usage_logs.sql ----------
-- Regjistron përdorimin e AI (chat / OCR) për çdo restorant

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  feature_type   TEXT NOT NULL CHECK (feature_type IN ('chat', 'ocr')),
  tokens_used    INTEGER NOT NULL CHECK (tokens_used >= 0),
  cost_usd       NUMERIC(12, 6) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE ai_usage_logs IS 'Historiku i thirrjeve AI (chat, OCR) për llogaritje kostoje.';
COMMENT ON COLUMN ai_usage_logs.restaurant_id IS 'FK te clients.id — restoranti/kafeneja.';
COMMENT ON COLUMN ai_usage_logs.feature_type IS 'chat ose ocr';
COMMENT ON COLUMN ai_usage_logs.tokens_used IS 'Numri total i tokenëve të konsumuar.';
COMMENT ON COLUMN ai_usage_logs.cost_usd IS 'Kostoja e vlerësuar në USD për këtë thirrje.';

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_restaurant_created
  ON ai_usage_logs (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature_created
  ON ai_usage_logs (feature_type, created_at DESC);


-- ---------- 024_reservations.sql ----------
-- Rezervime tavolinash — owner panel + waiter app

CREATE TABLE IF NOT EXISTS reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  table_number    INTEGER NOT NULL CHECK (table_number >= 1 AND table_number <= 30),
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL DEFAULT '',
  date            DATE NOT NULL,
  time            TIME NOT NULL,
  guests          INTEGER NOT NULL DEFAULT 2 CHECK (guests >= 1 AND guests <= 50),
  notes           TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_date
  ON reservations (restaurant_id, date);

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_status
  ON reservations (restaurant_id, status);

COMMENT ON TABLE reservations IS 'Rezervime tavolinash për restorant (restaurant_id = clients.id)';


-- ---------- 025_inventory.sql ----------
-- Inventari me përbërës — ingredients + receta menu (menu_ingredients)

CREATE TABLE IF NOT EXISTS ingredients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  unit            TEXT NOT NULL DEFAULT 'copë'
                    CHECK (unit IN ('kg', 'l', 'copë')),
  quantity        NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity    NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  cost_per_unit   NUMERIC(12, 4) NOT NULL DEFAULT 0 CHECK (cost_per_unit >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_restaurant
  ON ingredients (restaurant_id);

CREATE TABLE IF NOT EXISTS menu_ingredients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id    UUID NOT NULL REFERENCES pos_menu_items(id) ON DELETE CASCADE,
  ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_used   NUMERIC(12, 3) NOT NULL DEFAULT 1 CHECK (quantity_used > 0),
  UNIQUE (menu_item_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_menu_ingredients_menu
  ON menu_ingredients (menu_item_id);

CREATE INDEX IF NOT EXISTS idx_menu_ingredients_ingredient
  ON menu_ingredients (ingredient_id);

COMMENT ON TABLE ingredients IS 'Përbërësit e inventarit (restaurant_id = clients.id)';
COMMENT ON TABLE menu_ingredients IS 'Sa përbërës shpenzohet për 1 artikull menuje';


-- ---------- 026_shop_storefront.sql ----------
-- Webfaqe dyqanesh (/s/:slug) — tipi dyqan + fusha produktesh

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_tipi_check;
ALTER TABLE clients ADD CONSTRAINT clients_tipi_check
  CHECK (tipi IN ('restorant', 'kafene', 'tjeter', 'dyqan'));

ALTER TABLE pos_menu_items ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE pos_menu_items ADD COLUMN IF NOT EXISTS sku TEXT NOT NULL DEFAULT '';
ALTER TABLE pos_menu_items ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10, 2) NULL;


-- ---------- 027_ai_usage_logs_cascade.sql ----------
-- Siguro CASCADE kur fshihet klienti (fix për DB ku FK u krijua pa CASCADE)

ALTER TABLE ai_usage_logs
  DROP CONSTRAINT IF EXISTS ai_usage_logs_restaurant_id_fkey;

ALTER TABLE ai_usage_logs
  ADD CONSTRAINT ai_usage_logs_restaurant_id_fkey
  FOREIGN KEY (restaurant_id) REFERENCES clients(id) ON DELETE CASCADE;


-- ---------- 028_package_tier_pako_5.sql ----------
-- Pako 4 marketing = pako_5 backend (AI Profesionale)

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_package_tier_check;

ALTER TABLE clients
  ADD CONSTRAINT clients_package_tier_check
  CHECK (package_tier IN ('pako_1', 'pako_2', 'pako_3', 'pako_4', 'pako_5'));


-- ---------- 029_ai_daily_reports.sql ----------
-- Raporte AI ditore për klientët me pako_5 (Pako 4 — AI Profesionale)

CREATE TABLE IF NOT EXISTS ai_daily_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_date     DATE NOT NULL,
  report_json     JSONB NOT NULL DEFAULT '{}',
  summary_text    TEXT NOT NULL DEFAULT '',
  email_sent_at   TIMESTAMPTZ,
  tokens_used     INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_daily_reports_restaurant_date
  ON ai_daily_reports (restaurant_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_daily_reports_date
  ON ai_daily_reports (report_date DESC);

COMMENT ON TABLE ai_daily_reports IS 'Raportet AI ditore të gjeneruara automatikisht për restorantet me pako_5.';
COMMENT ON COLUMN ai_daily_reports.report_json IS 'Të dhënat e strukturuara: shitje, top artikuj, stok i ulët, fitim.';
COMMENT ON COLUMN ai_daily_reports.summary_text IS 'Përmbledhja në shqip e shkruar nga AI.';


-- ---------- 030_owner_groups.sql ----------
-- Multi-location: një pronar / grup → shumë lokale (clients)

CREATE TABLE IF NOT EXISTS owner_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emri        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS owner_group_id UUID REFERENCES owner_groups(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS owner_group_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_group_id  UUID NOT NULL REFERENCES owner_groups(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clients_owner_group ON clients (owner_group_id);
CREATE INDEX IF NOT EXISTS idx_owner_group_members_user ON owner_group_members (user_id);

COMMENT ON TABLE owner_groups IS 'Grup biznesi — disa lokale (clients) nën një pronar.';
COMMENT ON TABLE owner_group_members IS 'Pronarët që kanë akses në të gjitha lokalet e grupit.';


-- ---------- 031_supply_suggestions.sql ----------
-- Faza 7 — Sugjerime automatike furnizimi (pako_5 / AI)

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS last_supplier TEXT,
  ADD COLUMN IF NOT EXISTS last_supplier_email TEXT;

CREATE TABLE IF NOT EXISTS supply_suggestions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  suggestion_date     DATE NOT NULL,
  ingredient_id       UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  item_name           TEXT NOT NULL,
  unit                TEXT NOT NULL DEFAULT 'copë'
                        CHECK (unit IN ('kg', 'l', 'copë')),
  current_quantity    NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  min_quantity        NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  order_quantity      NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (order_quantity > 0),
  last_supplier       TEXT,
  last_supplier_email TEXT,
  ai_summary          TEXT,
  email_sent_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, suggestion_date, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_supply_suggestions_restaurant_date
  ON supply_suggestions (restaurant_id, suggestion_date DESC);

COMMENT ON TABLE supply_suggestions IS 'Lista ditore e furnizimit — përbërës nën minimum (pako_5 AI)';
COMMENT ON COLUMN ingredients.last_supplier IS 'Furnizuesi i fundit (nga skanimi i faturës ose manual)';
COMMENT ON COLUMN ingredients.last_supplier_email IS 'Email i furnizuesit për porosi';


-- ---------- 032_ai_chat_history.sql ----------
-- Faza 8 — Asistent virtual AI (historia e bisedës, pako_5)

CREATE TABLE IF NOT EXISTS ai_chat_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  tokens_used     INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_history_restaurant_created
  ON ai_chat_history (restaurant_id, created_at DESC);

COMMENT ON TABLE ai_chat_history IS 'Historia e bisedës me Asistentin AI (owner panel, pako_5)';


-- ---------- 033_profit_forecast.sql ----------
-- Faza 9 — Parashikim fitimi (pako_5 / Raporte AI)

ALTER TABLE ai_daily_reports
  ADD COLUMN IF NOT EXISTS profit_forecast JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN ai_daily_reports.profit_forecast IS
  'Parashikim fitimi: historiku 30 ditë, krahasim javë/muaj, forecast AI në shqip';


-- ---------- 034_notification_settings.sql ----------
-- Faza 10 — Njoftime push SMS/Telegram (pako_5)

CREATE TABLE IF NOT EXISTS notification_settings (
  restaurant_id         UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  telegram_chat_id      TEXT,
  sms_number            TEXT,
  notify_low_stock      BOOLEAN NOT NULL DEFAULT true,
  notify_daily_report   BOOLEAN NOT NULL DEFAULT true,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingredient_alert_notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  notified_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_alert_notifications_restaurant
  ON ingredient_alert_notifications (restaurant_id);

CREATE TABLE IF NOT EXISTS daily_report_notifications (
  restaurant_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_date     DATE NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (restaurant_id, report_date)
);

COMMENT ON TABLE notification_settings IS 'Preferencat e njoftimeve Telegram/SMS për pronarin (pako_5)';


-- ---------- 035_ai_usage_billing.sql ----------
-- AI usage billing: feature granular, cost_eur, limit mujor tokenësh per klient

ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS feature TEXT;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS cost_eur NUMERIC(12, 6);

UPDATE ai_usage_logs
SET feature = CASE
  WHEN feature_type = 'ocr' THEN 'scan_menu'
  WHEN feature_type = 'chat' THEN 'chat'
  ELSE 'chat'
END
WHERE feature IS NULL;

UPDATE ai_usage_logs
SET cost_eur = ROUND(COALESCE(cost_usd, 0) * 0.92, 6)
WHERE cost_eur IS NULL;

ALTER TABLE ai_usage_logs ALTER COLUMN feature SET DEFAULT 'chat';

ALTER TABLE ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_feature_check;
ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_feature_check CHECK (
  feature IN (
    'scan_menu',
    'scan_invoice',
    'daily_report',
    'chat',
    'supply_suggestion',
    'profit_forecast'
  )
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature_created
  ON ai_usage_logs (feature, created_at DESC);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_monthly_token_limit INTEGER
  CHECK (ai_monthly_token_limit IS NULL OR ai_monthly_token_limit >= 0);

COMMENT ON COLUMN ai_usage_logs.feature IS
  'Veçoria AI: scan_menu, scan_invoice, daily_report, chat, supply_suggestion, profit_forecast';
COMMENT ON COLUMN ai_usage_logs.cost_eur IS 'Kostoja e vlerësuar në EUR (Anthropic).';
COMMENT ON COLUMN clients.ai_monthly_token_limit IS
  'Limit opsional mujor tokenësh AI; NULL = pa limit.';


-- ---------- 036_fix_clients_package_tier_check.sql ----------
-- Fix clients_package_tier_check: allow pako_5 (Pako 4 — AI Profesionale).
-- Safe to re-run if 028 was never applied on production.

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_package_tier_check;

ALTER TABLE clients
  ADD CONSTRAINT clients_package_tier_check
  CHECK (package_tier IN ('pako_1', 'pako_2', 'pako_3', 'pako_4', 'pako_5'));


-- ---------- 037_pako_1_4_labels_and_naseri.sql ----------
-- Pako 1–4 (marketing) = pako_2 … pako_5 në backend.
-- pako_1 mbetet vetëm për klientë legacy.

COMMENT ON COLUMN clients.package_tier IS
  'pako_2=Pako1, pako_3=Pako2, pako_4=Pako3 (porosi online), pako_5=Pako4 (AI), pako_1=legacy';

-- Naseri përdor QR, kamarier, faqe publike dhe porosi online — Pako 4 (pako_5).
UPDATE clients
SET package_tier = 'pako_5'
WHERE kitchen_slug = 'naseri-77a7dd'
   OR (LOWER(TRIM(emri)) = 'naseri' AND package_tier IN ('pako_2', 'pako_3'));


-- ---------- 038_waiter_table_assignments.sql ----------
-- Caktimi i tavolinave për secilin kamarier.
-- Tavolinat janë numra virtualë (1..N) të gjeneruar nga pos_areas.
-- Çdo tavolinë mund t'i caktohet vetëm një kamarieri (UNIQUE table_number për klient),
-- ndaj rikaktimi (nga një kamarier te tjetri) është thjesht një upsert.

CREATE TABLE IF NOT EXISTS pos_waiter_tables (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  waiter_id     UUID NOT NULL REFERENCES pos_staff(id) ON DELETE CASCADE,
  table_number  INTEGER NOT NULL CHECK (table_number >= 1 AND table_number <= 30),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_pos_waiter_tables_client
  ON pos_waiter_tables (client_id);

CREATE INDEX IF NOT EXISTS idx_pos_waiter_tables_waiter
  ON pos_waiter_tables (client_id, waiter_id);


-- ---------- 039_sales_pos_synced_at.sql ----------
-- Heartbeat i sinkronizimit POS → cloud (për skadimin e tavolinave «Duke u sinkronizuar…»)
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS pos_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN sales_orders.pos_synced_at IS 'Herë e fundit që POS desktop dërgoi update/sync për këtë porosi';


-- ---------- 040_order_refusal_grace.sql ----------
-- Refuzim i porosisë nga kamarieri: 2 minuta për kamarierët e tjerë para se të anulohet.
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS refused_at TIMESTAMPTZ;

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS order_expires_at TIMESTAMPTZ;

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS refused_by_waiter_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_sales_order_expires
  ON sales_orders (order_expires_at)
  WHERE status = 'ordered' AND order_expires_at IS NOT NULL;


-- ---------- 041_register_switch_codes.sql ----------
-- Kodet sekretë për ndërrimin e arkës (fiskale / termike) — vetëm pronari i vendos.

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS register_code_fiscal_hash TEXT,
  ADD COLUMN IF NOT EXISTS register_code_thermal_hash TEXT,
  ADD COLUMN IF NOT EXISTS active_coupon_type TEXT NOT NULL DEFAULT 'thermal',
  ADD COLUMN IF NOT EXISTS register_mode_updated_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_settings_active_coupon_type_check'
  ) THEN
    ALTER TABLE pos_settings
      ADD CONSTRAINT pos_settings_active_coupon_type_check
      CHECK (active_coupon_type IN ('thermal', 'fiscal'));
  END IF;
END $$;

COMMENT ON COLUMN pos_settings.register_code_fiscal_hash IS 'bcrypt hash — kod sekret për arkë fiskale';
COMMENT ON COLUMN pos_settings.register_code_thermal_hash IS 'bcrypt hash — kod sekret për arkë termike';
COMMENT ON COLUMN pos_settings.active_coupon_type IS 'Arka aktive e lokale: thermal | fiscal';


-- ---------- 042_register_mode_visible_toggle.sql ----------
-- Zëvendëson kodet sekrete të ndërrimit të arkës (041) me një modalitet të
-- dukshëm ("auto" | "thermal" | "fiscal"), ndryshuar vetëm nga pronari te
-- paneli i tij, me gjurmë (kush/kur). Heq kolonat e kodeve — nuk përdoren më.

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS register_mode_updated_by TEXT;

ALTER TABLE pos_settings DROP CONSTRAINT IF EXISTS pos_settings_active_coupon_type_check;
ALTER TABLE pos_settings
  ADD CONSTRAINT pos_settings_active_coupon_type_check
  CHECK (active_coupon_type IN ('auto', 'thermal', 'fiscal'));

ALTER TABLE pos_settings ALTER COLUMN active_coupon_type SET DEFAULT 'auto';

ALTER TABLE pos_settings
  DROP COLUMN IF EXISTS register_code_fiscal_hash,
  DROP COLUMN IF EXISTS register_code_thermal_hash;

COMMENT ON COLUMN pos_settings.active_coupon_type IS
  'Arka aktive: auto (kamarieri zgjedh) | thermal | fiscal — ndryshuar vetëm nga pronari, në mënyrë të dukshme.';
COMMENT ON COLUMN pos_settings.register_mode_updated_by IS
  'Email i pronarit që ndryshoi modalitetin e fundit.';


-- ---------- 043_seed_babylon_menu_items.sql ----------
-- Shton artikuj menuje për klientin BABYLON (pos_menu_items) — idempotent:
-- vetëm shton artikujt që NUK ekzistojnë ende (krahasim me emër, pa dallim
-- të madhe/vogël shkronjash), asnjë artikull ekzistues nuk preket/fshihet.
-- Çmimet lihen 0 — pronari i vendos vetë te paneli.

DO $$
DECLARE
  v_client_id UUID;
  v_client_count INTEGER;
  v_cat_sort INTEGER;
  v_next_local_id INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_client_count FROM clients WHERE emri ILIKE '%BABYLON%';
  IF v_client_count = 0 THEN
    RAISE NOTICE '043: Klienti BABYLON nuk u gjet — seed anashkalohet (OK për projekt të ri bosh).';
    RETURN;
  ELSIF v_client_count > 1 THEN
    RAISE EXCEPTION 'U gjetën % klientë që përputhen me BABYLON — saktëso emrin te ky script para se ta ekzekutosh', v_client_count;
  END IF;

  SELECT id INTO v_client_id FROM clients WHERE emri ILIKE '%BABYLON%';

  -- 1) Sigurohu që kategoritë ekzistojnë (pa i prekur ato ekzistuese)
  SELECT COALESCE(MAX(sort_order), -1) INTO v_cat_sort FROM pos_categories WHERE client_id = v_client_id;

  INSERT INTO pos_categories (client_id, name, sort_order)
  SELECT v_client_id, c.name, v_cat_sort + ROW_NUMBER() OVER (ORDER BY c.ord)
  FROM (VALUES
    (1, 'Pije të nxehta'),
    (2, 'Pije të ftohta'),
    (3, 'Birra'),
    (4, 'Alkool'),
    (5, 'Verë'),
    (6, 'Ushqime'),
    (7, 'Ëmbëlsira'),
    (8, 'Snacks')
  ) AS c(ord, name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pos_categories pc
    WHERE pc.client_id = v_client_id AND LOWER(TRIM(pc.name)) = LOWER(TRIM(c.name))
  );

  -- 2) Shto vetëm artikujt që nuk ekzistojnë ende (krahasim me emër)
  SELECT COALESCE(MAX(local_id), 0) INTO v_next_local_id FROM pos_menu_items WHERE client_id = v_client_id;

  INSERT INTO pos_menu_items (client_id, local_id, name, category, price, active)
  SELECT v_client_id, v_next_local_id + ROW_NUMBER() OVER (ORDER BY new_items.ord), new_items.name, new_items.category, 0, true
  FROM (
    SELECT x.ord, x.name, x.category
    FROM (VALUES
      -- Pije të nxehta
      (1,  'Espresso',                  'Pije të nxehta'),
      (2,  'Espresso Double',            'Pije të nxehta'),
      (3,  'Macchiato',                  'Pije të nxehta'),
      (4,  'Macchiato e madhe',          'Pije të nxehta'),
      (5,  'Kapuçino',                   'Pije të nxehta'),
      (6,  'Neskafe',                    'Pije të nxehta'),
      (7,  'Çaj',                        'Pije të nxehta'),
      (8,  'Çaj me mjaltë e limon',      'Pije të nxehta'),
      (9,  'Sahlep',                     'Pije të nxehta'),
      -- Pije të ftohta
      (10, 'Ujë 0.5l',                   'Pije të ftohta'),
      (11, 'Ujë 1.5l',                   'Pije të ftohta'),
      (12, 'Ujë i gazuar',               'Pije të ftohta'),
      (13, 'Coca-Cola',                  'Pije të ftohta'),
      (14, 'Fanta',                      'Pije të ftohta'),
      (15, 'Sprite',                     'Pije të ftohta'),
      (16, 'Schweppes',                  'Pije të ftohta'),
      (17, 'Lëng dredhëz',               'Pije të ftohta'),
      (18, 'Lëng pjeshkë',               'Pije të ftohta'),
      (19, 'Lëng mollë',                 'Pije të ftohta'),
      (20, 'Ice Tea',                    'Pije të ftohta'),
      (21, 'Limonadë',                   'Pije të ftohta'),
      -- Birra
      (22, 'Lasko 0.33l',                'Birra'),
      (23, 'Heineken 0.33l',             'Birra'),
      (24, 'Peja 0.33l',                 'Birra'),
      (25, 'Tuborg 0.33l',               'Birra'),
      (26, 'Corona 0.33l',               'Birra'),
      (27, 'Birra draft e vogël',        'Birra'),
      (28, 'Birra draft e madhe',        'Birra'),
      -- Alkool
      (29, 'Raki e shtëpisë',            'Alkool'),
      (30, 'Raki e vjetër',              'Alkool'),
      (31, 'Johnny Walker',              'Alkool'),
      (32, 'Jameson',                    'Alkool'),
      (33, 'Chivas',                     'Alkool'),
      (34, 'Absolut',                    'Alkool'),
      (35, 'Smirnoff',                   'Alkool'),
      (36, 'Gordon''s Gin',              'Alkool'),
      (37, 'Bombay Gin',                 'Alkool'),
      (38, 'Tequila',                    'Alkool'),
      (39, 'Mojito',                     'Alkool'),
      (40, 'Margarita',                  'Alkool'),
      (41, 'Sex on the Beach',           'Alkool'),
      (42, 'Piña Colada',                'Alkool'),
      -- Verë
      (43, 'Verë e bardhë (shishe)',     'Verë'),
      (44, 'Verë e bardhë (gotë)',       'Verë'),
      (45, 'Verë e kuqe (shishe)',       'Verë'),
      (46, 'Verë e kuqe (gotë)',         'Verë'),
      (47, 'Verë rozë (shishe)',         'Verë'),
      (48, 'Verë rozë (gotë)',           'Verë'),
      -- Ushqime
      (49, 'Burger klasik',              'Ushqime'),
      (50, 'Cheeseburger',               'Ushqime'),
      (51, 'Sanduiç me proshutë',        'Ushqime'),
      (52, 'Sanduiç vegjetarian',        'Ushqime'),
      (53, 'Toast',                      'Ushqime'),
      (54, 'Pica Margarita',             'Ushqime'),
      (55, 'Pica Kapriçoza',             'Ushqime'),
      (56, 'Sallatë greke',              'Ushqime'),
      (57, 'Sallatë çezar',              'Ushqime'),
      -- Ëmbëlsira
      (58, 'Bakllavë',                   'Ëmbëlsira'),
      (59, 'Trileçe',                    'Ëmbëlsira'),
      (60, 'Tortë me çokollatë',         'Ëmbëlsira'),
      (61, 'Cheesecake',                 'Ëmbëlsira'),
      (62, 'Akullore (kuglla)',          'Ëmbëlsira'),
      (63, 'Fruta të stinës',            'Ëmbëlsira'),
      -- Snacks
      (64, 'Patatina',                   'Snacks'),
      (65, 'Kikirikë',                   'Snacks'),
      (66, 'Bajame',                     'Snacks'),
      (67, 'Fëstëkë',                    'Snacks'),
      (68, 'Mix të thata',               'Snacks')
    ) AS x(ord, name, category)
    WHERE NOT EXISTS (
      SELECT 1 FROM pos_menu_items pmi
      WHERE pmi.client_id = v_client_id AND LOWER(TRIM(pmi.name)) = LOWER(TRIM(x.name))
    )
  ) AS new_items;

  -- 3) Shëno katalogun si të freskët, që QR/Takeaway/waiter phone ta marrin menjëherë
  INSERT INTO pos_settings (client_id, table_count, receipt_width_mm, synced_at)
  VALUES (v_client_id, 10, 80, now())
  ON CONFLICT (client_id) DO UPDATE SET synced_at = now();

  RAISE NOTICE 'BABYLON menu seed: client_id=%, artikuj para=%, pas=%',
    v_client_id,
    v_next_local_id,
    (SELECT COUNT(*) FROM pos_menu_items WHERE client_id = v_client_id);
END $$;


-- ---------- 044_seed_babylon_menu_items_missing_categories.sql ----------
-- Plotëson 4 kategoritë që mungonin nga 043 (Birra, Alkool, Verë, Ushqime) +
-- artikujt e tyre, për klientin BABYLON. Njësoj si 043 — idempotent: vetëm
-- shton kategori/artikuj që NUK ekzistojnë ende (krahasim me emër, pa dallim
-- të madhe/vogël shkronjash). Nuk prek asgjë ekzistuese, as 4 kategoritë që
-- tashmë u futën nga 043 (Pije të nxehta, Pije të ftohta, Ëmbëlsira, Snacks).

DO $$
DECLARE
  v_client_id UUID;
  v_client_count INTEGER;
  v_cat_sort INTEGER;
  v_next_local_id INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_client_count FROM clients WHERE emri ILIKE '%BABYLON%';
  IF v_client_count = 0 THEN
    RAISE NOTICE '044: Klienti BABYLON nuk u gjet — seed anashkalohet (OK për projekt të ri bosh).';
    RETURN;
  ELSIF v_client_count > 1 THEN
    RAISE EXCEPTION 'U gjetën % klientë që përputhen me BABYLON — saktëso emrin te ky script para se ta ekzekutosh', v_client_count;
  END IF;

  SELECT id INTO v_client_id FROM clients WHERE emri ILIKE '%BABYLON%';

  -- 1) Sigurohu që 4 kategoritë që mungonin ekzistojnë tani (pa i prekur të tjerat)
  SELECT COALESCE(MAX(sort_order), -1) INTO v_cat_sort FROM pos_categories WHERE client_id = v_client_id;

  INSERT INTO pos_categories (client_id, name, sort_order)
  SELECT v_client_id, c.name, v_cat_sort + ROW_NUMBER() OVER (ORDER BY c.ord)
  FROM (VALUES
    (1, 'Birra'),
    (2, 'Alkool'),
    (3, 'Verë'),
    (4, 'Ushqime')
  ) AS c(ord, name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pos_categories pc
    WHERE pc.client_id = v_client_id AND LOWER(TRIM(pc.name)) = LOWER(TRIM(c.name))
  );

  -- 2) Shto vetëm artikujt e këtyre 4 kategorive që nuk ekzistojnë ende
  SELECT COALESCE(MAX(local_id), 0) INTO v_next_local_id FROM pos_menu_items WHERE client_id = v_client_id;

  INSERT INTO pos_menu_items (client_id, local_id, name, category, price, active)
  SELECT v_client_id, v_next_local_id + ROW_NUMBER() OVER (ORDER BY new_items.ord), new_items.name, new_items.category, 0, true
  FROM (
    SELECT x.ord, x.name, x.category
    FROM (VALUES
      -- Birra
      (1,  'Lasko 0.33l',                'Birra'),
      (2,  'Heineken 0.33l',             'Birra'),
      (3,  'Peja 0.33l',                 'Birra'),
      (4,  'Tuborg 0.33l',               'Birra'),
      (5,  'Corona 0.33l',               'Birra'),
      (6,  'Birra draft e vogël',        'Birra'),
      (7,  'Birra draft e madhe',        'Birra'),
      -- Alkool
      (8,  'Raki e shtëpisë',            'Alkool'),
      (9,  'Raki e vjetër',              'Alkool'),
      (10, 'Johnny Walker',              'Alkool'),
      (11, 'Jameson',                    'Alkool'),
      (12, 'Chivas',                     'Alkool'),
      (13, 'Absolut',                    'Alkool'),
      (14, 'Smirnoff',                   'Alkool'),
      (15, 'Gordon''s Gin',              'Alkool'),
      (16, 'Bombay Gin',                 'Alkool'),
      (17, 'Tequila',                    'Alkool'),
      (18, 'Mojito',                     'Alkool'),
      (19, 'Margarita',                  'Alkool'),
      (20, 'Sex on the Beach',           'Alkool'),
      (21, 'Piña Colada',                'Alkool'),
      -- Verë
      (22, 'Verë e bardhë (shishe)',     'Verë'),
      (23, 'Verë e bardhë (gotë)',       'Verë'),
      (24, 'Verë e kuqe (shishe)',       'Verë'),
      (25, 'Verë e kuqe (gotë)',         'Verë'),
      (26, 'Verë rozë (shishe)',         'Verë'),
      (27, 'Verë rozë (gotë)',           'Verë'),
      -- Ushqime
      (28, 'Burger klasik',              'Ushqime'),
      (29, 'Cheeseburger',               'Ushqime'),
      (30, 'Sanduiç me proshutë',        'Ushqime'),
      (31, 'Sanduiç vegjetarian',        'Ushqime'),
      (32, 'Toast',                      'Ushqime'),
      (33, 'Pica Margarita',             'Ushqime'),
      (34, 'Pica Kapriçoza',             'Ushqime'),
      (35, 'Sallatë greke',              'Ushqime'),
      (36, 'Sallatë çezar',              'Ushqime')
    ) AS x(ord, name, category)
    WHERE NOT EXISTS (
      SELECT 1 FROM pos_menu_items pmi
      WHERE pmi.client_id = v_client_id AND LOWER(TRIM(pmi.name)) = LOWER(TRIM(x.name))
    )
  ) AS new_items;

  -- 3) Shëno katalogun si të freskët, që QR/Takeaway/waiter phone ta marrin menjëherë
  INSERT INTO pos_settings (client_id, table_count, receipt_width_mm, synced_at)
  VALUES (v_client_id, 10, 80, now())
  ON CONFLICT (client_id) DO UPDATE SET synced_at = now();

  RAISE NOTICE 'BABYLON menu seed (044 — kategoritë e munguara): client_id=%, artikuj para=%, pas=%',
    v_client_id,
    v_next_local_id,
    (SELECT COUNT(*) FROM pos_menu_items WHERE client_id = v_client_id);
END $$;


-- ---------- 045_owner_panel_compliance.sql ----------
-- Mbështet panelin e pronarit: TVSH per-artikull (A-E), numri serial i PEF,
-- anulim porosie me arsye, barazimi i arkës te Z-Report (paraja e nisjes /
-- e numëruar / diferenca + arsyeja), shpenzimet e vogla ditore, dhe një
-- audit log i veçantë PËR KLIENT (ndryshe nga admin_activity_log global,
-- i cili nuk ka client_id dhe s'duhet përdorur për pronarët).

-- 1) TVSH per artikull menuje (A=18%, B=8%, C=0%, D=përjashtuar, E=tjetër)
ALTER TABLE pos_menu_items
  ADD COLUMN IF NOT EXISTS vat_category TEXT NOT NULL DEFAULT 'A';

ALTER TABLE pos_menu_items DROP CONSTRAINT IF EXISTS pos_menu_items_vat_category_check;
ALTER TABLE pos_menu_items
  ADD CONSTRAINT pos_menu_items_vat_category_check
  CHECK (vat_category IN ('A', 'B', 'C', 'D', 'E'));

-- 2) Numri serial i PEF (Pajisja Elektronike Fiskale) — fushë settings, jo vetëm
--    ai i kapur automatikisht për-kupon te fiscal_receipts.serial_nr
ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS pef_serial_number TEXT NOT NULL DEFAULT '';

-- 3) Anulim porosie me arsye (pas printimit) — RUAJTUR VETËM te owner_activity_log
--    (poshtë), JO si kolona te sales_orders — Rregulli #11: mos u shto kolona
--    tabelës sales_orders pa leje. sales_orders.status='cancelled' ekziston
--    tashmë (asnjë ndryshim skeme atje); arsyeja/aktori/koha shkojnë te
--    owner_activity_log.details (JSONB).

-- 4) Barazimi i arkës për Z-Report (nuk ka koncept "shift" te cloud-i — një
--    "ditë" = një "arkë" për klientin, siç e trajton tashmë daily_z_reports)
ALTER TABLE daily_z_reports
  ADD COLUMN IF NOT EXISTS opening_float NUMERIC(12, 2);
ALTER TABLE daily_z_reports
  ADD COLUMN IF NOT EXISTS closing_cash_actual NUMERIC(12, 2);
ALTER TABLE daily_z_reports
  ADD COLUMN IF NOT EXISTS cash_difference NUMERIC(12, 2);
ALTER TABLE daily_z_reports
  ADD COLUMN IF NOT EXISTS cash_difference_reason TEXT NOT NULL DEFAULT '';

-- 5) Shpenzime të vogla ditore (jashtë blerjeve të stokut)
CREATE TABLE IF NOT EXISTS owner_expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category      TEXT NOT NULL DEFAULT 'tjeter',
  amount        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  description   TEXT NOT NULL DEFAULT '',
  entered_by    TEXT NOT NULL DEFAULT '',
  expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_expenses_client_date
  ON owner_expenses (client_id, expense_date DESC);

-- 6) Audit log PËR KLIENT (çmime të ndryshuara, porosi/fatura të anulluara, etj.)
--    — i veçantë nga admin_activity_log (ai është global, pa client_id, për
--    Super Adminin e platformës, jo për pronarët e restoranteve).
CREATE TABLE IF NOT EXISTS owner_activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  actor_email   TEXT NOT NULL DEFAULT '',
  action        TEXT NOT NULL,
  target_type   TEXT NOT NULL DEFAULT '',
  target_id     TEXT NOT NULL DEFAULT '',
  target_label  TEXT NOT NULL DEFAULT '',
  details       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_activity_log_client
  ON owner_activity_log (client_id, created_at DESC);

COMMENT ON COLUMN pos_menu_items.vat_category IS 'Kategoria TVSH ATK: A=18%, B=8%, C=0%, D=përjashtuar, E=tjetër';
COMMENT ON COLUMN pos_settings.pef_serial_number IS 'Numri serial i Pajisjes Elektronike Fiskale (PEF) — shfaqet në X/Z raporte';
COMMENT ON COLUMN daily_z_reports.opening_float IS 'Paraja e nisjes së arkës për ditën (vendosur nga pronari para shitjeve)';
COMMENT ON COLUMN daily_z_reports.closing_cash_actual IS 'Paraja e numëruar fizikisht në mbyllje të ditës';
COMMENT ON COLUMN daily_z_reports.cash_difference IS 'closing_cash_actual - (opening_float + cash_register_balance)';


-- ---------- 046_owner_expenses_vendor_name.sql ----------
-- Kontabilisti kërkon emrin e firmës/furnitorit që lëshoi mallin/shërbimin për
-- çdo shpenzim të vogël ditor, jo vetëm kategorinë dhe përshkrimin e lirë.
ALTER TABLE owner_expenses
  ADD COLUMN IF NOT EXISTS vendor_name TEXT NOT NULL DEFAULT '';


-- ---------- 047_force_factory_reset.sql ----------
-- Remote factory-reset flag: Super Admin (phone) → POS wipes local data like "Rivendos si të re"
ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS force_factory_reset_at TIMESTAMPTZ;

COMMENT ON COLUMN licenses.force_factory_reset_at IS
  'When set, POS heartbeat tells desktop to factory-reset local data, then POS acks and clears this.';


-- ---------- 048_expand_clients_tipi.sql ----------
-- Zgjero clients.tipi: bar, market + llojet ekzistuese.
-- Kafene / Restorant / Bar / Market / Dyqan / Tjetër — e njëjta app.

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_tipi_check;

ALTER TABLE clients ADD CONSTRAINT clients_tipi_check
  CHECK (tipi IN ('restorant', 'kafene', 'tjeter', 'dyqan', 'bar', 'market'));


-- ---------- 049_ai_weekly_and_ratings.sql ----------
-- Raporte javore AI + cache vlerësimi kamarierësh (Pako 4)

CREATE TABLE IF NOT EXISTS ai_weekly_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  week_start      DATE NOT NULL,
  week_end        DATE NOT NULL,
  report_json     JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary_text    TEXT NOT NULL DEFAULT '',
  email_sent_at   TIMESTAMPTZ,
  tokens_used     INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_weekly_reports_restaurant
  ON ai_weekly_reports (restaurant_id, week_start DESC);

CREATE TABLE IF NOT EXISTS ai_waiter_ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  ratings_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
  analysis_text   TEXT NOT NULL DEFAULT '',
  tokens_used     INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_ai_waiter_ratings_restaurant
  ON ai_waiter_ratings (restaurant_id, period_end DESC);

COMMENT ON TABLE ai_weekly_reports IS 'Raportet AI javore (e hënë) për klientët me Pako 4.';
COMMENT ON TABLE ai_waiter_ratings IS 'Analiza AI e refuzimeve / vlerësimit të kamarierëve.';


-- ---------- 050_order_refusal_events.sql ----------
-- Arsye refuzimi + historik për panelin e pronarit / AI waiter rating
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS refuse_reason TEXT;

CREATE TABLE IF NOT EXISTS order_refusal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  waiter_id TEXT NOT NULL DEFAULT '',
  waiter_name TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  table_number INTEGER,
  total NUMERIC(12, 2),
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_refusal_events_client_created
  ON order_refusal_events (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_refusal_events_order
  ON order_refusal_events (sales_order_id);


-- ---------- 051_hospitality_clients_tipi.sql ----------
-- Lloje hospitality për clients.tipi (paneli Super Admin).
-- Mban edhe vlerat e vjetra (market, dyqan, tjeter) për rreshta ekzistues.

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_tipi_check;

ALTER TABLE clients ADD CONSTRAINT clients_tipi_check
  CHECK (tipi IN (
    'kafene',
    'restorant',
    'bar',
    'pub_lounge',
    'piceri',
    'fast_food',
    'kebab',
    'pasticeri',
    'akullore',
    'gjeltore',
    'market',
    'dyqan',
    'tjeter'
  ));


-- ---------- 052_expand_clients_tipi_sectors.sql ----------
-- Sektoret e reja të biznesit për Super Admin dashboard (1–12).

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_tipi_check;

ALTER TABLE clients ADD CONSTRAINT clients_tipi_check
  CHECK (tipi IN (
    'kafene',
    'restorant',
    'bar',
    'pub_lounge',
    'piceri',
    'fast_food',
    'kebab',
    'pasticeri',
    'akullore',
    'gjeltore',
    'furre_buke',
    'hotel_restorant',
    'bar_nate',
    'klub',
    'market',
    'minimarket',
    'dyqan_rroba',
    'dyqan_kepuce',
    'dyqan',
    'farmaci',
    'optike',
    'berber',
    'sallon_bukurie',
    'tjeter'
  ));


-- ---------- 053_super_admin_settings_persist.sql ----------
-- Cilësimet e Super Admin (çmimet e pakove) + fatura — mbijetojnë restart Railway
CREATE TABLE IF NOT EXISTS super_admin_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO super_admin_settings (id, settings)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS super_admin_invoices (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_super_admin_invoices_created
  ON super_admin_invoices (created_at DESC);


-- ---------- 054_offline_notifications.sql ----------
-- Njoftime email për klientë offline (çdo 12h, deri në 48h).

CREATE TABLE IF NOT EXISTS offline_notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  license_id       UUID REFERENCES licenses(id) ON DELETE SET NULL,
  offline_since    TIMESTAMPTZ NOT NULL,
  milestone_hours  INT NOT NULL CHECK (milestone_hours IN (12, 24, 36, 48)),
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, offline_since, milestone_hours)
);

CREATE INDEX IF NOT EXISTS idx_offline_notifications_client
  ON offline_notifications (client_id);

CREATE INDEX IF NOT EXISTS idx_offline_notifications_milestone
  ON offline_notifications (milestone_hours);


-- ---------- 055_pos_pending_purchases.sql ----------
-- Fatura blerjeje nga paneli (telefon/AI) → radhë për POS desktop (KAFENE).
-- POS i tërheq dhe i regjistron lokalisht: Stoku + Blerjet + Kontabilisti.

CREATE TABLE IF NOT EXISTS pos_pending_purchases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  supplier          TEXT NOT NULL DEFAULT '',
  invoice_number    TEXT NOT NULL DEFAULT '',
  invoice_date      DATE,
  items_json        JSONB NOT NULL DEFAULT '[]'::jsonb,
  source            TEXT NOT NULL DEFAULT 'ai_invoice_scan',
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'applied', 'cancelled')),
  applied_at        TIMESTAMPTZ,
  applied_note      TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_pending_purchases_client_status
  ON pos_pending_purchases (client_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_pos_pending_purchases_invoice
  ON pos_pending_purchases (client_id, supplier, invoice_number)
  WHERE status = 'pending';

COMMENT ON TABLE pos_pending_purchases IS
  'Blerje nga owner/AI telefon — POS i aplikon me createPurchaseInvoice (stok + Blerjet + Kontabilisti)';


-- ---------- 056_license_stripe_payments.sql ----------
-- Pagesa Stripe për licenca (Checkout) — e njëjta ide si KetuJemi
CREATE TABLE IF NOT EXISTS license_stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  package_plan TEXT NOT NULL,
  package_tier TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'eur',
  business_name TEXT NOT NULL DEFAULT '',
  owner_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  tipi TEXT NOT NULL DEFAULT 'restorant',
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_license_stripe_payments_status
  ON license_stripe_payments (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_license_stripe_payments_session
  ON license_stripe_payments (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_license_stripe_payments_email
  ON license_stripe_payments (email);

COMMENT ON TABLE license_stripe_payments IS
  'Checkout Stripe për Pako 1–3 (vjetore). Pako 4 AI mbetet kontakt manual.';

