/** Client-side: resize/compress payment proof to JPEG for reliable upload & display. */

const MAX_EDGE = 1280;
const TARGET_MAX_BYTES = 220_000;
const MIN_QUALITY = 0.52;

function isLikelyImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(file.name);
}

function estimateBytesFromDataUrl(dataUrl: string): number {
  const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
  return Math.ceil((b64.length * 3) / 4);
}

export async function prepareP2pProofFile(
  file: File,
): Promise<{ dataUrl: string; mime: string; sizeBytes: number }> {
  if (!isLikelyImage(file)) {
    throw new Error("p2p_proof_invalid");
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    bitmap = null;
  }

  if (!bitmap) {
    const raw = await readAsDataUrl(file);
    if (!raw.startsWith("data:image/")) throw new Error("p2p_proof_invalid");
    const sizeBytes = estimateBytesFromDataUrl(raw);
    if (sizeBytes > TARGET_MAX_BYTES * 2) throw new Error("p2p_proof_too_large");
    return { dataUrl: raw, mime: mimeFromDataUrl(raw), sizeBytes };
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height, 1));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("p2p_proof_invalid");
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = 0.85;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (estimateBytesFromDataUrl(dataUrl) > TARGET_MAX_BYTES && quality > MIN_QUALITY) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  const sizeBytes = estimateBytesFromDataUrl(dataUrl);
  if (sizeBytes > TARGET_MAX_BYTES * 1.15) {
    throw new Error("p2p_proof_too_large");
  }

  return { dataUrl, mime: "image/jpeg", sizeBytes };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("read_failed"));
    r.onload = () => resolve(String(r.result || ""));
    r.readAsDataURL(file);
  });
}

function mimeFromDataUrl(dataUrl: string): string {
  const m = /^data:(image\/[a-z0-9.+-]+);/i.exec(dataUrl)?.[1]?.toLowerCase();
  if (!m) return "image/jpeg";
  if (m === "image/jpg") return "image/jpeg";
  if (["image/jpeg", "image/png", "image/webp"].includes(m)) return m;
  return "image/jpeg";
}
