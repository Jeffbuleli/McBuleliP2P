"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCls } from "@/components/admin/admin-ui";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function PiReceiveAddressSettingsClient() {
  const [realAddress, setRealAddress] = useState("");
  const [testAddress, setTestAddress] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [piTestBalance, setPiTestBalance] = useState("0");
  const [piTestAmount, setPiTestAmount] = useState("");
  const [piTestMemo, setPiTestMemo] = useState("");
  const [piTestLedger, setPiTestLedger] = useState<
    Array<{ id: string; kind: string; amount: string; memo: string | null; createdAt: string }>
  >([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [piTestBusy, setPiTestBusy] = useState(false);

  const piTestUrl = useCallback(() => {
    const base = "/api/admin/settings/pi-test?limit=30";
    const id = targetUserId.trim();
    if (UUID_RE.test(id)) {
      return `${base}&userId=${encodeURIComponent(id)}`;
    }
    return base;
  }, [targetUserId]);

  const loadPiTest = useCallback(async () => {
    const res = await fetch(piTestUrl(), { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.ok) {
      if (typeof data.balance === "string") setPiTestBalance(data.balance);
      if (Array.isArray(data.ledger)) setPiTestLedger(data.ledger);
    }
  }, [piTestUrl]);

  useEffect(() => {
    void (async () => {
      setMsg(null);
      const res = await fetch("/api/admin/settings/pi-receive-address", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        if (typeof data.realAddress === "string") setRealAddress(data.realAddress);
        if (typeof data.testAddress === "string") setTestAddress(data.testAddress);
      } else {
        setMsg(typeof data.error === "string" ? data.error : "Failed to load");
      }
    })();
  }, []);

  useEffect(() => {
    void loadPiTest();
  }, [loadPiTest]);

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
      const id = targetUserId.trim();
      const res = await fetch("/api/admin/settings/pi-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          amount: piTestAmount,
          memo: piTestMemo,
          ...(UUID_RE.test(id) ? { targetUserId: id } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Operation failed");
        return;
      }
      await loadPiTest();
      setPiTestAmount("");
      setPiTestMemo("");
      setMsg("Updated Pi Test balance");
    } finally {
      setPiTestBusy(false);
    }
  }

  return (
    <div className={`space-y-4 ${adminCls.card}`}>
      <div className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/30 p-3">
        <p className="text-sm font-semibold text-[color:var(--fd-text)]">Pi Test (sandbox)</p>
        <p className={`mt-1 text-[11px] ${adminCls.muted}`}>
          Balance is stored per user (<span className="font-mono">users.pi_test_balance</span>),
          separate from real Pi (<span className="font-mono">users.pi_balance</span>). Operations
          (send, withdraw, transfers) use each asset&apos;s own balance — the wallet total is the sum of
          the rows below it.
        </p>

        <label className={`mt-3 block text-xs font-medium ${adminCls.muted}`}>
          Target user ID (optional — empty = your admin account)
          <input
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className={`mt-1 w-full font-mono text-xs ${adminCls.input}`}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </label>

        <div className="mt-3 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2">
          <p className={`text-[10px] font-semibold uppercase tracking-wide ${adminCls.muted}`}>
            Current Pi Test balance (read-only)
          </p>
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-emerald-700">
            {piTestBalance}
          </p>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className={`block text-xs font-medium ${adminCls.muted} sm:col-span-2`}>
            Amount (Pi Test)
            <input
              value={piTestAmount}
              onChange={(e) => setPiTestAmount(e.target.value)}
              inputMode="decimal"
              className={`mt-1 w-full font-mono text-xs ${adminCls.input}`}
              placeholder="0.1"
            />
          </label>
          <label className={`block text-xs font-medium ${adminCls.muted} sm:col-span-2`}>
            Memo / motif
            <input
              value={piTestMemo}
              onChange={(e) => setPiTestMemo(e.target.value)}
              className={`mt-1 w-full text-xs ${adminCls.input}`}
              placeholder="Training refill, demo payout, ..."
            />
          </label>
          <button
            type="button"
            disabled={piTestBusy || !piTestAmount.trim()}
            onClick={() => void adjust("deposit")}
            className={`${adminCls.btnPrimary} disabled:opacity-60`}
          >
            {piTestBusy ? "…" : "Deposit Pi Test"}
          </button>
          <button
            type="button"
            disabled={piTestBusy || !piTestAmount.trim()}
            onClick={() => void adjust("withdraw")}
            className="rounded-xl border border-rose-300 bg-rose-50 py-2.5 text-sm font-bold text-rose-800 disabled:opacity-60"
          >
            {piTestBusy ? "…" : "Withdraw Pi Test"}
          </button>
        </div>

        {piTestLedger.length ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--fd-border)]">
            <div className={`border-b border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide ${adminCls.muted}`}>
              Recent Pi Test activity (this user)
            </div>
            <ul className="divide-y divide-[color:var(--fd-border)]">
              {piTestLedger.slice(0, 20).map((x) => (
                <li key={x.id} className={`px-3 py-2 text-xs ${adminCls.muted}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px]">
                      {new Date(x.createdAt).toLocaleString()}
                    </span>
                    <span
                      className={
                        x.kind === "deposit"
                          ? "font-semibold text-emerald-700"
                          : "font-semibold text-rose-700"
                      }
                    >
                      {x.kind === "deposit" ? "+" : "-"}
                      {x.amount}
                    </span>
                  </div>
                  {x.memo ? <div className="mt-1">{x.memo}</div> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <label className={`block text-sm font-medium ${adminCls.muted}`}>
        Pi receiving address (real)
        <input
          value={realAddress}
          onChange={(e) => setRealAddress(e.target.value)}
          className={`mt-1 w-full font-mono text-xs ${adminCls.input}`}
          placeholder="G... (Pi address)"
        />
      </label>

      <label className={`block text-sm font-medium ${adminCls.muted}`}>
        Pi receiving address (test)
        <input
          value={testAddress}
          onChange={(e) => setTestAddress(e.target.value)}
          className={`mt-1 w-full font-mono text-xs ${adminCls.input}`}
          placeholder="G... (Pi test address)"
        />
      </label>

      {msg ? (
        <p className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/30 px-3 py-2 text-xs text-[color:var(--fd-text)]">
          {msg}
        </p>
      ) : null}

      <button
        type="button"
        disabled={loading}
        onClick={() => void save()}
        className={`w-full ${adminCls.btnPrimary} disabled:opacity-60`}
      >
        {loading ? "…" : "Save addresses"}
      </button>
    </div>
  );
}
