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

export function p2pDisplayName(u: P2pPublicUser): string {
  const dn = (u.displayName ?? "").trim();
  if (dn) return dn;
  const pi = (u.piUsername ?? "").trim();
  if (pi) return pi;
  return maskTraderEmail(u.email);
}

