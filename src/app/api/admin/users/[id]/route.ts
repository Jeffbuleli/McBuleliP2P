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
import type { StaffScope } from "@/lib/staff-scopes";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";

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

  const { role, staffScopes: bodyScopes } = parsed.data;
  const patch: {
    role: typeof role;
    staffScopes?: StaffScope[] | null;
  } = { role };

  if (role === UserRole.USER || role === UserRole.SUPER_ADMIN) {
    patch.staffScopes = null;
  } else if (role === UserRole.AGENT && bodyScopes !== undefined) {
    patch.staffScopes = bodyScopes;
  }

  const db = getDb();
  const [before] = await db
    .select({
      role: users.role,
      staffScopes: users.staffScopes,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      role: users.role,
      staffScopes: users.staffScopes,
    });

  if (!updated) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  await writePlatformAdminAudit({
    actorUserId: me?.id ?? null,
    action: PlatformAdminAuditAction.USER_ROLE_UPDATE,
    resourceType: "user",
    resourceId: id,
    meta: {
      targetEmail: updated.email,
      before: before
        ? { role: before.role, staffScopes: before.staffScopes }
        : null,
      after: { role: updated.role, staffScopes: updated.staffScopes },
    },
  });

  return NextResponse.json({ user: updated });
}
