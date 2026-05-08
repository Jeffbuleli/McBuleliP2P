import { NextResponse } from "next/server";

const TXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
} as const;

/** Strip BOM / outer whitespace; Pi compares the body to the portal string. */
export function normalizePiDomainValidationKey(raw: string | undefined): string {
  if (!raw) return "";
  return raw.replace(/^\uFEFF/, "").trim();
}

export function piDomainValidationResponse(
  rawKey: string | undefined,
  missingBody: string,
): NextResponse {
  const key = normalizePiDomainValidationKey(rawKey);
  if (!key) {
    return new NextResponse(missingBody, {
      status: 503,
      headers: { ...TXT_HEADERS },
    });
  }
  return new NextResponse(key, {
    status: 200,
    headers: {
      ...TXT_HEADERS,
      "Content-Length": String(Buffer.byteLength(key, "utf8")),
    },
  });
}

/** Some validators probe with HEAD before GET. */
export function piDomainValidationHeadResponse(
  rawKey: string | undefined,
): NextResponse {
  const key = normalizePiDomainValidationKey(rawKey);
  if (!key) {
    return new NextResponse(null, {
      status: 503,
      headers: { ...TXT_HEADERS },
    });
  }
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...TXT_HEADERS,
      "Content-Length": String(Buffer.byteLength(key, "utf8")),
    },
  });
}
