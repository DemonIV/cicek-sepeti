import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Depo dışındaki lockfile'lar yüzünden yanlış kök seçilmesin.
  outputFileTracingRoot: import.meta.dirname,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
    // Ürün fotoğrafı bu vitrinin kahramanı: AVIF/WebP aynı bant genişliğinde
    // belirgin biçimde daha temiz görüntü verir. Sıra önemli — tarayıcı
    // desteklediği ilk biçimi alır.
    formats: ["image/avif", "image/webp"],
    // Kart genişliği 2 sütunlu telefondan 6 sütunlu masaüstüne kadar değişiyor.
    // Ara ölçüler olmazsa optimizer bir üst basamağa yuvarlıyor: ya gereksiz
    // ağır dosya iniyor ya da 1.5x/2x ekranda yumuşama görülüyor.
    imageSizes: [16, 32, 48, 64, 96, 128, 200, 256, 320, 384],
    // Optimize edilmiş kareler 31 gün önbellekte kalsın (varsayılan 60 sn).
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
