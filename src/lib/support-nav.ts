/** Staff roles that use the admin support inbox (not the user chat composer). */
export function isSupportStaffRole(role: string): boolean {
  return role === "agent" || role === "super_admin";
}

export function supportInboxHref(args: {
  isStaff: boolean;
  threadId?: string | null;
}): string {
  if (args.isStaff) {
    if (args.threadId?.trim()) {
      return `/admin/support/${encodeURIComponent(args.threadId.trim())}`;
    }
    return "/admin/support";
  }
  return "/app/support";
}
