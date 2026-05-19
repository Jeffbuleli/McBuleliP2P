import { NextResponse } from "next/server";

/**
 * Outbound IP of this server (Render web service, not your Mac).
 * Whitelist on Binance → API Management if the key is IP-restricted.
 * Note: Render Shell curl may show a different IP than the web service.
 */
export async function GET() {
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json()) as { ip?: string };
    const ip = typeof json.ip === "string" ? json.ip.trim() : null;
    if (!ip) {
      return NextResponse.json(
        { error: "Could not resolve outbound IP" },
        { status: 502 },
      );
    }
    return NextResponse.json({
      outboundIp: ip,
      hint:
        "Add this IP on binance.com → API Management → your key → trusted IPs. For local npm run verify:binance, also whitelist your Mac public IP.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
