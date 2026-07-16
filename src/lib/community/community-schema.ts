import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

let schemaReady: Promise<void> | null = null;

/** Idempotent DDL — profils Community + DM avant migrate manuel sur Render. */
export function ensureCommunitySchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = runEnsureCommunitySchema().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

/** Force re-run after a partial / failed migration (dev & recovery). */
export function resetCommunitySchemaCache(): void {
  schemaReady = null;
}

async function safeSql(
  db: ReturnType<typeof getDb>,
  label: string,
  statement: ReturnType<typeof sql>,
): Promise<void> {
  try {
    await db.execute(statement);
  } catch (e) {
    console.warn(`[community-schema] skipped ${label}:`, e);
  }
}

async function runEnsureCommunitySchema(): Promise<void> {
  const db = getDb();

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_media (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bucket varchar(64) NOT NULL,
      object_key varchar(512) NOT NULL,
      public_url varchar(1024) NOT NULL,
      file_type varchar(16) NOT NULL,
      mime_type varchar(128) NOT NULL,
      size_bytes integer NOT NULL,
      width integer,
      height integer,
      duration_sec integer,
      stream_id varchar(64),
      variants jsonb,
      status varchar(16) NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_posts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body text NOT NULL,
      post_type varchar(16) NOT NULL DEFAULT 'text',
      status varchar(16) NOT NULL DEFAULT 'published',
      media_ids jsonb,
      like_count integer NOT NULL DEFAULT 0,
      comment_count integer NOT NULL DEFAULT 0,
      share_count integer NOT NULL DEFAULT 0,
      published_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS content_kind varchar(16) NOT NULL DEFAULT 'news'
  `);
  await db.execute(sql`
    ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS meta jsonb
  `);
  await db.execute(sql`
    ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS utility_tag varchar(16) NOT NULL DEFAULT 'create'
  `);
  await db.execute(sql`
    ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS quality_score smallint NOT NULL DEFAULT 50
  `);
  await db.execute(sql`
    ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS quality_source varchar(16) NOT NULL DEFAULT 'rules'
  `);
  await db.execute(sql`
    ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS boosted_until timestamptz
  `);
  await db.execute(sql`
    ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS boost_bp_spent integer
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_posts_utility_tag_idx
    ON community_posts (utility_tag, published_at)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_posts_quality_score_idx
    ON community_posts (quality_score, published_at)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_posts_boosted_until_idx
    ON community_posts (boosted_until)
    WHERE boosted_until IS NOT NULL
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_posts_feed_idx
    ON community_posts (status, published_at)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_posts_author_idx
    ON community_posts (author_id, created_at)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_posts_content_kind_idx
    ON community_posts (content_kind, published_at)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_posts_trending_idx
    ON community_posts (status, published_at, like_count, comment_count, view_count)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_stories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      story_type varchar(16) NOT NULL,
      body text,
      media_id uuid REFERENCES community_media(id) ON DELETE SET NULL,
      media_url text,
      bg_color varchar(32),
      status varchar(16) NOT NULL DEFAULT 'active',
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_stories_author_expires_idx
    ON community_stories (author_id, expires_at)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_stories_feed_idx
    ON community_stories (status, expires_at)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_story_views (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      story_id uuid NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE,
      viewer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT community_story_views_unique UNIQUE(story_id, viewer_id)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_story_reactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      story_id uuid NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji varchar(16) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT community_story_reactions_unique UNIQUE(story_id, user_id)
    )
  `);

  await safeSql(
    db,
    "community_user_profiles.cover_media_id",
    sql`
    ALTER TABLE community_user_profiles
    ADD COLUMN IF NOT EXISTS cover_media_id uuid
  `,
  );
  await safeSql(
    db,
    "community_user_profiles.verified_blue",
    sql`
    ALTER TABLE community_user_profiles
    ADD COLUMN IF NOT EXISTS verified_blue boolean NOT NULL DEFAULT false
  `,
  );
  await safeSql(
    db,
    "community_user_profiles.last_active_at",
    sql`
    ALTER TABLE community_user_profiles
    ADD COLUMN IF NOT EXISTS last_active_at timestamptz
  `,
  );

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_dm_threads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      participant_a uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      participant_b uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status varchar(16) NOT NULL DEFAULT 'pending',
      requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
      last_message_at timestamptz NOT NULL DEFAULT now(),
      last_message_preview varchar(160),
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT community_dm_threads_pair_order CHECK (participant_a < participant_b)
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS community_dm_threads_pair_unique
    ON community_dm_threads (participant_a, participant_b)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_dm_threads_last_msg_idx
    ON community_dm_threads (last_message_at)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_dm_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      thread_id uuid NOT NULL REFERENCES community_dm_threads(id) ON DELETE CASCADE,
      sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body text NOT NULL DEFAULT '',
      message_type varchar(16) NOT NULL DEFAULT 'text',
      attachment_url text,
      attachment_meta jsonb,
      hidden boolean NOT NULL DEFAULT false,
      hidden_reason varchar(32),
      delivered_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_dm_messages_thread_created_idx
    ON community_dm_messages (thread_id, created_at)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_dm_reads (
      thread_id uuid NOT NULL REFERENCES community_dm_threads(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_read_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (thread_id, user_id)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_dm_mutes (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      muted_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      until_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, muted_user_id)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_post_views (
      post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      viewer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (post_id, viewer_id)
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_post_views_post_idx
    ON community_post_views (post_id, created_at)
  `);

  await db.execute(sql`
    ALTER TABLE community_media
    ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    ALTER TABLE community_media
    ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    ALTER TABLE community_media
    ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0
  `);
  await safeSql(
    db,
    "community_comments.media_id",
    sql`
    ALTER TABLE community_comments
    ADD COLUMN IF NOT EXISTS media_id uuid REFERENCES community_media(id) ON DELETE CASCADE
  `,
  );
  await safeSql(
    db,
    "community_comments.media_idx",
    sql`
    CREATE INDEX IF NOT EXISTS community_comments_media_idx
    ON community_comments (media_id, created_at)
  `,
  );

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_translation_cache (
      content_hash varchar(64) NOT NULL,
      target_locale varchar(8) NOT NULL,
      source_locale varchar(8),
      translated_text text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (content_hash, target_locale)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_dm_typing (
      thread_id uuid NOT NULL REFERENCES community_dm_threads(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL,
      PRIMARY KEY (thread_id, user_id)
    )
  `);
}
