import { NextResponse } from "next/server";
import { getQuizForUser, submitQuizAttempt } from "@/lib/academy-service";
import { getLocale } from "@/lib/get-locale";
import { getSessionUserId } from "@/lib/session";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ quizSlug: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { quizSlug } = await ctx.params;
  const editionSlug = new URL(req.url).searchParams.get("edition")?.trim();
  if (!editionSlug) {
    return NextResponse.json({ error: "edition_required" }, { status: 400 });
  }

  const locale = await getLocale();
  const quiz = await getQuizForUser({
    userId,
    quizSlug,
    editionSlug,
    locale,
  });

  if (!quiz) {
    return NextResponse.json({ error: "academy_quiz_not_found" }, { status: 404 });
  }

  return NextResponse.json(quiz);
}

const submitSchema = z.object({
  editionSlug: z.string().min(1).max(64),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      choiceIndex: z.number().int().min(0).max(8),
    }),
  ),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ quizSlug: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { quizSlug } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const result = await submitQuizAttempt({
    userId,
    quizSlug,
    editionSlug: parsed.data.editionSlug,
    answers: parsed.data.answers,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    scorePercent: result.scorePercent,
    passed: result.passed,
    grantedBp: result.grantedBp,
  });
}
