import { NextResponse } from "next/server";
import { z } from "zod";
import { communityEnabled } from "@/lib/community/config";
import { createQuestion, listQuestions } from "@/lib/community/qa-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const createZ = z.object({
  title: z.string().min(10).max(200),
  body: z.string().min(20).max(4000),
  tags: z.array(z.string().max(24)).max(5).optional(),
});

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ questions: [] });
  }

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "30");
  const status = url.searchParams.get("status") as "open" | "all" | null;

  const questions = await listQuestions({
    limit,
    status: status ?? "open",
  });
  return NextResponse.json({ questions });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await createQuestion({
    authorId: userId,
    ...parsed.data,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    question: result.question,
    bpGranted: result.bpGranted,
  });
}
