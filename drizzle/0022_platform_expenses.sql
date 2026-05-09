-- Platform operating expenses (OPEX) — separate from user wallet ledger.
CREATE TABLE IF NOT EXISTS "platform_expenses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "amount" numeric(18, 2) NOT NULL,
  "currency" varchar(8) DEFAULT 'USD' NOT NULL,
  "category" varchar(64) NOT NULL,
  "description" text NOT NULL,
  "vendor" text,
  "attachment_url" text,
  "expense_date" varchar(10) NOT NULL,
  "status" varchar(16) DEFAULT 'draft' NOT NULL,
  "created_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "submitted_at" timestamp with time zone,
  "approved_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "approved_at" timestamp with time zone,
  "rejected_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "rejected_at" timestamp with time zone,
  "rejection_reason" text,
  "paid_at" timestamp with time zone,
  "paid_note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "platform_expenses_status_idx" ON "platform_expenses" ("status");
CREATE INDEX IF NOT EXISTS "platform_expenses_creator_idx" ON "platform_expenses" ("created_by_user_id");
CREATE INDEX IF NOT EXISTS "platform_expenses_expense_date_idx" ON "platform_expenses" ("expense_date");
CREATE INDEX IF NOT EXISTS "platform_expenses_created_idx" ON "platform_expenses" ("created_at");

CREATE TABLE IF NOT EXISTS "platform_expense_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "expense_id" uuid NOT NULL REFERENCES "platform_expenses"("id") ON DELETE CASCADE,
  "actor_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action" varchar(32) NOT NULL,
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "platform_expense_events_expense_idx" ON "platform_expense_events" ("expense_id");
CREATE INDEX IF NOT EXISTS "platform_expense_events_created_idx" ON "platform_expense_events" ("created_at");
