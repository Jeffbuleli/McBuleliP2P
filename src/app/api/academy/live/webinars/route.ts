import { NextResponse } from "next/server";
import { listPublishedWebinars } from "@/lib/academy-webinar-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listPublishedWebinars();
  return NextResponse.json({ webinars: rows });
}
