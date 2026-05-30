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

/** Rule-based fallback when OPENAI_API_KEY is not set. */
function fallbackAssistantReply(
  userMessage: string,
  systemPrompt: string,
): string {
  const lower = userMessage.toLowerCase();
  if (/human|agent|support|help me|aide|msaada|support humain/i.test(lower)) {
    return "For personal account issues, fraud, or disputes, please contact our human support team via **Support** in the app (/app/support) or email **hi@mcbuleli.org**. Include your account email and a short description. 💚";
  }
  if (/deposit|dépôt|amana|txid/i.test(lower)) {
    return "To deposit USDT: go to **Wallet → Deposit**, choose your network (TRC20 is often cheapest), send to the address shown, then paste your **TXID** to confirm. Need step-by-step help? Tell me which network you prefer.";
  }
  if (/withdraw|retrait|kutoa/i.test(lower)) {
    return "To withdraw USDT: **Wallet → Withdraw**. Enter address, network, and net amount. Platform fee is ~2 USDT. Track status in your withdrawal history. Enable 2FA for security.";
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
    return "Based on McBuleli's guides: I found relevant info in our knowledge base. Could you tell me more specifically what you need? I can explain deposits, P2P, KYC, trading, AVEC, or staking. 💚";
  }
  return "Welcome to McBuleli! 👋 I can help with crypto basics, USDT deposits/withdrawals, P2P escrow, mobile money, AI trading bots, AVEC savings, staking, and KYC. What would you like to explore? Visit https://mcbuleli.org or ask me anything.";
}
