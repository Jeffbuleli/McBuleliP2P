-- P2P schema completion: payment methods, proofs, ad reserve/boost, expiry reminders.

ALTER TABLE p2p_ads ADD COLUMN IF NOT EXISTS payment_method_codes JSONB;
ALTER TABLE p2p_ads ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ;
ALTER TABLE p2p_ads ADD COLUMN IF NOT EXISTS boost_amount_pi NUMERIC(36, 18) NOT NULL DEFAULT 0;
ALTER TABLE p2p_ads ADD COLUMN IF NOT EXISTS reserve_total_crypto NUMERIC(36, 18);
ALTER TABLE p2p_ads ADD COLUMN IF NOT EXISTS reserve_remaining_crypto NUMERIC(36, 18);

CREATE TABLE IF NOT EXISTS p2p_payment_method_defs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(8) NOT NULL,
  code VARCHAR(32) NOT NULL,
  label VARCHAR(64) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS p2p_payment_method_defs_cc_code_uq
  ON p2p_payment_method_defs(country_code, code);
CREATE INDEX IF NOT EXISTS p2p_payment_method_defs_cc_idx
  ON p2p_payment_method_defs(country_code, active, sort_order);

CREATE TABLE IF NOT EXISTS user_p2p_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country_code VARCHAR(8) NOT NULL,
  method_code VARCHAR(32) NOT NULL,
  account_name VARCHAR(96) NOT NULL,
  account_number_or_phone VARCHAR(64) NOT NULL,
  extra JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_p2p_payment_methods_user_idx
  ON user_p2p_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS user_p2p_payment_methods_cc_idx
  ON user_p2p_payment_methods(country_code, method_code, active);

CREATE TABLE IF NOT EXISTS p2p_order_payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_url TEXT NOT NULL,
  mime VARCHAR(64) NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS p2p_order_proofs_order_uq
  ON p2p_order_payment_proofs(order_id);
CREATE INDEX IF NOT EXISTS p2p_order_proofs_order_idx
  ON p2p_order_payment_proofs(order_id);
CREATE INDEX IF NOT EXISTS p2p_order_proofs_created_idx
  ON p2p_order_payment_proofs(created_at);

ALTER TABLE p2p_orders ADD COLUMN IF NOT EXISTS expiry_reminder_sent_at TIMESTAMPTZ;

-- Seed primary corridors (CD, CG, RW) — idempotent via unique index.
INSERT INTO p2p_payment_method_defs (country_code, code, label, sort_order)
SELECT v.country_code, v.code, v.label, v.sort_order
FROM (VALUES
  ('CD', 'AIRTEL_COD', 'Airtel Money', 10),
  ('CD', 'ORANGE_COD', 'Orange Money', 20),
  ('CD', 'VODACOM_MPESA_COD', 'M-Pesa (Vodacom)', 30),
  ('CD', 'BANK_CD', 'Bank transfer', 40),
  ('CG', 'AIRTEL_CG', 'Airtel Money', 10),
  ('CG', 'MTN_MOMO_CG', 'MTN MoMo', 20),
  ('CG', 'BANK_CG', 'Bank transfer', 30),
  ('RW', 'MTN_MOMO_RW', 'MTN MoMo', 10),
  ('RW', 'AIRTEL_RW', 'Airtel Money', 20),
  ('RW', 'BANK_RW', 'Bank transfer', 30)
) AS v(country_code, code, label, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM p2p_payment_method_defs d
  WHERE d.country_code = v.country_code AND d.code = v.code
);
