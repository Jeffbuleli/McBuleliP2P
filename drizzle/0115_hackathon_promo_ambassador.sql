-- Self-serve ambassador promo codes (kind + owner user).
ALTER TABLE hackathon_promo_codes
  ADD COLUMN IF NOT EXISTS kind varchar(16) NOT NULL DEFAULT 'partner',
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS hackathon_promo_codes_owner_idx
  ON hackathon_promo_codes (owner_user_id);

-- One active ambassador code per user per edition.
CREATE UNIQUE INDEX IF NOT EXISTS hackathon_promo_codes_ambassador_owner_uidx
  ON hackathon_promo_codes (edition_id, owner_user_id)
  WHERE kind = 'ambassador' AND active = true AND owner_user_id IS NOT NULL;
