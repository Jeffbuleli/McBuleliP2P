-- P3 — open Pro cohort for enrollment (49 USDT)

UPDATE "academy_editions"
SET "status" = 'open'
WHERE "slug" = 'q3-2026'
  AND "status" = 'draft';
