-- First-deposit launch reward campaign (5 MoMo + 5 USDT slots)

CREATE TABLE IF NOT EXISTS "deposit_launch_rewards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "slot" varchar(8) NOT NULL,
  "source_ref" varchar(128) NOT NULL UNIQUE,
  "reward_usdt" numeric(36, 18) NOT NULL,
  "gross_usd" numeric(36, 18) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "deposit_launch_rewards_user_idx" ON "deposit_launch_rewards" ("user_id");
CREATE INDEX IF NOT EXISTS "deposit_launch_rewards_slot_idx" ON "deposit_launch_rewards" ("slot");
