CREATE TABLE IF NOT EXISTS rsvps (
  id TEXT PRIMARY KEY,
  guest_name TEXT NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size BETWEEN 1 AND 6),
  needs_accommodation INTEGER NOT NULL DEFAULT 0 CHECK (needs_accommodation IN (0, 1)),
  check_in_at TEXT,
  check_out_at TEXT,
  phone TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  edit_token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rsvps_updated_at ON rsvps(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsvps_needs_accommodation ON rsvps(needs_accommodation);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  ip TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  first_attempt_at INTEGER NOT NULL,
  blocked_until INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rsvp_submissions (
  ip TEXT PRIMARY KEY,
  submissions INTEGER NOT NULL DEFAULT 0,
  first_submitted_at INTEGER NOT NULL,
  blocked_until INTEGER NOT NULL DEFAULT 0
);
