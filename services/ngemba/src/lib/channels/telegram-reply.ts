import { readEnvKey } from "@/lib/env";

export function telegramBotToken(): string | null {
  return readEnvKey("Telegram_Bot_Token") || readEnvKey("TELEGRAM_BOT_TOKEN");
}

function api(method: string): string | null {
  const token = telegramBotToken();
  if (!token) return null;
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function telegramSendMessage(
  chatId: string,
  text: string,
): Promise<void> {
  const url = api("sendMessage");
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4000),
    }),
  }).catch((err) => {
    console.warn("[ngemba] telegram sendMessage failed", err);
  });
}

export async function telegramSendAudio(
  chatId: string,
  mp3: Buffer,
): Promise<void> {
  const url = api("sendAudio");
  if (!url) return;
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append(
    "audio",
    new Blob([new Uint8Array(mp3)], { type: "audio/mpeg" }),
    "ngemba.mp3",
  );
  form.append("title", "Ngemba");
  await fetch(url, { method: "POST", body: form }).catch((err) => {
    console.warn("[ngemba] telegram sendAudio failed", err);
  });
}

export async function telegramDownloadFile(fileId: string): Promise<Buffer | null> {
  const token = telegramBotToken();
  const infoUrl = api("getFile");
  if (!token || !infoUrl) return null;
  const info = await fetch(`${infoUrl}?file_id=${encodeURIComponent(fileId)}`);
  if (!info.ok) return null;
  const data = (await info.json()) as {
    ok?: boolean;
    result?: { file_path?: string };
  };
  const path = data.result?.file_path;
  if (!data.ok || !path) return null;
  const file = await fetch(
    `https://api.telegram.org/file/bot${token}/${path}`,
  );
  if (!file.ok) return null;
  return Buffer.from(await file.arrayBuffer());
}
