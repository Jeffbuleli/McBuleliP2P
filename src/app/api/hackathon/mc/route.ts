import { NextResponse } from "next/server";
import { z } from "zod";
import { MC_CUES } from "@/lib/hackathon/mc-day";
import {
  clearMcTimer,
  getMcSession,
  mcControlKeyOk,
  requestMcVoiceReplay,
  resetMcSession,
  setMcCueById,
  setMcCueIndex,
  setMcHumanOverride,
  setMcVoiceEnabled,
  setProjectorMode,
  startMcTimer,
  stepMcCue,
  toMcPublic,
  type ProjectorMode,
} from "@/lib/hackathon/mc-state";

export const dynamic = "force-dynamic";

function keyFrom(req: Request, bodyKey?: string) {
  const url = new URL(req.url);
  return (
    bodyKey ??
    req.headers.get("x-mc-key") ??
    url.searchParams.get("key") ??
    ""
  );
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const includeCues = url.searchParams.get("cues") === "1";
    const publicState = toMcPublic(getMcSession());
    return NextResponse.json({
      ok: true,
      session: publicState,
      cues: includeCues ? MC_CUES : undefined,
      controlConfigured: Boolean((process.env.HACKATHON_MC_KEY ?? "").trim()),
    });
  } catch (e) {
    console.error("[hackathon/mc GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("next") }),
  z.object({ action: z.literal("prev") }),
  z.object({
    action: z.literal("goto"),
    cueId: z.string().min(1).max(120).optional(),
    cueIndex: z.number().int().min(0).optional(),
  }),
  z.object({
    action: z.literal("timer"),
    seconds: z.number().int().min(1).max(3 * 60 * 60).optional(),
  }),
  z.object({ action: z.literal("clear_timer") }),
  z.object({
    action: z.literal("human_override"),
    on: z.boolean(),
    messageFr: z.string().max(280).optional(),
  }),
  z.object({
    action: z.literal("projector"),
    mode: z.enum(["wall", "mc", "slides", "awards"]),
  }),
  z.object({
    action: z.literal("voice"),
    on: z.boolean(),
  }),
  z.object({ action: z.literal("voice_replay") }),
  z.object({ action: z.literal("reset") }),
]);

const postSchema = actionSchema.and(z.object({ key: z.string().optional() }));

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const key = keyFrom(req, parsed.data.key);
    if (!mcControlKeyOk(key)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const a = parsed.data;
    let session;
    switch (a.action) {
      case "next":
        session = stepMcCue(1);
        break;
      case "prev":
        session = stepMcCue(-1);
        break;
      case "goto": {
        if (a.cueId) session = setMcCueById(a.cueId);
        else if (typeof a.cueIndex === "number")
          session = setMcCueIndex(a.cueIndex);
        else
          return NextResponse.json({ error: "missing_target" }, { status: 400 });
        break;
      }
      case "timer": {
        const cur = toMcPublic(getMcSession());
        const seconds =
          a.seconds ?? cur.cue.timerSeconds ?? 10 * 60;
        session = startMcTimer(seconds);
        break;
      }
      case "clear_timer":
        session = clearMcTimer();
        break;
      case "human_override":
        session = setMcHumanOverride(a.on, a.messageFr);
        break;
      case "projector":
        session = setProjectorMode(a.mode as ProjectorMode);
        break;
      case "voice":
        session = setMcVoiceEnabled(a.on);
        break;
      case "voice_replay":
        session = requestMcVoiceReplay();
        break;
      case "reset":
        session = resetMcSession();
        break;
      default:
        return NextResponse.json({ error: "unknown_action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, session });
  } catch (e) {
    console.error("[hackathon/mc POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
