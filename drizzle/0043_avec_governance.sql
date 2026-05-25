ALTER TABLE "group_savings_groups"
  ADD COLUMN IF NOT EXISTS "governance_mode" varchar(16) NOT NULL DEFAULT 'legacy';

CREATE TABLE IF NOT EXISTS "group_proposals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL REFERENCES "group_savings_groups"("id") ON DELETE CASCADE,
  "author_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" varchar(64) NOT NULL,
  "risk_tier" varchar(1) NOT NULL,
  "status" varchar(32) NOT NULL,
  "title" text NOT NULL,
  "justification" text NOT NULL,
  "financial_impact_usdt" numeric(36, 18),
  "beneficiary_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "payload" jsonb NOT NULL DEFAULT '{}',
  "required_quorum_pct" integer NOT NULL,
  "required_majority_pct" integer NOT NULL,
  "vote_opens_at" timestamp with time zone,
  "vote_closes_at" timestamp with time zone,
  "execution_scheduled_at" timestamp with time zone,
  "executed_at" timestamp with time zone,
  "legacy_request_id" uuid REFERENCES "group_payout_requests"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "group_proposals_group_status_idx"
  ON "group_proposals" ("group_id", "status");
CREATE INDEX IF NOT EXISTS "group_proposals_vote_closes_idx"
  ON "group_proposals" ("status", "vote_closes_at");
CREATE INDEX IF NOT EXISTS "group_proposals_execution_scheduled_idx"
  ON "group_proposals" ("status", "execution_scheduled_at");

CREATE TABLE IF NOT EXISTS "group_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "proposal_id" uuid NOT NULL REFERENCES "group_proposals"("id") ON DELETE CASCADE,
  "voter_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "choice" varchar(8) NOT NULL,
  "weight" numeric(8, 4) NOT NULL DEFAULT '1',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "group_votes_proposal_voter_uidx"
  ON "group_votes" ("proposal_id", "voter_user_id");

ALTER TABLE "group_payout_requests"
  ADD COLUMN IF NOT EXISTS "proposal_id" uuid REFERENCES "group_proposals"("id") ON DELETE SET NULL;
