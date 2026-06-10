/** Client — upload image via serveur (fiable mobile) avec fallback presign/inline. */

import { fetchJson } from "@/lib/community/fetch-json";
import {
  prepareCommunityImageBlob,
  prepareCommunityImageFile,
} from "@/lib/community-image";

export async function uploadCommunityVideo(
  file: File,
  kind: "posts" | "blogs" | "covers" = "posts",
): Promise<{ id: string; url: string }> {
  return uploadCommunityVideoWithProgress(file, kind);
}

/** Video upload with progress — pre-upload before publishing. */
export function uploadCommunityVideoWithProgress(
  file: File,
  kind: "posts" | "blogs" | "covers" = "posts",
  onProgress?: (pct: number) => void,
): Promise<{ id: string; url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as {
          error?: string;
          id?: string;
          url?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && data.id) {
          resolve({ id: data.id, url: data.url! });
          return;
        }
        reject(new Error(data.error ?? "upload_failed"));
      } catch {
        reject(new Error("upload_failed"));
      }
    };

    xhr.onerror = () => reject(new Error("network_error"));
    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.timeout = 120_000;
    xhr.open("POST", "/api/community/media/upload");
    xhr.send(form);
  });
}

export async function uploadCommunityImage(
  file: File,
  kind: "posts" | "blogs" | "covers" | "avatars" = "posts",
): Promise<{ id: string; url: string }> {
  const prep = await prepareCommunityImageBlob(file);

  try {
    const form = new FormData();
    form.append(
      "file",
      new File([prep.blob], "upload.webp", { type: prep.mime }),
    );
    form.append("kind", kind);

    const direct = await fetchJson<{ error?: string; id?: string; url?: string }>(
      "/api/community/media/upload",
      { method: "POST", body: form, timeoutMs: 60_000 },
    );
    if (direct.ok && direct.data.id) {
      return { id: direct.data.id, url: direct.data.url! };
    }
    if (
      direct.data.error &&
      direct.data.error !== "r2_not_configured"
    ) {
      throw new Error(direct.data.error);
    }
  } catch (e) {
    if (e instanceof Error && e.message === "timeout") throw e;
    /* fallback presign / inline */
  }

  const presign = await fetchJson<{
    error?: string;
    id?: string;
    uploadUrl?: string;
    publicUrl?: string;
  }>("/api/community/media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mime: prep.mime,
      sizeBytes: prep.sizeBytes,
      kind,
    }),
  });

  if (presign.ok && presign.data.id && presign.data.uploadUrl) {
    try {
      const putRes = await fetch(presign.data.uploadUrl, {
        method: "PUT",
        body: prep.blob,
        headers: { "Content-Type": prep.mime },
      });
      if (putRes.ok) {
        const complete = await fetchJson<{
          error?: string;
          id?: string;
          url?: string;
        }>("/api/community/media/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId: presign.data.id }),
        });
        if (complete.ok && complete.data.id) {
          return {
            id: complete.data.id,
            url: complete.data.url ?? presign.data.publicUrl!,
          };
        }
      }
    } catch {
      /* presign PUT failed (CORS) — retry server upload once */
      const form = new FormData();
      form.append(
        "file",
        new File([prep.blob], "upload.webp", { type: prep.mime }),
      );
      form.append("kind", kind);
      const retry = await fetchJson<{ error?: string; id?: string; url?: string }>(
        "/api/community/media/upload",
        { method: "POST", body: form, timeoutMs: 60_000 },
      );
      if (retry.ok && retry.data.id) {
        return { id: retry.data.id, url: retry.data.url! };
      }
    }
  }

  const inline = await prepareCommunityImageFile(file);
  const legacy = await fetchJson<{ error?: string; id?: string; url?: string }>(
    "/api/community/media",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inline),
    },
  );
  if (!legacy.ok || !legacy.data.id) {
    throw new Error(legacy.data.error ?? "upload_failed");
  }
  return { id: legacy.data.id, url: legacy.data.url! };
}
