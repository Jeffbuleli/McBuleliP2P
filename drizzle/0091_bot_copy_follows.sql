-- Phase 4: bot copy performance (follower mirrors lead signals on own instance).

CREATE TABLE IF NOT EXISTS bot_copy_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
  plan_id VARCHAR(32) NOT NULL,
  billing VARCHAR(8) NOT NULL,
  sizing_ratio NUMERIC(5, 4) NOT NULL DEFAULT 0.5,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bot_copy_follows_pair_uidx
  ON bot_copy_follows(follower_id, lead_user_id, plan_id, billing);
CREATE INDEX IF NOT EXISTS bot_copy_follows_lead_idx
  ON bot_copy_follows(lead_user_id, status);
CREATE INDEX IF NOT EXISTS bot_copy_follows_follower_idx
  ON bot_copy_follows(follower_id, status);
