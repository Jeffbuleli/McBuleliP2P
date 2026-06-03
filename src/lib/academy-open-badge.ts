import { eq } from "drizzle-orm";
import { academyCredentials, getDb, users } from "@/db";
import type { Locale } from "@/i18n/locale";

const ISSUER_NAME = "McBuleli Academy";
const ISSUER_URL = "https://mcbuleli.org";

export type OpenBadgeCredential = {
  "@context": string[];
  type: string[];
  id: string;
  name: string;
  description: string;
  image: string;
  credentialSubject: {
    type: string[];
    name: string;
    achievement: {
      type: string[];
      name: string;
      description: string;
      image: string;
    };
  };
  issuer: {
    type: string[];
    id: string;
    name: string;
    url: string;
  };
  issuanceDate: string;
  validFrom: string;
  proof?: { type: string[]; verificationMethod: string };
};

export async function buildOpenBadgeForVerifyCode(
  code: string,
  locale: Locale,
): Promise<OpenBadgeCredential | null> {
  const db = getDb();
  const [row] = await db
    .select({
      cred: academyCredentials,
      email: users.email,
      displayName: users.displayName,
    })
    .from(academyCredentials)
    .innerJoin(users, eq(academyCredentials.userId, users.id))
    .where(eq(academyCredentials.verifyCode, code.trim()))
    .limit(1);

  if (!row || row.cred.revokedAt) return null;

  const title = locale === "fr" ? row.cred.titleFr : row.cred.titleEn;
  const holder =
    row.displayName?.trim() || row.email.split("@")[0] || "Participant";
  const issued = row.cred.issuedAt.toISOString();
  const verifyUrl = `${ISSUER_URL}/verify/${row.cred.verifyCode}`;
  const badgeImage = `${ISSUER_URL}/brand/logo-512.png`;

  return {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    id: verifyUrl,
    name: title,
    description:
      locale === "fr"
        ? "Badge McBuleli Academy — formation crypto, trading, IA et P2P."
        : "McBuleli Academy badge — crypto, trading, AI and P2P training.",
    image: badgeImage,
    credentialSubject: {
      type: ["AchievementSubject"],
      name: holder,
      achievement: {
        type: ["Achievement"],
        name: title,
        description:
          locale === "fr"
            ? "Parcours validé sur la plateforme McBuleli."
            : "Completed track on the McBuleli platform.",
        image: badgeImage,
      },
    },
    issuer: {
      type: ["Profile"],
      id: `${ISSUER_URL}/#issuer`,
      name: ISSUER_NAME,
      url: ISSUER_URL,
    },
    issuanceDate: issued,
    validFrom: issued,
    proof: {
      type: ["Verification"],
      verificationMethod: verifyUrl,
    },
  };
}
