export type BotActivityLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR";
export type BotLiveStatus = "ACTIVE" | "ANALYZING" | "WAITING" | "TRADING";

export type BotLiveActivity = {
  id: string;
  time: string;
  type: BotActivityLevel;
  message: string;
};

const TICK_MS = 4_000;
const WINDOW = 20;

const SCRIPT: Array<{ type: BotActivityLevel; message: string }> = [
  { type: "INFO", message: "Connecting to exchange..." },
  { type: "INFO", message: "Fetching market data..." },
  { type: "INFO", message: "Analyzing BTC/USDT..." },
  { type: "INFO", message: "Waiting for signal..." },
  { type: "SUCCESS", message: "LONG signal detected" },
  { type: "INFO", message: "Executing order..." },
  { type: "SUCCESS", message: "Position opened" },
  { type: "SUCCESS", message: "Take Profit reached" },
  { type: "WARNING", message: "Stop Loss triggered" },
];

const STATUSES: BotLiveStatus[] = ["ACTIVE", "ANALYZING", "WAITING", "TRADING"];

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Deterministic mock feed - no DB, no trading logic. */
export function buildMockBotActivityFeed(now = Date.now()): {
  status: BotLiveStatus;
  activities: BotLiveActivity[];
} {
  const tick = Math.floor(now / TICK_MS);
  const status = STATUSES[tick % STATUSES.length]!;
  const activities: BotLiveActivity[] = [];

  for (let i = 0; i < WINDOW; i++) {
    const t = tick - i;
    if (t < 0) continue;
    const step = SCRIPT[t % SCRIPT.length]!;
    activities.push({
      id: `mock-${t}`,
      time: fmtTime(new Date(now - i * TICK_MS)),
      type: step.type,
      message: step.message,
    });
  }

  return { status, activities };
}
