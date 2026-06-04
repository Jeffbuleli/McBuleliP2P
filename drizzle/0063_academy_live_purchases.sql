-- Live Studio — achats USDT + propriétaire d'édition

ALTER TABLE "academy_editions"
  ADD COLUMN IF NOT EXISTS "owner_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "academy_editions"
  ADD COLUMN IF NOT EXISTS "source" varchar(24) NOT NULL DEFAULT 'internal';

CREATE TABLE IF NOT EXISTS "academy_live_purchases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "plan_id" varchar(32) NOT NULL,
  "price_paid" numeric(18, 8) NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'active',
  "sessions_remaining" integer NOT NULL,
  "max_participants" integer NOT NULL,
  "max_minutes_per_session" integer NOT NULL,
  "starts_at" timestamptz DEFAULT now() NOT NULL,
  "expires_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "academy_live_purchases_user_status_idx"
  ON "academy_live_purchases" ("user_id", "status", "expires_at");
