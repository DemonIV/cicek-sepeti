import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { PanelHeader } from "@/components/panel/PanelShell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ProductImage } from "@/components/ui/ProductImage";
import {
  ProductActions,
  StockEditor,
} from "@/components/panel/ProductRowActions";

export const metadata: Metadata = { title: "Ürünlerim" };

type Search = Promise<{ eklendi?: string; guncellendi?: string; q?: string }>;

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const { eklendi, guncellendi, q } = await searchParams;

  const products = await db.product.findMany({
    where: {
      sellerId: seller.id,
      ...(q ? { name: { contains: q } } : {}),
    },
    include: { category: true },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <PanelHeader
        title="Ürünlerim"
        description="Vitrindeki ürünlerin. Stoğu satır üzerinden anında güncelleyebilirsin."
        actions={
          <>
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
            <Link
              href="/satici/urunler/yeni"
              className="btn btn-primary btn-sm"
            >
              <Icon name="plus" size={15} />
              Ürün ekle
            </Link>
          </>
        }
      />

      {(eklendi || guncellendi) && (
        <p className="mb-5 rounded-md border border-plum-200 bg-plum-50 px-4 py-3 text-[13px] font-medium text-plum-800">
          {eklendi
            ? "Ürün eklendi ve vitrine gönderildi."
            : "Ürün güncellendi."}
        </p>
      )}

      {products.length === 0 ? (
        <EmptyState
          title={q ? "Aramanla eşleşen ürün yok" : "Henüz ürün eklemedin"}
          description={
            q
              ? "Farklı bir kelimeyle aramayı dene."
              : "İlk ürününü ekle; vitrinde hemen yayına girer ve sipariş almaya başlarsın."
          }
          action={{ href: "/satici/urunler/yeni", label: "Ürün ekle" }}
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
                  <th className="text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
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
                    <td className="tabular font-semibold">
                      {formatPrice(product.price)}
                    </td>
                    <td>
                      <StockEditor
                        productId={product.id}
                        stock={product.stock}
                      />
                    </td>
                    <td>
                      {product.isActive ? (
                        <Badge tone="leaf" dot>
                          Yayında
                        </Badge>
                      ) : (
                        <Badge tone="neutral" dot>
                          Yayında değil
                        </Badge>
                      )}
                    </td>
                    <td>
                      <ProductActions
                        productId={product.id}
                        isActive={product.isActive}
                      />
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
