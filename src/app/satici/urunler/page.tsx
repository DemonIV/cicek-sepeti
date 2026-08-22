import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { priceInfo } from "@/lib/discount";
import { PanelHeader } from "@/components/panel/PanelShell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ProductImage } from "@/components/ui/ProductImage";
import { StockToggle } from "@/components/panel/ProductRowActions";

export const metadata: Metadata = { title: "Ürünlerim" };

type Search = Promise<{ q?: string }>;

/**
 * Satıcının ürün listesi — okunur, düzenlenmez (madde 4).
 *
 * Ürün bilgisini operasyon ekibi yönetir; bayinin yetkisi stoğu kapatıp
 * açmakla sınırlıdır. Böylece vitrindeki fiyat ve içerik tek elden kontrol
 * edilir, yanlış fiyatlı ürün yayına çıkmaz.
 */
export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const { q } = await searchParams;

  const [products, manager] = await Promise.all([
    db.product.findMany({
      where: {
        sellerId: seller.id,
        ...(q ? { name: { contains: q } } : {}),
      },
      include: { category: true },
      orderBy: [{ stockClosed: "asc" }, { isActive: "desc" }, { createdAt: "desc" }],
    }),
    seller.accountManagerId
      ? db.user.findUnique({ where: { id: seller.accountManagerId } })
      : null,
  ]);

  const closedCount = products.filter((p) => p.stockClosed).length;

  return (
    <>
      <PanelHeader
        title="Ürünlerim"
        description="Vitrindeki ürünlerin. Yoğun bir günde ya da malzeme bittiğinde ürünün stoğunu kapatabilirsin."
        actions={
          <form action="/satici/urunler" className="relative">
            <Icon
              name="search"
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Ürün ara…"
              aria-label="Ürün ara"
              className="field py-1.5 pl-8 text-[13px] sm:w-56"
            />
          </form>
        }
      />

      <div className="mb-5 flex flex-wrap items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3">
        <Icon name="alert" size={17} className="mt-0.5 flex-none text-plum-400" />
        <p className="text-[12.5px] leading-relaxed text-muted">
          Ürün adı, fiyatı, görseli ve açıklaması{" "}
          <strong className="font-semibold text-plum-900">
            operasyon ekibi
          </strong>{" "}
          tarafından yönetilir. Bir üründe değişiklik gerekiyorsa sorumlun
          {manager ? (
            <>
              {" "}
              <strong className="font-semibold text-plum-900">
                {manager.name}
              </strong>
              {manager.phone ? ` (${manager.phone})` : ""}
            </>
          ) : (
            " operasyon ekibi"
          )}{" "}
          ile iletişime geçebilirsin.
          {closedCount > 0 &&
            ` Şu an ${closedCount} ürünün stoğu kapalı — satışa çıkmıyorlar.`}
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title={q ? "Aramanla eşleşen ürün yok" : "Mağazanda henüz ürün yok"}
          description={
            q
              ? "Farklı bir kelimeyle aramayı dene."
              : "Ürünlerin operasyon ekibi tarafından tanımlanır. Sorumlunla iletişime geçebilirsin."
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Kategori</th>
                  <th>Fiyat</th>
                  <th>Stok</th>
                  <th>Durum</th>
                  <th className="text-right">Stok kontrolü</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const price = priceInfo(product);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative size-11 flex-none overflow-hidden rounded-md bg-plum-50">
                            <ProductImage
                              src={product.imageUrl}
                              alt={product.name}
                              sizes="44px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-plum-950">
                              {product.name}
                            </p>
                            {product.isFeatured && (
                              <span className="text-[11px] text-bloom-600">
                                Öne çıkan
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-muted">{product.category.name}</td>
                      <td>
                        <p className="tabular font-semibold">
                          {formatPrice(price.price)}
                        </p>
                        {price.isDiscounted && (
                          <p className="tabular text-[11px] text-faint line-through">
                            {formatPrice(price.listPrice)}
                          </p>
                        )}
                      </td>
                      <td className="tabular">
                        {product.stock === 0 ? (
                          <span className="text-[#9c2f2a]">Tükendi</span>
                        ) : product.stock <= 5 ? (
                          <span className="text-gold-700">
                            {product.stock} (az)
                          </span>
                        ) : (
                          product.stock
                        )}
                      </td>
                      <td>
                        {product.stockClosed ? (
                          <Badge tone="amber" dot>
                            Stok kapalı
                          </Badge>
                        ) : product.isActive ? (
                          <Badge tone="leaf" dot>
                            Satışta
                          </Badge>
                        ) : (
                          <Badge tone="neutral" dot>
                            Yayında değil
                          </Badge>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <StockToggle
                            productId={product.id}
                            closed={product.stockClosed}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
