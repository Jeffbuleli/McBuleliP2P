-- e-AVEC Marché Phase 5: MoMo payment fields + awaiting_payment

ALTER TABLE eavec_market_orders
  ADD COLUMN IF NOT EXISTS payment_method varchar(16) NOT NULL DEFAULT 'wallet';

ALTER TABLE eavec_market_orders
  ADD COLUMN IF NOT EXISTS fiat_deposit_ref varchar(64);

ALTER TABLE eavec_market_orders
  ADD COLUMN IF NOT EXISTS momo_phone varchar(32);

ALTER TABLE eavec_market_orders
  ALTER COLUMN escrowed_at DROP NOT NULL;

CREATE INDEX IF NOT EXISTS eavec_market_orders_fiat_ref_idx
  ON eavec_market_orders (fiat_deposit_ref)
  WHERE fiat_deposit_ref IS NOT NULL;
