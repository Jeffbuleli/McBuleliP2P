CREATE TABLE IF NOT EXISTS "deposit_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "deposit_id" uuid REFERENCES "deposits"("id") ON DELETE SET NULL,
  "asset" varchar(16) NOT NULL DEFAULT 'USDT',
  "network_canonical" varchar(32) NOT NULL,
  "shared_address" text NOT NULL,
  "memo_shown" text,
  "expected_amount" numeric(36,18) NOT NULL,
  "declared_amount" numeric(36,18) NOT NULL,
  "status" varchar(32) NOT NULL DEFAULT 'ACTIVE',
  "expires_at" timestamptz NOT NULL,
  "grace_until" timestamptz NOT NULL,
  "matched_txid" varchar(512),
  "match_meta" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "deposit_sessions_user_idx"
  ON "deposit_sessions" ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "deposit_sessions_status_idx"
  ON "deposit_sessions" ("status","expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "deposit_sessions_matched_txid_uidx"
  ON "deposit_sessions" ("matched_txid") WHERE "matched_txid" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "withdrawal_risk_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "withdrawal_id" uuid NOT NULL REFERENCES "withdrawals"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "score" integer NOT NULL,
  "level" varchar(16) NOT NULL,
  "reasons" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "meta" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "withdrawal_risk_events_withdrawal_idx"
  ON "withdrawal_risk_events" ("withdrawal_id");
CREATE INDEX IF NOT EXISTS "withdrawal_risk_events_user_created_idx"
  ON "withdrawal_risk_events" ("user_id","created_at");

CREATE TABLE IF NOT EXISTS "withdrawal_queue_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "withdrawal_id" uuid NOT NULL REFERENCES "withdrawals"("id") ON DELETE CASCADE,
  "idempotency_key" varchar(96) NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'queued',
  "run_after" timestamptz NOT NULL DEFAULT now(),
  "attempts" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 5,
  "lock_token" varchar(64),
  "locked_at" timestamptz,
  "last_error" text,
  "provider_ref" varchar(128),
  "txid" varchar(512),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "withdrawal_queue_jobs_idempotency_uidx"
  ON "withdrawal_queue_jobs" ("idempotency_key");
CREATE UNIQUE INDEX IF NOT EXISTS "withdrawal_queue_jobs_withdrawal_uidx"
  ON "withdrawal_queue_jobs" ("withdrawal_id");
CREATE INDEX IF NOT EXISTS "withdrawal_queue_jobs_status_run_after_idx"
  ON "withdrawal_queue_jobs" ("status","run_after");

CREATE TABLE IF NOT EXISTS "withdrawal_address_whitelist" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "asset" varchar(16) NOT NULL DEFAULT 'USDT',
  "network_canonical" varchar(32) NOT NULL,
  "address" text NOT NULL,
  "memo_to" text,
  "label" varchar(64),
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "approved_at" timestamptz,
  "cooldown_until" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "withdrawal_address_whitelist_user_addr_uidx"
  ON "withdrawal_address_whitelist" ("user_id","asset","network_canonical","address");
CREATE INDEX IF NOT EXISTS "withdrawal_address_whitelist_status_idx"
  ON "withdrawal_address_whitelist" ("user_id","status");
