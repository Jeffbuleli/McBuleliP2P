import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/get-locale";
import { I18nProvider } from "@/components/i18n-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalLangSwitch } from "@/components/conditional-lang-switch";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { PwaInstallBanner } from "@/components/pwa/install-banner";
import { getAppOrigin } from "@/lib/app-url";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** Canonical URL for OG/Twitter links (WhatsApp requires absolute image URLs). */
const metadataBaseUrl = getAppOrigin() || undefined;

const desc =
  "Buy & sell crypto with mobile money — P2P escrow, wallet, and secure transfers in Africa.";

export const metadata: Metadata = {
  ...(metadataBaseUrl ? { metadataBase: new URL(metadataBaseUrl) } : {}),
  title: {
    default: "McBuleli",
    template: "%s · McBuleli",
  },
  description: desc,
  applicationName: "McBuleli",
  openGraph: {
    type: "website",
    siteName: "McBuleli",
    title: "McBuleli",
    description: desc,
  },
  twitter: {
    card: "summary_large_image",
    title: "McBuleli",
    description: desc,
  },
  icons: {
    icon: [
      { url: "/icons/icon-144.png", type: "image/png", sizes: "144x144" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-256.png", type: "image/png", sizes: "256x256" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/icons/icon-192.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "McBuleli",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  /** Align with PWA manifest — green chrome / status tint on Android */
  themeColor: "#305f33",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`dark ${inter.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans text-stone-100">
        <ThemeProvider>
          <I18nProvider initialLocale={locale}>
            <RegisterServiceWorker />
            <ConditionalLangSwitch />
            <PwaInstallBanner />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
