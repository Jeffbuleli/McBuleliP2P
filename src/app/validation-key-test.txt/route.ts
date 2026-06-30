import {
  piDomainValidationHeadResponse,
  piDomainValidationResponse,
} from "@/lib/pi-domain-validation-response";

export const dynamic = "force-dynamic";

/** Pi test / sandbox checklist — same host, separate path from production. */
export async function GET() {
  return piDomainValidationResponse(
    process.env.PI_DOMAIN_VALIDATION_KEY_TEST,
    "Set PI_DOMAIN_VALIDATION_KEY_TEST in your hosting environment.",
  );
}

export async function HEAD() {
  return piDomainValidationHeadResponse(process.env.PI_DOMAIN_VALIDATION_KEY_TEST);
}
