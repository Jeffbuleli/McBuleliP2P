-- Replace PawaPay tables with FreshPay naming (data preserved via RENAME).
ALTER TABLE IF EXISTS "fiat_pawapay_transactions" RENAME TO "fiat_freshpay_transactions";
ALTER TABLE IF EXISTS "fiat_freshpay_transactions" RENAME COLUMN "pawapay_id" TO "reference";
ALTER TABLE IF EXISTS "fiat_freshpay_transactions"
  ADD COLUMN IF NOT EXISTS "provider_tx_id" varchar(64);

ALTER INDEX IF EXISTS "fiat_pawapay_tx_user_idx" RENAME TO "fiat_freshpay_tx_user_idx";
ALTER INDEX IF EXISTS "fiat_pawapay_tx_status_idx" RENAME TO "fiat_freshpay_tx_status_idx";
ALTER INDEX IF EXISTS "fiat_pawapay_tx_kind_idx" RENAME TO "fiat_freshpay_tx_kind_idx";

ALTER TABLE IF EXISTS "pawapay_webhook_events" RENAME TO "freshpay_webhook_events";
ALTER TABLE IF EXISTS "freshpay_webhook_events" RENAME COLUMN "pawapay_id" TO "provider_reference";

ALTER INDEX IF EXISTS "pawapay_webhook_user_idx" RENAME TO "freshpay_webhook_user_idx";
ALTER INDEX IF EXISTS "pawapay_webhook_pawapay_idx" RENAME TO "freshpay_webhook_provider_idx";
