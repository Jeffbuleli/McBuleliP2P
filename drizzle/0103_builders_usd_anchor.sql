-- Builders: USD notional anchor (McB amount is a quote, not the economic price)
ALTER TABLE "builders_memberships"
  ADD COLUMN IF NOT EXISTS "paid_usd_notional" numeric(18, 6);
ALTER TABLE "builders_memberships"
  ADD COLUMN IF NOT EXISTS "mcb_usd_rate" numeric(36, 18);
ALTER TABLE "builders_memberships"
  ADD COLUMN IF NOT EXISTS "fee_perks_unlocked" boolean NOT NULL DEFAULT false;
