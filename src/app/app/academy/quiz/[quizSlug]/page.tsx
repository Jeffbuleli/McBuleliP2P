import { AcademyQuizClient } from "@/components/academy/academy-quiz-client";
import { ACADEMY_EDITION_JUNE_2026 } from "@/lib/academy-config";

export const dynamic = "force-dynamic";

export default async function AcademyQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizSlug: string }>;
  searchParams: Promise<{ edition?: string }>;
}) {
  const { quizSlug } = await params;
  const sp = await searchParams;
  const editionSlug = sp.edition?.trim() || ACADEMY_EDITION_JUNE_2026;

  return <AcademyQuizClient quizSlug={quizSlug} editionSlug={editionSlug} />;
}
