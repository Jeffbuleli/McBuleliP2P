-- Custodial fixed-term staking (principal locked until maturity, APR fixed at subscription)
CREATE TABLE IF NOT EXISTS "user_stakes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "asset" varchar(8) NOT NULL,
  "principal" numeric(36, 18) NOT NULL,
  "apr_annual" numeric(12, 6) NOT NULL,
  "term_days" integer NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'active',
  "interest_paid" numeric(36, 18),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "user_stakes_user_idx" ON "user_stakes" ("user_id");
CREATE INDEX IF NOT EXISTS "user_stakes_status_ends_idx" ON "user_stakes" ("status", "ends_at");
