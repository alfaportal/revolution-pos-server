-- Njoftime email pronari për skadim licencë (data_skadimit) — një herë për datë skadimi.

CREATE TABLE IF NOT EXISTS license_email_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id    UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('expiry_7d', 'expired')),
  expiry_date   DATE NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (license_id, kind, expiry_date)
);

CREATE INDEX IF NOT EXISTS idx_license_email_notifications_license
  ON license_email_notifications (license_id);
