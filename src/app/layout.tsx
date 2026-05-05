import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/get-locale";
import { I18nProvider } from "@/components/i18n-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalLangSwitch } from "@/components/conditional-lang-switch";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  ...(appUrl ? { metadataBase: new URL(appUrl) } : {}),
  title: {
    default: "McBuleli",
    template: "%s · McBuleli",
  },
  description:
    "Buy & sell crypto with mobile money — P2P escrow, wallet, and secure transfers in Africa.",
  applicationName: "McBuleli",
  icons: {
    icon: [{ url: "/brand/logo.png", type: "image/png", sizes: "any" }],
    shortcut: "/brand/logo.png",
    apple: "/brand/logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "McBuleli",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0a09",
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
            <ConditionalLangSwitch />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
