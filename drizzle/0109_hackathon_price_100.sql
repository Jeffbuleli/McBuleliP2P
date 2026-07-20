-- Unique ticket price: 100 USD for the full 3-day McBuleli Hackathon
UPDATE "hackathon_editions"
SET
  "price_day1_usd" = '100',
  "price_full_usd" = '100',
  "updated_at" = now()
WHERE "featured" = true
   OR "slug" = 'kinshasa-vibe-coding-2026';
