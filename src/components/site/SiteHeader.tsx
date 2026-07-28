import Link from "next/link";
import { db } from "@/lib/db";
import { getCartCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/ui/Icon";
import { ProductImage } from "@/components/ui/ProductImage";

/**
 * Vitrin başlığı: marka ortada, işlemler iki yanda.
 *
 * Kategori şeridi yazı değil fotoğraf taşır — "buket" kelimesini okumak yerine
 * buketi görüp tıklarsın. Küçük kemerler ana sayfadaki büyük kemerlerin
 * yankısı; şerit böylece süs değil, markanın parçası gibi durur.
 */
export async function SiteHeader() {
  const [categories, cartCount, user] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    getCartCount(),
    getCurrentUser(),
  ]);

  return (
    <header className="border-b border-line bg-surface">
      {/* Telefonda yalnızca marka satırı ve arama sabit kalır; kategori şeridi
          yukarı kayıp yerini içeriğe bırakır. */}
      <div className="sticky top-0 z-30 bg-surface md:static">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          {/* Telefonda marka solda, sepet sağda — tek elle ulaşılır bir uygulama
            başlığı. Masaüstünde üç sütuna açılıp marka ortaya geçer.
            minmax(0,1fr): yan sütunlar içeriğin altına inebilsin. */}
          <div className="flex h-14 items-center justify-between gap-3 md:grid md:h-[5.25rem] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
            <div className="hidden md:block md:justify-self-start">
              <Link
                href="/hesabim"
                className="btn btn-ghost btn-sm gap-2"
                title={user?.name}
              >
                <Icon name="user" size={17} />
                <span className="hidden lg:inline">
                  {user?.role === "CUSTOMER" ? "Hesabım" : "Hesap"}
                </span>
              </Link>
            </div>

            <Link
              href="/"
              className="min-w-0 md:justify-self-center md:text-center"
            >
              <span className="block font-display text-[1.2rem] font-medium uppercase leading-none tracking-[0.09em] text-plum-950 sm:text-[1.5rem] sm:tracking-[0.14em] lg:text-[1.75rem]">
                Çiçek<span className="text-bloom-600">Sepeti</span>
              </span>
              <span className="mt-1.5 hidden font-mono text-[9px] uppercase tracking-[0.3em] text-faint md:block">
                Çok satıcılı pazaryeri
              </span>
            </Link>

            <nav className="flex-none md:justify-self-end">
              <Link
                href="/sepet"
                className="btn btn-dark btn-sm gap-2"
                aria-label={`Sepet, ${cartCount} ürün`}
              >
                <Icon name="cart" size={16} />
                <span className="hidden sm:inline">Sepet</span>
                {cartCount > 0 && (
                  <span className="tabular rounded-sm bg-bloom-600 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none">
                    {cartCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          <form
            action="/urunler"
            className="relative mx-auto max-w-xl pb-3 md:pb-4"
          >
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              type="search"
              name="q"
              placeholder="Buket, orkide, kutuda çiçek ara…"
              aria-label="Ürün ara"
              className="field pl-10"
            />
          </form>
        </div>
      </div>

      {/* Kategori şeridi — her kategori kendi fotoğrafıyla */}
      <div className="border-t border-line bg-plum-50/50">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <nav className="scroll-row py-3 lg:justify-center">
            <CategoryTile href="/urunler" label="Tümü" />
            {categories.map((category) => (
              <CategoryTile
                key={category.id}
                href={`/kategori/${category.slug}`}
                label={category.name}
                imageUrl={category.imageUrl}
              />
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

function CategoryTile({
  href,
  label,
  imageUrl,
}: {
  href: string;
  label: string;
  imageUrl?: string | null;
}) {
  return (
    <Link href={href} className="group w-[4.5rem] text-center sm:w-[5rem]">
      <div className="arch-sm relative mx-auto h-[3.75rem] w-[3.25rem] border border-line bg-plum-100 transition-[border-color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:border-bloom-400">
        {imageUrl ? (
          <ProductImage
            src={imageUrl}
            alt=""
            sizes="52px"
            className="transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-display text-[1.15rem] text-plum-500">
            ✽
          </span>
        )}
      </div>
      <span className="mt-1.5 block truncate text-[11.5px] font-semibold text-plum-800 transition-colors group-hover:text-bloom-700">
        {label}
      </span>
    </Link>
  );
}
