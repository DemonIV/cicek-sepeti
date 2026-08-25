import Link from "next/link";
import { getCartCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { getSelectedArea, areaLabel } from "@/lib/delivery-area";
import { COLLECTIONS } from "@/lib/collections";
import { AreaTrigger } from "@/components/site/AreaTrigger";
import { MainNav } from "@/components/site/MainNav";
import { Icon } from "@/components/ui/Icon";

/**
 * Vitrin başlığı — üç katman:
 *
 *   1. Koyu şerit: koleksiyonlar (Premium · Hediye · Balon…) ve teslimat bölgesi.
 *   2. Marka satırı: logo solda, arama ortada, hesap ve sepet sağda.
 *   3. Kategori navbar'ı: dokuz metin başlığı, hover'da açılır menü
 *      (`MainNav`). Fotoğraflı kategori şeridi ana sayfaya indi.
 *
 * Düzen 21 Ağustos 2026'da müşteri isteğiyle değişti: marka ortadaydı, sola
 * alındı; arama ortaya geçti; üstteki boşluk koleksiyon şeridine ayrıldı.
 */
export async function SiteHeader() {
  const [cartCount, user, area] = await Promise.all([
    getCartCount(),
    getCurrentUser(),
    getSelectedArea(),
  ]);

  return (
    <header className="border-b border-line bg-surface">
      {/* ----------------------- 1. Koleksiyon şeridi ----------------------- */}
      <div className="bg-plum-950 text-plum-100">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 sm:px-6">
          <nav className="scroll-row hidden flex-1 gap-6 py-2.5 md:flex">
            {COLLECTIONS.map((collection) => (
              <Link
                key={collection.slug}
                href={`/urunler?koleksiyon=${collection.slug}`}
                className="text-[12.5px] font-semibold tracking-[0.01em] text-plum-200 transition-colors hover:text-white"
              >
                {collection.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/satici-ol"
            className="hidden whitespace-nowrap text-[12.5px] font-semibold text-plum-200 transition-colors hover:text-white md:block"
          >
            Satıcı ol
          </Link>

          <AreaTrigger label={area ? areaLabel(area) : null} />
        </div>
      </div>

      {/* ------------------------- 2. Marka satırı -------------------------- */}
      {/* Telefonda yalnızca marka satırı ve arama sabit kalır; şeritler yukarı
          kayıp yerini içeriğe bırakır. */}
      <div className="sticky top-0 z-30 bg-surface md:static">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-3 md:grid md:h-[5.25rem] md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-8">
            <Link href="/" className="min-w-0 shrink-0">
              <span className="block font-display text-[1.2rem] font-semibold uppercase leading-none tracking-[0.07em] text-plum-950 sm:text-[1.45rem] lg:text-[1.6rem]">
                Çiçek<span className="text-bloom-600">Sepeti</span>
              </span>
              <span className="mt-1.5 hidden font-mono text-[9px] uppercase tracking-[0.28em] text-faint md:block">
                Çok satıcılı pazaryeri
              </span>
            </Link>

            {/* Arama masaüstünde ortada; telefonda kendi satırında (altta). */}
            <form action="/urunler" className="relative hidden md:block">
              <Icon
                name="search"
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
              />
              <input
                type="search"
                name="q"
                placeholder="Buket, orkide, kutuda çiçek, çikolata ara…"
                aria-label="Ürün ara"
                className="field h-11 rounded-full pl-11 text-[14px]"
              />
            </form>

            <nav className="flex flex-none items-center gap-2">
              <Link
                href="/hesabim"
                className="btn btn-ghost btn-sm hidden gap-2 md:inline-flex"
                title={user?.name}
              >
                <Icon name="user" size={17} />
                <span className="hidden lg:inline">
                  {user?.role === "CUSTOMER" ? "Hesabım" : "Hesap"}
                </span>
              </Link>

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

          <form action="/urunler" className="relative pb-3 md:hidden">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              type="search"
              name="q"
              placeholder="Buket, orkide, çikolata ara…"
              aria-label="Ürün ara"
              className="field rounded-full pl-10"
            />
          </form>
        </div>
      </div>

      {/* ---------------------- 3. Kategori navbar'ı ------------------------ */}
      {/* Metin başlıkları + açılır menü. Buradaki fotoğraflı kategori şeridi
          ana sayfanın en üstüne taşındı (`CategoryRail`) — gerçek pazaryeri
          düzeninde de o şerit başlığın değil gövdenin ilk elemanı. */}
      <MainNav
        collections={COLLECTIONS.map(({ slug, label }) => ({ slug, label }))}
      />
    </header>
  );
}
