import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { Icon } from "@/components/ui/Icon";
import type {
  CategoryShowcase as Showcase,
  ShowcaseBanner,
  ShowcaseRow,
  ShowcaseTile,
} from "@/lib/category-showcase";

/**
 * Kategori vitrini — ürün ızgarasının üstünde duran afiş satırları ve alt
 * kategori ızgarası. Sıra `CS-NAVBAR-GOZLEM.md` §7'deki gibi:
 *
 *   ikili afiş → alt kategori ızgarası → üçlü afiş → ikili afiş → ürünler
 *
 * Afişlerin fotoğrafı gerçek bir ürünün fotoğrafıdır (`images` haritası
 * sayfada tek sorguda doldurulur). Ayrı bir görsel varlık yok, kırık görsel
 * riski yok.
 */
export function CategoryShowcase({
  showcase,
  images,
  allHref,
}: {
  showcase: Showcase;
  /** ürün slug'ı → fotoğraf adresi */
  images: Record<string, string>;
  /** "Tümünü görüntüle" kutucuğunun gittiği adres. */
  allHref: string;
}) {
  return (
    <div className="mt-6 space-y-4 sm:space-y-5">
      <BannerRow row={showcase.lead} images={images} priority />

      <TileGrid tiles={showcase.tiles} images={images} allHref={allHref} />

      {showcase.rows.map((row, index) => (
        <BannerRow key={index} row={row} images={images} />
      ))}
    </div>
  );
}

function BannerRow({
  row,
  images,
  priority = false,
}: {
  row: ShowcaseRow;
  images: Record<string, string>;
  priority?: boolean;
}) {
  const visible = row.banners.filter((banner) => images[banner.productSlug]);
  if (visible.length === 0) return null;

  return (
    <div
      className={`grid gap-3 sm:gap-4 ${
        row.size === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
      }`}
    >
      {visible.map((banner) => (
        <Banner
          key={banner.title}
          banner={banner}
          image={images[banner.productSlug]}
          sizes={row.size === 2 ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 100vw, 33vw"}
          priority={priority}
        />
      ))}
    </div>
  );
}

/**
 * Tek afiş. Referansta yazı sağda ve düz bir kutunun içinde; burada sola
 * alındı — Türkçe başlıklar uzun, sola yaslı okununca kırılmıyor. Fotoğraf
 * soldan koyulaşan bir geçişle kapatılır, yazı her fotoğrafta okunur kalır.
 */
function Banner({
  banner,
  image,
  sizes,
  priority,
}: {
  banner: ShowcaseBanner;
  image: string;
  sizes: string;
  priority: boolean;
}) {
  return (
    <Link
      href={banner.href}
      className="group relative block aspect-[12/5] overflow-hidden rounded-[var(--radius-banner-sm)] border border-line bg-plum-100 shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
    >
      <ProductImage
        src={image}
        alt=""
        sizes={sizes}
        priority={priority}
        className="transition-transform duration-700 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-r from-plum-950/90 via-plum-950/60 to-transparent" />
      <span className="absolute inset-y-0 left-0 flex max-w-[72%] flex-col justify-center gap-2 p-5 sm:p-6">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-bloom-200">
          {banner.badge}
        </span>
        <span className="font-display text-[clamp(1.15rem,2.4vw,1.75rem)] font-medium uppercase leading-[1.05] tracking-[0.01em] text-white">
          {banner.title}
        </span>
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/80 transition-colors group-hover:text-white">
          İncele
          <Icon name="arrow-right" size={13} />
        </span>
      </span>
    </Link>
  );
}

/**
 * Alt kategori ızgarası — altı sütun, sonuncusu "Tümünü görüntüle".
 * Referanstaki gibi küçük fotoğraf üstte, ad altta.
 */
function TileGrid({
  tiles,
  images,
  allHref,
}: {
  tiles: ShowcaseTile[];
  images: Record<string, string>;
  allHref: string;
}) {
  const visible = tiles.filter((tile) => images[tile.productSlug]);
  if (visible.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
      {visible.map((tile) => (
        <Link
          key={tile.label}
          href={tile.href}
          className="group flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-line bg-plum-50/60 px-2 py-3.5 text-center transition-colors hover:border-bloom-300 hover:bg-plum-50"
        >
          <span className="relative size-11 overflow-hidden rounded-full border border-line bg-surface">
            <ProductImage
              src={images[tile.productSlug]}
              alt=""
              sizes="44px"
              className="transition-transform duration-500 group-hover:scale-105"
            />
          </span>
          <span className="text-[12px] font-semibold leading-snug text-plum-800 transition-colors group-hover:text-bloom-700">
            {tile.label}
          </span>
        </Link>
      ))}

      <Link
        href={allHref}
        className="group flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-line-strong bg-surface px-2 py-3.5 text-center transition-colors hover:border-bloom-400"
      >
        <span className="grid size-11 place-items-center rounded-full bg-plum-50 text-plum-500 transition-colors group-hover:text-bloom-600">
          <Icon name="grid" size={18} />
        </span>
        <span className="text-[12px] font-semibold leading-snug text-bloom-700">
          Tümünü görüntüle
        </span>
      </Link>
    </div>
  );
}
