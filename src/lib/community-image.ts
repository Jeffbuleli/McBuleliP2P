/** Client — compression image feed (économie données). */

const MAX_EDGE = 1080;
const TARGET_MAX_BYTES = 280_000;

function estimateBytes(dataUrl: string): number {
  const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
  return Math.ceil((b64.length * 3) / 4);
}

export async function prepareCommunityImageFile(
  file: File,
): Promise<{ dataUrl: string; mime: string; sizeBytes: number }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("community_image_invalid");
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("community_image_invalid");

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height, 1));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("community_image_invalid");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = 0.82;
  let dataUrl = canvas.toDataURL("image/webp", quality);
  while (estimateBytes(dataUrl) > TARGET_MAX_BYTES && quality > 0.45) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/webp", quality);
  }

  if (estimateBytes(dataUrl) > TARGET_MAX_BYTES * 1.5) {
    throw new Error("community_image_too_large");
  }

  return {
    dataUrl,
    mime: "image/webp",
    sizeBytes: estimateBytes(dataUrl),
  };
}
