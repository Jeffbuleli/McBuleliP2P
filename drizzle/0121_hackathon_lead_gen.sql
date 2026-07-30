-- Hackathon lead-gen: prospects, campaigns, recipients, events, suppression + registration UTM.

ALTER TABLE hackathon_registrations
  ADD COLUMN IF NOT EXISTS utm_source varchar(64),
  ADD COLUMN IF NOT EXISTS utm_medium varchar(32),
  ADD COLUMN IF NOT EXISTS utm_campaign varchar(64),
  ADD COLUMN IF NOT EXISTS utm_content varchar(64),
  ADD COLUMN IF NOT EXISTS lead_id uuid;

CREATE INDEX IF NOT EXISTS hackathon_registrations_lead_idx
  ON hackathon_registrations (lead_id);
CREATE INDEX IF NOT EXISTS hackathon_registrations_utm_campaign_idx
  ON hackathon_registrations (edition_id, utm_campaign);

CREATE TABLE IF NOT EXISTS hackathon_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  first_name varchar(80) NOT NULL,
  last_name varchar(80) NOT NULL DEFAULT '',
  email varchar(255) NOT NULL,
  email_canonical varchar(255) NOT NULL,
  phone varchar(40),
  linkedin_url text,
  company varchar(160),
  job_title varchar(160),
  location varchar(160),
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  experience_years integer,
  notes text,
  source varchar(64) NOT NULL DEFAULT 'csv',
  consent_at timestamptz,
  consent_source varchar(64),
  score integer NOT NULL DEFAULT 0,
  score_breakdown jsonb NOT NULL DEFAULT '{"total":0,"criteria":[]}'::jsonb,
  category varchar(24) NOT NULL DEFAULT 'UNQUALIFIED',
  segment varchar(32) NOT NULL DEFAULT 'general',
  qualification_reason text,
  recommended_profile varchar(120),
  priority varchar(16) NOT NULL DEFAULT 'none',
  lifecycle varchar(24) NOT NULL DEFAULT 'LEAD',
  email_valid boolean NOT NULL DEFAULT true,
  suppressed boolean NOT NULL DEFAULT false,
  already_registered boolean NOT NULL DEFAULT false,
  last_contacted_at timestamptz,
  contact_count integer NOT NULL DEFAULT 0,
  matched_registration_id uuid REFERENCES hackathon_registrations(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_leads_edition_email_uidx
  ON hackathon_leads (edition_id, email_canonical);
CREATE INDEX IF NOT EXISTS hackathon_leads_edition_score_idx
  ON hackathon_leads (edition_id, score);
CREATE INDEX IF NOT EXISTS hackathon_leads_edition_category_idx
  ON hackathon_leads (edition_id, category);
CREATE INDEX IF NOT EXISTS hackathon_leads_edition_segment_idx
  ON hackathon_leads (edition_id, segment);
CREATE INDEX IF NOT EXISTS hackathon_leads_edition_lifecycle_idx
  ON hackathon_leads (edition_id, lifecycle);
CREATE INDEX IF NOT EXISTS hackathon_leads_source_idx
  ON hackathon_leads (edition_id, source);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hackathon_registrations_lead_id_fkey'
  ) THEN
    ALTER TABLE hackathon_registrations
      ADD CONSTRAINT hackathon_registrations_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES hackathon_leads(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS hackathon_suppression_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_canonical varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  reason varchar(32) NOT NULL,
  source varchar(64),
  campaign_id uuid,
  lead_id uuid REFERENCES hackathon_leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_suppression_email_uidx
  ON hackathon_suppression_list (email_canonical);
CREATE INDEX IF NOT EXISTS hackathon_suppression_created_idx
  ON hackathon_suppression_list (created_at);

CREATE TABLE IF NOT EXISTS hackathon_email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  segment varchar(32) NOT NULL DEFAULT 'mixed',
  min_category varchar(24) NOT NULL DEFAULT 'B_QUALIFIED',
  subject_template text NOT NULL,
  body_template text NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'DRAFT',
  prospect_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  delivered_count integer NOT NULL DEFAULT 0,
  open_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  unsubscribe_count integer NOT NULL DEFAULT 0,
  conversion_count integer NOT NULL DEFAULT 0,
  dry_run boolean NOT NULL DEFAULT true,
  test_sent_at timestamptz,
  approved_at timestamptz,
  approved_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  send_started_at timestamptz,
  send_completed_at timestamptz,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hackathon_email_campaigns_edition_idx
  ON hackathon_email_campaigns (edition_id, created_at);
CREATE INDEX IF NOT EXISTS hackathon_email_campaigns_status_idx
  ON hackathon_email_campaigns (edition_id, status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hackathon_suppression_campaign_id_fkey'
  ) THEN
    ALTER TABLE hackathon_suppression_list
      ADD CONSTRAINT hackathon_suppression_campaign_id_fkey
      FOREIGN KEY (campaign_id) REFERENCES hackathon_email_campaigns(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS hackathon_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES hackathon_email_campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES hackathon_leads(id) ON DELETE CASCADE,
  personalized_subject text NOT NULL,
  personalized_html text NOT NULL,
  personalized_text text,
  personalization_facts jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(24) NOT NULL DEFAULT 'PENDING',
  skip_reason varchar(40),
  resend_message_id varchar(128),
  sent_at timestamptz,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  open_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  last_clicked_at timestamptz,
  converted_registration_id uuid REFERENCES hackathon_registrations(id) ON DELETE SET NULL,
  click_token varchar(48) NOT NULL UNIQUE,
  unsubscribe_token varchar(48) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_campaign_recipients_campaign_lead_uidx
  ON hackathon_campaign_recipients (campaign_id, lead_id);
CREATE INDEX IF NOT EXISTS hackathon_campaign_recipients_status_idx
  ON hackathon_campaign_recipients (campaign_id, status);
CREATE INDEX IF NOT EXISTS hackathon_campaign_recipients_lead_idx
  ON hackathon_campaign_recipients (lead_id);

CREATE TABLE IF NOT EXISTS hackathon_campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES hackathon_email_campaigns(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES hackathon_campaign_recipients(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES hackathon_leads(id) ON DELETE CASCADE,
  type varchar(32) NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hackathon_campaign_events_campaign_idx
  ON hackathon_campaign_events (campaign_id, created_at);
CREATE INDEX IF NOT EXISTS hackathon_campaign_events_lead_idx
  ON hackathon_campaign_events (lead_id, created_at);
CREATE INDEX IF NOT EXISTS hackathon_campaign_events_type_idx
  ON hackathon_campaign_events (type, created_at);
