import { NextResponse } from "next/server";
import {
  countPartnerOrgMessages,
  ensurePartnerOrgsSeeded,
  listEditionParticipants,
  listPartnerOrgsRoster,
  partnerOrgStats,
} from "@/lib/hackathon/partner-chat";
import { resolvePartnerChatAccess } from "@/lib/hackathon/partner-chat-auth";
import { loginHrefFor } from "@/lib/auth-return-path";

export const dynamic = "force-dynamic";

/** Vue stats + roster + participants. Auth via McBuleli session. */
export async function GET() {
  try {
    const editionId = await ensurePartnerOrgsSeeded();
    if (!editionId) {
      return NextResponse.json({
        editionId: null,
        stats: { total: 0, confirmed: 0, inProgress: 0, undetermined: 0 },
        messageCount: 0,
        orgs: [],
        participants: [],
        auth: {
          verified: false,
          needLogin: true,
          forbidden: false,
          staff: false,
          displayName: null,
          orgId: null,
          orgShortName: null,
          matchedOrgs: [],
          loginHref: loginHrefFor("/hackathon/chat"),
        },
      });
    }

    const access = await resolvePartnerChatAccess(editionId);
    const verified = access.ok;
    const session = access.ok ? access.session : null;
    const matchedOrgs = access.ok ? access.matchedOrgs : [];
    const orgShort =
      matchedOrgs.find((o) => o.id === session?.orgId)?.shortName ?? null;

    const orgs = await listPartnerOrgsRoster(editionId, verified);
    const stats = partnerOrgStats(orgs);
    const messageCount = await countPartnerOrgMessages(editionId);
    const participants = verified
      ? await listEditionParticipants(editionId)
      : [];

    return NextResponse.json({
      editionId,
      stats,
      messageCount,
      orgs,
      participants,
      auth: {
        verified,
        needLogin: !access.ok && access.error === "login_required",
        forbidden: !access.ok && access.error === "forbidden",
        staff: Boolean(session?.staff),
        displayName: session?.displayName ?? null,
        orgId: session?.orgId ?? null,
        orgShortName: orgShort,
        matchedOrgs,
        loginHref: loginHrefFor("/hackathon/chat"),
      },
    });
  } catch (e) {
    console.error("[hackathon/chat]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
