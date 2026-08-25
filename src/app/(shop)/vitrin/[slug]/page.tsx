import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductImage } from "@/components/ui/ProductImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { CategoryShowcase } from "@/components/site/CategoryShowcase";
import { showcaseProductSlugs } from "@/lib/category-showcase";
import { LANDINGS, findLanding } from "@/lib/landing";
import { areaFilter, areaLabel, getSelectedArea } from "@/lib/delivery-area";
import { sameDayAvailable } from "@/lib/delivery-time";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return LANDINGS.map((landing) => ({ slug: landing.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: findLanding(slug)?.title ?? "Sayfa bulunamadı" };
}

/**
 * Vitrin sayfası — navbar'ın üst başlıkları (`/vitrin/cicek`, `/vitrin/hediye`…).
 *
 * Kategori sayfasıyla aynı iskelet: kapak → kardeş başlıklar → vitrin (afiş
 * satırları + alt kategori kutucukları) → ürün ızgarası. Fark, ürünlerin
 * `Category` tablosundan değil `landing.ts` içindeki `where` parçasından
 * gelmesi; "Çiçek" yedi kategoriyi toplar, "Kişiye Özel" elle seçilmiş bir
 * listedir.
 */
export default async function LandingPage({ params }: { params: Params }) {
  const { slug } = await params;
  const landing = findLanding(slug);
  if (!landing) notFound();

  // Kategori sayfasındaki kural burada da geçerli: bölge seçiliyse yalnızca
  // oraya gönderilebilen ürünler listelenir (madde 12).
  const [area, byArea] = await Promise.all([getSelectedArea(), areaFilter()]);
  const sameDayOpen = sameDayAvailable(new Date());

  const [products, cover, showcaseRows] = await Promise.all([
    db.product.findMany({
      where: {
        isActive: true,
        seller: { status: "APPROVED", ...(byArea.seller ?? {}) },
        ...landing.where,
      },
      include: { seller: true },
      orderBy: [{ isFeatured: "desc" }, { reviewCount: "desc" }],
    }),
    db.product.findUnique({
      where: { slug: landing.coverProductSlug },
      select: { imageUrl: true },
    }),
    // Vitrin fotoğrafları da gerçek ürünlerden gelir; hepsi tek sorguda.
    db.product.findMany({
      where: {
        slug: { in: showcaseProductSlugs(landing.showcase) },
        isActive: true,
      },
      select: { slug: true, imageUrl: true },
    }),
  ]);

  const showcaseImages: Record<string, string> = {};
  for (const row of showcaseRows) showcaseImages[row.slug] = row.imageUrl;

  const siblings = LANDINGS.filter((other) => other.slug !== landing.slug);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <section className="relative overflow-hidden rounded-xl border border-line bg-plum-950">
        <div className="absolute inset-0 opacity-40">
          <ProductImage
            src={cover?.imageUrl ?? ""}
            alt=""
            priority
            sizes="100vw"
          />
        </div>
        <div className="relative px-6 py-14 sm:px-10 sm:py-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-bloom-200">
            Vitrin
          </p>
          <h1 className="mt-3 text-[clamp(2rem,5vw,3.2rem)] leading-none text-white">
            {landing.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/70">
            {landing.tagline}
          </p>
          <p className="tabular mt-2 text-sm text-white/50">
            {products.length} ürün ·{" "}
            {area
              ? `${areaLabel(area)} bölgesine gönderilebilenler`
              : "onaylı çiçekçilerden"}
          </p>
        </div>
      </section>

      <nav className="scroll-row mt-6">
        {siblings.map((other) => (
          <Link
            key={other.slug}
            href={`/vitrin/${other.slug}`}
            className="whitespace-nowrap rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] text-plum-800 transition-colors hover:border-plum-300"
          >
            {other.label}
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

      {products.length > 0 && (
        <CategoryShowcase
          showcase={landing.showcase}
          images={showcaseImages}
          allHref="/urunler"
        />
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="section-title">Ürünler</h2>
        <Link
          href="/urunler"
          className="link-underline text-[13px] font-semibold text-plum-800"
        >
          Filtrelerle ara →
        </Link>
      </div>

      <div className="mt-4">
        {products.length === 0 ? (
          <EmptyState
            title={
              area
                ? "Bölgene gönderilebilen ürün yok"
                : "Bu vitrinde henüz ürün yok"
            }
            description={
              area
                ? `${areaLabel(area)} bölgesine hizmet veren çiçekçilerin bu vitrinde ürünü yok. Başka bir bölge seçebilir ya da tüm ürünlere bakabilirsin.`
                : "Çiçekçiler ürün eklediğinde burada görünecek."
            }
            action={
              area
                ? { href: "/teslimat-bolgesi", label: "Bölgeyi değiştir" }
                : { href: "/urunler", label: "Tüm ürünlere bak" }
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
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
  );
}
