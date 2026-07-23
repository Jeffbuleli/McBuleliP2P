-- Partner cashback claim Mobile Money payout fields.
ALTER TABLE hackathon_promo_cashback_claims
  ADD COLUMN IF NOT EXISTS phone_number varchar(32),
  ADD COLUMN IF NOT EXISTS provider varchar(64),
  ADD COLUMN IF NOT EXISTS provider_label varchar(120),
  ADD COLUMN IF NOT EXISTS payout_reference varchar(64),
  ADD COLUMN IF NOT EXISTS payout_status varchar(24);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_promo_cashback_claims_payout_ref_uidx
  ON hackathon_promo_cashback_claims (payout_reference)
  WHERE payout_reference IS NOT NULL;
