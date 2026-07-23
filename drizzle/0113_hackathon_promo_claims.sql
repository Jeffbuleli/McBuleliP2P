-- Partner promo cashback claims + dashboard OTP gate.
ALTER TABLE hackathon_promo_codes
  ADD COLUMN IF NOT EXISTS dashboard_otp_hash varchar(128),
  ADD COLUMN IF NOT EXISTS dashboard_otp_expires_at timestamptz;

CREATE TABLE IF NOT EXISTS hackathon_promo_cashback_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES hackathon_promo_codes(id) ON DELETE CASCADE,
  amount_usd numeric(12, 2) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'requested',
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hackathon_promo_cashback_claims_promo_idx
  ON hackathon_promo_cashback_claims (promo_code_id, created_at DESC);
CREATE INDEX IF NOT EXISTS hackathon_promo_cashback_claims_status_idx
  ON hackathon_promo_cashback_claims (status);
