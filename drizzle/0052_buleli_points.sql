ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "buleli_points_balance" integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "reward_point_grants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "grant_type" varchar(48) NOT NULL,
  "points" integer NOT NULL,
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "reward_point_grants_user_grant_unique" UNIQUE ("user_id", "grant_type")
);

CREATE INDEX IF NOT EXISTS "reward_point_grants_user_idx"
  ON "reward_point_grants" ("user_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "reward_point_ledger" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "amount" integer NOT NULL,
  "grant_type" varchar(48),
  "note" varchar(128),
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "reward_point_ledger_user_created_idx"
  ON "reward_point_ledger" ("user_id", "created_at" DESC);
