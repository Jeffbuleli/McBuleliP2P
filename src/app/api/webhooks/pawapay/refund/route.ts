import { postPawapayWebhook } from "../handler";

export const dynamic = "force-dynamic";

/** Same handler as `/api/webhooks/pawapay` — use if the dashboard requires a refund-only URL. */
export const POST = postPawapayWebhook;

