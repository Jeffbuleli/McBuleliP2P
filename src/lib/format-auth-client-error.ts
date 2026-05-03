/** Parse JSON body from /api/auth/* for display */
export function formatAuthClientError(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "Something went wrong.";
  }
  const d = data as Record<string, unknown>;
  if (typeof d.message === "string") {
    const detail = typeof d.detail === "string" ? d.detail.trim() : "";
    if (detail && detail.length <= 240) {
      return `${d.message} (${detail})`;
    }
    return d.message;
  }
  if (typeof d.error === "string") {
    return d.error;
  }
  const fe = d.fieldErrors as Record<string, string[] | undefined> | undefined;
  if (fe) {
    const parts = Object.entries(fe).flatMap(([key, vals]) =>
      (vals ?? []).map((v) => `${key}: ${v}`),
    );
    if (parts.length) {
      return parts.join(" · ");
    }
  }
  return "Could not complete request.";
}
