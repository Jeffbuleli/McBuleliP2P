-- Partner workspace: owner-gated door badges (2 seats/org) + preparation to-dos.

CREATE TABLE IF NOT EXISTS hackathon_partner_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES hackathon_partner_orgs(id) ON DELETE CASCADE,
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  seat_index smallint NOT NULL CHECK (seat_index IN (1, 2)),
  /** reserved = seat 2 empty | active = assigned | revoked */
  status varchar(16) NOT NULL DEFAULT 'reserved',
  holder_email varchar(255),
  holder_name varchar(160),
  role_label varchar(200) NOT NULL DEFAULT 'Partenaire',
  /** partner | speaker | mentor | jury | sponsor */
  badge_kind varchar(24) NOT NULL DEFAULT 'partner',
  ticket_code varchar(32) UNIQUE,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  granted_by_email varchar(255),
  presence_status varchar(16) NOT NULL DEFAULT 'absent',
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_partner_passes_org_seat_uidx
  ON hackathon_partner_passes (org_id, seat_index);
CREATE INDEX IF NOT EXISTS hackathon_partner_passes_edition_idx
  ON hackathon_partner_passes (edition_id, status);
CREATE INDEX IF NOT EXISTS hackathon_partner_passes_holder_email_idx
  ON hackathon_partner_passes (lower(holder_email));

CREATE TABLE IF NOT EXISTS hackathon_partner_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES hackathon_partner_orgs(id) ON DELETE CASCADE,
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  title varchar(240) NOT NULL,
  notes text,
  /** todo | doing | done */
  status varchar(16) NOT NULL DEFAULT 'todo',
  /** atelier | mentorat | jury | logo | logistique | other */
  kind varchar(32) NOT NULL DEFAULT 'other',
  sort_order integer NOT NULL DEFAULT 0,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hackathon_partner_tasks_org_idx
  ON hackathon_partner_tasks (org_id, status, sort_order);
