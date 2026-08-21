/**
 * Browser TTS for McBuleli AI MC lines (FR).
 * Used on the room projector (/hackathon/live in MC mode).
 */

export function stopMcVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

function pickFrVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) =>
        /^fr[-_]/i.test(v.lang) &&
        /google|thomas|amélie|amelie|hortense|denise/i.test(v.name),
    ) ??
    voices.find((v) => /^fr[-_]/i.test(v.lang)) ??
    null
  );
}

export function speakMcLine(text: string, opts?: { rate?: number }) {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const line = text.replace(/\s+/g, " ").trim();
  if (!line) return false;

  stopMcVoice();
  const u = new SpeechSynthesisUtterance(line);
  u.lang = "fr-FR";
  u.rate = opts?.rate ?? 0.95;
  u.pitch = 1;
  const voice = pickFrVoice();
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
}

/** Some browsers load voices async. */
export function ensureMcVoicesLoaded(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }
  if (window.speechSynthesis.getVoices().length > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const onVoices = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      resolve();
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      resolve();
    }, 1500);
  });
}
