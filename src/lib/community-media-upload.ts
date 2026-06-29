/** Client - upload images/videos via serveur Render → R2 (pas de presign navigateur). */

import { fetchJson } from "@/lib/community/fetch-json";
import { prepareCommunityImageBlob } from "@/lib/community-image";

export async function uploadCommunityVideo(
  file: File,
  kind: "posts" | "blogs" | "covers" | "avatars" | "stories" = "posts",
): Promise<{ id: string; url: string }> {
  return uploadCommunityVideoWithProgress(
    file,
    kind === "avatars" ? "posts" : kind,
  );
}

/** Video upload with progress - pre-upload before publishing. */
export function uploadCommunityVideoWithProgress(
  file: File,
  kind: "posts" | "blogs" | "covers" | "stories" = "posts",
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

/** Upload image via serveur uniquement - évite les orphelins presign/pending sur R2. */
export async function uploadCommunityImage(
  file: File,
  kind: "posts" | "blogs" | "covers" | "avatars" | "stories" = "posts",
): Promise<{ id: string; url: string }> {
  const prep = await prepareCommunityImageBlob(file);
  const form = new FormData();
  form.append(
    "file",
    new File([prep.blob], "upload.webp", { type: prep.mime }),
  );
  form.append("kind", kind);

  const direct = await fetchJson<{ error?: string; id?: string; url?: string }>(
    "/api/community/media/upload",
    { method: "POST", body: form, timeoutMs: 90_000 },
  );

  if (direct.ok && direct.data.id) {
    return { id: direct.data.id, url: direct.data.url! };
  }

  throw new Error(direct.data.error ?? "upload_failed");
}
