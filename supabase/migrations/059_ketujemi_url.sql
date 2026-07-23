-- Link reciprocal opsional Revolution ↔ KetuJemi (vetëm URL, pa sync operacional)

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS ketujemi_url TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN pos_settings.ketujemi_url IS
  'URL publike KetuJemi për link reciprocal SEO (opsionale). Nuk sinkronizon të dhëna.';
