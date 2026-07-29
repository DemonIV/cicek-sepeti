/**
 * Next `next/image` özel yükleyicisi — görselleri Unsplash CDN'ine boyutlatır.
 *
 * Neden: yerleşik optimizer görseli **kendi sunucumuzda** açar. Seed'deki
 * Unsplash URL'leri ham dosyaya işaret ediyor (tanesi ~7 MB, ~6000 px). Katalog
 * sayfası bir seferde onlarca kare istediği için 512 MB'lık bir kutuda (Render
 * free plan) Node süreci `sharp` çözerken bellek yetmeyip ölüyor ve tüm site
 * 502 veriyor. Ölçüldü: yayına alınan ilk sürüm bu yüzden düştü.
 *
 * Çözüm: ölçeklendirmeyi Unsplash'in imgix altyapısına devret. `w` istenen
 * genişliği, `auto=format` tarayıcının kabul ettiği en iyi biçimi (AVIF/WebP)
 * verir — yani AVIF ve responsive srcset kazanımı korunur, bize düşen iş sıfır
 * olur. Kareler Unsplash kenar önbelleğinden gelir.
 *
 * Uzak konak Unsplash değilse URL olduğu gibi geçer (satıcı panelinden elle
 * girilen görseller). Özel yükleyici devrede olduğu için `remotePatterns`
 * artık konak doğrulaması yapmaz; demo için kabul edilebilir.
 */

const UNSPLASH_HOSTS = ["images.unsplash.com", "plus.unsplash.com"];

export default function unsplashLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src.startsWith("https://")) return src;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  if (!UNSPLASH_HOSTS.includes(url.hostname)) return src;

  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 88));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  return url.toString();
}
