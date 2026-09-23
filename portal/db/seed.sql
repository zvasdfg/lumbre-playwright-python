INSERT INTO system_metadata (key, value, updated_at)
VALUES ('seed_version', '2026.07.03', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;
