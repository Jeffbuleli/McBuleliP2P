import { NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { getDb, p2pPaymentMethodDefs, userP2pPaymentMethods, users } from "@/db";
import { getSessionUserId } from "@/lib/session";

const postZ = z.object({
  methodCode: z.string().min(2).max(32),
  accountName: z.string().min(2).max(96),
  accountNumberOrPhone: z.string().min(3).max(64),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const [u] = await db
    .select({ countryCode: users.countryCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const cc = (u?.countryCode ?? "CD").toUpperCase();

  const rows = await db
    .select({
      id: userP2pPaymentMethods.id,
      methodCode: userP2pPaymentMethods.methodCode,
      accountName: userP2pPaymentMethods.accountName,
      accountNumberOrPhone: userP2pPaymentMethods.accountNumberOrPhone,
      active: userP2pPaymentMethods.active,
      updatedAt: userP2pPaymentMethods.updatedAt,
    })
    .from(userP2pPaymentMethods)
    .where(and(eq(userP2pPaymentMethods.userId, userId), eq(userP2pPaymentMethods.countryCode, cc)))
    .orderBy(asc(userP2pPaymentMethods.methodCode), asc(userP2pPaymentMethods.accountName));

  return NextResponse.json({ ok: true, countryCode: cc, methods: rows });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "p2p_invalid_limits" }, { status: 400 });

  const db = getDb();
  const [u] = await db
    .select({ countryCode: users.countryCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const cc = (u?.countryCode ?? "CD").toUpperCase();

  // Validate method code exists for this country (active).
  const [def] = await db
    .select({ code: p2pPaymentMethodDefs.code })
    .from(p2pPaymentMethodDefs)
    .where(
      and(
        eq(p2pPaymentMethodDefs.countryCode, cc),
        eq(p2pPaymentMethodDefs.code, parsed.data.methodCode.toUpperCase()),
        eq(p2pPaymentMethodDefs.active, true),
      ),
    )
    .limit(1);
  if (!def) return NextResponse.json({ error: "p2p_payment_methods_required" }, { status: 400 });

  const now = new Date();
  const [row] = await db
    .insert(userP2pPaymentMethods)
    .values({
      userId,
      countryCode: cc,
      methodCode: parsed.data.methodCode.toUpperCase(),
      accountName: parsed.data.accountName.trim(),
      accountNumberOrPhone: parsed.data.accountNumberOrPhone.trim(),
      extra: null,
      active: true,
      updatedAt: now,
    })
    .returning({ id: userP2pPaymentMethods.id });

  return NextResponse.json({ ok: true, id: row?.id ?? null });
}

const patchZ = z.object({ id: z.string().min(8), active: z.boolean() });

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = patchZ.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "p2p_action_not_allowed" }, { status: 400 });

  const db = getDb();
  const now = new Date();
  await db
    .update(userP2pPaymentMethods)
    .set({ active: parsed.data.active, updatedAt: now })
    .where(and(eq(userP2pPaymentMethods.id, parsed.data.id), eq(userP2pPaymentMethods.userId, userId)));
  return NextResponse.json({ ok: true });
}

