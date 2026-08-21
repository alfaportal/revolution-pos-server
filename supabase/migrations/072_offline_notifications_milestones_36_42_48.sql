-- Njoftime offline pronarit: vetëm 36h, 42h, 48h (jo më 12h/24h).

DELETE FROM offline_notifications
WHERE milestone_hours NOT IN (36, 42, 48);

ALTER TABLE offline_notifications
  DROP CONSTRAINT IF EXISTS offline_notifications_milestone_hours_check;

ALTER TABLE offline_notifications
  ADD CONSTRAINT offline_notifications_milestone_hours_check
  CHECK (milestone_hours IN (36, 42, 48));

COMMENT ON TABLE offline_notifications IS
  'Email pronarit kur POS/arka offline — njoftime në 36, 42 dhe 48 orë.';
