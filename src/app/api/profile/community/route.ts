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
  coverMediaId: z.string().uuid().nullable().optional(),
  location: z.string().max(80).optional(),
  website: z.string().max(200).optional(),
  x: z.string().max(120).optional(),
  facebook: z.string().max(200).optional(),
  tiktok: z.string().max(120).optional(),
  youtube: z.string().max(120).optional(),
  whatsapp: z.string().max(32).optional(),
  telegram: z.string().max(64).optional(),
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
    coverMediaId: parsed.data.coverMediaId,
    location: parsed.data.location,
    website: parsed.data.website,
    x: parsed.data.x,
    facebook: parsed.data.facebook,
    tiktok: parsed.data.tiktok,
    youtube: parsed.data.youtube,
    whatsapp: parsed.data.whatsapp,
    telegram: parsed.data.telegram,
  });

  if (!result.ok) {
    const status =
      result.error === "profile_community_handle_taken"
        ? 409
        : result.error === "profile_invalid_website" ||
            result.error === "profile_invalid_whatsapp"
          ? 400
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, profile: result.profile });
}
