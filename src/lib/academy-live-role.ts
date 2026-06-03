import { UserRole, type UserRoleType } from "@/lib/roles";

export type AcademyLiveRole = "learner" | "host";

/** Staff animate la session live (Jitsi host preset). Co-animateur = backlog. */
export function resolveAcademyLiveRole(
  role: UserRoleType | null | undefined,
): AcademyLiveRole {
  if (role === UserRole.SUPER_ADMIN || role === UserRole.AGENT) {
    return "host";
  }
  return "learner";
}
