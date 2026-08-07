-- RDPI Think Tank survey responses (fiscalité numérique RDC).

CREATE TABLE IF NOT EXISTS rdpi_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_slug varchar(64) NOT NULL DEFAULT 'fiscalite-numerique-rdc-2026',
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  full_name varchar(200),
  province varchar(120),
  activity varchar(120),
  locale varchar(8) NOT NULL DEFAULT 'fr',
  user_agent varchar(400),
  ip_hash varchar(64),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rdpi_survey_responses_slug_created_idx
  ON rdpi_survey_responses (survey_slug, created_at);
CREATE INDEX IF NOT EXISTS rdpi_survey_responses_province_idx
  ON rdpi_survey_responses (province);
CREATE INDEX IF NOT EXISTS rdpi_survey_responses_activity_idx
  ON rdpi_survey_responses (activity);
