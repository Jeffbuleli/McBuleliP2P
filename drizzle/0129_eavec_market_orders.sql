-- e-AVEC Marché orders + wallet escrow (Phase 4)

CREATE TABLE IF NOT EXISTS eavec_market_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES eavec_market_listings(id) ON DELETE RESTRICT,
  buyer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  currency varchar(8) NOT NULL,
  /** Wallet asset actually escrowed: USD | CDF | USDT */
  escrow_asset varchar(8) NOT NULL,
  unit_price numeric(18, 2) NOT NULL,
  total_amount numeric(18, 2) NOT NULL,
  /** escrowed | ready | released | cancelled | disputed | expired */
  status varchar(16) NOT NULL DEFAULT 'escrowed',
  listing_title varchar(120) NOT NULL,
  listing_snapshot jsonb,
  escrowed_at timestamptz NOT NULL DEFAULT now(),
  ready_at timestamptz,
  released_at timestamptz,
  cancelled_at timestamptz,
  disputed_at timestamptz,
  expires_at timestamptz,
  cancel_reason varchar(64),
  dispute_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS eavec_market_orders_buyer_idx
  ON eavec_market_orders (buyer_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS eavec_market_orders_seller_idx
  ON eavec_market_orders (seller_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS eavec_market_orders_listing_idx
  ON eavec_market_orders (listing_id);

CREATE INDEX IF NOT EXISTS eavec_market_orders_status_idx
  ON eavec_market_orders (status);
