-- eAVEC Financial Passport consents (explicit, time-bound, revocable)

CREATE TABLE IF NOT EXISTS group_passport_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES group_savings_groups(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_label varchar(128) NOT NULL,
  scopes varchar(128) NOT NULL DEFAULT 'summary,score',
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS group_passport_consents_member_idx
  ON group_passport_consents (member_user_id, group_id);

CREATE INDEX IF NOT EXISTS group_passport_consents_expires_idx
  ON group_passport_consents (expires_at);
