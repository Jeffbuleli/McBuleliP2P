-- Hackathon partner promo codes: share link + partner dashboard + cashback tracking.
CREATE TABLE IF NOT EXISTS hackathon_promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  code varchar(32) NOT NULL,
  org_name varchar(200) NOT NULL,
  partner_email varchar(255) NOT NULL,
  partner_name varchar(160),
  discount_percent numeric(5, 2) NOT NULL DEFAULT 10,
  cashback_usd numeric(12, 2) NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  dashboard_token varchar(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_promo_codes_edition_code_uidx
  ON hackathon_promo_codes (edition_id, lower(code));
CREATE INDEX IF NOT EXISTS hackathon_promo_codes_email_idx
  ON hackathon_promo_codes (partner_email);
CREATE INDEX IF NOT EXISTS hackathon_promo_codes_edition_idx
  ON hackathon_promo_codes (edition_id);

ALTER TABLE hackathon_registrations
  ADD COLUMN IF NOT EXISTS promo_code_id uuid REFERENCES hackathon_promo_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promo_code varchar(32),
  ADD COLUMN IF NOT EXISTS cashback_usd numeric(12, 2),
  ADD COLUMN IF NOT EXISTS cashback_awarded_at timestamptz;

CREATE INDEX IF NOT EXISTS hackathon_registrations_promo_idx
  ON hackathon_registrations (promo_code_id);
