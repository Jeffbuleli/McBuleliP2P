import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { PiPaymentStatusClient } from "./pi-payment-status-client";

export const dynamic = "force-dynamic";

export default async function PiPaymentStatusPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const locale = await getLocale();
  const d = getDictionary(locale);
  return <PiPaymentStatusClient paymentId={paymentId} dict={d} />;
}

