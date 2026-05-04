-- P2P extensions: payment proof, disputes, platform fees on release, chat, ratings.

ALTER TABLE p2p_orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE p2p_orders ADD COLUMN IF NOT EXISTS payment_proof_note TEXT;
ALTER TABLE p2p_orders ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE p2p_orders ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ;
ALTER TABLE p2p_orders ADD COLUMN IF NOT EXISTS platform_fee_crypto NUMERIC(36, 18);
ALTER TABLE p2p_orders ADD COLUMN IF NOT EXISTS buyer_received_crypto NUMERIC(36, 18);
ALTER TABLE p2p_orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS p2p_orders_disputed_idx ON p2p_orders(status) WHERE status = 'disputed';

CREATE TABLE p2p_order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX p2p_order_messages_order_idx ON p2p_order_messages(order_id);

CREATE TABLE p2p_order_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stars SMALLINT NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id, from_user_id)
);

CREATE INDEX p2p_order_ratings_to_user_idx ON p2p_order_ratings(to_user_id);
