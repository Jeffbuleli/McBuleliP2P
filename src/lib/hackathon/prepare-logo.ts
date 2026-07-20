/** Client-side: compress partner/sponsor logos for FormData JSON (data URL). */

const MAX_EDGE = 480;
const TARGET_MAX_BYTES = 160_000;

function isLikelyImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name);
}

function estimateBytesFromDataUrl(dataUrl: string): number {
  const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
  return Math.ceil((b64.length * 3) / 4);
}

/**
 * Resize logo for DB storage as data URL (PNG preferred for transparency).
 */
export async function preparePartnerLogoDataUrl(file: File): Promise<string> {
  if (!isLikelyImage(file)) {
    throw new Error("logo_invalid");
  }
  if (file.size > 4_000_000) {
    throw new Error("logo_too_large");
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    bitmap = null;
  }

  if (!bitmap) {
    const raw = await readAsDataUrl(file);
    if (!raw.startsWith("data:image/")) throw new Error("logo_invalid");
    if (estimateBytesFromDataUrl(raw) > TARGET_MAX_BYTES * 1.5) {
      throw new Error("logo_too_large");
    }
    return raw;
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
    throw new Error("logo_invalid");
  }
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let dataUrl = canvas.toDataURL("image/png");
  if (estimateBytesFromDataUrl(dataUrl) > TARGET_MAX_BYTES) {
    let quality = 0.9;
    dataUrl = canvas.toDataURL("image/webp", quality);
    while (estimateBytesFromDataUrl(dataUrl) > TARGET_MAX_BYTES && quality > 0.5) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL("image/webp", quality);
    }
  }

  if (estimateBytesFromDataUrl(dataUrl) > TARGET_MAX_BYTES * 1.2) {
    throw new Error("logo_too_large");
  }
  return dataUrl;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("read_failed"));
    r.onload = () => resolve(String(r.result || ""));
    r.readAsDataURL(file);
  });
}
