import { redirect } from "next/navigation";

/** Deposit detail + resume flow lives on the deposit wizard. */
export default async function WalletActivityDepositPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/app/deposit/${id}`);
}
