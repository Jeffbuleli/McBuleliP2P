-- Futures live governance: opt-in default, audit trail, admin disable reason.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trade_live_disabled_reason TEXT,
  ADD COLUMN IF NOT EXISTS trade_live_disabled_at TIMESTAMPTZ;

ALTER TABLE users ALTER COLUMN trade_live_enabled SET DEFAULT false;

-- Grandfather users who already traded live (closed or open non-demo positions).
UPDATE users u
SET trade_live_enabled = true
WHERE trade_live_enabled = false
  AND (
    EXISTS (
      SELECT 1
      FROM trade_futures_positions p
      WHERE p.user_id = u.id AND p.is_demo = false
    )
    OR EXISTS (
      SELECT 1
      FROM trade_simple_options o
      WHERE o.user_id = u.id AND o.is_demo = false
    )
  );

CREATE TABLE IF NOT EXISTS trade_live_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(32) NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  meta JSONB,
  ip VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trade_live_events_user_idx ON trade_live_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trade_live_events_action_idx ON trade_live_events(action, created_at DESC);
