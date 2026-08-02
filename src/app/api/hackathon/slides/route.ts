import { NextResponse } from "next/server";
import { z } from "zod";
import { ensurePartnerOrgsSeeded } from "@/lib/hackathon/partner-chat";
import { resolvePartnerChatAccess } from "@/lib/hackathon/partner-chat-auth";
import {
  endSlideSession,
  getFeaturedSlideSession,
  goLiveSlideSession,
  setSlideSessionIndex,
} from "@/lib/hackathon/slides/session";
import {
  getHackathonDeck,
  listHackathonDecks,
} from "@/lib/hackathon/slides/registry";

export const dynamic = "force-dynamic";

async function requireSpeakerControl() {
  const editionId = await ensurePartnerOrgsSeeded();
  if (!editionId) {
    return {
      error: NextResponse.json({ error: "no_edition" }, { status: 404 }),
    } as const;
  }
  const access = await resolvePartnerChatAccess(editionId);
  if (!access.ok) {
    return {
      error: NextResponse.json(
        { error: access.error },
        { status: access.error === "login_required" ? 401 : 403 },
      ),
    } as const;
  }
  return {
    editionId,
    session: access.session,
  } as const;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug")?.trim().toLowerCase();
    const session = await getFeaturedSlideSession();
    const decks = listHackathonDecks();

    if (slug) {
      const deck = getHackathonDeck(slug);
      if (!deck) {
        return NextResponse.json({ error: "deck_not_found" }, { status: 404 });
      }
      return NextResponse.json({
        session,
        deck,
        decks,
      });
    }

    return NextResponse.json({ session, decks });
  } catch (e) {
    console.error("[hackathon/slides GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("go_live"),
    deckSlug: z.string().min(1).max(128),
    slideIndex: z.number().int().min(0).optional(),
    speakerLabel: z.string().min(1).max(160).optional(),
  }),
  z.object({
    action: z.literal("set_index"),
    slideIndex: z.number().int().min(0),
  }),
  z.object({
    action: z.literal("end_live"),
  }),
]);

export async function POST(req: Request) {
  try {
    const ctx = await requireSpeakerControl();
    if ("error" in ctx) return ctx.error;

    const body = postSchema.parse(await req.json());
    const speakerLabel =
      body.action === "go_live"
        ? (body.speakerLabel?.trim() || ctx.session.displayName)
        : ctx.session.displayName;

    if (body.action === "go_live") {
      const session = await goLiveSlideSession({
        editionId: ctx.editionId,
        deckSlug: body.deckSlug,
        slideIndex: body.slideIndex,
        speakerLabel,
        userId: ctx.session.userId,
      });
      return NextResponse.json({ ok: true, session });
    }

    if (body.action === "set_index") {
      const session = await setSlideSessionIndex({
        editionId: ctx.editionId,
        slideIndex: body.slideIndex,
        userId: ctx.session.userId,
      });
      return NextResponse.json({ ok: true, session });
    }

    const session = await endSlideSession({
      editionId: ctx.editionId,
      userId: ctx.session.userId,
    });
    return NextResponse.json({ ok: true, session });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "server_error";
    if (
      msg === "deck_not_found" ||
      msg === "not_live" ||
      msg === "slide_session_upsert_failed"
    ) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("[hackathon/slides POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
