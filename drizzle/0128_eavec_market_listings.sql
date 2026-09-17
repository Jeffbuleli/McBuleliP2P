-- e-AVEC Marché: community marketplace listings (Phase 3 MVP)

CREATE TABLE IF NOT EXISTS eavec_market_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES group_savings_groups(id) ON DELETE SET NULL,
  title varchar(120) NOT NULL,
  description text,
  category varchar(32) NOT NULL,
  currency varchar(8) NOT NULL DEFAULT 'USD',
  price numeric(18, 2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  location_label varchar(128),
  country_code varchar(8),
  image_url text,
  status varchar(16) NOT NULL DEFAULT 'available',
  kind varchar(16) NOT NULL DEFAULT 'product',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS eavec_market_listings_status_cat_idx
  ON eavec_market_listings (status, category);

CREATE INDEX IF NOT EXISTS eavec_market_listings_seller_idx
  ON eavec_market_listings (seller_user_id);

CREATE INDEX IF NOT EXISTS eavec_market_listings_created_idx
  ON eavec_market_listings (created_at);

CREATE INDEX IF NOT EXISTS eavec_market_listings_group_idx
  ON eavec_market_listings (group_id);
