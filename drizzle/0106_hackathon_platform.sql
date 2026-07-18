-- McBuleli Hackathon / Bootcamp multi-edition platform

CREATE TABLE IF NOT EXISTS "hackathon_editions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(128) NOT NULL UNIQUE,
  "name_fr" varchar(200) NOT NULL,
  "name_en" varchar(200) NOT NULL,
  "tagline_fr" text,
  "tagline_en" text,
  "start_date" timestamp with time zone,
  "end_date" timestamp with time zone,
  "venue" varchar(200),
  "city" varchar(120) NOT NULL DEFAULT 'Kinshasa',
  "country" varchar(80) NOT NULL DEFAULT 'CD',
  "max_seats" integer NOT NULL DEFAULT 100,
  "price_day1_usd" numeric(12, 2) NOT NULL DEFAULT '50',
  "price_full_usd" numeric(12, 2) NOT NULL DEFAULT '80',
  "status" varchar(16) NOT NULL DEFAULT 'soon',
  "featured" boolean NOT NULL DEFAULT false,
  "program" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "prizes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "gallery" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "display_stats" jsonb NOT NULL DEFAULT '{"participants":0,"teams":0,"hackathons":1,"projects":0,"partners":0,"sponsors":0}'::jsonb,
  "cover_image" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hackathon_editions_status_idx"
  ON "hackathon_editions" ("status", "start_date");
CREATE INDEX IF NOT EXISTS "hackathon_editions_featured_idx"
  ON "hackathon_editions" ("featured");

CREATE TABLE IF NOT EXISTS "hackathon_people" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "edition_id" uuid NOT NULL REFERENCES "hackathon_editions"("id") ON DELETE CASCADE,
  "role" varchar(16) NOT NULL,
  "name" varchar(160) NOT NULL,
  "company" varchar(160),
  "title" varchar(160),
  "expertise" varchar(200),
  "photo_url" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  "published" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hackathon_people_edition_role_idx"
  ON "hackathon_people" ("edition_id", "role", "sort_order");

CREATE TABLE IF NOT EXISTS "hackathon_partners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "edition_id" uuid NOT NULL REFERENCES "hackathon_editions"("id") ON DELETE CASCADE,
  "org_name" varchar(200) NOT NULL,
  "contact_name" varchar(160) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(40),
  "website" varchar(255),
  "sector" varchar(120),
  "partnership_types" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "contribution" text,
  "logo_url" text,
  "status" varchar(16) NOT NULL DEFAULT 'lead',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hackathon_partners_edition_status_idx"
  ON "hackathon_partners" ("edition_id", "status");

CREATE TABLE IF NOT EXISTS "hackathon_sponsors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "edition_id" uuid NOT NULL REFERENCES "hackathon_editions"("id") ON DELETE CASCADE,
  "company_name" varchar(200) NOT NULL,
  "contact_name" varchar(160) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(40),
  "website" varchar(255),
  "pack" varchar(24) NOT NULL DEFAULT 'bronze',
  "budget_note" text,
  "comment" text,
  "logo_url" text,
  "status" varchar(16) NOT NULL DEFAULT 'lead',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hackathon_sponsors_edition_status_idx"
  ON "hackathon_sponsors" ("edition_id", "status");

CREATE TABLE IF NOT EXISTS "hackathon_registrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "edition_id" uuid NOT NULL REFERENCES "hackathon_editions"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "first_name" varchar(80) NOT NULL,
  "last_name" varchar(80) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(40) NOT NULL,
  "whatsapp" varchar(40),
  "city" varchar(120),
  "profession" varchar(120),
  "company" varchar(160),
  "level" varchar(24) NOT NULL DEFAULT 'beginner',
  "project_name" varchar(200),
  "project_description" text,
  "project_category" varchar(64),
  "work_mode" varchar(16) NOT NULL DEFAULT 'solo',
  "ticket_pack" varchar(16) NOT NULL DEFAULT 'full',
  "price_usd" numeric(12, 2) NOT NULL,
  "payment_status" varchar(16) NOT NULL DEFAULT 'pending',
  "payment_method" varchar(24),
  "ticket_code" varchar(32) UNIQUE,
  "locale" varchar(8) NOT NULL DEFAULT 'fr',
  "checked_in_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hackathon_registrations_edition_idx"
  ON "hackathon_registrations" ("edition_id", "created_at");
CREATE INDEX IF NOT EXISTS "hackathon_registrations_email_idx"
  ON "hackathon_registrations" ("email");
CREATE INDEX IF NOT EXISTS "hackathon_registrations_payment_idx"
  ON "hackathon_registrations" ("edition_id", "payment_status");
CREATE UNIQUE INDEX IF NOT EXISTS "hackathon_registrations_edition_email_uidx"
  ON "hackathon_registrations" ("edition_id", "email");

CREATE TABLE IF NOT EXISTS "hackathon_payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "registration_id" uuid NOT NULL REFERENCES "hackathon_registrations"("id") ON DELETE CASCADE,
  "reference" varchar(64) NOT NULL UNIQUE,
  "rail" varchar(16) NOT NULL,
  "provider" varchar(64),
  "phone_number" varchar(32),
  "currency" varchar(8) NOT NULL DEFAULT 'USD',
  "amount" varchar(64) NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'INITIATED',
  "provider_tx_id" varchar(128),
  "checkout_url" text,
  "failure_message" text,
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "hackathon_payments_registration_idx"
  ON "hackathon_payments" ("registration_id");
CREATE INDEX IF NOT EXISTS "hackathon_payments_status_idx"
  ON "hackathon_payments" ("status");

-- Seed first Kinshasa edition (featured)
INSERT INTO "hackathon_editions" (
  "slug", "name_fr", "name_en", "tagline_fr", "tagline_en",
  "venue", "city", "max_seats", "price_day1_usd", "price_full_usd",
  "status", "featured", "program", "prizes", "display_stats"
)
SELECT
  'kinshasa-vibe-coding-2026',
  'McBuleli AI Hackathon — Kinshasa',
  'McBuleli AI Hackathon — Kinshasa',
  'Bootcamp Vibe Coding + Hackathon : apprenez, construisez, pitchtez.',
  'Vibe Coding Bootcamp + Hackathon: learn, build, pitch.',
  'À confirmer',
  'Kinshasa',
  100,
  '50',
  '80',
  'open',
  true,
  '[
    {"day":1,"titleFr":"Jour 1 — Bootcamp Vibe Coding","titleEn":"Day 1 — Vibe Coding Bootcamp","itemsFr":["Introduction au Vibe Coding","ChatGPT","Cursor","Lovable","Bolt","Création d''une application","Déploiement"],"itemsEn":["Introduction to Vibe Coding","ChatGPT","Cursor","Lovable","Bolt","Build an application","Deployment"]},
    {"day":2,"titleFr":"Jour 2 — Hackathon","titleEn":"Day 2 — Hackathon","itemsFr":["Les équipes développent leur projet","Présentation devant le jury","Remise des prix"],"itemsEn":["Teams build their project","Jury presentations","Awards ceremony"]}
  ]'::jsonb,
  '[
    {"id":"best_app","labelFr":"Meilleure application","labelEn":"Best application"},
    {"id":"innovation","labelFr":"Innovation","labelEn":"Innovation"},
    {"id":"social_impact","labelFr":"Impact social","labelEn":"Social impact"},
    {"id":"ai","labelFr":"IA","labelEn":"AI"},
    {"id":"fintech","labelFr":"Fintech","labelEn":"Fintech"},
    {"id":"education","labelFr":"Education","labelEn":"Education"},
    {"id":"health","labelFr":"Santé","labelEn":"Health"},
    {"id":"agriculture","labelFr":"Agriculture","labelEn":"Agriculture"}
  ]'::jsonb,
  '{"participants":0,"teams":0,"hackathons":1,"projects":0,"partners":0,"sponsors":0}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM "hackathon_editions" WHERE "slug" = 'kinshasa-vibe-coding-2026'
);

INSERT INTO "hackathon_people" ("edition_id", "role", "name", "company", "title", "expertise", "sort_order")
SELECT e.id, p.role, p.name, p.company, p.title, p.expertise, p.sort_order
FROM "hackathon_editions" e
CROSS JOIN (VALUES
  ('jury', 'Jury McBuleli', 'McBuleli', 'Product & Fintech', 'IA · Produit · Marché', 0),
  ('jury', 'Expert Innovation', 'À annoncer', 'Jury', 'Startups · Impact', 1),
  ('mentor', 'Mentor Vibe Coding', 'McBuleli Academy', 'Mentor', 'Cursor · ChatGPT · Ship', 0),
  ('mentor', 'Mentor Produit', 'À annoncer', 'Mentor', 'Pitch · UX · Go-to-market', 1)
) AS p(role, name, company, title, expertise, sort_order)
WHERE e.slug = 'kinshasa-vibe-coding-2026'
  AND NOT EXISTS (
    SELECT 1 FROM "hackathon_people" hp WHERE hp.edition_id = e.id
  );
