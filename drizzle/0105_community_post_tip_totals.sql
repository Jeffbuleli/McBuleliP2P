-- Public tip totals on posts (BP live, McB reserved) + feed interest ranking
ALTER TABLE "community_posts"
  ADD COLUMN IF NOT EXISTS "tip_bp_total" integer NOT NULL DEFAULT 0;
ALTER TABLE "community_posts"
  ADD COLUMN IF NOT EXISTS "tip_mcb_total" numeric(36, 18) NOT NULL DEFAULT 0;

-- Backfill BP tip totals from ledger (tips attributed to a post)
UPDATE "community_posts" AS p
SET "tip_bp_total" = COALESCE(s.total, 0)
FROM (
  SELECT
    post_id,
    SUM(amount)::integer AS total
  FROM (
    SELECT
      (meta->>'postId')::uuid AS post_id,
      (meta->>'amount')::integer AS amount
    FROM "reward_point_ledger"
    WHERE note LIKE 'community_tip_in:%'
      AND meta ? 'postId'
      AND (meta->>'postId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND (meta->>'amount') ~ '^[0-9]+$'
  ) parsed
  GROUP BY post_id
) AS s
WHERE p.id = s.post_id;
