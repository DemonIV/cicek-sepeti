import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import {
  PRODUCT_REQUEST_STATUS_META,
  type ProductRequestStatus,
} from "@/lib/enums";
import { priceInfo } from "@/lib/discount";
import { PanelHeader } from "@/components/panel/PanelShell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ProductImage } from "@/components/ui/ProductImage";
import { StockToggle } from "@/components/panel/ProductRowActions";
import { ProductRequestWithdraw } from "@/components/panel/ProductRequestControls";

export const metadata: Metadata = { title: "Ürünlerim" };

type Search = Promise<{ q?: string }>;

/**
 * Satıcının ürün listesi — okunur, düzenlenmez (madde 4).
 *
 * Mevcut ürünün bilgisini operasyon ekibi yönetir; bayinin o ürün üzerindeki
 * yetkisi stoğu kapatıp açmakla sınırlıdır. Böylece vitrindeki fiyat ve içerik
 * tek elden kontrol edilir, yanlış fiyatlı ürün yayına çıkmaz.
 *
 * Yeni ürün ise bayiden gelebilir: sayfanın altındaki "Başvurularım" bölümü
 * bayinin önerdiği ürünleri ve operasyonun kararını gösterir.
 */
export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const { q } = await searchParams;

  const [products, manager, requests] = await Promise.all([
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
    db.productRequest.findMany({
      where: { sellerId: seller.id },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const closedCount = products.filter((p) => p.stockClosed).length;
  const waitingCount = requests.filter((r) => r.status === "BEKLIYOR").length;

  return (
    <>
      <PanelHeader
        title="Ürünlerim"
        description="Vitrindeki ürünlerin. Yoğun bir günde ya da malzeme bittiğinde ürünün stoğunu kapatabilirsin."
        actions={
          <>
          <Link href="/satici/urunler/basvuru" className="btn btn-primary btn-sm">
            <Icon name="plus" size={15} />
            Yeni ürün başvurusu
          </Link>
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
          </>
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
          ile iletişime geçebilirsin. Mağazana{" "}
          <strong className="font-semibold text-plum-900">yeni bir ürün</strong>{" "}
          eklemek istersen başvuru gönder; onaylandığında vitrine çıkar.
          {closedCount > 0 &&
            ` Şu an ${closedCount} ürünün stoğu kapalı — satışa çıkmıyorlar.`}
          {waitingCount > 0 &&
            ` ${waitingCount} ürün başvurun operasyon onayını bekliyor.`}
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title={q ? "Aramanla eşleşen ürün yok" : "Mağazanda henüz ürün yok"}
          description={
            q
              ? "Farklı bir kelimeyle aramayı dene."
              : "İlk ürününü “Yeni ürün başvurusu” ile öner; operasyon onayladığında vitrinde görünür."
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

      {/* --------------------------- Başvurularım --------------------------- */}
      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-plum-950">
              Başvurularım
            </h2>
            <p className="mt-0.5 text-[12.5px] text-muted">
              Mağazana eklenmesini istediğin ürünler. Onaylananlar yukarıdaki
              listede yayına çıkar.
            </p>
          </div>
          {waitingCount > 0 && (
            <Badge tone="amber" dot>
              {waitingCount} başvuru onay bekliyor
            </Badge>
          )}
        </div>

        {requests.length === 0 ? (
          <EmptyState
            title="Henüz başvurun yok"
            description="Mağazana yeni bir ürün eklemek için “Yeni ürün başvurusu” düğmesini kullan."
            action={{ href: "/satici/urunler/basvuru", label: "Yeni ürün başvurusu" }}
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
                    <th>Gönderim</th>
                    <th>Durum</th>
                    <th className="text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => {
                    const meta =
                      PRODUCT_REQUEST_STATUS_META[
                        request.status as ProductRequestStatus
                      ];
                    return (
                      <tr key={request.id}>
                        <td>
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="relative size-11 flex-none overflow-hidden rounded-md bg-plum-50">
                              <ProductImage
                                src={request.imageUrl}
                                alt={request.name}
                                sizes="44px"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-plum-950">
                                {request.name}
                              </p>
                              {request.status === "REDDEDILDI" &&
                                request.reviewNote && (
                                  <p className="mt-0.5 text-[11.5px] text-[#9c2f2a]">
                                    Ret sebebi: {request.reviewNote}
                                  </p>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="text-muted">{request.category.name}</td>
                        <td className="tabular font-semibold">
                          {formatPrice(request.price)}
                        </td>
                        <td className="text-muted">
                          {formatDate(request.createdAt)}
                        </td>
                        <td>
                          {meta && (
                            <Badge tone={meta.tone} dot>
                              {meta.label}
                            </Badge>
                          )}
                          {request.reviewedBy && (
                            <p className="mt-0.5 text-[11px] text-faint">
                              {request.reviewedBy}
                            </p>
                          )}
                        </td>
                        <td>
                          <div className="flex justify-end">
                            {request.status === "BEKLIYOR" ? (
                              <ProductRequestWithdraw requestId={request.id} />
                            ) : (
                              <span className="text-[12px] text-faint">—</span>
                            )}
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
      </section>
    </>
  );
}
