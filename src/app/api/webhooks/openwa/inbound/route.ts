import { NextResponse } from "next/server";

/** OpenWA gateway removed from McBuleli — webhook permanently closed. */
export async function POST() {
  return NextResponse.json(
    { error: "openwa_removed" },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "openwa_removed" },
    { status: 410 },
  );
}
