import type { Metadata } from "next";
import { Bodoni_Moda, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DemoBar } from "@/components/site/DemoBar";
import { SetupNotice } from "@/components/site/SetupNotice";
import { isDatabaseSeeded } from "@/lib/auth";

/**
 * Başlık yüzü: yüksek kontrastlı didone. Çiçekçi vitrininin ve hediye kartının
 * kibarlığını taşır; iri boyda kullanılır, gövde metnine hiç girmez.
 */
const display = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bodoni",
  display: "swap",
  style: ["normal", "italic"],
});

/** Gövde yüzü: geometrik ama yuvarlak omuzlu — didonenin sertliğini dengeler. */
const sans = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Çiçek Sepeti — Çok satıcılı çiçek ve hediye platformu",
    template: "%s · Çiçek Sepeti",
  },
  description:
    "Türkiye'nin çiçekçilerini tek çatı altında toplayan çok satıcılı çiçek ve hediye platformu. Bu bir sunum demosudur.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const seeded = await isDatabaseSeeded();

  return (
    <html
      lang="tr"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen">
        {seeded ? (
          <>
            <DemoBar />
            {children}
          </>
        ) : (
          <SetupNotice />
        )}
      </body>
    </html>
  );
}
