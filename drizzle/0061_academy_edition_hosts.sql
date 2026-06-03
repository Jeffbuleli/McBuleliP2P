-- P4 — co-animateurs cohorte (live host Jitsi)

CREATE TABLE IF NOT EXISTS "academy_edition_hosts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "edition_id" uuid NOT NULL REFERENCES "academy_editions"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" varchar(16) NOT NULL DEFAULT 'co_host',
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "academy_edition_hosts_edition_user_unique" UNIQUE ("edition_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "academy_edition_hosts_edition_idx"
  ON "academy_edition_hosts" ("edition_id");
