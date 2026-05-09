/**
 * Pi Developer Portal always requests `/validation-key.txt` at the **registered**
 * app URL — same path for Mainnet and Testnet apps; only the key string differs.
 *
 * Same deployment can serve www (Mainnet checklist) and *.onrender.com (Testnet checklist):
 * pick the key from `Host`.
 */
export function resolvePiDomainValidationKeyForHost(hostHeader: string | null): {
  rawKey: string | undefined;
  missingMessage: string;
} {
  const hostname = (hostHeader ?? "").split(":")[0].toLowerCase();

  const mainRaw = process.env.PI_DOMAIN_VALIDATION_KEY;
  const testRaw = process.env.PI_DOMAIN_VALIDATION_KEY_TEST;

  const explicitTestHosts = new Set(
    (process.env.PI_VALIDATION_KEY_TEST_HOSTS ?? "")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );

  const testKey = testRaw?.trim();
  const mainKey = mainRaw?.trim();

  let useTestKey = false;

  if (explicitTestHosts.size > 0) {
    useTestKey = explicitTestHosts.has(hostname);
  } else if (hostname.endsWith(".onrender.com") && Boolean(testKey)) {
    /** Typical Pi Testnet checklist: register the Render URL; serve Testnet key here. */
    useTestKey = true;
  }

  if (useTestKey) {
    return {
      rawKey: testRaw?.trim(),
      missingMessage:
        "Set PI_DOMAIN_VALIDATION_KEY_TEST for Pi Network Testnet verification on this host.",
    };
  }

  return {
    rawKey: mainKey,
    missingMessage: "Set PI_DOMAIN_VALIDATION_KEY in your hosting environment.",
  };
}
