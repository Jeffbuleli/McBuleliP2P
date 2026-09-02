"use client";

import { useEffect, useRef, useState } from "react";
import { IconMic } from "@/components/icons";

type Props = {
  locale: string;
  label: string;
  listeningLabel: string;
  unsupportedLabel: string;
  onText: (text: string) => void;
};

type Rec = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const LANG_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ln: "fr-FR",
  sw: "sw-KE",
  lua: "fr-FR",
  kg: "fr-FR",
};

function getSpeechRecognition(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Rec;
    webkitSpeechRecognition?: new () => Rec;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function VoiceButton({
  locale,
  label,
  listeningLabel,
  unsupportedLabel,
  onText,
}: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<Rec | null>(null);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
  }, []);

  function toggle() {
    const SR = getSpeechRecognition();
    if (!SR) return;

    if (listening && recRef.current) {
      recRef.current.stop();
      setListening(false);
      return;
    }

    const rec = new SR();
    recRef.current = rec;
    rec.lang = LANG_MAP[locale] || "fr-FR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript?.trim();
      if (text) onText(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  if (!supported) {
    return <p className="text-xs text-ng-muted">{unsupportedLabel}</p>;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${
        listening
          ? "bg-ng-urgent text-white"
          : "bg-ng-primary-muted text-ng-primary"
      }`}
    >
      <IconMic className="size-4" />
      {listening ? listeningLabel : label}
    </button>
  );
}
