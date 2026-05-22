/** Max solidarity cotisation per meeting (one “full buy-in” worth). */
export function maxSocialFundPerMeeting(
  shareValueUsdt: number,
  maxSharesPerMeeting: number,
): number {
  const share = Number.isFinite(shareValueUsdt) && shareValueUsdt > 0 ? shareValueUsdt : 0;
  const maxShares =
    Number.isFinite(maxSharesPerMeeting) && maxSharesPerMeeting > 0
      ? Math.floor(maxSharesPerMeeting)
      : 5;
  return share * maxShares;
}

export function isSocialFundPerMeetingMisconfigured(
  socialFundUsdt: number,
  shareValueUsdt: number,
  maxSharesPerMeeting: number,
): boolean {
  const social = Math.max(0, socialFundUsdt);
  if (social <= 0) return false;
  return social > maxSocialFundPerMeeting(shareValueUsdt, maxSharesPerMeeting);
}

export function validateSocialFundPerMeeting(
  socialFundUsdt: number,
  shareValueUsdt: number,
  maxSharesPerMeeting: number,
): "group_invalid_social_fund" | "group_social_fund_too_high" | null {
  if (!Number.isFinite(socialFundUsdt) || socialFundUsdt < 0) {
    return "group_invalid_social_fund";
  }
  if (socialFundUsdt > maxSocialFundPerMeeting(shareValueUsdt, maxSharesPerMeeting)) {
    return "group_social_fund_too_high";
  }
  return null;
}
