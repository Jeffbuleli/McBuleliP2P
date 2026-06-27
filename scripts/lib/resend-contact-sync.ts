/**
 * Upsert contacts into a Resend segment (for broadcasts).
 */

export type ResendContactInput = {
  email: string;
  firstName?: string | null;
};

async function resendFetch(apiKey: string, path: string, init: RequestInit) {
  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body };
}

export async function upsertResendContact(args: {
  apiKey: string;
  segmentId: string;
  contact: ResendContactInput;
}): Promise<{ ok: boolean; status: number }> {
  const payload = {
    email: args.contact.email,
    first_name: args.contact.firstName?.trim() || undefined,
    unsubscribed: false,
    segments: [{ id: args.segmentId }],
  };

  const created = await resendFetch(args.apiKey, "/contacts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (created.ok || created.status === 409) {
    return { ok: true, status: created.status };
  }

  // Resend may return existing contact — try PATCH by email
  const patched = await resendFetch(
    args.apiKey,
    `/contacts/${encodeURIComponent(args.contact.email)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        first_name: args.contact.firstName?.trim() || undefined,
        unsubscribed: false,
        segments: [{ id: args.segmentId }],
      }),
    },
  );
  return { ok: patched.ok, status: patched.status };
}

export async function syncContactsToSegment(args: {
  apiKey: string;
  segmentId: string;
  contacts: ResendContactInput[];
}): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;
  for (const contact of args.contacts) {
    const r = await upsertResendContact({
      apiKey: args.apiKey,
      segmentId: args.segmentId,
      contact,
    });
    if (r.ok) synced += 1;
    else failed += 1;
  }
  return { synced, failed };
}
