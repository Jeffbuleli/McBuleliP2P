"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconMic } from "@/components/icons";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";

type Bubble = { id: string; role: "user" | "assistant"; content: string };

const GREETING =
  "Bonjour. Ici Ngemba, pour l'école. Tu peux parler à ton rythme, sans donner ton nom. Qu'est-ce qui se passe ?";

const STARTERS = ["Harcèlement", "Violence", "Cyber", "Autre"];

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
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function speak(id: string, text: string) {
    const res = await fetch("/api/voice/speak", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id, text: text.slice(0, 700) }),
    });
    if (!res.ok) return;
    const url = URL.createObjectURL(await res.blob());
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    void audio.play().catch(() => undefined);
  }

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
    const shown = trimmed || "Message vocal";
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: shown },
    ]);
    setDraft("");
    try {
      const alreadyOpen = Boolean(sessionId);
      const id = await ensureSession(trimmed || "Message vocal depuis l'école");
      if (!id) return;
      let body = trimmed;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        const up = await fetch(`/api/alerts/${id}/media`, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const upData = await up.json().catch(() => ({}));
        const heard = upData.attachment?.transcription as string | undefined;
        if (heard?.trim()) body = heard.trim();
        if (!body) body = "Message vocal";
      }
      const shouldPost = alreadyOpen || Boolean(file);
      if (shouldPost && body) {
        const res = await fetch(`/api/alerts/${id}/messages`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        const data = await res.json().catch(() => ({}));
        const reply = [...(data.messages ?? [])]
          .reverse()
          .find(
            (m: { actor?: string; body?: string }) =>
              m.actor === "McBuleli IA" && m.body,
          );
        if (reply?.body) {
          setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: "assistant", content: reply.body },
          ]);
          void speak(id, reply.body);
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
              m.actor === "McBuleli IA" && m.body,
          );
        if (ai?.body) {
          setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: "assistant", content: ai.body },
          ]);
          void speak(id, ai.body);
        }
      }
    } catch {
      setError("Connexion interrompue.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleMic() {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data.size) chunks.push(ev.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      if (blob.size < 800) return;
      void pushTurn("", new File([blob], "voix.webm", { type: blob.type }));
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
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
          <p className="truncate text-sm font-bold">Ngemba École</p>
          <p className="truncate text-[11px] text-[#6ee7a0]/80">
            On t&apos;écoute d&apos;abord
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
            <p
              className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-[#305f33] text-white"
                  : "rounded-bl-md border border-white/10 bg-white/10 text-stone-100"
              }`}
            >
              {m.content}
            </p>
          </div>
        ))}
        {busy ? (
          <p className="text-xs text-[#6ee7a0]">Ngemba écrit…</p>
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
        className="flex flex-col gap-2 border-t border-white/10 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void pushTurn(draft);
        }}
      >
        <div className="flex min-w-0 flex-1 items-end gap-2">
          <button
            type="button"
            onClick={() => void toggleMic()}
            className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full ${
              recording ? "bg-red-600 text-white" : "bg-white/10 text-[#6ee7a0]"
            }`}
            aria-label="Parler"
          >
            <IconMic className="size-5" />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Écris ici…"
            className="min-h-11 w-full min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none placeholder:text-stone-500"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="min-h-11 w-full shrink-0 rounded-full bg-[#305f33] px-4 text-sm font-semibold text-white disabled:opacity-40 sm:w-auto sm:min-w-[7.5rem]"
        >
          Envoyer
        </button>
      </form>
    </main>
  );
}
