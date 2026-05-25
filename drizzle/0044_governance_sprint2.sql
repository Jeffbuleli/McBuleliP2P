-- Sprint 2: committee votes (tier B), vote retries, vote audience
ALTER TABLE "group_proposals"
  ADD COLUMN IF NOT EXISTS "vote_audience" varchar(16) NOT NULL DEFAULT 'members',
  ADD COLUMN IF NOT EXISTS "retry_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "parent_proposal_id" uuid REFERENCES "group_proposals"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "group_proposals_parent_idx"
  ON "group_proposals" ("parent_proposal_id");
