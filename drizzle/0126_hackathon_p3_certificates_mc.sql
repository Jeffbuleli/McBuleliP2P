-- P3: MC session persistence + participant certificates

CREATE TABLE IF NOT EXISTS hackathon_mc_sessions (
  id varchar(32) PRIMARY KEY DEFAULT 'default',
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hackathon_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES hackathon_registrations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES hackathon_teams(id) ON DELETE SET NULL,
  kind varchar(24) NOT NULL,
  rank integer,
  holder_name varchar(160) NOT NULL,
  team_name varchar(160),
  title_fr varchar(200) NOT NULL,
  title_en varchar(200) NOT NULL,
  verify_code varchar(32) NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  meta jsonb
);

CREATE INDEX IF NOT EXISTS hackathon_certificates_edition_idx
  ON hackathon_certificates (edition_id, issued_at);

CREATE INDEX IF NOT EXISTS hackathon_certificates_registration_idx
  ON hackathon_certificates (registration_id, kind);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_certificates_reg_kind_uidx
  ON hackathon_certificates (registration_id, kind);
