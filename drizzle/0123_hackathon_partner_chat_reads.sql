-- Sender identity for partner chat + per-user last-read cursor (unread badge).
ALTER TABLE hackathon_partner_chat_messages
  ADD COLUMN IF NOT EXISTS sender_user_id uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS hackathon_partner_chat_messages_sender_user_idx
  ON hackathon_partner_chat_messages (edition_id, sender_user_id);

CREATE TABLE IF NOT EXISTS hackathon_partner_chat_reads (
  edition_id uuid NOT NULL REFERENCES hackathon_editions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (edition_id, user_id)
);

CREATE INDEX IF NOT EXISTS hackathon_partner_chat_reads_user_idx
  ON hackathon_partner_chat_reads (user_id);
