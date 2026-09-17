-- e-AVEC Marché Phase 6: ratings + dispute resolution columns

ALTER TABLE eavec_market_orders
  ADD COLUMN IF NOT EXISTS dispute_resolution varchar(16);

ALTER TABLE eavec_market_orders
  ADD COLUMN IF NOT EXISTS dispute_resolved_at timestamptz;

CREATE TABLE IF NOT EXISTS eavec_market_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES eavec_market_orders(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stars integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT eavec_market_ratings_stars_chk CHECK (stars >= 1 AND stars <= 5)
);

CREATE UNIQUE INDEX IF NOT EXISTS eavec_market_ratings_order_from_uidx
  ON eavec_market_ratings (order_id, from_user_id);

CREATE INDEX IF NOT EXISTS eavec_market_ratings_to_user_idx
  ON eavec_market_ratings (to_user_id);
