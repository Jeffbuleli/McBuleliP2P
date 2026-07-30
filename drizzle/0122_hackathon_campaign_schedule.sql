-- Schedule outbound hackathon lead campaigns (Kinshasa timezone aware).

ALTER TABLE hackathon_email_campaigns
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

CREATE INDEX IF NOT EXISTS hackathon_email_campaigns_scheduled_idx
  ON hackathon_email_campaigns (scheduled_at)
  WHERE scheduled_at IS NOT NULL;
