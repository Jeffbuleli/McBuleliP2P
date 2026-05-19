import { NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { getDb, p2pPaymentMethodDefs, userP2pPaymentMethods, users } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { effectiveP2pCountryCode } from "@/lib/p2p-country-code";
import { isP2pCatalogMethodCode } from "@/lib/p2p-payment-method-catalog";

const postZ = z.object({
  methodCode: z.string().min(2).max(32),
  accountName: z.string().min(2).max(96),
  accountNumberOrPhone: z.string().min(3).max(64),
});

const patchZ = z.object({
  id: z.string().min(8),
  active: z.boolean().optional(),
  accountName: z.string().min(2).max(96).optional(),
  accountNumberOrPhone: z.string().min(3).max(64).optional(),
});

const deleteZ = z.object({ id: z.string().min(8) });

async function userCountry(userId: string): Promise<string> {
  const db = getDb();
  const [u] = await db
    .select({ countryCode: users.countryCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return effectiveP2pCountryCode(u?.countryCode ?? null);
}

async function methodCodeAllowed(cc: string, codeUp: string): Promise<boolean> {
  const db = getDb();
  const [def] = await db
    .select({ code: p2pPaymentMethodDefs.code })
    .from(p2pPaymentMethodDefs)
    .where(
      and(
        eq(p2pPaymentMethodDefs.countryCode, cc),
        eq(p2pPaymentMethodDefs.code, codeUp),
        eq(p2pPaymentMethodDefs.active, true),
      ),
    )
    .limit(1);
  return Boolean(def) || isP2pCatalogMethodCode(cc, codeUp);
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cc = await userCountry(userId);
  const db = getDb();

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

  const cc = await userCountry(userId);
  const codeUp = parsed.data.methodCode.toUpperCase();
  if (!(await methodCodeAllowed(cc, codeUp))) {
    return NextResponse.json({ error: "p2p_payment_methods_required" }, { status: 400 });
  }

  const db = getDb();
  const now = new Date();
  const [row] = await db
    .insert(userP2pPaymentMethods)
    .values({
      userId,
      countryCode: cc,
      methodCode: codeUp,
      accountName: parsed.data.accountName.trim(),
      accountNumberOrPhone: parsed.data.accountNumberOrPhone.trim(),
      extra: null,
      active: true,
      updatedAt: now,
    })
    .returning({ id: userP2pPaymentMethods.id });

  return NextResponse.json({ ok: true, id: row?.id ?? null });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = patchZ.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "p2p_action_not_allowed" }, { status: 400 });

  const { id, active, accountName, accountNumberOrPhone } = parsed.data;
  if (
    active === undefined &&
    accountName === undefined &&
    accountNumberOrPhone === undefined
  ) {
    return NextResponse.json({ error: "p2p_action_not_allowed" }, { status: 400 });
  }

  const db = getDb();
  const now = new Date();
  const patch: {
    active?: boolean;
    accountName?: string;
    accountNumberOrPhone?: string;
    updatedAt: Date;
  } = { updatedAt: now };
  if (active !== undefined) patch.active = active;
  if (accountName !== undefined) patch.accountName = accountName.trim();
  if (accountNumberOrPhone !== undefined) {
    patch.accountNumberOrPhone = accountNumberOrPhone.trim();
  }

  const [upd] = await db
    .update(userP2pPaymentMethods)
    .set(patch)
    .where(and(eq(userP2pPaymentMethods.id, id), eq(userP2pPaymentMethods.userId, userId)))
    .returning({ id: userP2pPaymentMethods.id });

  if (!upd) return NextResponse.json({ error: "p2p_action_not_allowed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = deleteZ.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "p2p_action_not_allowed" }, { status: 400 });

  const db = getDb();
  const [del] = await db
    .delete(userP2pPaymentMethods)
    .where(
      and(
        eq(userP2pPaymentMethods.id, parsed.data.id),
        eq(userP2pPaymentMethods.userId, userId),
      ),
    )
    .returning({ id: userP2pPaymentMethods.id });

  if (!del) return NextResponse.json({ error: "p2p_action_not_allowed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
