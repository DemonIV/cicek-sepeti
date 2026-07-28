import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/site/ProductCard";
import { CatalogFilters, SortSelect } from "@/components/site/CatalogFilters";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Tüm ürünler" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = first(params.q)?.trim() ?? "";
  const categorySlug = first(params.kategori) ?? "";
  const sellerSlug = first(params.satici) ?? "";
  const maxPrice = Number(first(params.maxFiyat)) || 0;
  const sort = first(params.sirala) ?? "onerilen";

  const orderBy =
    sort === "fiyat-artan"
      ? [{ price: "asc" as const }]
      : sort === "fiyat-azalan"
        ? [{ price: "desc" as const }]
        : sort === "yeni"
          ? [{ createdAt: "desc" as const }]
          : [{ isFeatured: "desc" as const }, { reviewCount: "desc" as const }];

  const where = {
    isActive: true,
    seller: { status: "APPROVED", ...(sellerSlug ? { slug: sellerSlug } : {}) },
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(maxPrice ? { price: { lte: maxPrice } } : {}),
    ...(q
      ? {
          OR: [{ name: { contains: q } }, { description: { contains: q } }],
        }
      : {}),
  };

  const [products, categories, sellers, bounds] = await Promise.all([
    db.product.findMany({ where, include: { seller: true }, orderBy }),
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true, seller: { status: "APPROVED" } },
            },
          },
        },
      },
    }),
    db.seller.findMany({
      where: { status: "APPROVED" },
      orderBy: { storeName: "asc" },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    }),
    db.product.aggregate({
      where: { isActive: true, seller: { status: "APPROVED" } },
      _min: { price: true },
      _max: { price: true },
    }),
  ]);

  const priceBounds = {
    min: Math.floor(bounds._min.price ?? 0),
    max: Math.ceil(bounds._max.price ?? 5000),
  };

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const activeSeller = sellers.find((s) => s.slug === sellerSlug);

  const filters = (
    <Suspense
      fallback={<div className="h-64 animate-pulse rounded-lg bg-plum-50" />}
    >
      <CatalogFilters
        total={products.length}
        priceBounds={priceBounds}
        categories={categories.map((c) => ({
          value: c.slug,
          label: c.name,
          hint: String(c._count.products),
        }))}
        sellers={sellers.map((s) => ({
          value: s.slug,
          label: s.storeName,
          hint: String(s._count.products),
        }))}
      />
    </Suspense>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 md:py-10">
      <header className="mb-5 md:mb-8">
        <p className="eyebrow">Katalog</p>
        <h1 className="mt-2.5 text-[1.75rem] leading-tight md:text-[2rem]">
          {q
            ? `“${q}” için sonuçlar`
            : (activeCategory?.name ??
              activeSeller?.storeName ??
              "Tüm ürünler")}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Onaylı çiçekçilerin vitrindeki ürünleri. Fiyat, kategori ve satıcıya
          göre daraltabilirsin.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="lg:sticky lg:top-[4.5rem] lg:self-start">
          {/* Telefonda filtreler katlı gelir — ürünler ilk ekranda görünsün.
              Masaüstünde sürekli açık bir kenar çubuğudur. */}
          <details className="lg:hidden">
            <summary className="btn btn-outline btn-sm mb-3 w-full cursor-pointer">
              Filtrele
            </summary>
            {filters}
          </details>

          <div className="hidden lg:block">{filters}</div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="tabular shrink-0 whitespace-nowrap text-xs text-muted">
              {products.length} sonuç
            </p>
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          {products.length === 0 ? (
            <EmptyState
              title="Aradığın kriterlere uyan ürün yok"
              description="Filtreleri gevşetmeyi ya da farklı bir kelimeyle aramayı dene."
              action={{ href: "/urunler", label: "Filtreleri temizle" }}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 6}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
