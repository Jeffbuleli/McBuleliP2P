import type { ReactNode } from "react";
import { Manrope, Syne } from "next/font/google";
import "@/components/eavec-market/marche-world.css";

const mkDisplay = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-mk-display",
  display: "swap",
});

const mkBody = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-mk-body",
  display: "swap",
});

export default function MarcheWorldLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`mk-world ${mkDisplay.variable} ${mkBody.variable}`}>
      {children}
    </div>
  );
}
