import fs from "fs";
import path from "path";

/** Lit une clé depuis process.env ou le .env racine McBuleli (dev local). */
export function readEnvKey(name: string): string | null {
  const direct = process.env[name]?.trim();
  if (direct) return direct;
  try {
    const rootEnv = path.resolve(process.cwd(), "../../.env");
    const text = fs.readFileSync(rootEnv, "utf8");
    const line = text.split("\n").find((l) => l.startsWith(`${name}=`));
    if (!line) return null;
    return line
      .slice(name.length + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  } catch {
    return null;
  }
}
