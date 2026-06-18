-- FreshPay tables when rename from PawaPay (0077) did not apply (new env or db:push-only).
CREATE TABLE IF NOT EXISTS "fiat_freshpay_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "kind" varchar(16) NOT NULL,
  "status" varchar(24) DEFAULT 'INITIATED' NOT NULL,
  "reference" varchar(64) NOT NULL,
  "provider_tx_id" varchar(64),
  "currency" varchar(8) NOT NULL,
  "amount" varchar(64) NOT NULL,
  "phone_number" varchar(32),
  "provider" varchar(64),
  "failure_code" varchar(64),
  "failure_message" text,
  "batch_id" uuid,
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  CONSTRAINT "fiat_freshpay_transactions_reference_unique" UNIQUE("reference")
);

CREATE INDEX IF NOT EXISTS "fiat_freshpay_tx_user_idx" ON "fiat_freshpay_transactions" ("user_id");
CREATE INDEX IF NOT EXISTS "fiat_freshpay_tx_status_idx" ON "fiat_freshpay_transactions" ("status");
CREATE INDEX IF NOT EXISTS "fiat_freshpay_tx_kind_idx" ON "fiat_freshpay_transactions" ("kind");

CREATE TABLE IF NOT EXISTS "freshpay_webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "dedup_key" varchar(512) NOT NULL,
  "kind" varchar(16) NOT NULL,
  "provider_reference" varchar(64) NOT NULL,
  "status" varchar(32) NOT NULL,
  "currency" varchar(8) NOT NULL,
  "amount" varchar(64) NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "effect" varchar(32) NOT NULL,
  "raw_body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "freshpay_webhook_events_dedup_key_unique" UNIQUE("dedup_key")
);

CREATE INDEX IF NOT EXISTS "freshpay_webhook_user_idx" ON "freshpay_webhook_events" ("user_id");
CREATE INDEX IF NOT EXISTS "freshpay_webhook_provider_idx" ON "freshpay_webhook_events" ("provider_reference");
