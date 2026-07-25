-- Team formation: soft capacity, unique roles, governance + 3 canonical challenges.

ALTER TABLE hackathon_editions
  ADD COLUMN IF NOT EXISTS soft_max_teams integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS target_team_size integer NOT NULL DEFAULT 3;

ALTER TABLE hackathon_teams
  ADD COLUMN IF NOT EXISTS comms_url text,
  ADD COLUMN IF NOT EXISTS governance_notes text;

-- Normalize legacy roles before unique constraint.
UPDATE hackathon_team_members SET role = 'principal_dev' WHERE role = 'dev';
UPDATE hackathon_team_members SET role = 'specialist' WHERE role IN ('business', 'other');

-- Resolve duplicate roles within a team (keep earliest; reassign later rows to a free role).
DO $$
DECLARE
  r RECORD;
  free_role text;
  roles text[] := ARRAY['lead', 'principal_dev', 'design', 'specialist', 'presenter'];
BEGIN
  FOR r IN
    SELECT m.id, m.team_id
    FROM hackathon_team_members m
    WHERE EXISTS (
      SELECT 1
      FROM hackathon_team_members m2
      WHERE m2.team_id = m.team_id
        AND m2.role = m.role
        AND m2.joined_at < m.joined_at
    )
    ORDER BY m.joined_at ASC, m.id ASC
  LOOP
    SELECT x INTO free_role
    FROM unnest(roles) AS x
    WHERE NOT EXISTS (
      SELECT 1
      FROM hackathon_team_members
      WHERE team_id = r.team_id AND role = x
    )
    LIMIT 1;

    IF free_role IS NOT NULL THEN
      UPDATE hackathon_team_members SET role = free_role WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_team_members_team_role_uidx
  ON hackathon_team_members (team_id, role);

CREATE TABLE IF NOT EXISTS hackathon_team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  author_registration_id uuid NOT NULL REFERENCES hackathon_registrations(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hackathon_team_messages_team_idx
  ON hackathon_team_messages (team_id, created_at DESC);
