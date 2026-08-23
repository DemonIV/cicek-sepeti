import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductImage } from "@/components/ui/ProductImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { areaFilter, areaLabel, getSelectedArea } from "@/lib/delivery-area";
import { sameDayAvailable } from "@/lib/delivery-time";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.category.findUnique({ where: { slug } });
  return { title: category?.name ?? "Kategori bulunamadı" };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;

  // Kategori de bölgeye göre daralır: çiçek kargoya girmiyor, alıcının
  // mahallesine hizmet veren çiçekçiden çıkıyor (madde 12). Bölge seçili
  // değilse liste daralmaz, ama adres penceresi kendiliğinden açılır.
  const [area, byArea] = await Promise.all([getSelectedArea(), areaFilter()]);
  const sameDayOpen = sameDayAvailable(new Date());

  const category = await db.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: {
          isActive: true,
          isAddOn: false,
          seller: { status: "APPROVED", ...(byArea.seller ?? {}) },
        },
        include: { seller: true },
        orderBy: [{ isFeatured: "desc" }, { reviewCount: "desc" }],
      },
    },
  });

  if (!category) notFound();

  const others = await db.category.findMany({
    where: { slug: { not: slug }, isHidden: false },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <section className="relative overflow-hidden rounded-xl border border-line bg-plum-950">
        <div className="absolute inset-0 opacity-40">
          <ProductImage
            src={category.imageUrl ?? ""}
            alt=""
            priority
            sizes="100vw"
          />
        </div>
        <div className="relative px-6 py-14 sm:px-10 sm:py-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-bloom-200">
            Kategori
          </p>
          <h1 className="mt-3 text-[clamp(2rem,5vw,3.2rem)] leading-none text-white">
            {category.name}
          </h1>
          <p className="tabular mt-3 text-sm text-white/70">
            {category.products.length} ürün ·{" "}
            {area
              ? `${areaLabel(area)} bölgesine gönderilebilenler`
              : "onaylı çiçekçilerden"}
          </p>
        </div>
      </section>

      <nav className="scroll-row mt-6">
        {others.map((other) => (
          <Link
            key={other.id}
            href={`/kategori/${other.slug}`}
            className="whitespace-nowrap rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] text-plum-800 transition-colors hover:border-plum-300"
          >
            {other.name}
          </Link>
        ))}
      </nav>

      {area && (
        <p className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-full bg-bloom-50 px-3 py-1.5 text-[12.5px]">
          <Icon name="pin" size={13} className="text-bloom-600" />
          <span className="font-semibold text-plum-950">{areaLabel(area)}</span>
          <span className="text-muted">
            bölgesine gönderim yapan çiçekçilerin ürünleri
          </span>
          <Link
            href="/teslimat-bolgesi"
            className="link-underline font-semibold text-bloom-700"
          >
            değiştir
          </Link>
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="section-title">Ürünler</h2>
        <Link
          href={`/urunler?kategori=${category.slug}`}
          className="link-underline text-[13px] font-semibold text-plum-800"
        >
          Filtrelerle ara →
        </Link>
      </div>

      <div className="mt-4">
        {category.products.length === 0 ? (
          <EmptyState
            title={
              area
                ? "Bu kategoride bölgene gönderilebilen ürün yok"
                : "Bu kategoride henüz ürün yok"
            }
            description={
              area
                ? `${areaLabel(area)} bölgesine hizmet veren çiçekçilerin bu kategoride ürünü yok. Başka bir bölge seçebilir ya da diğer kategorilere bakabilirsin.`
                : "Çiçekçiler bu kategoriye ürün eklediğinde burada görünecek."
            }
            action={
              area
                ? { href: "/teslimat-bolgesi", label: "Bölgeyi değiştir" }
                : { href: "/urunler", label: "Tüm ürünlere bak" }
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
            {category.products.map((product, index) => (
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
  );
}
