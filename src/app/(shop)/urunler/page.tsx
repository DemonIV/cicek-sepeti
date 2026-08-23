import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/site/ProductCard";
import { CatalogFilters, SortSelect } from "@/components/site/CatalogFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { findCollection } from "@/lib/collections";
import { areaFilter, getSelectedArea, areaLabel } from "@/lib/delivery-area";
import { sameDayAvailable } from "@/lib/delivery-time";

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
  const occasionSlug = first(params.amac) ?? "";
  const maxPrice = Number(first(params.maxFiyat)) || 0;
  const sort = first(params.sirala) ?? "onerilen";
  const collection = findCollection(first(params.koleksiyon));

  const now = new Date();
  // Aynı gün teslimat penceresi açıksa kartlarda söylenir (`delivery-time.ts`).
  const sameDayOpen = sameDayAvailable(now);
  // Bölge seçiliyse yalnızca oraya gönderilebilen ürünler listelenir (madde 12).
  const [area, byArea] = await Promise.all([getSelectedArea(), areaFilter()]);

  const orderBy =
    sort === "fiyat-artan"
      ? [{ price: "asc" as const }]
      : sort === "fiyat-azalan"
        ? [{ price: "desc" as const }]
        : sort === "yeni"
          ? [{ createdAt: "desc" as const }]
          : [{ isFeatured: "desc" as const }, { reviewCount: "desc" as const }];

  // Ek ürünler katalogda tek başına listelenmez; yalnızca onları isteyen
  // koleksiyonlarda ve aramada görünürler (madde 6).
  const showAddOns = collection?.includeAddOns || Boolean(q);

  const where = {
    isActive: true,
    ...(showAddOns ? {} : { isAddOn: false }),
    seller: {
      status: "APPROVED",
      ...(sellerSlug ? { slug: sellerSlug } : {}),
      ...(byArea.seller ?? {}),
    },
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(occasionSlug
      ? { occasions: { some: { occasion: { slug: occasionSlug } } } }
      : {}),
    ...(maxPrice ? { price: { lte: maxPrice } } : {}),
    ...(collection ? collection.where(now) : {}),
    ...(q
      ? {
          OR: [{ name: { contains: q } }, { description: { contains: q } }],
        }
      : {}),
  };

  const [products, categories, occasions, sellers, bounds] = await Promise.all([
    db.product.findMany({ where, include: { seller: true }, orderBy }),
    // Kenar çubuğundaki sayılar da bölgeyi izler: seçili mahalleye gönderim
    // yapmayan bir satıcı listede durup boş sonuç vermemeli.
    db.category.findMany({
      where: { isHidden: false },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                isAddOn: false,
                seller: { status: "APPROVED", ...(byArea.seller ?? {}) },
              },
            },
          },
        },
      },
    }),
    db.occasion.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            products: {
              where: {
                product: {
                  isActive: true,
                  seller: { status: "APPROVED", ...(byArea.seller ?? {}) },
                },
              },
            },
          },
        },
      },
    }),
    db.seller.findMany({
      where: { status: "APPROVED", ...(byArea.seller ?? {}) },
      orderBy: { storeName: "asc" },
      include: {
        _count: {
          select: { products: { where: { isActive: true, isAddOn: false } } },
        },
      },
    }),
    db.product.aggregate({
      where: {
        isActive: true,
        isAddOn: false,
        seller: { status: "APPROVED", ...(byArea.seller ?? {}) },
      },
      _min: { price: true },
      _max: { price: true },
    }),
  ]);

  const priceBounds = {
    min: Math.floor(bounds._min.price ?? 0),
    max: Math.ceil(bounds._max.price ?? 5000),
  };

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const activeOccasion = occasions.find((o) => o.slug === occasionSlug);
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
        occasions={occasions
          .filter((o) => o._count.products > 0)
          .map((o) => ({
            value: o.slug,
            label: o.name,
            hint: String(o._count.products),
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
            : (collection?.label ??
              activeOccasion?.name ??
              activeCategory?.name ??
              activeSeller?.storeName ??
              "Tüm ürünler")}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          {collection?.tagline ??
            activeOccasion?.tagline ??
            "Onaylı çiçekçilerin vitrindeki ürünleri. Amaç, kategori, fiyat ve satıcıya göre daraltabilirsin."}
        </p>

        {area && (
          <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full bg-bloom-50 px-3 py-1.5 text-[12.5px]">
            <Icon name="pin" size={13} className="text-bloom-600" />
            <span className="font-semibold text-plum-950">
              {areaLabel(area)}
            </span>
            <span className="text-muted">bölgesine gönderilebilenler</span>
            <Link
              href="/teslimat-bolgesi"
              className="link-underline font-semibold text-bloom-700"
            >
              değiştir
            </Link>
          </p>
        )}
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
              description={
                area
                  ? `${areaLabel(area)} bölgesine gönderilebilen ürünler arasında eşleşme çıkmadı. Filtreleri gevşetebilir ya da başka bir bölge seçebilirsin.`
                  : "Filtreleri gevşetmeyi ya da farklı bir kelimeyle aramayı dene."
              }
              action={
                area
                  ? { href: "/teslimat-bolgesi", label: "Bölgeyi değiştir" }
                  : { href: "/urunler", label: "Filtreleri temizle" }
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 6}
                  sameDay={sameDayOpen}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
