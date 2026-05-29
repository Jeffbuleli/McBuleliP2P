-- Step 1: add column (backfill + unique index via npm run db:backfill-email-canonical)

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_canonical varchar(255);
