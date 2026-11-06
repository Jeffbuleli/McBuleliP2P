"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconMic } from "@/components/icons";
import { VoiceWave } from "@/components/voice-wave";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { useVoiceDraft } from "@/hooks/use-voice-draft";

type Bubble = { id: string; role: "user" | "assistant"; content: string };

const GREETING =
  "Bonjour. Ici Ngemba. Vous pouvez parler de violences, à la maison ou ailleurs, sans donner votre nom. Qu'est-ce qui se passe ?";

const STARTERS = ["À la maison", "Violence sexuelle", "Un enfant", "Harcèlement"];

export function SchoolChat({ initialLocale }: { initialLocale?: string }) {
  const { href } = useCitizenLocale(initialLocale);
  const [messages, setMessages] = useState<Bubble[]>([
    { id: "hello", role: "assistant", content: GREETING },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceDraft();

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function ensureSession(text: string): Promise<string | null> {
    if (sessionId) return sessionId;
    const res = await fetch("/api/alerts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text.slice(0, 500),
        locale: "fr",
        source: "school",
        schoolContext: { concernType: "other", establishmentHint: null, isMinor: true },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.id) {
      setError("Envoi impossible. Réessayez.");
      return null;
    }
    setSessionId(data.id as string);
    return data.id as string;
  }

  async function pushTurn(text: string, file?: File) {
    const trimmed = text.trim();
    if (busy || (!trimmed && !file)) return;
    setBusy(true);
    setError(null);
    const shown = trimmed || "Vocal";
    const userId = `u-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: shown },
    ]);
    setDraft("");
    try {
      const alreadyOpen = Boolean(sessionId);
      const id = await ensureSession(trimmed || "Message vocal");
      if (!id) return;
      let body = trimmed;
      let mediaId: string | undefined;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        const up = await fetch(`/api/alerts/${id}/media`, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const upData = await up.json().catch(() => ({}));
        mediaId = upData.attachment?.id as string | undefined;
        const heard = upData.attachment?.transcription as string | undefined;
        if (heard?.trim()) body = heard.trim();
        if (!body) body = "Message vocal";
        setMessages((prev) =>
          prev.map((m) => (m.id === userId ? { ...m, content: body } : m)),
        );
      }
      const shouldPost = alreadyOpen || Boolean(file);
      if (shouldPost && body) {
        const res = await fetch(`/api/alerts/${id}/messages`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body, mediaId }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.error === "thread_full") {
          setError(
            "Cette conversation s'arrête à 40 messages. Ouvrez une nouvelle discussion pour continuer avec Ngemba.",
          );
          return;
        }
        const reply = [...(data.messages ?? [])]
          .reverse()
          .find(
            (m: { actor?: string; body?: string }) =>
              (m.actor === "Ngemba" || m.actor === "McBuleli IA") && m.body,
          );
        if (reply?.body) {
          setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: "assistant", content: reply.body },
          ]);
        }
      } else {
        const listed = await fetch(`/api/alerts/${id}/messages`, {
          credentials: "include",
        });
        const data = await listed.json().catch(() => ({}));
        const ai = [...(data.messages ?? [])]
          .reverse()
          .find(
            (m: { actor?: string; body?: string }) =>
              (m.actor === "Ngemba" || m.actor === "McBuleli IA") && m.body,
          );
        if (ai?.body) {
          setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: "assistant", content: ai.body },
          ]);
        }
      }
    } catch {
      setError("Connexion interrompue.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleMic() {
    if (voice.recording) {
      await voice.stop();
      return;
    }
    if (voice.file) {
      voice.clear();
      return;
    }
    try {
      setDraft("");
      await voice.start();
    } catch {
      setError("Micro refusé.");
    }
  }

  async function submit() {
    let file = voice.file;
    if (voice.recording) file = await voice.stop();
    const text = draft;
    voice.clear();
    await pushTurn(text, file ?? undefined);
  }

  return (
    <main
      className={`mx-auto flex h-dvh w-full max-w-lg flex-col bg-[#102016] text-stone-100 sm:max-w-xl lg:max-w-2xl`}
    >
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#305f33] text-sm font-bold text-white">
          N
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">Ngemba VBG</p>
          <p className="truncate text-[11px] text-[#6ee7a0]/80">
            On vous écoute d&apos;abord
          </p>
        </div>
        <Link href={href("/")} className="text-xs font-semibold text-stone-400">
          Fermer
        </Link>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-[#305f33] text-white"
                  : "rounded-bl-md border border-white/10 bg-white/10 text-stone-100"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {busy ? (
          <p className="text-xs text-[#6ee7a0]">
            Ngemba écrit…
          </p>
        ) : null}
        {messages.length === 1 ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {STARTERS.map((label) => (
              <button
                key={label}
                type="button"
                disabled={busy}
                onClick={() => void pushTurn(`Je veux parler de : ${label.toLowerCase()}.`)}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-[#6ee7a0]"
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {error ? <p className="px-4 text-xs text-red-300">{error}</p> : null}

      <form
        className="flex items-end gap-2 border-t border-white/10 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <button
          type="button"
          onClick={() => void toggleMic()}
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-2xl ${
            voice.recording ? "bg-red-600 text-white" : "bg-white/10 text-[#6ee7a0]"
          }`}
          aria-label="Parler"
        >
          <IconMic className="size-5" />
        </button>
        {voice.recording || voice.file ? (
          <VoiceWave
            levels={voice.levels}
            className="border border-white/10 bg-white/5 text-[#6ee7a0]"
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Écris ici…"
            className="min-h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none placeholder:text-stone-500"
          />
        )}
        <button
          type="submit"
          disabled={busy || (!draft.trim() && !voice.file && !voice.recording)}
          aria-label="Envoyer"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-[#305f33] px-3.5 text-sm font-bold text-white disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
            <path d="M4 12h12M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Envoyer
        </button>
      </form>
    </main>
  );
}
