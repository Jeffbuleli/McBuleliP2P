CREATE TABLE IF NOT EXISTS "group_payout_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL REFERENCES "group_savings_groups"("id") ON DELETE CASCADE,
  "initiated_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "to_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "amount_usdt" numeric(36, 18) NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "required_approvals" integer NOT NULL,
  "batch_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "executed_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "group_payout_requests_group_status_idx"
  ON "group_payout_requests" ("group_id", "status");

CREATE TABLE IF NOT EXISTS "group_payout_approvals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL REFERENCES "group_payout_requests"("id") ON DELETE CASCADE,
  "approver_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "group_payout_approvals_request_approver_uidx"
  ON "group_payout_approvals" ("request_id", "approver_user_id");
