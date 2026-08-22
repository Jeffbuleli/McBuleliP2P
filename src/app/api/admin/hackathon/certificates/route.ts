import { NextResponse } from "next/server";
import { z } from "zod";
import { issueEditionCertificates } from "@/lib/hackathon/certificates";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";
import {
  StaffAuthError,
  requireStaffScope,
  requireSuperAdmin,
} from "@/lib/session-user";

export const dynamic = "force-dynamic";

function authError(e: unknown) {
  const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
  return NextResponse.json({ error: msg }, { status: 403 });
}

const bodyZ = z.object({
  editionId: z.string().uuid().optional(),
});

/** Issue participation + podium distinction certificates for an edition. */
export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
  } catch {
    try {
      await requireStaffScope("hackathon_stats");
    } catch (e) {
      return authError(e);
    }
  }

  const json = await req.json().catch(() => ({}));
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  let editionId = parsed.data.editionId;
  if (!editionId) {
    const featured = await getFeaturedEditionRow();
    if (!featured) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }
    editionId = featured.id;
  }

  try {
    const result = await issueEditionCertificates(editionId);
    return NextResponse.json({ ok: true, editionId, ...result });
  } catch (e) {
    console.error("[admin/hackathon/certificates]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
