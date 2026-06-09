/** Client — compression image feed (économie données). */

const MAX_EDGE = 1080;
const TARGET_MAX_BYTES = 280_000;

function estimateBytes(dataUrl: string): number {
  const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
  return Math.ceil((b64.length * 3) / 4);
}

async function loadImageSource(file: File): Promise<{
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  cleanup: () => void;
}> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (bitmap) {
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => {
        ctx.drawImage(bitmap, 0, 0, w, h);
      },
      cleanup: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("community_image_invalid"));
      el.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => {
        ctx.drawImage(img, 0, 0, w, h);
      },
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  quality: number,
): { dataUrl: string; mime: string } {
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) {
    return { dataUrl: webp, mime: "image/webp" };
  }
  const jpeg = canvas.toDataURL("image/jpeg", quality);
  return { dataUrl: jpeg, mime: "image/jpeg" };
}

export async function prepareCommunityImageFile(
  file: File,
): Promise<{ dataUrl: string; mime: string; sizeBytes: number }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("community_image_invalid");
  }

  const source = await loadImageSource(file);
  try {
    const scale = Math.min(
      1,
      MAX_EDGE / Math.max(source.width, source.height, 1),
    );
    const w = Math.max(1, Math.round(source.width * scale));
    const h = Math.max(1, Math.round(source.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("community_image_invalid");
    source.draw(ctx, w, h);

    let quality = 0.82;
    let { dataUrl, mime } = canvasToDataUrl(canvas, quality);
    while (estimateBytes(dataUrl) > TARGET_MAX_BYTES && quality > 0.45) {
      quality -= 0.08;
      ({ dataUrl, mime } = canvasToDataUrl(canvas, quality));
    }

    if (estimateBytes(dataUrl) > TARGET_MAX_BYTES * 1.5) {
      throw new Error("community_image_too_large");
    }

    return {
      dataUrl,
      mime,
      sizeBytes: estimateBytes(dataUrl),
    };
  } finally {
    source.cleanup();
  }
}
