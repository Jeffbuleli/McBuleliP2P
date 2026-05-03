/** Parse JSON body from /api/auth/* for display */
export function formatAuthClientError(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "Something went wrong.";
  }
  const d = data as Record<string, unknown>;
  if (typeof d.message === "string") {
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
