-- Partner chat message image attachments (R2 public URL).
ALTER TABLE hackathon_partner_chat_messages
  ADD COLUMN IF NOT EXISTS image_url text;
