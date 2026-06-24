import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOwnCommunityProfile,
  updateOwnCommunityProfile,
} from "@/lib/community/profile-service";
import { isValidCommunityHandle } from "@/lib/community/username";
import { getSessionUserId } from "@/lib/session";

const patchZ = z.object({
  handle: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .refine((v) => isValidCommunityHandle(v.toLowerCase()), {
      message: "invalid_handle",
    })
    .optional(),
  bio: z.string().max(280).optional(),
  showKycBadge: z.boolean().optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getOwnCommunityProfile(userId);
  if (!profile) return NextResponse.json({ error: "profile_invalid_input" }, { status: 404 });
  return NextResponse.json({ ok: true, profile });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = patchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "profile_invalid_input" }, { status: 400 });
  }

  const result = await updateOwnCommunityProfile(userId, {
    handle: parsed.data.handle?.toLowerCase(),
    bio: parsed.data.bio,
    showKycBadge: parsed.data.showKycBadge,
  });

  if (!result.ok) {
    const status = result.error === "profile_community_handle_taken" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, profile: result.profile });
}
