import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/get-locale";
import { I18nProvider } from "@/components/i18n-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalLangSwitch } from "@/components/conditional-lang-switch";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { PwaInstallBanner } from "@/components/pwa/install-banner";
import { AssistantLauncher } from "@/components/assistant/assistant-launcher";
import { CANONICAL_PRODUCTION_ORIGIN, getMetadataOrigin } from "@/lib/app-url";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** Canonical URL for OG/Twitter links (WhatsApp requires absolute image URLs). */
const metadataBaseUrl = getMetadataOrigin() || undefined;

const desc =
  "Buy and sell USDT & Pi with mobile money in DR Congo and Africa. P2P escrow, wallet, staking, AVEC savings and KYC on mcbuleli.org.";

const ogImageAlt = "McBuleli — USDT wallet, P2P & mobile money in Africa";

export const metadata: Metadata = {
  ...(metadataBaseUrl ? { metadataBase: new URL(metadataBaseUrl) } : {}),
  title: {
    default: "McBuleli — USDT Wallet, P2P & Mobile Money in Africa",
    template: "%s · McBuleli",
  },
  description: desc,
  applicationName: "McBuleli",
  openGraph: {
    type: "website",
    siteName: "McBuleli",
    title: "McBuleli — USDT Wallet, P2P & Mobile Money in Africa",
    description: desc,
    url: CANONICAL_PRODUCTION_ORIGIN,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: ogImageAlt,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "McBuleli — USDT Wallet, P2P & Mobile Money in Africa",
    description: desc,
    images: [{ url: "/opengraph-image", alt: ogImageAlt }],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/icons/icon-192.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "McBuleli — USDT Wallet, P2P & Mobile Money in Africa",
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
            <AssistantLauncher />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
