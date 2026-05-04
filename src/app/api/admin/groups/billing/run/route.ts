import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff, StaffAuthError } from "@/lib/session-user";
import { processGroupSubscriptionBilling } from "@/lib/group-savings-billing";

const bodyZ = z.object({
  groupId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    await requireStaff();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }
  const r = await processGroupSubscriptionBilling({ groupId: parsed.data.groupId });
  if (!r.ok) return NextResponse.json({ message: r.message }, { status: 400 });
  return NextResponse.json(r);
}

