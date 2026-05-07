"use client";

import { useEffect, useState } from "react";

export default function PiReceiveAddressSettingsClient() {
  const [realAddress, setRealAddress] = useState("");
  const [testAddress, setTestAddress] = useState("");
  const [piTestBalance, setPiTestBalance] = useState("0");
  const [piTestAmount, setPiTestAmount] = useState("");
  const [piTestMemo, setPiTestMemo] = useState("");
  const [piTestLedger, setPiTestLedger] = useState<
    Array<{ id: string; kind: string; amount: string; memo: string | null; createdAt: string }>
  >([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [piTestBusy, setPiTestBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      setMsg(null);
      const res = await fetch("/api/admin/settings/pi-receive-address", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        if (typeof data.realAddress === "string") setRealAddress(data.realAddress);
        if (typeof data.testAddress === "string") setTestAddress(data.testAddress);
        if (typeof data.piTestBalance === "string") setPiTestBalance(data.piTestBalance);
      } else {
        setMsg(typeof data.error === "string" ? data.error : "Failed to load");
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/settings/pi-test?limit=30", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        if (typeof data.balance === "string") setPiTestBalance(data.balance);
        if (Array.isArray(data.ledger)) setPiTestLedger(data.ledger);
      }
    })();
  }, []);

  async function save() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings/pi-receive-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          realAddress: realAddress.trim(),
          testAddress: testAddress.trim(),
          piTestBalance: piTestBalance.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }
      setMsg("Saved");
    } finally {
      setLoading(false);
    }
  }

  async function adjust(kind: "deposit" | "withdraw") {
    setPiTestBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings/pi-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          amount: piTestAmount,
          memo: piTestMemo,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Operation failed");
        return;
      }
      const res2 = await fetch("/api/admin/settings/pi-test?limit=30", { cache: "no-store" });
      const data2 = await res2.json().catch(() => ({}));
      if (res2.ok && data2?.ok) {
        if (typeof data2.balance === "string") setPiTestBalance(data2.balance);
        if (Array.isArray(data2.ledger)) setPiTestLedger(data2.ledger);
      }
      setPiTestAmount("");
      setPiTestMemo("");
      setMsg("Updated Pi Test balance");
    } finally {
      setPiTestBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-stone-700 bg-stone-900/60 p-4">
      <label className="block text-sm font-medium text-stone-200">
        Pi Test balance (training)
        <input
          value={piTestBalance}
          onChange={(e) => setPiTestBalance(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950/60 px-3 py-3 font-mono text-xs text-stone-100"
          placeholder="0"
        />
        <span className="mt-1 block text-[11px] font-normal text-stone-400">
          Stored in platform settings. Displayed in the wallet as “Pi Test”.
        </span>
      </label>

      <div className="rounded-2xl border border-stone-700 bg-stone-950/40 p-3">
        <p className="text-sm font-semibold text-stone-100">Pi Test procedure</p>
        <p className="mt-1 text-[11px] text-stone-400">
          Simulate deposits/withdrawals for training without touching users.piBalance.
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-medium text-stone-300 sm:col-span-2">
            Amount (Pi Test)
            <input
              value={piTestAmount}
              onChange={(e) => setPiTestAmount(e.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950/60 px-3 py-2.5 font-mono text-xs text-stone-100"
              placeholder="0.1"
            />
          </label>
          <label className="block text-xs font-medium text-stone-300 sm:col-span-2">
            Memo / motif
            <input
              value={piTestMemo}
              onChange={(e) => setPiTestMemo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950/60 px-3 py-2.5 text-xs text-stone-100"
              placeholder="Training refill, demo payout, ..."
            />
          </label>
          <button
            type="button"
            disabled={piTestBusy || !piTestAmount.trim()}
            onClick={() => void adjust("deposit")}
            className="rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {piTestBusy ? "…" : "Deposit Pi Test"}
          </button>
          <button
            type="button"
            disabled={piTestBusy || !piTestAmount.trim()}
            onClick={() => void adjust("withdraw")}
            className="rounded-xl border border-rose-700/50 bg-rose-950/30 py-2.5 text-sm font-bold text-rose-100 disabled:opacity-60"
          >
            {piTestBusy ? "…" : "Withdraw Pi Test"}
          </button>
        </div>

        {piTestLedger.length ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-stone-800">
            <div className="border-b border-stone-800 bg-stone-950/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              Recent Pi Test activity
            </div>
            <ul className="divide-y divide-stone-800">
              {piTestLedger.slice(0, 20).map((x) => (
                <li key={x.id} className="px-3 py-2 text-xs text-stone-200">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px] text-stone-400">
                      {new Date(x.createdAt).toLocaleString()}
                    </span>
                    <span
                      className={
                        x.kind === "deposit"
                          ? "font-semibold text-emerald-200"
                          : "font-semibold text-rose-200"
                      }
                    >
                      {x.kind === "deposit" ? "+" : "-"}
                      {x.amount}
                    </span>
                  </div>
                  {x.memo ? <div className="mt-1 text-stone-400">{x.memo}</div> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <label className="block text-sm font-medium text-stone-200">
        Pi receiving address (real)
        <input
          value={realAddress}
          onChange={(e) => setRealAddress(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950/60 px-3 py-3 font-mono text-xs text-stone-100"
          placeholder="G... (Pi address)"
        />
      </label>

      <label className="block text-sm font-medium text-stone-200">
        Pi receiving address (test)
        <input
          value={testAddress}
          onChange={(e) => setTestAddress(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950/60 px-3 py-3 font-mono text-xs text-stone-100"
          placeholder="G... (Pi test address)"
        />
      </label>

      {msg ? (
        <p className="rounded-xl border border-stone-700 bg-stone-950/60 px-3 py-2 text-xs text-stone-200">
          {msg}
        </p>
      ) : null}

      <button
        type="button"
        disabled={loading}
        onClick={() => void save()}
        className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-stone-950 disabled:opacity-60"
      >
        {loading ? "…" : "Save"}
      </button>
    </div>
  );
}

