import type { users } from "@/db/schema";

export type P2pPublicUser = Pick<
  typeof users.$inferSelect,
  "email" | "displayName" | "avatarUrl" | "piUsername"
>;

export function maskTraderEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return "***";
  if (local.length <= 2) return `**@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

/** Public P2P label - never exposes email on marketplace. */
export function p2pDisplayName(u: P2pPublicUser): string {
  const dn = (u.displayName ?? "").trim();
  if (dn) return dn;
  const pi = (u.piUsername ?? "").trim();
  if (pi) return pi.startsWith("@") ? pi : `@${pi}`;
  return "Trader";
}

/** Initial for avatar fallback when no photo. */
export function p2pAvatarLabel(u: P2pPublicUser): string {
  const name = p2pDisplayName(u);
  if (name === "Trader") return u.email.trim().charAt(0).toUpperCase() || "?";
  return name.replace(/^@/, "").charAt(0).toUpperCase() || "?";
}

