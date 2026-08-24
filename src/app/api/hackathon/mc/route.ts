import { NextResponse } from "next/server";
import { z } from "zod";
import {
  mcControlAuthorized,
  mcOperatorUserId,
  requireMcControl,
  McControlAuthError,
} from "@/lib/hackathon/mc-auth";
import { KILELO_REMOTE_MEET_SLUG } from "@/lib/hackathon/mc-day";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";
import { getSessionUser } from "@/lib/session-user";
import {
  clearMcMeet,
  clearMcTimer,
  ensureMcSessionHydrated,
  getMcSession,
  requestMcVoiceReplay,
  resetMcSession,
  setMcCueById,
  setMcCueIndex,
  setMcHumanOverride,
  setMcMeetSlug,
  setMcVoiceEnabled,
  setProjectorMode,
  startMcTimer,
  stepMcCue,
  toMcPublic,
  type ProjectorMode,
} from "@/lib/hackathon/mc-state";
import {
  getMcSlideRemoteSummary,
  goLiveSlideSession,
  stepSlideSession,
} from "@/lib/hackathon/slides/session";

export const dynamic = "force-dynamic";

const BOOTCAMP_DECK_SLUG = "vibe-coding-masterclass";

async function slideRemoteSummary() {
  return getMcSlideRemoteSummary();
}

export async function GET() {
  try {
    await ensureMcSessionHydrated();
    const publicState = toMcPublic(getMcSession());
    const slides = await slideRemoteSummary();
    return NextResponse.json({
      ok: true,
      session: publicState,
      slides,
      canControl: await mcControlAuthorized(),
    });
  } catch (e) {
    console.error("[hackathon/mc GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("step"),
    delta: z.number().int().min(-1).max(1),
  }),
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
    mode: z.enum(["wall", "mc", "slides", "awards", "meet"]),
  }),
  z.object({
    action: z.literal("meet"),
    slug: z.string().min(1).max(80).nullable(),
  }),
  z.object({
    action: z.literal("smart"),
    id: z.enum([
      "kilelo_visio",
      "kilelo_projector",
      "visio_off",
      "bootcamp_slides",
      "build_wall",
      "podium",
    ]),
  }),
  z.object({ action: z.literal("go_live_slides") }),
  z.object({
    action: z.literal("voice"),
    on: z.boolean(),
  }),
  z.object({ action: z.literal("voice_replay") }),
  z.object({ action: z.literal("reset") }),
]);

function applySmart(
  id:
    | "kilelo_visio"
    | "kilelo_projector"
    | "visio_off"
    | "bootcamp_slides"
    | "build_wall"
    | "podium",
): ReturnType<typeof toMcPublic> {
  switch (id) {
    case "kilelo_visio": {
      let s = setMcCueById("partner-kilelo-call");
      s = setProjectorMode("mc");
      s = setMcMeetSlug(KILELO_REMOTE_MEET_SLUG);
      s = startMcTimer(10 * 60);
      return s;
    }
    case "kilelo_projector": {
      let s = setMcMeetSlug(KILELO_REMOTE_MEET_SLUG);
      s = setProjectorMode("meet");
      return s;
    }
    case "visio_off":
      return clearMcMeet();
    case "bootcamp_slides": {
      let s = setMcCueById("call-jeff");
      s = setProjectorMode("slides");
      return s;
    }
    case "build_wall": {
      let s = setMcCueById("build-mentors");
      s = setProjectorMode("wall");
      return s;
    }
    case "podium": {
      let s = setMcCueById("awards");
      s = setProjectorMode("awards");
      return s;
    }
    default:
      return toMcPublic(getMcSession());
  }
}

async function applyStep(delta: number) {
  const mc = getMcSession();
  if (mc.projectorMode === "slides") {
    const edition = await getFeaturedEditionRow();
    const userId = await mcOperatorUserId();
    const slides = await slideRemoteSummary();
    if (
      edition &&
      userId &&
      slides?.status === "live" &&
      slides.totalSlides > 0
    ) {
      await stepSlideSession({
        editionId: edition.id,
        delta,
        userId,
      });
      return toMcPublic(getMcSession());
    }
  }
  return stepMcCue(delta);
}

export async function POST(req: Request) {
  try {
    await ensureMcSessionHydrated();
    await requireMcControl();

    const json = await req.json().catch(() => null);
    const parsed = actionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const a = parsed.data;
    let session;
    switch (a.action) {
      case "step":
        session = await applyStep(a.delta);
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
        const seconds = a.seconds ?? cur.cue.timerSeconds ?? 10 * 60;
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
      case "meet":
        session = setMcMeetSlug(a.slug);
        break;
      case "smart":
        session = applySmart(a.id);
        break;
      case "go_live_slides": {
        const edition = await getFeaturedEditionRow();
        const userId = await mcOperatorUserId();
        const user = await getSessionUser();
        if (!edition || !userId) {
          return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }
        await goLiveSlideSession({
          editionId: edition.id,
          deckSlug: BOOTCAMP_DECK_SLUG,
          slideIndex: 0,
          speakerLabel: user?.email?.split("@")[0] ?? "Jeff Buleli",
          userId,
        });
        session = toMcPublic(getMcSession());
        break;
      }
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

    const slides = await slideRemoteSummary();
    return NextResponse.json({ ok: true, session, slides });
  } catch (e) {
    if (e instanceof McControlAuthError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[hackathon/mc POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
