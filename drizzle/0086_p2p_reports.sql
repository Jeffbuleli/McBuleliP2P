-- P2P user reports (counterparty abuse / scam).

CREATE TABLE IF NOT EXISTS p2p_user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES p2p_orders(id) ON DELETE SET NULL,
  reason VARCHAR(32) NOT NULL,
  details TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS p2p_user_reports_status_idx ON p2p_user_reports(status, created_at);
CREATE INDEX IF NOT EXISTS p2p_user_reports_reported_idx ON p2p_user_reports(reported_user_id, created_at);
