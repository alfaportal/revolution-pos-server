-- Heartbeat i fundit nga POS (POST /api/v1/license/heartbeat).

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_licenses_last_heartbeat_at
  ON licenses (last_heartbeat_at DESC NULLS LAST);

COMMENT ON COLUMN licenses.last_heartbeat_at IS 'Koha e heartbeat-it të fundit nga POS — online/idle/offline në admin.';
