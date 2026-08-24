/**
 * Browser TTS for McBuleli IA MC lines (FR).
 * Relaxed stage rhythm: slower rate, soft pitch, longer pauses; lexicon for local names.
 * Used on the room projector (/hackathon/live in MC mode).
 */

/** Spoken forms so FR TTS does not mangle brand / partner names. */
const PRONUNCIATION: Array<[RegExp, string]> = [
  // Identité IA avant le remplacement générique « McBuleli »
  [/\bMcBuleli IA\b/gi, "Mac Bouléli I A"],
  [/\bMcBuleli P2P\b/gi, "Mac Bouléli Pé deux Pé"],
  [/\bMcBuleli ISP\b/gi, "Mac Bouléli I S P"],
  [/\bMcBuleli Meet\b/gi, "Mac Bouléli Meet"],
  [/\bMcBuleli\b/gi, "Mac Bouléli"],
  [/\bSilikin\b/gi, "Silikine"],
  // Abréviations isolées → nom complet (lisibilité scène)
  [
    /\bTYTS\b/g,
    "The Young Technology Service",
  ],
  [
    /\bTHE YOUNG TECHNOLOGY SERVICE\b/gi,
    "The Young Technology Service",
  ],
  // RDPI : laisser tel quel quand suivi de Think Tank (déjà clair à l'oreille)
  [/\bIA Académie\s*\/\s*CHK\b/gi, "I A Académie"],
  [/\bIA Académie\b/gi, "I A Académie"],
  [/\bCHK\b/g, "C H K"],
  [/\bIA\b/g, "I A"],
  [/\bKilelo\b/gi, "Kilélo"],
  [/\bMontanaPay\b/gi, "Montana Pay"],
  [/\bKIMIA Service\b/gi, "Kimia Service"],
  [/\bKIMIA\b/g, "Kimia"],
  [/\bILOKWE GROUP\b/gi, "Ilokoué Group"],
  [/\bILOKWE\b/gi, "Ilokoué"],
  [/\bpawaPay\b/gi, "Pawa Pay"],
  [/\bBinance\b/gi, "Binance"],
  [/\bDemo Day\b/gi, "Démo Day"],
  [/\bMini Demo\b/gi, "Mini Démo"],
  [/\bVibe Coding\b/gi, "Vaïbe Coding"],
  [/\bCursor\b/gi, "Curseur"],
  [/\bClaude\b/gi, "Claude"],
  [/\bCodex\b/gi, "Codex"],
  [/\bPatty B\b/gi, "Patty Bé"],
  [/\bMme Patty B\./gi, "Madame Patty Bé"],
  [/\bMadame Patty Bé\b/gi, "Madame Patty Bé"],
  // Ir = Ingénieur (Congo) — avant Jeff Buleli générique
  [
    /\bIr Jeff Buleli\b/gi,
    "Ingénieur Jeff Bouléli",
  ],
  [/\bJeff Buleli\b/gi, "Jeff Bouléli"],
  [/\bAristote Mugisho\b/gi, "Aristote Moughicho"],
  [/\bRodrigue Kashara David\b/gi, "Rodrigue Kachara David"],
  [/\bMike Mulopo\b/gi, "Mike Mulopo"],
  [/\bDelly Montana\b/gi, "Delly Montana"],
  [/\bChristian Ikwele\b/gi, "Christian Ikwélé"],
  [/\bAaron Nsomone\b/gi, "Aaron Nsomoné"],
  [/\bJeancy Kabangu\b/gi, "Djéancy Kabangou"],
  [/\bMr\b/g, "Monsieur"],
  [/\bCyber Alert DRC\b/gi, "Cyber Alert D R C"],
  [/\bSafeFind\b/gi, "Safe Find"],
  [/\bAfrica Insight\b/gi, "Africa Insight"],
  [/·/g, ","],
  [/–|—/g, ","],
];

/** Slower than default — relaxed, unhurried stage presence. */
const DEFAULT_RATE = 0.84;
/** Slightly softer than neutral. */
const DEFAULT_PITCH = 0.96;
/** Pause between sentence chunks (ms). */
const CHUNK_GAP_MS = 620;

let speakGeneration = 0;

export function stopMcVoice() {
  speakGeneration += 1;
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

function applyPronunciation(text: string): string {
  let out = text;
  for (const [re, spoken] of PRONUNCIATION) {
    out = out.replace(re, spoken);
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Split into speakable chunks for a measured stage rhythm. */
export function splitMcSpeechChunks(text: string): string[] {
  const normalized = applyPronunciation(text);
  if (!normalized) return [];
  const parts = normalized
    .split(/(?<=[.!?…])\s+|(?<=:)\s+|(?<=;)\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1 && normalized.length > 120) {
    return normalized
      .split(/(?<=,)\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return parts.length ? parts : [normalized];
}

function pickFrVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  /** Prefer warm / soft FR voices before more formal male defaults. */
  const prefer = [
    /amélie|amelie/i,
    /audrey/i,
    /marie/i,
    /denise/i,
    /hortense/i,
    /google.*fr.*female/i,
    /google.*fr/i,
    /thomas/i,
  ];
  for (const re of prefer) {
    const hit = voices.find((v) => /^fr[-_]/i.test(v.lang) && re.test(v.name));
    if (hit) return hit;
  }
  return voices.find((v) => /^fr[-_]/i.test(v.lang)) ?? null;
}

function speakChunk(
  chunk: string,
  opts: { rate: number; pitch: number; voice: SpeechSynthesisVoice | null },
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const u = new SpeechSynthesisUtterance(chunk);
    u.lang = "fr-FR";
    u.rate = opts.rate;
    u.pitch = opts.pitch;
    if (opts.voice) u.voice = opts.voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

function wait(ms: number, gen: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (gen === speakGeneration) resolve();
      else resolve();
    }, ms);
  });
}

/**
 * Speak a stage line with pronunciation fixes and paced chunk gaps.
 * Returns false if TTS unavailable / empty.
 */
export function speakMcLine(
  text: string,
  opts?: {
    rate?: number;
    pitch?: number;
    onChunk?: (i: number, total: number) => void;
    onDone?: () => void;
  },
): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const chunks = splitMcSpeechChunks(text);
  if (!chunks.length) return false;

  const gen = ++speakGeneration;
  window.speechSynthesis.cancel();

  const voice = pickFrVoice();
  const rate = opts?.rate ?? DEFAULT_RATE;
  const pitch = opts?.pitch ?? DEFAULT_PITCH;

  void (async () => {
    for (let i = 0; i < chunks.length; i++) {
      if (gen !== speakGeneration) return;
      opts?.onChunk?.(i, chunks.length);
      await speakChunk(chunks[i]!, { rate, pitch, voice });
      if (gen !== speakGeneration) return;
      if (i < chunks.length - 1) {
        await wait(CHUNK_GAP_MS, gen);
      }
    }
    if (gen === speakGeneration) opts?.onDone?.();
  })();

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
