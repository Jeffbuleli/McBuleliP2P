import { NextResponse } from "next/server";
import { readCitizenToken } from "@/lib/citizen/token";
import { MEDIA_MAX_PER_SESSION } from "@/lib/media/types";
import { saveMedia } from "@/lib/media/store";
import { transcribeAudioIfConfigured } from "@/lib/media/transcribe";
import {
  addSessionMedia,
  getSession,
  setMediaTranscription,
} from "@/lib/sessions/store";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { requireOpsAuth } from "@/lib/ops/auth";

type Ctx = { params: Promise<{ id: string }> };

async function canAccessSession(sessionId: string, req: Request) {
  const session = getSession(sessionId);
  if (!session) return { session: null as null, allowed: false };

  const auth = await requireOpsAuth(req);
  if (!(auth instanceof NextResponse)) {
    return { session, allowed: true };
  }

  const citizen = await readCitizenToken();
  if (citizen && session.citizenToken === citizen) {
    return { session, allowed: true };
  }

  return { session, allowed: false };
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const ip = clientIp(req);
  const rl = rateLimit(`media-upload:${ip}`, 8, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  const access = await canAccessSession(id, req);
  if (!access.session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!access.allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (access.session.media.length >= MEDIA_MAX_PER_SESSION) {
    return NextResponse.json({ error: "media_limit" }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  try {
    const attachment = await saveMedia({ sessionId: id, file });
    let updated = addSessionMedia(id, attachment);
    if (!updated) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (attachment.kind === "audio") {
      const transcription = await transcribeAudioIfConfigured(id, attachment);
      if (transcription) {
        updated =
          setMediaTranscription(id, attachment.id, transcription) ?? updated;
      }
    }

    return NextResponse.json({
      media: updated.media,
      attachment: updated.media.find((m) => m.id === attachment.id),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "upload_failed";
    const status =
      msg === "file_too_large" || msg === "unsupported_media_type" ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const access = await canAccessSession(id, req);
  if (!access.session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!access.allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ media: access.session.media });
}
