import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import {
  StaffAuthError,
  getSessionUser,
  requireSuperAdmin,
} from "@/lib/session-user";
import { adminSetRoleSchema } from "@/lib/validation";
import { UserRole } from "@/lib/roles";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const parsed = adminSetRoleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const me = await getSessionUser();
  if (me?.id === id && parsed.data.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json(
      { message: "You cannot remove your own super admin role here." },
      { status: 400 },
    );
  }

  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ role: parsed.data.role })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      role: users.role,
    });

  if (!updated) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: updated });
}
