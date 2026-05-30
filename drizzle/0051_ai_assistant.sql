CREATE TABLE IF NOT EXISTS "ai_assistant_conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
  "guest_token" varchar(64),
  "locale" varchar(8) DEFAULT 'en' NOT NULL,
  "page_context" varchar(128),
  "detected_intents" jsonb DEFAULT '[]'::jsonb,
  "simplified_mode" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ai_assistant_conversations_user_idx" ON "ai_assistant_conversations" ("user_id");
CREATE INDEX IF NOT EXISTS "ai_assistant_conversations_guest_idx" ON "ai_assistant_conversations" ("guest_token");
CREATE INDEX IF NOT EXISTS "ai_assistant_conversations_updated_idx" ON "ai_assistant_conversations" ("updated_at");

CREATE TABLE IF NOT EXISTS "ai_assistant_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL REFERENCES "ai_assistant_conversations"("id") ON DELETE CASCADE,
  "role" varchar(16) NOT NULL,
  "content" text NOT NULL,
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ai_assistant_messages_conversation_idx" ON "ai_assistant_messages" ("conversation_id", "created_at");

CREATE TABLE IF NOT EXISTS "ai_assistant_knowledge" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(128) NOT NULL,
  "category" varchar(64) NOT NULL,
  "locale" varchar(8) DEFAULT 'all' NOT NULL,
  "title" varchar(256) NOT NULL,
  "content" text NOT NULL,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "embedding" jsonb,
  "priority" integer DEFAULT 0 NOT NULL,
  "published" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_assistant_knowledge_slug_locale_uidx" ON "ai_assistant_knowledge" ("slug", "locale");
CREATE INDEX IF NOT EXISTS "ai_assistant_knowledge_category_idx" ON "ai_assistant_knowledge" ("category");
CREATE INDEX IF NOT EXISTS "ai_assistant_knowledge_published_idx" ON "ai_assistant_knowledge" ("published");
