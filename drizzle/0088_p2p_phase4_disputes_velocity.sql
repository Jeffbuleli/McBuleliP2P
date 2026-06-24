-- Phase 4: dispute SLA + multi-file evidence.

ALTER TABLE p2p_orders ADD COLUMN IF NOT EXISTS dispute_response_due_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS p2p_dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_url TEXT NOT NULL,
  mime VARCHAR(64) NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS p2p_dispute_evidence_order_idx
  ON p2p_dispute_evidence(order_id, created_at);
