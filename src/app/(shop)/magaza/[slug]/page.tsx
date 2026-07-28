import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductImage } from "@/components/ui/ProductImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const seller = await db.seller.findUnique({ where: { slug } });
  return { title: seller?.storeName ?? "Mağaza bulunamadı" };
}

export default async function StorePage({ params }: { params: Params }) {
  const { slug } = await params;

  const seller = await db.seller.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true },
        include: { seller: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!seller || seller.status !== "APPROVED") notFound();

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="relative aspect-[16/6] bg-plum-100 sm:aspect-[16/4]">
          <ProductImage
            src={seller.coverUrl ?? ""}
            alt={seller.storeName}
            priority
            sizes="100vw"
          />
        </div>

        <div className="px-6 py-7 sm:px-10">
          <h1 className="text-[clamp(1.7rem,4vw,2.4rem)] leading-tight">
            {seller.storeName}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
              <Icon name="pin" size={14} />
              {seller.district ? `${seller.district}, ` : ""}
              {seller.city}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="package" size={14} />
              {seller.products.length} ürün
            </span>
            <span className="tabular flex items-center gap-1.5">
              <Icon name="check" size={14} />
              {seller.rating.toFixed(1)} puan
            </span>
          </div>

          {seller.about && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              {seller.about}
            </p>
          )}
        </div>
      </section>

      <h2 className="section-title mt-10">Mağazanın ürünleri</h2>

      <div className="mt-4">
        {seller.products.length === 0 ? (
          <EmptyState
            title="Mağazada yayında ürün yok"
            description="Satıcı ürünlerini yayına aldığında burada listelenecek."
            action={{ href: "/urunler", label: "Diğer ürünlere bak" }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
            {seller.products.map((product, index) => (
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
  );
}
