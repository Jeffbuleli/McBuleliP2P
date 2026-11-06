import { NextResponse } from "next/server";
import { handleTelegramInbound } from "@/lib/channels/telegram-inbound";
import {
  telegramBotToken,
  telegramDownloadFile,
  telegramSendAudio,
  telegramSendMessage,
} from "@/lib/channels/telegram-reply";
import { readEnvKey } from "@/lib/env";
import { synthesizeSpeech, transcribeWithEleven } from "@/lib/voice/elevenlabs";

type TgMessage = {
  message_id?: number;
  text?: string;
  voice?: { file_id?: string };
  audio?: { file_id?: string };
  chat?: { id?: number };
  from?: { id?: number; language_code?: string };
};

/** Telegram appelle cette URL directement. Répond au texte et au vocal. */
export async function POST(req: Request) {
  if (!telegramBotToken()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const secret = readEnvKey("NGEMBA_TELEGRAM_WEBHOOK_SECRET");
  if (secret) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: { update_id?: number; message?: TgMessage };
  try {
    update = (await req.json()) as { update_id?: number; message?: TgMessage };
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  const chatId = message?.chat?.id;
  if (!message || chatId == null) {
    return NextResponse.json({ ok: true });
  }

  const chat = String(chatId);
  const userId = String(message.from?.id ?? chatId);
  const voiceId = message.voice?.file_id || message.audio?.file_id;
  let text = message.text?.trim() ?? "";

  if (!text && voiceId) {
    const audio = await telegramDownloadFile(voiceId);
    if (audio) {
      text =
        (await transcribeWithEleven(audio, "audio/ogg", "telegram.ogg")) || "";
    }
  }

  if (!text) {
    await telegramSendMessage(
      chat,
      "Je suis là. Écrivez, ou envoyez un message vocal.",
    );
    return NextResponse.json({ ok: true });
  }

  const result = await handleTelegramInbound({
    idempotencyKey: `tg:${update.update_id ?? message.message_id ?? Date.now()}`,
    telegramUserId: userId,
    telegramChatId: chat,
    text,
    locale: "fr",
  });

  if ("error" in result) {
    await telegramSendMessage(
      chat,
      "Je n'ai pas pu répondre tout de suite. Réessayez dans un instant.",
    );
    return NextResponse.json({ ok: true });
  }

  const reply = result.replies[0]?.body?.trim();
  if (reply) {
    await telegramSendMessage(chat, reply);
    const spoken = await synthesizeSpeech(reply);
    if (spoken) await telegramSendAudio(chat, spoken);
  }

  return NextResponse.json({ ok: true });
}
