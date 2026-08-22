import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { priceInfo } from "@/lib/discount";
import { PanelHeader } from "@/components/panel/PanelShell";
import { FilterChip } from "@/components/panel/FilterChip";
import { ProductVisibilityToggle } from "@/components/panel/AdminControls";
import { Badge, SellerStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage } from "@/components/ui/ProductImage";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Ürün yönetimi" };

type Search = Promise<{
  satici?: string;
  q?: string;
  durum?: string;
  eklendi?: string;
  guncellendi?: string;
}>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { satici, q, durum, eklendi, guncellendi } = await searchParams;

  const where = {
    ...(satici ? { seller: { slug: satici } } : {}),
    ...(durum === "pasif" ? { isActive: false } : {}),
    ...(durum === "aktif" ? { isActive: true } : {}),
    ...(q ? { name: { contains: q } } : {}),
  };

  const [products, sellers] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        seller: true,
        category: true,
        _count: { select: { items: true } },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      take: 120,
    }),
    db.seller.findMany({ orderBy: { storeName: "asc" } }),
  ]);

  const buildHref = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const base = { satici: satici ?? null, durum: durum ?? null, q: q ?? null };
    for (const [key, value] of Object.entries({ ...base, ...patch })) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return query ? `/admin/urunler?${query}` : "/admin/urunler";
  };

  return (
    <>
      <PanelHeader
        title="Ürün yönetimi"
        description="Tüm bayilerin ürünleri. Ürün bilgisi, galerisi ve zamanlı indirimi buradan yönetilir; bayi yalnızca stoğu kapatabilir."
        actions={
          <>
            <form action="/admin/urunler" className="relative">
              {satici && <input type="hidden" name="satici" value={satici} />}
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
            <Link href="/admin/urunler/yeni" className="btn btn-primary btn-sm">
              <Icon name="plus" size={15} />
              Ürün ekle
            </Link>
          </>
        }
      />

      {(eklendi || guncellendi) && (
        <p className="mb-5 rounded-md border border-plum-200 bg-plum-50 px-4 py-3 text-[13px] font-medium text-plum-800">
          {eklendi ? "Ürün eklendi ve vitrine gönderildi." : "Ürün güncellendi."}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <FilterChip
          href={buildHref({ durum: null })}
          label="Tümü"
          active={!durum}
        />
        <FilterChip
          href={buildHref({ durum: "aktif" })}
          label="Yayında"
          active={durum === "aktif"}
        />
        <FilterChip
          href={buildHref({ durum: "pasif" })}
          label="Yayında değil"
          active={durum === "pasif"}
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip
          href={buildHref({ satici: null })}
          label="Tüm mağazalar"
          active={!satici}
        />
        {sellers.map((seller) => (
          <FilterChip
            key={seller.id}
            href={buildHref({ satici: seller.slug })}
            label={seller.storeName}
            active={satici === seller.slug}
          />
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="Bu filtrede ürün yok"
          description="Filtreleri gevşetip tekrar dene."
          action={{ href: "/admin/urunler", label: "Filtreleri temizle" }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Mağaza</th>
                  <th>Kategori</th>
                  <th>Fiyat</th>
                  <th>Stok</th>
                  <th>Satış</th>
                  <th>Durum</th>
                  <th className="text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="relative size-11 flex-none overflow-hidden rounded-md bg-plum-50">
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            sizes="44px"
                          />
                        </div>
                        {product.isActive &&
                        product.seller.status === "APPROVED" ? (
                          <Link
                            href={`/urun/${product.slug}`}
                            className="font-medium text-plum-900 hover:underline"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{product.name}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <p className="text-muted">{product.seller.storeName}</p>
                      {product.seller.status !== "APPROVED" && (
                        <SellerStatusBadge status={product.seller.status} />
                      )}
                    </td>
                    <td className="text-muted">{product.category.name}</td>
                    <td>
                      {(() => {
                        const price = priceInfo(product);
                        return (
                          <>
                            <p className="tabular font-semibold">
                              {formatPrice(price.price)}
                            </p>
                            {price.isDiscounted && (
                              <p className="tabular text-[11px] text-bloom-700">
                                %{price.percent} indirimli
                              </p>
                            )}
                            {price.scheduled && (
                              <p className="text-[11px] text-muted">
                                İndirim planlandı
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="tabular">
                      {product.stock === 0 ? (
                        <span className="text-[#9c2f2a]">Tükendi</span>
                      ) : (
                        product.stock
                      )}
                    </td>
                    <td className="tabular text-muted">
                      {product._count.items}
                    </td>
                    <td>
                      {product.stockClosed ? (
                        <Badge tone="amber" dot>
                          Bayi stoğu kapattı
                        </Badge>
                      ) : product.isActive ? (
                        <Badge tone="leaf" dot>
                          Yayında
                        </Badge>
                      ) : (
                        <Badge tone="neutral" dot>
                          Kaldırıldı
                        </Badge>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/urunler/${product.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          Düzenle
                        </Link>
                        <ProductVisibilityToggle
                          productId={product.id}
                          isActive={product.isActive}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
