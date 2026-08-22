/** Client-safe certificate types (no Node / DB imports). */

export type CertificateKind = "participation" | "distinction";

export type CertificatePublic = {
  id: string;
  kind: CertificateKind;
  rank: number | null;
  holderName: string;
  teamName: string | null;
  titleFr: string;
  titleEn: string;
  verifyCode: string;
  issuedAt: string;
  verifyUrl: string;
  printUrl: string;
  eventLabelFr: string;
  eventLabelEn: string;
  venue: string;
  revoked: boolean;
};
