import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PiNetworkApiKeyMissingError,
  PiNetworkTestApiKeyMissingError,
  getPiNetworkApiKeyForSandbox,
} from "@/lib/pi-network-env";
import { piFetchRewardedAdStatus } from "@/lib/pi-platform-ads";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodyZ = z.object({
  adId: z.string().min(6),
  sandbox: z.boolean().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  try {
    const apiKey = getPiNetworkApiKeyForSandbox(parsed.data.sandbox === true);
    const status = await piFetchRewardedAdStatus(parsed.data.adId, apiKey);
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    if (
      e instanceof PiNetworkApiKeyMissingError ||
      e instanceof PiNetworkTestApiKeyMissingError
    ) {
      return NextResponse.json({ message: e.message }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : "Pi ad status check failed.";
    return NextResponse.json({ message: msg }, { status: 502 });
  }
}

