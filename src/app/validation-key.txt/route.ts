import { resolvePiDomainValidationKeyForHost } from "@/lib/pi-domain-validation-key-host";
import {
  piDomainValidationHeadResponse,
  piDomainValidationResponse,
} from "@/lib/pi-domain-validation-response";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const host = req.headers.get("host");
  const { rawKey, missingMessage } =
    resolvePiDomainValidationKeyForHost(host);
  return piDomainValidationResponse(rawKey, missingMessage);
}

export async function HEAD(req: Request) {
  const host = req.headers.get("host");
  const { rawKey } = resolvePiDomainValidationKeyForHost(host);
  return piDomainValidationHeadResponse(rawKey);
}
