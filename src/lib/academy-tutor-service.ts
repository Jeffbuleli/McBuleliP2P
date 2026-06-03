import type { AssistantLocale } from "@/lib/assistant/messages";
import { ensureAcademyKnowledgeSeeded } from "@/lib/academy-knowledge";
import { assertEnrolledInEdition, resolveEditionIdBySlug } from "@/lib/academy-cohort-messaging";
import {
  getOrCreateConversation,
  sendAssistantMessage,
} from "@/lib/assistant/service";
import { eq } from "drizzle-orm";
import { academyEditions, getDb } from "@/db";

export function academyPageContext(editionSlug: string): string {
  return `academy:${editionSlug}`.slice(0, 128);
}

function tutorSystemAddon(locale: AssistantLocale, editionTitle: string): string {
  if (locale === "fr") {
    return `Tu es le tuteur IA de la cohorte McBuleli Academy « ${editionTitle} ». Réponds uniquement sur le syllabus (crypto, wallet McBuleli, P2P, trading, IA, Buleli Points). Pas de conseil d'investissement personnalisé. Encourage la présence aux lives et le quiz.`;
  }
  return `You are the AI tutor for McBuleli Academy cohort « ${editionTitle} ». Answer only about the syllabus (crypto, McBuleli wallet, P2P, trading, AI, Buleli Points). No personalized investment advice. Encourage live attendance and the quiz.`;
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

  const conversation = await getOrCreateConversation({
    conversationId: args.conversationId ?? null,
    userId: args.userId,
    locale: args.locale,
    pageContext,
  });

  const addon = tutorSystemAddon(args.locale, editionTitle);

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
