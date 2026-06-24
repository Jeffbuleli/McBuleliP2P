"use client";

import { useState } from "react";
import { CommunityMentionText } from "@/components/community/community-mention-text";
import { IconTranslate } from "@/components/community/community-icons";
import { shouldOfferTranslation } from "@/lib/community/text-locale";

export function CommunityTranslatableText({
  text,
  sourceText,
  fr,
  className = "",
  withMentions = false,
  truncateTranslationAt,
}: {
  text: string;
  sourceText?: string;
  fr: boolean;
  className?: string;
  withMentions?: boolean;
  truncateTranslationAt?: number;
}) {
  const userLocale = fr ? "fr" : "en";
  const fullText = sourceText ?? text;
  const offerTranslate = shouldOfferTranslation(fullText, userLocale);

  const [showingTranslation, setShowingTranslation] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayFull = showingTranslation && translatedText ? translatedText : text;
  const display =
    showingTranslation &&
    translatedText &&
    truncateTranslationAt &&
    displayFull.length > truncateTranslationAt
      ? `${displayFull.slice(0, truncateTranslationAt).trim()}…`
      : displayFull;

  const body = withMentions ? (
    <CommunityMentionText text={display} />
  ) : (
    display
  );

  async function onTranslate() {
    if (loading) return;
    if (showingTranslation && translatedText) {
      setShowingTranslation(false);
      return;
    }
    if (translatedText) {
      setShowingTranslation(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/community/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText, targetLocale: userLocale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = data.error as string | undefined;
        if (code === "translate_rate_limit") {
          setError(
            fr
              ? "Limite de traductions atteinte (20/jour)."
              : "Translation limit reached (20/day).",
          );
        } else {
          setError(fr ? "Traduction impossible." : "Translation failed.");
        }
        return;
      }
      setTranslatedText(data.translatedText as string);
      setShowingTranslation(true);
    } catch {
      setError(fr ? "Traduction impossible." : "Translation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className={className}>
      {body}
      {offerTranslate ? (
        <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#78716c]">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void onTranslate();
            }}
            disabled={loading}
            aria-label={fr ? "Traduire" : "Translate"}
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold text-[#305f33] hover:bg-[#e8f3ee] disabled:opacity-50"
          >
            <IconTranslate size={14} />
            {loading
              ? fr
                ? "…"
                : "…"
              : showingTranslation && translatedText
                ? fr
                  ? "Original"
                  : "Original"
                : fr
                  ? "Traduire"
                  : "Translate"}
          </button>
          {showingTranslation && translatedText ? (
            <span className="text-[10px] italic">
              {fr ? "Traduit par McBuleli AI" : "Translated by McBuleli AI"}
            </span>
          ) : null}
          {error ? <span className="text-[10px] text-red-600">{error}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
