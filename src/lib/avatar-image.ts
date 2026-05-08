const MAX_BYTES = 512 * 1024;

export function detectImageMime(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function assertAvatarImageBuffer(buf: Buffer): { ok: true; mime: "image/jpeg" | "image/png" | "image/webp" } | { ok: false; error: string } {
  if (buf.length > MAX_BYTES) {
    return { ok: false, error: "avatar_too_large" };
  }
  const mime = detectImageMime(buf);
  if (!mime) {
    return { ok: false, error: "avatar_invalid_type" };
  }
  return { ok: true, mime };
}

export { MAX_BYTES as AVATAR_MAX_BYTES };
