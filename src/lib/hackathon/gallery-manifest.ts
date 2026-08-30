/**
 * McBuleli Hackathon Kinshasa 2026 — photo gallery (R2).
 * Populated by scripts/upload-hackathon-gallery-r2.ts
 */
export type HackathonGalleryPhoto = {
  id: string;
  batch: string;
  fileName: string;
  thumbUrl: string;
  hdUrl: string;
};

export const HACKATHON_GALLERY_PHOTOS: HackathonGalleryPhoto[] = [];

export const HACKATHON_GALLERY_READY = HACKATHON_GALLERY_PHOTOS.length > 0;
