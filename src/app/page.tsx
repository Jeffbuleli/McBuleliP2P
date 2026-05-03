import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-12">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
          McBuleli P2P
        </p>
        <h1 className="mt-3 text-3xl font-bold text-stone-900">
          Crypto deposits & withdrawals
        </h1>
        <p className="mt-3 text-pretty text-stone-600">
          Guided flows, strict TXID checks against Binance or OKX, and plain-language
          warnings so users send on the right network.
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-emerald-700 px-4 py-3 text-center text-lg font-semibold text-white shadow-md shadow-emerald-900/20 active:scale-[0.99]"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-xl border-2 border-rose-900/40 bg-white px-4 py-3 text-center text-lg font-semibold text-rose-950 active:scale-[0.99]"
        >
          Create account
        </Link>
      </div>
      <p className="mt-8 text-center text-xs text-stone-500">
        Configure API keys on the server; never expose keys in the browser.
      </p>
    </div>
  );
}
