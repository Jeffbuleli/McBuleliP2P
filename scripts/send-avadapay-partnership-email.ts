/** Backward-compatible entry — delegates to send-partnership-email.ts */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(dir, "send-partnership-email.ts");
const result = spawnSync(
  process.execPath,
  ["--import", "tsx", script, ...process.argv.slice(2)],
  { stdio: "inherit", cwd: path.join(dir, "..") },
);
process.exit(result.status ?? 1);
