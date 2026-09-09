import { NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { resolveIpGeolocation } from "@/lib/location/ip-geo";

/** Lookup IP → lieu approx (ops investigation / dossiers anciens). */
export async function GET(req: Request) {
  const auth = await requireOpsAuth(req, { permission: "alerts.view" });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const ip = url.searchParams.get("ip")?.trim() || "";
  if (!ip) {
    return NextResponse.json({ error: "missing_ip" }, { status: 400 });
  }

  const geo = await resolveIpGeolocation(ip);
  if (!geo) {
    return NextResponse.json({ geo: null });
  }
  return NextResponse.json({ geo });
}
