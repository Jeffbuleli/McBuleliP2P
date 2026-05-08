import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin, StaffAuthError } from "@/lib/session-user";
import {
  getPlatformSetting,
  PlatformSettingKey,
  setPlatformSetting,
} from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  realAddress: z.string().trim().min(10).optional(),
  testAddress: z.string().trim().min(10).optional(),
});

export async function GET() {
  try {
    await requireSuperAdmin();
    const [realAddress, testAddress] = await Promise.all([
      getPlatformSetting(PlatformSettingKey.PI_RECEIVE_ADDRESS_REAL),
      getPlatformSetting(PlatformSettingKey.PI_RECEIVE_ADDRESS_TEST),
    ]);
    return NextResponse.json({ ok: true, realAddress, testAddress });
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ ok: false, error: msg }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
    const json = await req.json().catch(() => null);
    const parsed = bodyZ.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
    }

    const ops: Promise<void>[] = [];
    if (typeof parsed.data.realAddress === "string") {
      ops.push(
        setPlatformSetting(
          PlatformSettingKey.PI_RECEIVE_ADDRESS_REAL,
          parsed.data.realAddress,
        ),
      );
    }
    if (typeof parsed.data.testAddress === "string") {
      ops.push(
        setPlatformSetting(
          PlatformSettingKey.PI_RECEIVE_ADDRESS_TEST,
          parsed.data.testAddress,
        ),
      );
    }
    await Promise.all(ops);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ ok: false, error: msg }, { status: 403 });
  }
}

