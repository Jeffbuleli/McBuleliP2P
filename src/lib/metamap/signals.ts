/** SDK / webhook text indicating the user already passed MetaMap verification. */
export function isMetamapAlreadyVerifiedSignal(detail: unknown): boolean {
  if (!detail || typeof detail !== "object") return false;
  const blob = JSON.stringify(detail).toLowerCase();
  if (blob.includes("sanction")) return false;
  return (
    (blob.includes("already") &&
      (blob.includes("verif") ||
        blob.includes("exist") ||
        blob.includes("complet") ||
        blob.includes("registered"))) ||
    blob.includes("duplicate user") ||
    blob.includes("already_verified") ||
    blob.includes("user_exists") ||
    blob.includes("user already")
  );
}

export function rejectionNoteFromWebhookBody(
  body: Record<string, unknown>,
): string | null {
  const direct = [
    body.message,
    body.reason,
    body.error,
    body.rejectionReason,
    body.rejection_reason,
  ];
  for (const v of direct) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  const steps = body.steps;
  if (Array.isArray(steps)) {
    for (const step of steps) {
      if (!step || typeof step !== "object") continue;
      const err = (step as { error?: unknown; message?: unknown }).error;
      const msg = (step as { error?: unknown; message?: unknown }).message;
      if (typeof err === "string" && err.trim()) return err.trim();
      if (typeof msg === "string" && msg.trim()) return msg.trim();
    }
  }

  return null;
}
