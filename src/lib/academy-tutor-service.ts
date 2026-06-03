import type { AssistantLocale } from "@/lib/assistant/messages";
import { ensureAcademyKnowledgeSeeded } from "@/lib/academy-knowledge";
import { assertEnrolledInEdition, resolveEditionIdBySlug } from "@/lib/academy-cohort-messaging";
import { buildAcademyMentorSystemAddon } from "@/lib/academy-mentor-context";
import { buildMentorLearnerContext } from "@/lib/academy-mentor-learner-context";
import {
  getOrCreateConversation,
  sendAssistantMessage,
} from "@/lib/assistant/service";
import type { Locale } from "@/i18n/locale";
import { eq } from "drizzle-orm";
import { academyEditions, getDb } from "@/db";

export function academyPageContext(editionSlug: string): string {
  return `academy:${editionSlug}`.slice(0, 128);
}

export async function sendAcademyTutorMessage(args: {
  userId: string;
  editionSlug: string;
  programSlug?: string;
  message: string;
  conversationId?: string | null;
  locale: AssistantLocale;
}): Promise<
  | {
      ok: true;
      conversationId: string;
      reply: string;
    }
  | { ok: false; code: string }
> {
  const editionId = await resolveEditionIdBySlug({
    editionSlug: args.editionSlug,
    programSlug: args.programSlug,
  });
  if (!editionId) return { ok: false, code: "academy_edition_not_found" };

  const enrolled = await assertEnrolledInEdition({
    userId: args.userId,
    editionId,
  });
  if (!enrolled) return { ok: false, code: "academy_not_enrolled" };

  const db = getDb();
  const [edition] = await db
    .select({
      titleFr: academyEditions.titleFr,
      titleEn: academyEditions.titleEn,
      tutorEnabled: academyEditions.tutorEnabled,
    })
    .from(academyEditions)
    .where(eq(academyEditions.id, editionId))
    .limit(1);

  if (!edition?.tutorEnabled) {
    return { ok: false, code: "academy_tutor_disabled" };
  }

  await ensureAcademyKnowledgeSeeded();

  const editionTitle =
    args.locale === "fr" ? edition.titleFr : edition.titleEn;
  const pageContext = academyPageContext(args.editionSlug);
  const appLocale: Locale = args.locale === "fr" ? "fr" : "en";

  const { journey, mentor, recentVerbs } = await buildMentorLearnerContext({
    userId: args.userId,
    editionSlug: args.editionSlug,
    programSlug: args.programSlug,
    locale: appLocale,
  });

  const conversation = await getOrCreateConversation({
    conversationId: args.conversationId ?? null,
    userId: args.userId,
    locale: args.locale,
    pageContext,
  });

  const addon = buildAcademyMentorSystemAddon({
    locale: args.locale,
    editionTitle,
    journey,
    recentVerbs,
    learner: mentor,
  });

  const result = await sendAssistantMessage({
    conversationId: conversation.id,
    userMessage: args.message,
    pageContext,
    locale: args.locale,
    knowledgeSearch: {
      category: "academy",
      editionSlug: args.editionSlug,
      limit: 6,
    },
    systemPromptSuffix: addon,
  });

  return {
    ok: true,
    conversationId: conversation.id,
    reply: result.assistantMessage.content,
  };
}
