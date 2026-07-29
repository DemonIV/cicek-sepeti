import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Depo dışındaki lockfile'lar yüzünden yanlış kök seçilmesin.
  outputFileTracingRoot: import.meta.dirname,
  images: {
    // Ölçeklendirme Unsplash CDN'ine devredildi — gerekçesi ve ölçümü
    // `src/lib/image-loader.ts` başındaki notta. Yerleşik optimizer görselleri
    // kendi sunucumuzda açtığı için 512 MB'lık kutuda süreci OOM ile
    // öldürüyordu. Özel yükleyici devredeyken `remotePatterns`, `formats` ve
    // `minimumCacheTTL` yerleşik optimizere ait olduğundan işlemez; AVIF/WebP
    // seçimini `auto=format`, önbelleği Unsplash kenarı üstlenir.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Kart genişliği 2 sütunlu telefondan 6 sütunlu masaüstüne kadar değişiyor.
    // Ara ölçüler olmazsa srcset bir üst basamağa yuvarlıyor: ya gereksiz ağır
    // dosya iniyor ya da 1.5x/2x ekranda yumuşama görülüyor.
    imageSizes: [16, 32, 48, 64, 96, 128, 200, 256, 320, 384],
  },
};

export default nextConfig;
