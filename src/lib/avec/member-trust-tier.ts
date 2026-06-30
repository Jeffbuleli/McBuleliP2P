/** Informational engagement tier — does not affect vote weight (1 member = 1 vote). */
export type MemberTrustTier = "new" | "active" | "trusted";

export function memberTrustTier(args: {
  meetingsPaid?: number;
  sharesTotal?: number;
  kycApproved?: boolean;
}): MemberTrustTier {
  const meetings = args.meetingsPaid ?? 0;
  const shares = args.sharesTotal ?? 0;
  if (meetings >= 3 && shares >= 3 && args.kycApproved) return "trusted";
  if (meetings >= 1 || shares >= 1) return "active";
  return "new";
}
