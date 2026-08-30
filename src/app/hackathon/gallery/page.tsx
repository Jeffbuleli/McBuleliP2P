import { HackathonGalleryClient } from "@/components/hackathon/hackathon-gallery-client";

export const metadata = {
  title: "Galerie photos - McBuleli Hackathon",
  description:
    "Photos du McBuleli Hackathon Kinshasa 2026 - téléchargement HD.",
  robots: { index: true, follow: true },
};

export default function HackathonGalleryPage() {
  return <HackathonGalleryClient />;
}
