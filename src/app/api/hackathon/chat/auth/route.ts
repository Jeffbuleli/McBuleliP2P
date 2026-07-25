import { NextResponse } from "next/server";
import { z } from "zod";
import {
  partnerChatOrgPrefCookieName,
  resolvePartnerChatAccess,
} from "@/lib/hackathon/partner-chat-auth";
import { ensurePartnerOrgsSeeded } from "@/lib/hackathon/partner-chat";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  action: z.literal("select_org"),
  orgId: z.string().uuid(),
});

/** Prefer an org when the logged-in partner email matches several. */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const editionId = await ensurePartnerOrgsSeeded();
    if (!editionId) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }
    const access = await resolvePartnerChatAccess(editionId);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }
    if (access.session.staff) {
      return NextResponse.json({ error: "staff_no_org" }, { status: 400 });
    }
    const allowed = access.matchedOrgs.some((o) => o.id === parsed.data.orgId);
    if (!allowed) {
      return NextResponse.json({ error: "org_forbidden" }, { status: 403 });
    }

    const res = NextResponse.json({ ok: true, orgId: parsed.data.orgId });
    res.cookies.set(partnerChatOrgPrefCookieName(), parsed.data.orgId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    console.error("[hackathon/chat/auth]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
