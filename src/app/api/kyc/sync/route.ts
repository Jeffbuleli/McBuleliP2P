import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { setUserKycPending } from "@/lib/kyc-service";

const bodyZ = z.object({
  event: z.enum(["started", "finished", "exited"]),
  identityId: z.string().optional(),
  verificationId: z.string().optional(),
});

/** Client callback after MetaMap SDK events — sets pending until webhook confirms. */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "kyc_invalid_body" }, { status: 400 });
  }

  if (parsed.data.event === "started" || parsed.data.event === "finished") {
    await setUserKycPending({
      userId,
      metamapIdentityId: parsed.data.identityId ?? null,
      metamapVerificationId: parsed.data.verificationId ?? null,
    });
  }

  return NextResponse.json({ ok: true });
}
