import { UserRole, type UserRoleType } from "@/lib/roles";
import { isEditionCoHost } from "@/lib/academy-edition-hosts";

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

/** Staff ou co-animateur désigné pour cette édition (P4). */
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
  return coHost ? "host" : "learner";
}
