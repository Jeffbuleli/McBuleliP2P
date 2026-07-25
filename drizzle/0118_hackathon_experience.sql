-- Hackathon experience: challenges, teams, announcements, submissions, mentors, jury.

ALTER TABLE hackathon_editions
  ADD COLUMN IF NOT EXISTS challenge_lock_at timestamptz,
  ADD COLUMN IF NOT EXISTS submission_deadline_at timestamptz;

ALTER TABLE hackathon_people
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS hackathon_people_user_idx ON hackathon_people (user_id);

CREATE TABLE IF NOT EXISTS hackathon_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  slug varchar(64) NOT NULL,
  label_fr varchar(160) NOT NULL,
  label_en varchar(160) NOT NULL,
  blurb_fr text,
  blurb_en text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_challenges_edition_slug_uidx
  ON hackathon_challenges (edition_id, slug);
CREATE INDEX IF NOT EXISTS hackathon_challenges_edition_idx
  ON hackathon_challenges (edition_id, sort_order);

CREATE TABLE IF NOT EXISTS hackathon_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL,
  slug varchar(140) NOT NULL,
  invite_code varchar(16) NOT NULL UNIQUE,
  challenge_id uuid REFERENCES hackathon_challenges(id) ON DELETE SET NULL,
  status varchar(24) NOT NULL DEFAULT 'forming',
  is_solo boolean NOT NULL DEFAULT false,
  rules_accepted_at timestamptz,
  rules_accepted_by_registration_id uuid,
  created_by_registration_id uuid NOT NULL,
  presented_at timestamptz,
  judged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_teams_edition_slug_uidx
  ON hackathon_teams (edition_id, slug);
CREATE INDEX IF NOT EXISTS hackathon_teams_edition_status_idx
  ON hackathon_teams (edition_id, status);
CREATE INDEX IF NOT EXISTS hackathon_teams_invite_idx
  ON hackathon_teams (invite_code);

CREATE TABLE IF NOT EXISTS hackathon_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hackathon_announcements_edition_idx
  ON hackathon_announcements (edition_id, pinned, published_at);

CREATE TABLE IF NOT EXISTS hackathon_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES hackathon_registrations(id) ON DELETE CASCADE,
  role varchar(24) NOT NULL DEFAULT 'other',
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_team_members_team_reg_uidx
  ON hackathon_team_members (team_id, registration_id);
CREATE UNIQUE INDEX IF NOT EXISTS hackathon_team_members_registration_uidx
  ON hackathon_team_members (registration_id);
CREATE INDEX IF NOT EXISTS hackathon_team_members_team_idx
  ON hackathon_team_members (team_id);

CREATE TABLE IF NOT EXISTS hackathon_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  status varchar(16) NOT NULL DEFAULT 'draft',
  demo_url text,
  github_url text,
  figma_url text,
  pitch_pdf_url text,
  readme_url text,
  notes text,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_submissions_team_uidx
  ON hackathon_submissions (team_id);
CREATE INDEX IF NOT EXISTS hackathon_submissions_edition_status_idx
  ON hackathon_submissions (edition_id, status);

CREATE TABLE IF NOT EXISTS hackathon_mentor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  topic varchar(200) NOT NULL,
  notes text,
  status varchar(16) NOT NULL DEFAULT 'open',
  mentor_person_id uuid REFERENCES hackathon_people(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  closed_at timestamptz,
  created_by_registration_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hackathon_mentor_requests_edition_status_idx
  ON hackathon_mentor_requests (edition_id, status);
CREATE INDEX IF NOT EXISTS hackathon_mentor_requests_team_idx
  ON hackathon_mentor_requests (team_id);

CREATE TABLE IF NOT EXISTS hackathon_jury_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES hackathon_submissions(id) ON DELETE CASCADE,
  juror_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criterion varchar(32) NOT NULL,
  score integer NOT NULL,
  comment text,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_jury_scores_unique_uidx
  ON hackathon_jury_scores (submission_id, juror_user_id, criterion);
CREATE INDEX IF NOT EXISTS hackathon_jury_scores_submission_idx
  ON hackathon_jury_scores (submission_id);

-- Default cutoffs for Kinshasa 2026 featured edition (Africa/Kinshasa = UTC+1).
UPDATE hackathon_editions
SET
  challenge_lock_at = COALESCE(challenge_lock_at, '2026-08-28T14:00:00+01:00'::timestamptz),
  submission_deadline_at = COALESCE(submission_deadline_at, '2026-08-29T12:45:00+01:00'::timestamptz)
WHERE featured = true OR slug LIKE '%2026%';
