import { NextResponse } from "next/server";
import { z } from "zod";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";
import {
  getPitchQueue,
  initPitchQueueFromSubmitted,
  pitchQueueGoto,
  pitchQueueNext,
  pitchQueuePrev,
  resetPitchQueue,
  setPitchQueueActive,
  setPitchQueueEntries,
  toPitchQueuePublic,
} from "@/lib/hackathon/pitch-queue";
import { mcControlAuthorized } from "@/lib/hackathon/mc-auth";
import { markTeamPresented } from "@/lib/hackathon/teams";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const queue = toPitchQueuePublic(getPitchQueue());
    return NextResponse.json({ ok: true, queue });
  } catch (e) {
    console.error("[hackathon/pitch-queue GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("init") }),
  z.object({ action: z.literal("next") }),
  z.object({ action: z.literal("prev") }),
  z.object({ action: z.literal("goto"), index: z.number().int().min(0) }),
  z.object({ action: z.literal("active"), on: z.boolean() }),
  z.object({
    action: z.literal("reorder"),
    teamIds: z.array(z.string().uuid()).min(1),
  }),
  z.object({ action: z.literal("reset") }),
  z.object({
    action: z.literal("present_current"),
  }),
]);

const postSchema = actionSchema;

export async function POST(req: Request) {
  try {
    if (!(await mcControlAuthorized())) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const json = await req.json().catch(() => null);
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const edition = await getFeaturedEditionRow();
    if (!edition) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }

    const a = parsed.data;
    let queue;

    switch (a.action) {
      case "init":
        queue = await initPitchQueueFromSubmitted(edition.id);
        break;
      case "next":
        queue = pitchQueueNext();
        break;
      case "prev":
        queue = pitchQueuePrev();
        break;
      case "goto":
        queue = pitchQueueGoto(a.index);
        break;
      case "active":
        queue = setPitchQueueActive(a.on);
        break;
      case "reorder": {
        const cur = getPitchQueue();
        const byId = new Map(cur.entries.map((e) => [e.teamId, e]));
        const entries = a.teamIds
          .map((id) => byId.get(id))
          .filter(Boolean) as typeof cur.entries;
        queue = setPitchQueueEntries(entries);
        break;
      }
      case "reset":
        queue = resetPitchQueue();
        break;
      case "present_current": {
        const cur = toPitchQueuePublic(getPitchQueue());
        const team = cur.current;
        if (team) {
          await markTeamPresented(team.teamId);
        }
        queue = pitchQueueNext();
        break;
      }
      default:
        return NextResponse.json({ error: "unknown_action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, queue });
  } catch (e) {
    console.error("[hackathon/pitch-queue POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
