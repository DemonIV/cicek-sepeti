import Link from "next/link";
import type { Metadata } from "next";
import { getCartDetail } from "@/lib/cart";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, lineTotal } from "@/lib/pricing";
import { ProductImage } from "@/components/ui/ProductImage";
import { ProductCard } from "@/components/site/ProductCard";
import { CartLineControls } from "@/components/site/CartLineControls";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Sepetim" };

export default async function CartPage() {
  const cart = await getCartDetail();

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="mb-8 text-[2rem] leading-tight">Sepetim</h1>
        <EmptyState
          title="Sepetin şu an boş"
          description="Beğendiğin aranjmanı sepete ekle, hediye notunu ödeme adımında yazarsın."
          action={{ href: "/urunler", label: "Ürünlere göz at" }}
        />
      </div>
    );
  }

  const remaining = FREE_SHIPPING_THRESHOLD - cart.subtotal;

  /**
   * Çapraz satış: sepettekilerle aynı kategorilerden, sepette olmayan ürünler.
   * Hem masaüstünde sol sütunun altındaki boşluğu kapatır hem de ücretsiz
   * teslimat eşiğine yaklaşmak için gerçek bir yol sunar.
   */
  const cartCategoryIds = (
    await db.product.findMany({
      where: { id: { in: cart.items.map((item) => item.productId) } },
      select: { categoryId: true },
      distinct: ["categoryId"],
    })
  ).map((product) => product.categoryId);

  const suggestions = await db.product.findMany({
    where: {
      id: { notIn: cart.items.map((item) => item.productId) },
      categoryId: { in: cartCategoryIds },
      isActive: true,
      stock: { gt: 0 },
      seller: { status: "APPROVED" },
    },
    include: { seller: true },
    orderBy: [{ isFeatured: "desc" }, { reviewCount: "desc" }],
    take: 5,
  });

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-[2rem] leading-tight">Sepetim</h1>
        <p className="mt-2 text-sm text-muted">
          {cart.itemCount} ürün ·{" "}
          {cart.groups.length > 1
            ? `${cart.groups.length} farklı çiçekçiden`
            : "tek çiçekçiden"}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {cart.groups.length > 1 && (
            <div className="flex items-start gap-3 rounded-lg border border-plum-200 bg-plum-50 px-4 py-3.5">
              <Icon
                name="store"
                size={18}
                className="mt-0.5 flex-none text-plum-600"
              />
              <p className="text-[13px] leading-relaxed text-plum-800">
                Sepetinde{" "}
                <strong>{cart.groups.length} farklı çiçekçinin</strong> ürünü
                var. Her çiçekçi kendi kalemini ayrı hazırlar; siparişi tek
                seferde ödersin, teslimatlar tek takip numarası altında ilerler.
              </p>
            </div>
          )}

          {cart.groups.map((group) => (
            <section key={group.sellerId} className="card overflow-hidden">
              <header className="flex items-center justify-between gap-3 border-b border-line bg-plum-50/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon name="store" size={15} className="text-plum-500" />
                  <p className="text-[13px] font-semibold text-plum-950">
                    {group.storeName}
                  </p>
                  <span className="text-[12px] text-muted">· {group.city}</span>
                </div>
                <span className="tabular text-[12px] text-muted">
                  {group.items.length} kalem
                </span>
              </header>

              <ul className="divide-y divide-[var(--color-line)]">
                {group.items.map((item) => (
                  <li key={item.productId} className="flex gap-4 p-4">
                    <Link
                      href={`/urun/${item.slug}`}
                      className="relative size-24 flex-none overflow-hidden rounded-md bg-plum-50"
                    >
                      <ProductImage
                        src={item.imageUrl}
                        alt={item.name}
                        sizes="96px"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <Link
                          href={`/urun/${item.slug}`}
                          className="text-[14px] font-semibold leading-snug text-plum-950 hover:underline"
                        >
                          {item.name}
                        </Link>
                        <p className="tabular whitespace-nowrap text-[14px] font-semibold">
                          {formatPrice(lineTotal(item))}
                        </p>
                      </div>

                      <p className="tabular text-[12px] text-muted">
                        Birim {formatPrice(item.unitPrice)}
                        {item.stock <= 5 && (
                          <span className="ml-2 text-bloom-700">
                            · stokta {item.stock} adet
                          </span>
                        )}
                      </p>

                      <div className="mt-auto pt-1">
                        <CartLineControls
                          productId={item.productId}
                          quantity={item.quantity}
                          stock={item.stock}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="lg:sticky lg:top-[4.5rem] lg:self-start">
          <div className="card card-pad">
            <h2 className="text-base font-semibold">Sipariş özeti</h2>

            <dl className="mt-4 space-y-2.5 text-[13.5px]">
              <Line term="Ara toplam" value={formatPrice(cart.subtotal)} />
              <Line
                term="Teslimat"
                value={
                  cart.shipping === 0 ? "Ücretsiz" : formatPrice(cart.shipping)
                }
                accent={cart.shipping === 0}
              />
            </dl>

            {remaining > 0 && (
              <p className="mt-3 rounded-md bg-bloom-50 px-3 py-2 text-[12px] leading-snug text-bloom-800">
                {formatPrice(remaining)} daha ekle, teslimat ücretsiz olsun.
              </p>
            )}

            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-sm font-semibold">Toplam</span>
              <span className="tabular font-display text-[1.5rem] font-semibold">
                {formatPrice(cart.total)}
              </span>
            </div>

            <Link
              href="/odeme"
              className="btn btn-primary btn-lg btn-block mt-5"
            >
              Teslimat bilgilerine geç
              <Icon name="arrow-right" size={16} />
            </Link>

            <Link
              href="/urunler"
              className="mt-2.5 block text-center text-[13px] text-muted hover:text-plum-800"
            >
              Alışverişe devam et
            </Link>
          </div>
        </aside>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="section-title">Bu siparişe eklenebilir</h2>
              <p className="mt-1.5 text-[13px] text-muted">
                Sepetindekilerle aynı kategorilerden, aynı gün hazırlanabilir.
              </p>
            </div>
            <Link
              href="/urunler"
              className="link-underline shrink-0 text-[13px] font-semibold text-plum-800"
            >
              Tüm ürünler →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {suggestions.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Line({
  term,
  value,
  accent = false,
}: {
  term: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{term}</dt>
      <dd className={`tabular font-medium ${accent ? "text-plum-600" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
