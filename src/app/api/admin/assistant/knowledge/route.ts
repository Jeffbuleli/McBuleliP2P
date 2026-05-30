import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, aiAssistantKnowledge } from "@/db";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";
import { assistantKnowledgeSchema } from "@/lib/validation";
import {
  assistantAnalyticsSummary,
  listAssistantKnowledge,
} from "@/lib/assistant/service";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const staff = await requireStaffScope("withdrawals");
    if (staff.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const url = new URL(req.url);
  if (url.searchParams.get("analytics") === "1") {
    const analytics = await assistantAnalyticsSummary();
    return NextResponse.json({ analytics });
  }

  const items = await listAssistantKnowledge();
  return NextResponse.json({
    items: items.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  try {
    const staff = await requireStaffScope("withdrawals");
    if (staff.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const parsed = assistantKnowledgeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const db = getDb();
  const [row] = await db
    .insert(aiAssistantKnowledge)
    .values({
      slug: parsed.data.slug,
      category: parsed.data.category,
      locale: parsed.data.locale,
      title: parsed.data.title,
      content: parsed.data.content,
      tags: parsed.data.tags ?? [],
      priority: parsed.data.priority ?? 0,
      published: parsed.data.published ?? true,
    })
    .onConflictDoUpdate({
      target: [aiAssistantKnowledge.slug, aiAssistantKnowledge.locale],
      set: {
        category: parsed.data.category,
        title: parsed.data.title,
        content: parsed.data.content,
        tags: parsed.data.tags ?? [],
        priority: parsed.data.priority ?? 0,
        published: parsed.data.published ?? true,
        updatedAt: new Date(),
      },
    })
    .returning();

  return NextResponse.json({ item: row });
}

export async function DELETE(req: Request) {
  try {
    const staff = await requireStaffScope("withdrawals");
    if (staff.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const db = getDb();
  await db
    .delete(aiAssistantKnowledge)
    .where(eq(aiAssistantKnowledge.id, id));

  return NextResponse.json({ ok: true });
}
