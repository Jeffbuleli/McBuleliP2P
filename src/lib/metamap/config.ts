/** MetaMap Web SDK + webhook — https://docs.metamap.com/ */

export function metamapClientId(): string {
  return (
    process.env.NEXT_PUBLIC_METAMAP_CLIENT_ID?.trim() ||
    process.env.METAMAP_CLIENT_ID?.trim() ||
    ""
  );
}

export function metamapFlowId(): string {
  return (
    process.env.NEXT_PUBLIC_METAMAP_FLOW_ID?.trim() ||
    process.env.METAMAP_FLOW_ID?.trim() ||
    ""
  );
}

export function metamapWebhookSecret(): string {
  return process.env.METAMAP_WEBHOOK_SECRET?.trim() ?? "";
}

export function metamapConfigured(): boolean {
  return Boolean(metamapClientId() && metamapFlowId());
}
