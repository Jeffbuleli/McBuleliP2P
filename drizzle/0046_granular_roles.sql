-- Sprint 5: optional granular roles per membership (treasurer, credit_officer, secretary)
ALTER TABLE group_savings_memberships
  ADD COLUMN IF NOT EXISTS granular_roles jsonb NOT NULL DEFAULT '[]'::jsonb;
