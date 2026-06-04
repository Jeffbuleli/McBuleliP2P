import { UserRole, type UserRoleType } from "@/lib/roles";
import { isEditionCoHost } from "@/lib/academy-edition-hosts";
import { canUserHostAcademyLive } from "@/lib/academy-live-service";

export type AcademyLiveRole = "learner" | "host";

/** Staff animate la session live (Jitsi host preset). */
export function resolveAcademyLiveRole(
  role: UserRoleType | null | undefined,
): AcademyLiveRole {
  if (role === UserRole.SUPER_ADMIN || role === UserRole.AGENT) {
    return "host";
  }
  return "learner";
}

/** Staff, co-animateur, ou propriétaire Live Studio avec forfait actif. */
export async function resolveAcademyLiveRoleForEdition(args: {
  userId: string;
  editionId: string;
  appRole: UserRoleType | null | undefined;
}): Promise<AcademyLiveRole> {
  if (resolveAcademyLiveRole(args.appRole) === "host") return "host";
  const coHost = await isEditionCoHost({
    userId: args.userId,
    editionId: args.editionId,
  });
  if (coHost) return "host";
  if (
    await canUserHostAcademyLive({
      userId: args.userId,
      editionId: args.editionId,
      appRole: args.appRole,
    })
  ) {
    return "host";
  }
  return "learner";
}
