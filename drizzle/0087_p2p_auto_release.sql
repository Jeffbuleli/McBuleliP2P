-- P2P auto-release after seller verification window (post-paid).

ALTER TABLE p2p_orders ADD COLUMN IF NOT EXISTS auto_release_at TIMESTAMPTZ;
ALTER TABLE p2p_orders ADD COLUMN IF NOT EXISTS release_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS p2p_orders_auto_release_idx
  ON p2p_orders(status, auto_release_at)
  WHERE status = 'paid';

-- Backfill open paid orders (30 min default window).
UPDATE p2p_orders
SET auto_release_at = paid_marked_at + interval '30 minutes'
WHERE status = 'paid'
  AND paid_marked_at IS NOT NULL
  AND auto_release_at IS NULL;
