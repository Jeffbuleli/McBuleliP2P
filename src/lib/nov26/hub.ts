import {
  getHackathonEditionBySlug,
  NOV26_EDITION_SLUG,
} from "@/lib/hackathon/editions";
import { payLaterPublicUrl } from "@/lib/hackathon/service";
import { getRegistrationForUser } from "@/lib/hackathon/teams";

export type Nov26HubState = {
  editionId: string;
  firstName: string;
  lastName: string;
  email: string;
  paymentStatus: string;
  priceUsd: string;
  ticketCode: string | null;
  payUrl: string | null;
};

export async function loadNov26HubForUser(
  userId: string,
): Promise<Nov26HubState | null> {
  const edition = await getHackathonEditionBySlug(NOV26_EDITION_SLUG);
  if (!edition) return null;

  const reg = await getRegistrationForUser(userId, edition.id);
  if (!reg) return null;

  const payUrl =
    reg.paymentStatus === "reserved" && reg.paymentToken
      ? payLaterPublicUrl(reg.paymentToken)
      : null;

  return {
    editionId: edition.id,
    firstName: reg.firstName,
    lastName: reg.lastName,
    email: reg.email,
    paymentStatus: reg.paymentStatus,
    priceUsd: String(reg.priceUsd),
    ticketCode: reg.ticketCode,
    payUrl,
  };
}
