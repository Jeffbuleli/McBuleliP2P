import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb, p2pPaymentMethodDefs } from "@/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cc = (url.searchParams.get("country") ?? "CD").trim().toUpperCase();
  const db = getDb();
  const defs = await db
    .select({
      code: p2pPaymentMethodDefs.code,
      label: p2pPaymentMethodDefs.label,
      countryCode: p2pPaymentMethodDefs.countryCode,
    })
    .from(p2pPaymentMethodDefs)
    .where(and(eq(p2pPaymentMethodDefs.countryCode, cc), eq(p2pPaymentMethodDefs.active, true)))
    .orderBy(asc(p2pPaymentMethodDefs.sortOrder), asc(p2pPaymentMethodDefs.label));
  return NextResponse.json({ ok: true, methods: defs });
}

