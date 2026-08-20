import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, hackathonPartnerOrgs } from "@/db";
import { ensurePartnerOrgsSeeded } from "@/lib/hackathon/partner-chat";
import { resolvePartnerChatAccess } from "@/lib/hackathon/partner-chat-auth";
import { partnerDayBriefForSlug } from "@/lib/hackathon/partner-day-brief";
import {
  grantPartnerSeat2,
  listOrgPasses,
  passToPublic,
} from "@/lib/hackathon/partner-passes";
import {
  addPartnerTask,
  ensureDefaultPartnerTasks,
  setPartnerTaskStatus,
} from "@/lib/hackathon/partner-tasks";

export const dynamic = "force-dynamic";

async function requireOrgSession() {
  const editionId = await ensurePartnerOrgsSeeded();
  if (!editionId) {
    return {
      error: NextResponse.json({ error: "no_edition" }, { status: 404 }),
    } as const;
  }
  const access = await resolvePartnerChatAccess(editionId);
  if (!access.ok) {
    return {
      error: NextResponse.json(
        { error: access.error },
        { status: access.error === "login_required" ? 401 : 403 },
      ),
    } as const;
  }
  const orgId =
    access.session.orgId ?? access.matchedOrgs[0]?.id ?? null;
  if (!orgId && !access.session.staff) {
    return {
      error: NextResponse.json({ error: "no_org" }, { status: 403 }),
    } as const;
  }
  return {
    editionId,
    session: access.session,
    orgId,
    matchedOrgs: access.matchedOrgs,
  } as const;
}

export async function GET(req: Request) {
  try {
    const ctx = await requireOrgSession();
    if ("error" in ctx) return ctx.error;
    const url = new URL(req.url);
    const requested = url.searchParams.get("orgId")?.trim();
    const resolvedOrgId = ctx.session.staff
      ? requested || ctx.orgId || ctx.matchedOrgs[0]?.id
      : ctx.session.orgId || ctx.orgId;
    if (!resolvedOrgId) {
      return NextResponse.json({ error: "no_org" }, { status: 400 });
    }
    if (!ctx.session.staff && resolvedOrgId !== ctx.session.orgId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const db = getDb();
    const [[org], passes, tasks] = await Promise.all([
      db
        .select({
          slug: hackathonPartnerOrgs.slug,
          shortName: hackathonPartnerOrgs.shortName,
        })
        .from(hackathonPartnerOrgs)
        .where(eq(hackathonPartnerOrgs.id, resolvedOrgId))
        .limit(1),
      listOrgPasses(resolvedOrgId),
      ensureDefaultPartnerTasks(resolvedOrgId),
    ]);

    const visiblePasses = ctx.session.seatHolderOnly
      ? passes.filter(
          (p) =>
            p.status === "active" &&
            (p.holderEmail?.trim().toLowerCase() ?? "") === ctx.session.email,
        )
      : passes;

    const dayBrief = partnerDayBriefForSlug(org?.slug ?? "");

    return NextResponse.json({
      orgId: resolvedOrgId,
      orgSlug: org?.slug ?? null,
      orgShortName: org?.shortName ?? null,
      seatHolderOnly: ctx.session.seatHolderOnly,
      dayBrief,
      passes: visiblePasses.map(passToPublic),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        status: t.status,
        kind: t.kind,
        sortOrder: t.sortOrder,
      })),
    });
  } catch (e) {
    console.error("[hackathon/partner-workspace GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("grant_seat_2"),
    holderEmail: z.string().email().max(255),
    holderName: z.string().trim().min(1).max(160),
    orgId: z.string().uuid().optional(),
  }),
  z.object({
    action: z.literal("add_task"),
    title: z.string().trim().min(2).max(240),
    kind: z.string().trim().max(32).optional(),
    orgId: z.string().uuid().optional(),
  }),
  z.object({
    action: z.literal("set_task_status"),
    taskId: z.string().uuid(),
    status: z.enum(["todo", "doing", "done"]),
    orgId: z.string().uuid().optional(),
  }),
]);

export async function POST(req: Request) {
  try {
    const ctx = await requireOrgSession();
    if ("error" in ctx) return ctx.error;

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const data = parsed.data;
    const orgId = ctx.session.staff
      ? data.orgId ?? ctx.orgId
      : ctx.session.orgId;
    if (!orgId) {
      return NextResponse.json({ error: "no_org" }, { status: 400 });
    }

    if (data.action === "grant_seat_2") {
      if (ctx.session.seatHolderOnly) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      const row = await grantPartnerSeat2({
        orgId,
        granterEmail: ctx.session.email,
        holderEmail: data.holderEmail,
        holderName: data.holderName,
      });
      return NextResponse.json({ ok: true, pass: passToPublic(row) });
    }

    if (data.action === "add_task") {
      const task = await addPartnerTask({
        orgId,
        editionId: ctx.editionId,
        title: data.title,
        kind: data.kind,
        userId: ctx.session.userId,
      });
      return NextResponse.json({ ok: true, task });
    }

    if (data.action === "set_task_status") {
      const task = await setPartnerTaskStatus({
        taskId: data.taskId,
        orgId,
        status: data.status,
      });
      if (!task) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, task });
    }

    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "server_error";
    if (
      msg === "invalid_email" ||
      msg === "no_seat_2" ||
      msg === "seat_taken" ||
      msg === "invalid_title"
    ) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("[hackathon/partner-workspace POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
