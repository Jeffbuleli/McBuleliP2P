import { NextResponse } from "next/server";
import { requireStaffScope, StaffAuthError } from "@/lib/session-user";
import { defaultLandingPromosConfig, landingPromosConfigZ } from "@/lib/landing-promos-config";
import { getLandingPromosConfig, setLandingPromosConfig } from "@/lib/landing-promos";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStaffScope("landing_ads");
    const config = await getLandingPromosConfig();
    return NextResponse.json({ ok: true, config });
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ ok: false, error: msg }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await requireStaffScope("landing_ads");
    const json = await req.json().catch(() => null);
    const parsed = landingPromosConfigZ.safeParse(json?.config ?? json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "landing_promos_invalid" }, { status: 400 });
    }
    await setLandingPromosConfig(parsed.data);
    return NextResponse.json({ ok: true, config: parsed.data });
  } catch (e) {
    if (e instanceof Error && e.message === "landing_promos_invalid") {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ ok: false, error: msg }, { status: 403 });
  }
}

export async function PUT(req: Request) {
  return POST(req);
}

/** Reset to built-in defaults. */
export async function DELETE() {
  try {
    await requireStaffScope("landing_ads");
    const config = defaultLandingPromosConfig();
    await setLandingPromosConfig(config);
    return NextResponse.json({ ok: true, config });
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ ok: false, error: msg }, { status: 403 });
  }
}
