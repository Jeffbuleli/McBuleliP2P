-- P2P marketplace: ads + escrow-backed orders (custodial crypto).

CREATE TABLE p2p_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  side VARCHAR(8) NOT NULL CHECK (side IN ('sell', 'buy')),
  asset VARCHAR(8) NOT NULL CHECK (asset IN ('USDT', 'PI')),
  fiat_currency VARCHAR(8) NOT NULL,
  price NUMERIC(36, 18) NOT NULL,
  min_fiat NUMERIC(36, 18) NOT NULL,
  max_fiat NUMERIC(36, 18) NOT NULL,
  payment_methods TEXT NOT NULL,
  terms TEXT,
  country_code VARCHAR(8),
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX p2p_ads_market_idx ON p2p_ads(status, asset, fiat_currency);
CREATE INDEX p2p_ads_user_idx ON p2p_ads(user_id);

CREATE TABLE p2p_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES p2p_ads(id),
  maker_id UUID NOT NULL REFERENCES users(id),
  taker_id UUID NOT NULL REFERENCES users(id),
  asset VARCHAR(8) NOT NULL,
  fiat_currency VARCHAR(8) NOT NULL,
  price NUMERIC(36, 18) NOT NULL,
  fiat_amount NUMERIC(36, 18) NOT NULL,
  crypto_amount NUMERIC(36, 18) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'awaiting_payment',
  seller_user_id UUID NOT NULL REFERENCES users(id),
  buyer_user_id UUID NOT NULL REFERENCES users(id),
  payer_user_id UUID NOT NULL REFERENCES users(id),
  payment_snapshot TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  paid_marked_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX p2p_orders_maker_idx ON p2p_orders(maker_id);
CREATE INDEX p2p_orders_taker_idx ON p2p_orders(taker_id);
CREATE INDEX p2p_orders_status_expires_idx ON p2p_orders(status, expires_at);
