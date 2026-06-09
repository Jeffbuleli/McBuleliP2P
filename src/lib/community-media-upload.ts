/** Client — upload image communauté via R2 (presign) ou inline fallback. */

import { fetchJson } from "@/lib/community/fetch-json";
import {
  prepareCommunityImageBlob,
  prepareCommunityImageFile,
} from "@/lib/community-image";

export async function uploadCommunityImage(
  file: File,
  kind: "posts" | "blogs" | "covers" | "avatars" = "posts",
): Promise<{ id: string; url: string }> {
  const prep = await prepareCommunityImageBlob(file);

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

  if (
    presign.ok &&
    presign.data.id &&
    presign.data.uploadUrl
  ) {
    const putRes = await fetch(presign.data.uploadUrl, {
      method: "PUT",
      body: prep.blob,
      headers: { "Content-Type": prep.mime },
    });
    if (!putRes.ok) {
      throw new Error("r2_upload_failed");
    }

    const complete = await fetchJson<{ error?: string; id?: string; url?: string }>(
      "/api/community/media/complete",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: presign.data.id }),
      },
    );
    if (!complete.ok || !complete.data.id) {
      throw new Error(complete.data.error ?? "r2_complete_failed");
    }
    return { id: complete.data.id, url: complete.data.url ?? presign.data.publicUrl! };
  }

  if (presign.data.error && presign.data.error !== "r2_not_configured") {
    throw new Error(presign.data.error);
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
