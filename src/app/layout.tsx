import type { Metadata } from "next";
import { Bodoni_Moda, Poppins, Outfit, Nunito } from "next/font/google";
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

/**
 * Veri ve etiket yüzü: Nunito (müşteri isteği, 26 Ağustos 2026 — ciceksepeti.com
 * gibi yuvarlak uçlu tek bir sansta buluşan arayüz).
 *
 * Seçim tahmin değil: ciceksepeti.com'un stil dosyası okundu, tek metin yüzü
 * olarak `@font-face { font-family: Nunito }` (400 ve 600, next/font ile kendi
 * sunucusundan) tanımlıyor. Yani bu slot artık birebir aynı yüz.
 *
 * Bu slot tarihsel olarak "mono" adını taşıyor (`--font-mono`, `.mono`,
 * `font-mono`) ama ARTIK MONOSPACE DEĞİL. Slotun gerçek işi kod değil,
 * 9–11 px büyük harfli mikro etiket (`.eyebrow`, `.gift-note-label`, ürün
 * kartındaki satıcı satırı) ve sipariş numarası gibi tabular veri. Plex Mono
 * bu işi görüyordu ama teknik bir yüzdü; Nunito yuvarlak omuzlarıyla gövdedeki
 * Poppins'in yanında aynı ailedenmiş gibi durur ve mikro etiketi ısıtır.
 *
 * `latin-ext` şart: Türkçe glifler (ğ, ş, İ, ı, ç) latin altkümesinde yok,
 * eksik bırakılırsa "SİPARİŞ NO" gibi etiketler sistem yüzüne düşer.
 * Nunito değişken eksenli (wght 200–1000), o yüzden ağırlık listesi yok —
 * 60 kullanımın 27'si semibold/bold ve hepsi gerçek ağırlıktan çiziliyor.
 */
const mono = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito",
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
