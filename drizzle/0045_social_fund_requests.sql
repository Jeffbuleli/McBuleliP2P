CREATE TABLE IF NOT EXISTS "group_social_fund_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL REFERENCES "group_savings_groups"("id") ON DELETE CASCADE,
  "requester_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "aid_type" varchar(32) NOT NULL,
  "aid_mode" varchar(16) NOT NULL DEFAULT 'grant',
  "amount_usdt" numeric(36, 18) NOT NULL,
  "justification" text NOT NULL,
  "proof_attachment_url" text,
  "status" varchar(24) NOT NULL DEFAULT 'pending_vote',
  "proposal_id" uuid REFERENCES "group_proposals"("id") ON DELETE SET NULL,
  "limits_snapshot" jsonb NOT NULL DEFAULT '{}',
  "paid_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "group_social_fund_requests_group_status_idx"
  ON "group_social_fund_requests" ("group_id", "status");
CREATE INDEX IF NOT EXISTS "group_social_fund_requests_requester_idx"
  ON "group_social_fund_requests" ("requester_user_id", "created_at");
