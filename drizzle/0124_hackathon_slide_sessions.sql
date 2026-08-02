-- Speaker slide sessions for /hackathon/slides → /hackathon/live projector mode.
CREATE TABLE IF NOT EXISTS hackathon_slide_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL UNIQUE REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  deck_slug varchar(128),
  slide_index integer NOT NULL DEFAULT 0,
  status varchar(16) NOT NULL DEFAULT 'idle',
  speaker_label varchar(160),
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hackathon_slide_sessions_status_idx
  ON hackathon_slide_sessions (status, updated_at);
