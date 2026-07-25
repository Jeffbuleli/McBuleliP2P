import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hackathonMentorRequests } from "@/db";
import { buildHubPayload, getFeaturedEditionRow } from "@/lib/hackathon/hub";
import { SessionError, requireUserId } from "@/lib/session";
import {
  acceptTeamRules,
  createTeam,
  getMemberForRegistration,
  getRegistrationForUser,
  joinTeam,
  leaveTeam,
  markTeamBuilding,
  setTeamChallenge,
  TeamError,
} from "@/lib/hackathon/teams";

export const dynamic = "force-dynamic";

async function requirePaidContext() {
  const userId = await requireUserId();
  const edition = await getFeaturedEditionRow();
  if (!edition) {
    return {
      error: NextResponse.json({ error: "no_edition" }, { status: 404 }),
    } as const;
  }
  const reg = await getRegistrationForUser(userId, edition.id);
  if (!reg) {
    return {
      error: NextResponse.json({ error: "not_registered" }, { status: 404 }),
    } as const;
  }
  return { userId, edition, reg } as const;
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const payload = await buildHubPayload(userId);
    if ("error" in payload && payload.error) {
      return NextResponse.json(payload, { status: 404 });
    }
    return NextResponse.json(payload);
  } catch (e) {
    if (e instanceof SessionError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[hackathon/hub]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    name: z.string().trim().min(2).max(120),
    isSolo: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("join"),
    inviteCode: z.string().trim().min(4).max(16),
    role: z.enum(["dev", "design", "business", "other"]).optional(),
  }),
  z.object({
    action: z.literal("challenge"),
    challengeId: z.string().uuid(),
  }),
  z.object({ action: z.literal("accept_rules") }),
  z.object({ action: z.literal("leave") }),
  z.object({ action: z.literal("mark_building") }),
  z.object({
    action: z.literal("mentor_request"),
    topic: z.string().trim().min(2).max(200),
    notes: z.string().trim().max(2000).optional(),
  }),
]);

export async function POST(req: Request) {
  try {
    const ctx = await requirePaidContext();
    if ("error" in ctx) return ctx.error;
    const { edition, reg } = ctx;

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const data = parsed.data;

    if (data.action === "create") {
      const team = await createTeam({
        editionId: edition.id,
        registrationId: reg.id,
        paymentStatus: reg.paymentStatus,
        name: data.name,
        isSolo: data.isSolo,
      });
      return NextResponse.json({ ok: true, team });
    }

    if (data.action === "join") {
      const team = await joinTeam({
        inviteCode: data.inviteCode,
        registrationId: reg.id,
        editionId: edition.id,
        paymentStatus: reg.paymentStatus,
        role: data.role,
      });
      return NextResponse.json({ ok: true, team });
    }

    const membership = await getMemberForRegistration(reg.id);
    if (!membership) {
      return NextResponse.json({ error: "no_team" }, { status: 400 });
    }
    const isLead = membership.member.role === "lead";

    if (data.action === "challenge") {
      const challenge = await setTeamChallenge({
        teamId: membership.team.id,
        challengeId: data.challengeId,
        registrationId: reg.id,
        isLead,
      });
      return NextResponse.json({ ok: true, challenge });
    }

    if (data.action === "accept_rules") {
      await acceptTeamRules({
        teamId: membership.team.id,
        registrationId: reg.id,
        isLead,
      });
      return NextResponse.json({ ok: true });
    }

    if (data.action === "leave") {
      await leaveTeam({
        teamId: membership.team.id,
        registrationId: reg.id,
        memberRole: membership.member.role,
      });
      return NextResponse.json({ ok: true });
    }

    if (data.action === "mark_building") {
      if (reg.paymentStatus !== "paid") {
        return NextResponse.json({ error: "payment_required" }, { status: 403 });
      }
      await markTeamBuilding(membership.team.id);
      return NextResponse.json({ ok: true });
    }

    if (data.action === "mentor_request") {
      if (reg.paymentStatus !== "paid") {
        return NextResponse.json({ error: "payment_required" }, { status: 403 });
      }
      const db = getDb();
      const [row] = await db
        .insert(hackathonMentorRequests)
        .values({
          teamId: membership.team.id,
          editionId: edition.id,
          topic: data.topic,
          notes: data.notes ?? null,
          createdByRegistrationId: reg.id,
          status: "open",
        })
        .returning();
      return NextResponse.json({ ok: true, request: row });
    }

    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (e) {
    if (e instanceof TeamError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof SessionError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[hackathon/hub POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
