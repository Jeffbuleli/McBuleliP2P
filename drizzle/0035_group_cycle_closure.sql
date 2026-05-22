ALTER TABLE "group_savings_groups"
  ADD COLUMN IF NOT EXISTS "cycle_status" varchar(16) NOT NULL DEFAULT 'active';

ALTER TABLE "group_savings_groups"
  ADD COLUMN IF NOT EXISTS "cycle_number" integer NOT NULL DEFAULT 1;

ALTER TABLE "group_savings_groups"
  ADD COLUMN IF NOT EXISTS "cycle_started_at" timestamptz;

UPDATE "group_savings_groups"
SET "cycle_started_at" = "created_at"
WHERE "cycle_started_at" IS NULL;

ALTER TABLE "group_savings_groups"
  ADD COLUMN IF NOT EXISTS "cycle_closed_at" timestamptz;

CREATE TABLE IF NOT EXISTS "group_cycle_closure_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL REFERENCES "group_savings_groups"("id") ON DELETE CASCADE,
  "initiated_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "cycle_number" integer NOT NULL,
  "distributable_usdt" numeric(36, 18) NOT NULL,
  "snapshot" jsonb NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "required_approvals" integer NOT NULL,
  "batch_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "executed_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "group_cycle_closure_requests_group_status_idx"
  ON "group_cycle_closure_requests" ("group_id", "status");

CREATE TABLE IF NOT EXISTS "group_cycle_closure_approvals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL REFERENCES "group_cycle_closure_requests"("id") ON DELETE CASCADE,
  "approver_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "group_cycle_closure_approvals_request_approver_uidx"
  ON "group_cycle_closure_approvals" ("request_id", "approver_user_id");
