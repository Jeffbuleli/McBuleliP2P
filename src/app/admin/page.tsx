import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <p className="text-stone-400">
        Validate withdrawal requests: execute the transfer on your custody
        platform, then record the on-chain transaction ID so the user app can
        show &quot;completed&quot;.
      </p>
      <Link
        href="/admin/withdrawals"
        className="inline-block rounded-xl bg-amber-600 px-5 py-3 font-semibold text-stone-950"
      >
        Withdrawal queue
      </Link>
    </div>
  );
}
