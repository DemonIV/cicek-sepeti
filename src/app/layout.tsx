import type { Metadata } from "next";
import { Bodoni_Moda, Poppins, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DemoBar } from "@/components/site/DemoBar";
import { SetupNotice } from "@/components/site/SetupNotice";
import { isDatabaseSeeded } from "@/lib/auth";

/**
 * Başlık yüzü: geometrik, açık gözlü bir sans. Didone'nin ince tırnakları
 * küçük boyda dağılıyordu; başlıkların ilk işi okunmak (müşteri isteği,
 * 21 Ağustos 2026). Outfit iri boyda ferah, 16 px'te bile net durur.
 */
const display = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/**
 * Yalnızca hediye notu için: elle yazılmış kart hissini taşıyan italik didone.
 * Başlıklardan çekildi ama imza öğesinde kaldı — dört rolün de gördüğü o kart
 * markanın kendisi.
 */
const note = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bodoni-note",
  display: "swap",
  style: ["italic"],
});

/**
 * Gövde yüzü: Poppins — geometrik, dairesel omuzlu, başlıklardaki Outfit ile
 * aynı ailedenmiş gibi duran ama gövdede daha yumuşak bir sans (müşteri isteği,
 * 25 Ağustos 2026). Poppins değişken eksen taşımadığı için ağırlıklar tek tek
 * yükleniyor.
 */
const sans = Poppins({
  subsets: ["latin", "latin-ext"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
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
      className={`${display.variable} ${sans.variable} ${note.variable} ${mono.variable}`}
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
