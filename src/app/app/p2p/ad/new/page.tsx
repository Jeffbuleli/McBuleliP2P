"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  FlowChipGrid,
  FlowError,
  FlowField,
  FlowInput,
  FlowPrimaryBtn,
  FlowProfileLink,
  FlowSection,
  FlowSegment,
  FlowSelect,
  FlowTextarea,
  P2pFlowShell,
} from "@/components/p2p/p2p-flow-ui";
import { countryLabel } from "@/lib/country-label";
import { clientErrorText } from "@/lib/client-error-text";
import {
  makerSideForMarketView,
  type P2pMarketView,
} from "@/lib/p2p-market-view";
import {
  P2P_COUNTRY_CODES,
  p2pAllowedQuoteFiats,
  p2pListingFeeAmount,
  p2pListingFeeAsset,
  type P2pCryptoAsset,
  type P2pFiatCurrency,
  type P2pSide,
} from "@/lib/p2p-config";

type PaymentDef = { code: string; label: string };

export default function P2pNewAdPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const lockedView: P2pMarketView | null =
    viewParam === "buy" || viewParam === "sell" ? viewParam : null;
  const [side, setSide] = useState<P2pSide>(() =>
    lockedView ? makerSideForMarketView(lockedView) : "sell",
  );
  const [asset, setAsset] = useState<P2pCryptoAsset>("USDT");
  const quoteFiats = useMemo(
    () => p2pAllowedQuoteFiats().filter((f) => f !== "USDT" && f !== "PI"),
    [],
  );
  const [fiat, setFiat] = useState<P2pFiatCurrency>(() => quoteFiats[0] ?? "CDF");
  const listingFee = p2pListingFeeAmount();
  const listingFeeAsset = p2pListingFeeAsset();
  const isBuyMarketPost = lockedView === "buy" || (!lockedView && side === "sell");

  useEffect(() => {
    if (lockedView) {
      setSide(makerSideForMarketView(lockedView));
    }
  }, [lockedView]);

  useEffect(() => {
    if (
      quoteFiats.length > 0 &&
      !quoteFiats.includes(fiat as (typeof quoteFiats)[number])
    ) {
      setFiat(quoteFiats[0] ?? "CDF");
    }
  }, [quoteFiats, fiat]);

  const [price, setPrice] = useState("");
  const [minFiat, setMinFiat] = useState("");
  const [maxFiat, setMaxFiat] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [paymentDefs, setPaymentDefs] = useState<PaymentDef[]>([]);
  const [paymentCodes, setPaymentCodes] = useState<string[]>([]);
  const [myMethodCodes, setMyMethodCodes] = useState<Set<string>>(new Set());
  const [terms, setTerms] = useState("");
  const [country, setCountry] = useState("CD");
  const [reserveAmountCrypto, setReserveAmountCrypto] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [balUsdt, setBalUsdt] = useState<number | null>(null);
  const [balPi, setBalPi] = useState<number | null>(null);
  const cryptoQuote = false;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/wallet/summary", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || cancelled) return;
      const lines = (data as { lines?: { asset: string; balanceNum: number }[] }).lines;
      if (!Array.isArray(lines)) return;
      const u = lines.find((x) => x.asset === "USDT")?.balanceNum;
      const p = lines.find((x) => x.asset === "PI")?.balanceNum;
      setBalUsdt(typeof u === "number" ? u : 0);
      setBalPi(typeof p === "number" ? p : 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/p2p/me/payment-methods", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || cancelled) return;
      const rows = (data.methods as { methodCode: string; active: boolean }[]) ?? [];
      setMyMethodCodes(
        new Set(rows.filter((r) => r.active).map((r) => r.methodCode.toUpperCase())),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadDefs() {
      const cc = country === "OTHER" ? "CD" : country;
      const res = await fetch(`/api/p2p/payment-methods?country=${encodeURIComponent(cc)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        if (!cancelled) setPaymentDefs([]);
        return;
      }
      const list = (data.methods as PaymentDef[]) ?? [];
      if (!cancelled) {
        setPaymentDefs(list);
        setPaymentCodes((cur) => cur.filter((c) => list.some((d) => d.code === c)));
      }
    }
    void loadDefs();
    return () => {
      cancelled = true;
    };
  }, [country]);

  useEffect(() => {
    if (!paymentCodes.length) return;
    const labels = paymentDefs
      .filter((d) => paymentCodes.includes(d.code))
      .map((d) => d.label);
    if (labels.length) setPaymentMethods(labels.join(", "));
  }, [paymentCodes, paymentDefs]);

  const sellNeedHint = useMemo(() => {
    if (side !== "sell") return null;
    const p = Number(price.replace(",", "."));
    const maxF = Number(maxFiat.replace(",", "."));
    if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(maxF) || maxF <= 0) return null;
    const need = maxF / p;
    if (!Number.isFinite(need) || need <= 0) return null;
    const bal = asset === "USDT" ? balUsdt : balPi;
    if (bal == null) return null;
    const needR = Math.ceil(need * 1e8) / 1e8;
    const balR = Math.floor(bal * 1e8) / 1e8;
    return { need: needR, bal: balR, ok: bal + 1e-12 >= need };
  }, [side, price, maxFiat, asset, balUsdt, balPi]);

  const errMsg = useMemo(() => {
    if (!err) return null;
    return clientErrorText(t, err);
  }, [err, t]);

  const missingProfileCodes = useMemo(
    () =>
      paymentCodes.filter((c) => !myMethodCodes.has(c.toUpperCase())),
    [paymentCodes, myMethodCodes],
  );

  function togglePayment(code: string) {
    setErr(null);
    setPaymentCodes((cur) =>
      cur.includes(code) ? cur.filter((x) => x !== code) : [...cur, code],
    );
  }

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const codes = paymentCodes.length ? paymentCodes : undefined;
      const pm =
        codes && paymentDefs.length
          ? paymentDefs.filter((d) => codes.includes(d.code)).map((d) => d.label).join(", ")
          : paymentMethods;

      if (!cryptoQuote) {
        if (paymentDefs.length > 0) {
          if (!paymentCodes.length) {
            setErr("p2p_payment_pick_one");
            return;
          }
          if (missingProfileCodes.length > 0) {
            setErr("p2p_payment_profile_missing");
            return;
          }
        } else if (!pm || pm.trim().length < 3) {
          setErr("p2p_payment_methods_required");
          return;
        }
      }

      const res = await fetch("/api/p2p/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side,
          asset,
          fiatCurrency: fiat,
          price,
          minFiat,
          maxFiat,
          paymentMethods: cryptoQuote ? "On-platform" : pm,
          paymentMethodCodes: cryptoQuote ? undefined : codes,
          reserveAmountCrypto: side === "sell" ? reserveAmountCrypto.trim() || undefined : undefined,
          terms: terms.trim() || undefined,
          countryCode: country === "OTHER" ? undefined : country,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "p2p_ad_create_failed");
        return;
      }
      router.push("/app/p2p");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const publishDisabled =
    loading ||
    (sellNeedHint != null && !sellNeedHint.ok) ||
    (!cryptoQuote &&
      (paymentDefs.length > 0
        ? paymentCodes.length === 0 || missingProfileCodes.length > 0
        : paymentMethods.trim().length < 3));

  const pageTitle = lockedView === "buy"
    ? t("p2p_post_title_buy")
    : lockedView === "sell"
      ? t("p2p_post_title_sell")
      : t("p2p_post_title");
  const pageSubtitle = lockedView === "buy"
    ? t("p2p_post_subtitle_buy")
    : lockedView === "sell"
      ? t("p2p_post_subtitle_sell")
      : t("p2p_post_subtitle");

  return (
    <P2pFlowShell title={pageTitle} subtitle={pageSubtitle}>
      <p
        className={`rounded-2xl px-3 py-2 text-[11px] leading-snug ${
          isBuyMarketPost
            ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
            : "bg-[color:var(--fd-sell-mint)] text-[color:var(--fd-sell)]"
        }`}
      >
        {isBuyMarketPost ? t("p2p_market_buy_hint") : t("p2p_market_sell_hint")}
      </p>

      <p className="rounded-2xl border border-[color:var(--fd-border)] bg-white px-3 py-2 text-[11px] text-[color:var(--fd-muted)]">
        {t("p2p_listing_fee_note", {
          amount: listingFee,
          asset: listingFeeAsset,
        })}
      </p>

      {!lockedView ? (
        <FlowSection title={t("p2p_side_label")}>
          <FlowSegment
            value={side}
            onChange={setSide}
            options={[
              { id: "buy" as const, label: t("p2p_side_buy") },
              { id: "sell" as const, label: t("p2p_side_sell") },
            ]}
          />
        </FlowSection>
      ) : null}

      <FlowSection title={t("p2p_asset_label")}>
        <FlowField label={t("p2p_asset_label")}>
          <FlowSelect
            value={asset}
            onChange={(e) => setAsset(e.target.value as P2pCryptoAsset)}
          >
            <option value="USDT">USDT</option>
            <option value="PI">PI</option>
          </FlowSelect>
        </FlowField>
        <FlowField label={t("p2p_fiat_label")} hint={cryptoQuote ? t("p2p_crypto_quote_hint") : t("p2p_fiat_quote_escrow_note")}>
          <FlowSelect
            value={fiat}
            onChange={(e) => setFiat(e.target.value as P2pFiatCurrency)}
          >
            {quoteFiats.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </FlowSelect>
        </FlowField>
      </FlowSection>

      <FlowSection title={t("p2p_price_label")}>
        <FlowField label={t("p2p_price_per_unit")}>
          <FlowInput value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
        </FlowField>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <FlowField label={t("p2p_min_fiat")}>
            <FlowInput value={minFiat} onChange={(e) => setMinFiat(e.target.value)} inputMode="decimal" />
          </FlowField>
          <FlowField label={t("p2p_max_fiat")} hint={side === "sell" ? t("p2p_sell_escrow_explainer") : undefined}>
            <FlowInput value={maxFiat} onChange={(e) => setMaxFiat(e.target.value)} inputMode="decimal" />
          </FlowField>
        </div>
      </FlowSection>

      {!cryptoQuote ? (
        <FlowSection
          title={t("p2p_payment_detail")}
          hint={t("p2p_payment_methods_profile_hint")}
          action={<FlowProfileLink label={t("p2p_payment_methods_title")} />}
        >
          {!paymentDefs.length ? (
            <FlowTextarea
              value={paymentMethods}
              onChange={(e) => {
                setPaymentMethods(e.target.value);
                setErr(null);
              }}
              rows={3}
            />
          ) : (
            <FlowChipGrid
              items={paymentDefs}
              selected={paymentCodes}
              onToggle={togglePayment}
              configured={myMethodCodes}
            />
          )}
        </FlowSection>
      ) : null}

      {side === "sell" ? (
        <FlowSection title={t("p2p_reserve_label")} hint={t("p2p_reserve_hint")}>
          <FlowInput
            value={reserveAmountCrypto}
            onChange={(e) => setReserveAmountCrypto(e.target.value)}
            inputMode="decimal"
            placeholder={asset === "USDT" ? "100" : "20"}
          />
        </FlowSection>
      ) : null}

      <FlowSection title={t("p2p_terms_optional")}>
        <FlowTextarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} />
      </FlowSection>

      <FlowSection title={t("p2p_country_label")}>
        <FlowSelect value={country} onChange={(e) => setCountry(e.target.value)}>
          {P2P_COUNTRY_CODES.map((c) => (
            <option key={c} value={c}>
              {countryLabel(locale, c)}
            </option>
          ))}
        </FlowSelect>
      </FlowSection>

      {errMsg ? <FlowError>{errMsg}</FlowError> : null}

      {sellNeedHint && !sellNeedHint.ok ? (
        <FlowError>
          {t("p2p_sell_need_hint")
            .replace("{need}", String(sellNeedHint.need))
            .replace("{asset}", asset)
            .replace("{bal}", String(sellNeedHint.bal))}
        </FlowError>
      ) : null}

      <FlowPrimaryBtn
        disabled={publishDisabled}
        onClick={() => void submit()}
        variant={isBuyMarketPost ? "primary" : "sell"}
      >
        {loading ? "…" : t("p2p_create_ad")}
      </FlowPrimaryBtn>
    </P2pFlowShell>
  );
}
