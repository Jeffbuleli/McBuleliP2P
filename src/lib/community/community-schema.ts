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

async function runEnsureCommunitySchema(): Promise<void> {
  const db = getDb();

  await db.execute(sql`
    ALTER TABLE community_user_profiles
    ADD COLUMN IF NOT EXISTS cover_media_id uuid
  `);
  await db.execute(sql`
    ALTER TABLE community_user_profiles
    ADD COLUMN IF NOT EXISTS verified_blue boolean NOT NULL DEFAULT false
  `);
  await db.execute(sql`
    ALTER TABLE community_user_profiles
    ADD COLUMN IF NOT EXISTS last_active_at timestamptz
  `);

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
    ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS content_kind varchar(16) NOT NULL DEFAULT 'news'
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_posts_content_kind_idx
    ON community_posts (content_kind, published_at)
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
  await db.execute(sql`
    ALTER TABLE community_comments
    ADD COLUMN IF NOT EXISTS media_id uuid REFERENCES community_media(id) ON DELETE CASCADE
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS community_comments_media_idx
    ON community_comments (media_id, created_at)
  `);

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
