ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" varchar(16);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by_user_id" uuid;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_usdt_balance" numeric(36, 18) NOT NULL DEFAULT '0';

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_referred_by_user_id_users_id_fk";
ALTER TABLE "users"
  ADD CONSTRAINT "users_referred_by_user_id_users_id_fk"
  FOREIGN KEY ("referred_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE UNIQUE INDEX IF NOT EXISTS "users_referral_code_unique"
  ON "users" ("referral_code")
  WHERE "referral_code" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "referral_first_rewards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "referee_user_id" uuid NOT NULL,
  "referrer_user_id" uuid NOT NULL,
  "platform_fee_usd" numeric(18, 8) NOT NULL,
  "reward_usdt" numeric(18, 8) NOT NULL,
  "source" varchar(32) NOT NULL,
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "referral_first_rewards_referee_user_id_unique" UNIQUE ("referee_user_id"),
  CONSTRAINT "referral_first_rewards_referee_user_id_users_id_fk"
    FOREIGN KEY ("referee_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "referral_first_rewards_referrer_user_id_users_id_fk"
    FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "referral_first_rewards_referrer_idx"
  ON "referral_first_rewards" ("referrer_user_id");
