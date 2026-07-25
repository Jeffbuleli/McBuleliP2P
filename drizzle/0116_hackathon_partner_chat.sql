-- Partner exchange portal: org roster + shared chat room per edition.

CREATE TABLE IF NOT EXISTS hackathon_partner_orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  slug varchar(64) NOT NULL,
  org_name varchar(200) NOT NULL,
  short_name varchar(48) NOT NULL,
  logo_url text,
  contact_email varchar(255) NOT NULL,
  website varchar(255),
  status varchar(16) NOT NULL DEFAULT 'undetermined',
  sort_order integer NOT NULL DEFAULT 0,
  otp_hash text,
  otp_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_partner_orgs_edition_slug_uidx
  ON hackathon_partner_orgs (edition_id, slug);

CREATE INDEX IF NOT EXISTS hackathon_partner_orgs_edition_status_idx
  ON hackathon_partner_orgs (edition_id, status);

CREATE TABLE IF NOT EXISTS hackathon_partner_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  org_id uuid REFERENCES hackathon_partner_orgs(id) ON DELETE SET NULL,
  sender_label varchar(80) NOT NULL,
  body text NOT NULL,
  message_type varchar(16) NOT NULL DEFAULT 'chat',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hackathon_partner_chat_messages_edition_created_idx
  ON hackathon_partner_chat_messages (edition_id, created_at);
