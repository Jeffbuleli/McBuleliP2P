-- Phase 2: idempotent keys per action + spend perks
ALTER TABLE "reward_point_grants" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(96);

UPDATE "reward_point_grants"
SET "idempotency_key" = "grant_type"
WHERE "idempotency_key" IS NULL;

ALTER TABLE "reward_point_grants" ALTER COLUMN "idempotency_key" SET NOT NULL;

DROP INDEX IF EXISTS "reward_point_grants_user_grant_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "reward_point_grants_user_idempotency_unique"
  ON "reward_point_grants" ("user_id", "idempotency_key");

CREATE TABLE IF NOT EXISTS "reward_point_perks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "perk_type" varchar(48) NOT NULL,
  "discount_percent" integer NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'active',
  "used_order_id" uuid,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "reward_point_perks_user_active_idx"
  ON "reward_point_perks" ("user_id", "status", "expires_at");
