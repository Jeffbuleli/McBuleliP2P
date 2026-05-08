import {
  piDomainValidationHeadResponse,
  piDomainValidationResponse,
} from "@/lib/pi-domain-validation-response";

export const dynamic = "force-dynamic";

export async function GET() {
  return piDomainValidationResponse(
    process.env.PI_DOMAIN_VALIDATION_KEY,
    "Set PI_DOMAIN_VALIDATION_KEY in your hosting environment.",
  );
}

export async function HEAD() {
  return piDomainValidationHeadResponse(process.env.PI_DOMAIN_VALIDATION_KEY);
}
