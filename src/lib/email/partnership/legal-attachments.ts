import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { ResendFileAttachment } from "@/lib/email/send";

export const LEGAL_DOCS_DIR = path.join(process.cwd(), "content", "legal-private");

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/** Preferred filenames (place scans here - never commit). */
const PREFERRED_LEGAL_FILES = [
  "rccm-1.pdf",
  "rccm-1.png",
  "rccm-2.pdf",
  "rccm-2.png",
  "id-nat.pdf",
  "id-nat.png",
  "id_nat.pdf",
  "id_nat.png",
] as const;

/** Legacy root-level scans (gitignored). */
const LEGACY_ROOT_FILES = ["RCCM1.png", "RCCM2.png", "ID NAT.png"] as const;

function mimeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

function readFileAttachment(absPath: string, filename: string): ResendFileAttachment {
  const content = readFileSync(absPath).toString("base64");
  return { filename, content, content_type: mimeFor(absPath) };
}

function resolveExisting(paths: string[]): string | null {
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

/** Lists legal files available locally (for CLI hints). */
export function listLocalLegalDocumentPaths(): string[] {
  const found: string[] = [];

  for (const name of PREFERRED_LEGAL_FILES) {
    const abs = path.join(LEGAL_DOCS_DIR, name);
    if (existsSync(abs)) found.push(abs);
  }

  if (existsSync(LEGAL_DOCS_DIR)) {
    for (const entry of readdirSync(LEGAL_DOCS_DIR, { withFileTypes: true })) {
      if (!entry.isFile() || entry.name === "README.md" || entry.name === ".gitignore") continue;
      const abs = path.join(LEGAL_DOCS_DIR, entry.name);
      if (!found.includes(abs)) found.push(abs);
    }
  }

  for (const name of LEGACY_ROOT_FILES) {
    const abs = path.join(process.cwd(), name);
    if (existsSync(abs)) found.push(abs);
  }

  return found.sort();
}

/** RCCM + ID NAT attachments for Resend (base64). */
export function buildLegalDocumentAttachments(): ResendFileAttachment[] {
  const attachments: ResendFileAttachment[] = [];
  const seen = new Set<string>();

  function add(absPath: string, displayName?: string) {
    const filename = displayName ?? path.basename(absPath);
    if (seen.has(filename)) return;
    seen.add(filename);
    attachments.push(readFileAttachment(absPath, filename));
  }

  const rccm1 = resolveExisting([
    path.join(LEGAL_DOCS_DIR, "rccm-1.pdf"),
    path.join(LEGAL_DOCS_DIR, "rccm-1.png"),
    path.join(process.cwd(), "RCCM1.png"),
  ]);
  if (rccm1) add(rccm1, "McBuleli-RCCM-1" + path.extname(rccm1));

  const rccm2 = resolveExisting([
    path.join(LEGAL_DOCS_DIR, "rccm-2.pdf"),
    path.join(LEGAL_DOCS_DIR, "rccm-2.png"),
    path.join(process.cwd(), "RCCM2.png"),
  ]);
  if (rccm2) add(rccm2, "McBuleli-RCCM-2" + path.extname(rccm2));

  const idNat = resolveExisting([
    path.join(LEGAL_DOCS_DIR, "id-nat.pdf"),
    path.join(LEGAL_DOCS_DIR, "id-nat.png"),
    path.join(LEGAL_DOCS_DIR, "id_nat.pdf"),
    path.join(LEGAL_DOCS_DIR, "id_nat.png"),
    path.join(process.cwd(), "ID NAT.png"),
  ]);
  if (idNat) add(idNat, "McBuleli-ID-NAT" + path.extname(idNat));

  return attachments;
}
