CREATE TABLE IF NOT EXISTS "group_avec_loans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL REFERENCES "group_savings_groups"("id") ON DELETE CASCADE,
  "borrower_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "initiated_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "principal_usdt" numeric(36, 18) NOT NULL,
  "outstanding_usdt" numeric(36, 18) NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "required_approvals" integer NOT NULL,
  "batch_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "disbursed_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "group_avec_loans_group_status_idx"
  ON "group_avec_loans" ("group_id", "status");

CREATE TABLE IF NOT EXISTS "group_avec_loan_approvals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "loan_id" uuid NOT NULL REFERENCES "group_avec_loans"("id") ON DELETE CASCADE,
  "approver_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "group_avec_loan_approvals_loan_approver_uidx"
  ON "group_avec_loan_approvals" ("loan_id", "approver_user_id");
