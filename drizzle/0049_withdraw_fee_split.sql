ALTER TABLE "withdrawals"
  ADD COLUMN IF NOT EXISTS "provider_fee" numeric(36, 18) NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS "platform_fee" numeric(36, 18) NOT NULL DEFAULT '0';
