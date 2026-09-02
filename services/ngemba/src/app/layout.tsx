import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NGEMBA - Sécurité et paix",
  description: "Alertez - McBuleli IA comprend - orientation humaine.",
  applicationName: "NGEMBA",
};

export const viewport: Viewport = {
  themeColor: "#06402b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={poppins.variable}>
      <body className="min-h-dvh font-sans antialiased text-ng-text">
        {children}
      </body>
    </html>
  );
}
