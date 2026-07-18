-- Hackathon: hold reminder flag + Silikin venue + Cursor/Claude/Codex program
ALTER TABLE "hackathon_registrations"
  ADD COLUMN IF NOT EXISTS "hold_reminder_sent_at" timestamp with time zone;

UPDATE "hackathon_editions"
SET
  "venue" = 'Silikin Village, 63, Ave Colonel Mondjiba',
  "city" = 'Kinshasa',
  "program" = '[
    {
      "day": 1,
      "titleFr": "Jour 1 - Bootcamp Vibe Coding",
      "titleEn": "Day 1 - Vibe Coding Bootcamp",
      "itemsFr": ["Introduction au Vibe Coding", "Cursor", "Claude", "Codex", "Création d''une application", "Déploiement"],
      "itemsEn": ["Introduction to Vibe Coding", "Cursor", "Claude", "Codex", "Build an application", "Deployment"]
    },
    {
      "day": 2,
      "titleFr": "Jour 2 - Hackathon",
      "titleEn": "Day 2 - Hackathon",
      "itemsFr": ["Les équipes développent leur projet", "Présentation devant le jury", "Remise des prix"],
      "itemsEn": ["Teams build their project", "Jury presentations", "Awards ceremony"]
    }
  ]'::jsonb,
  "updated_at" = now()
WHERE "featured" = true
   OR "slug" = 'kinshasa-vibe-coding-2026';
