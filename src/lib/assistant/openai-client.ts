import OpenAI from "openai";

let client: OpenAI | null = null;

export function assistantOpenAiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function getClient(): OpenAI {
  if (!client) {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) throw new Error("openai_not_configured");
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

export function assistantModel(): string {
  return process.env.OPENAI_ASSISTANT_MODEL?.trim() || "gpt-4o-mini";
}

function buildChatMessages(args: {
  systemPrompt: string;
  history: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
}): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    { role: "system", content: args.systemPrompt },
    ...args.history.slice(-12).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: args.userMessage },
  ];
}

export async function generateAssistantReply(args: {
  systemPrompt: string;
  history: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
}): Promise<string> {
  if (!assistantOpenAiEnabled()) {
    return fallbackAssistantReply(args.userMessage, args.systemPrompt);
  }

  const openai = getClient();
  const res = await openai.chat.completions.create({
    model: assistantModel(),
    messages: buildChatMessages(args),
    temperature: 0.65,
    max_tokens: 800,
  });

  const text = res.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("empty_ai_response");
  return text;
}

/** Stream tokens via OpenAI SSE; falls back to single-chunk for rule-based mode. */
export async function* streamAssistantReply(args: {
  systemPrompt: string;
  history: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
}): AsyncGenerator<string, void, unknown> {
  if (!assistantOpenAiEnabled()) {
    const full = await fallbackAssistantReply(
      args.userMessage,
      args.systemPrompt,
    );
    const words = full.split(/(\s+)/);
    for (const w of words) {
      if (w) {
        yield w;
        await new Promise((r) => setTimeout(r, 12));
      }
    }
    return;
  }

  const openai = getClient();
  const stream = await openai.chat.completions.create({
    model: assistantModel(),
    messages: buildChatMessages(args),
    temperature: 0.65,
    max_tokens: 800,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

/** Structured JSON completion for Community translate / moderation. */
export async function completeChatJson(args: {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  if (!assistantOpenAiEnabled()) {
    throw new Error("openai_not_configured");
  }

  const openai = getClient();
  const res = await openai.chat.completions.create({
    model: assistantModel(),
    messages: [
      { role: "system", content: args.systemPrompt },
      { role: "user", content: args.userMessage },
    ],
    temperature: args.temperature ?? 0.2,
    max_tokens: args.maxTokens ?? 800,
    response_format: { type: "json_object" },
  });

  const text = res.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("empty_ai_response");
  return text;
}

/** Rule-based fallback when OPENAI_API_KEY is not set. */
function fallbackAssistantReply(
  userMessage: string,
  systemPrompt: string,
): string {
  const sw = /ACTIVE UI LANGUAGE:\s*\*\*Swahili/i.test(systemPrompt);
  const fr = /ACTIVE UI LANGUAGE:\s*\*\*French/i.test(systemPrompt);
  const lower = userMessage.toLowerCase();
  if (/human|agent|support|help me|aide|msaada|support humain/i.test(lower)) {
    if (sw) {
      return "Kwa matatizo ya akaunti, ulaghai, au migogoro, wasiliana na **msaada wa binadamu** kupitia **Support** kwenye app (/app/support) au barua pepe **hi@mcbuleli.org**. Jumuisha barua pepe ya akaunti yako na maelezo mafupi. 💚";
    }
    if (fr) {
      return "Pour les problèmes de compte, fraude ou litiges, contactez notre **support humain** via **Support** dans l'app (/app/support) ou **hi@mcbuleli.org**. Indiquez votre e-mail et un bref résumé. 💚";
    }
    return "For personal account issues, fraud, or disputes, please contact our human support team via **Support** in the app (/app/support) or email **hi@mcbuleli.org**. Include your account email and a short description. 💚";
  }
  if (/deposit|dépôt|amana|txid/i.test(lower)) {
    return "To deposit USDT: go to **Wallet → Deposit**, choose your network (TRC20 is often cheapest), send to the address shown, then paste your **TXID** to confirm. Need step-by-step help? Tell me which network you prefer.";
  }
  if (/withdraw|retrait|kutoa/i.test(lower)) {
    return "To withdraw USDT: **Wallet → Withdraw**. Enter address, network, and net amount. Platform fee is **2 USDT** (external). Minimum net **5 USDT** external / **1 USDT** internal McBuleli. Track status in withdrawal history. Enable 2FA for security.";
  }
  if (/p2p|escrow|mobile money/i.test(lower)) {
    return "McBuleli P2P uses **escrow** — the seller's crypto is locked until you confirm mobile money payment. Never pay outside the platform. Browse offers at **P2P Marketplace** in the app.";
  }
  if (/kyc|verify|identit/i.test(lower)) {
    return "Complete KYC in **Profile → KYC** using Didit. Have your ID ready. Verification unlocks higher limits and more features.";
  }
  if (/bot|trading|trade/i.test(lower)) {
    return "McBuleli offers **AI Trading Bots** under Trade → Bots. Start small — crypto trading involves risk of loss. I can explain setup if you'd like.";
  }
  if (/avec|tontine|group|épargne/i.test(lower)) {
    return "**AVEC** is group savings for communities — like a digital tontine. Find it under **Groups** in the app. Members contribute and can access internal loans.";
  }
  if (/stak/i.test(lower)) {
    return "**Staking** lets you earn rewards on locked crypto. Check **Staking** in the app for current programs, APY, and minimums.";
  }
  if (/crypto|blockchain|wallet|usdt|beginner|débutant/i.test(lower)) {
    return "Welcome! **Crypto** is digital money. **USDT** stays near $1 — good for saving and transfers. Your **McBuleli wallet** holds USDT and Pi. Start with a small deposit and explore P2P when ready. What would you like to learn first? 💚";
  }
  if (/security|password|2fa|passkey/i.test(lower)) {
    return "Secure your account in **Profile → Security**: strong password, **2FA** (authenticator app), **passkey**, and WhatsApp recovery. McBuleli never asks for your password in chat.";
  }
  const kbMatch = systemPrompt.match(/KNOWLEDGE BASE[\s\S]*?\[1\]/);
  if (kbMatch) {
    if (sw) {
      return "Kulingana na miongozo ya McBuleli: nina taarifa husika. Ungependa nieleze zaidi kuhusu amana, P2P, KYC, biashara, AVEC, au staking? 💚";
    }
    if (fr) {
      return "D'après les guides McBuleli : j'ai trouvé des informations pertinentes. Souhaitez-vous des détails sur dépôts, P2P, KYC, trading, AVEC ou staking ? 💚";
    }
    return "Based on McBuleli's guides: I found relevant info in our knowledge base. Could you tell me more specifically what you need? I can explain deposits, P2P, KYC, trading, AVEC, or staking. 💚";
  }
  if (sw) {
    return "Karibu McBuleli!\n\nNaweza kusaidia kuhusu:\n- Misingi ya crypto\n- Amana / kutoa USDT, escrow P2P, pesa ya simu\n- Boti za AI, Academy, AVEC, staking, KYC\n\nUngependa kujua nini kuhusu jukwaa?";
  }
  if (fr) {
    return "Bienvenue sur McBuleli !\n\nJe peux vous aider sur :\n- Bases crypto\n- Dépôts / retraits USDT, P2P, mobile money\n- Bots IA, Academy, AVEC, staking, KYC\n\nQue souhaitez-vous explorer sur McBuleli ?";
  }
  return "Welcome to McBuleli!\n\nI can help with:\n- Crypto basics\n- USDT deposits / withdrawals, P2P, mobile money\n- AI bots, Academy, AVEC, staking, KYC\n\nWhat would you like to explore on McBuleli?";
}
