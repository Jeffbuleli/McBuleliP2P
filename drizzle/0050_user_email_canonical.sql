-- Canonical email for dedup (Gmail dots, domain typos). Backfill uses lower(trim); run npm run db:backfill-email-canonical for Gmail rules.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_canonical varchar(255);

UPDATE users
SET email_canonical = lower(trim(email))
WHERE email_canonical IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_canonical_unique
  ON users (email_canonical)
  WHERE email_canonical IS NOT NULL;
