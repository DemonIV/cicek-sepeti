import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/site/ProductCard";
import { AddToCart } from "@/components/site/AddToCart";
import { AddOnPicker } from "@/components/site/AddOnPicker";
import { ProductGallery } from "@/components/site/ProductGallery";
import { DiscountCountdown } from "@/components/site/DiscountCountdown";
import { Badge } from "@/components/ui/Badge";
import { Icon, type IconName } from "@/components/ui/Icon";
import { RatingBlock } from "@/components/ui/Rating";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/pricing";
import { ADDON_KIND_LABEL, DELIVERY_SLOTS, type AddOnKind } from "@/lib/enums";
import { priceInfo } from "@/lib/discount";
import { getSelectedArea, sellerServesSelectedArea, areaLabel } from "@/lib/delivery-area";
import { ProductReviews } from "@/components/site/ProductReviews";
import { productReviews } from "@/lib/reviews";
import { DeliveryDayPicker } from "@/components/site/DeliveryDayPicker";
import {
  deliveryDayOptions,
  maxDeliveryDate,
  sameDayPromise,
  slotsForDate,
} from "@/lib/delivery-time";
import { readDeliveryPreference } from "@/app/actions/delivery";

type Params = Promise<{ slug: string }>;

async function loadProduct(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      seller: true,
      category: true,
      media: { orderBy: { sortOrder: "asc" } },
      occasions: { include: { occasion: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  return { title: product?.name ?? "Ürün bulunamadı" };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  if (!product || !product.isActive || product.seller.status !== "APPROVED") {
    notFound();
  }

  const [related, addOns, area, servesArea, reviews, deliveryPref] =
    await Promise.all([
    db.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
        isAddOn: false,
        seller: { status: "APPROVED" },
      },
      include: { seller: true },
      take: 6,
    }),
    // Ek ürünler (madde 6) — çiçeğin yanına eklenebilenler.
    product.isAddOn
      ? []
      : db.product.findMany({
          where: { isAddOn: true, isActive: true, stockClosed: false, stock: { gt: 0 } },
          include: { seller: true },
          orderBy: { price: "asc" },
          take: 8,
        }),
    getSelectedArea(),
    sellerServesSelectedArea(product.sellerId),
    productReviews(product.id),
    readDeliveryPreference(),
  ]);

  // Aynı gün teslimat penceresi ve saat aralıkları tek yerden gelir
  // (`lib/delivery-time.ts`); ödeme adımı da aynı hesabı kullanır.
  const now = new Date();
  const dayOptions = deliveryDayOptions(now);
  const slotsByDay = Object.fromEntries(
    dayOptions.map((day) => [day.value, slotsForDate(day.value, now)]),
  );

  const price = priceInfo(product);
  const low = product.stock > 0 && product.stock <= 5;
  const closed = product.stockClosed || !product.seller.acceptingOrders;
  const freeShipping = price.price >= FREE_SHIPPING_THRESHOLD;

  // Galeri: seed'de her ürüne en az üç kare düşer; hiç yoksa ana görsele döner.
  const gallery = product.media.length
    ? product.media.map((item) => ({
        id: item.id,
        url: item.url,
        kind: item.kind === "VIDEO" ? ("VIDEO" as const) : ("IMAGE" as const),
      }))
    : [{ id: product.id, url: product.imageUrl, kind: "IMAGE" as const }];

  // Son teslimat dilimi geçtiyse en erken teslimat yarına kayar. Demo için
  // yeterli bir kural; gerçek sistemde çiçekçinin çalışma saatinden gelir.
  const lastSlotStart = Number(DELIVERY_SLOTS.at(-1)!.slice(0, 2));
  const earliest = new Date().getHours() < lastSlotStart ? "Bugün" : "Yarın";

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
        <Link href="/" className="hover:text-plum-800">
          Ana sayfa
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/kategori/${product.category.slug}`}
          className="hover:text-plum-800"
        >
          {product.category.name}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-plum-900">{product.name}</span>
      </nav>

      {/* Üst blok kendi genişliğinde ortalanır: 1440'ta kahraman görsel
          sayfanın sol kenarına yapışıyor, sağ sütun boşlukta kalıyordu. */}
      <div className="mx-auto grid max-w-[78rem] gap-10 lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-14">
        {/* Kahraman görsel tam kare: katalogdaki kartla aynı çerçeve */}
        <ProductGallery
          items={gallery}
          alt={product.name}
          poster={product.imageUrl}
        />

        <div className="lg:py-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href={`/magaza/${product.seller.slug}`}
              className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] font-medium text-plum-800 transition-colors hover:border-plum-300"
            >
              <Icon name="store" size={14} />
              {product.seller.storeName}
              <span className="text-muted">· {product.seller.city}</span>
            </Link>
            <RatingBlock value={product.rating} count={product.reviewCount} />
          </div>

          <h1 className="mt-4 text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.05]">
            {product.name}
          </h1>

          {/* Gönderim amaçları: aynı niyetle arayan müşteriyi listeye götürür */}
          {product.occasions.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] text-faint">Ne için:</span>
              {product.occasions.map(({ occasion }) => (
                <Link
                  key={occasion.id}
                  href={`/urunler?amac=${occasion.slug}`}
                  className="rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] font-medium text-plum-800 transition-colors hover:border-bloom-400 hover:text-bloom-700"
                >
                  {occasion.name}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="tabular font-display text-[2rem] font-semibold leading-none text-bloom-700">
              {formatPrice(price.price)}
            </p>
            {price.isDiscounted && (
              <>
                <p className="tabular text-[17px] text-faint line-through">
                  {formatPrice(price.listPrice)}
                </p>
                <Badge tone="bloom">%{price.percent} indirim</Badge>
              </>
            )}
            {low && <Badge tone="amber">Son {product.stock} adet</Badge>}
            {product.stock <= 0 && <Badge tone="neutral">Tükendi</Badge>}
          </div>

          {price.isDiscounted && price.endsAt && (
            <p className="mt-2.5 flex items-center gap-2 text-[13px] text-muted">
              <Icon name="clock" size={14} className="text-bloom-600" />
              İndirimin bitmesine
              <DiscountCountdown
                endsAt={price.endsAt.toISOString()}
                className="font-semibold text-plum-950"
              />
            </p>
          )}

          <p className="mt-5 max-w-prose text-[15px] leading-relaxed text-muted">
            {product.description}
          </p>

          {/* Teslimat vaadi sepete eklemeden önce görünür — sipariş kararını
              bu üç bilgi veriyor. */}
          <div className="mt-6 flex flex-wrap gap-2">
            <DeliveryPromise icon="clock" label="En erken" value={earliest} />
            <DeliveryPromise
              icon="truck"
              label="Teslimat"
              value={freeShipping ? "Ücretsiz" : formatPrice(SHIPPING_FEE)}
            />
            <DeliveryPromise icon="tag" label="Hediye notu" value="Ücretsiz" />
          </div>

          {/* Bölge uyarısı (madde 12): seçili mahalleye gönderilemiyorsa
              sepete eklemeden önce söylenir. */}
          {area && !servesArea && (
            <p className="mt-6 rounded-md border border-[#eed9ae] bg-gold-100 px-3.5 py-3 text-[13px] leading-snug text-gold-700">
              <strong className="font-semibold">
                {product.seller.storeName}
              </strong>{" "}
              seçili bölgene ({areaLabel(area)}) teslimat yapmıyor. Bu ürünü
              sepete ekleyebilirsin ama ödeme adımında başka bir mahalle
              seçmen gerekir.{" "}
              <Link
                href="/teslimat-bolgesi"
                className="link-underline font-semibold"
              >
                Bölgeyi değiştir
              </Link>
            </p>
          )}

          {!closed && (
            <div className="mt-6">
              <DeliveryDayPicker
                days={dayOptions}
                slots={slotsByDay}
                allSlots={[...DELIVERY_SLOTS]}
                promise={sameDayPromise(now)}
                initial={deliveryPref}
                maxDate={maxDeliveryDate(now)}
              />
            </div>
          )}

          {closed ? (
            <div className="mt-6 rounded-lg border border-line bg-plum-50 px-4 py-3.5">
              <p className="text-sm font-semibold text-plum-900">
                Bu ürün şu an satışa kapalı
              </p>
              <p className="mt-1 text-[13px] text-muted">
                {product.stockClosed
                  ? "Çiçekçi bu ürünün stoğunu geçici olarak kapattı."
                  : `${product.seller.storeName} şu anda sipariş almıyor.`}
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <AddToCart productId={product.id} stock={product.stock} />
            </div>
          )}

          <dl className="mt-8 divide-y divide-[var(--color-line)] border-y border-line text-sm">
            <Row
              icon="truck"
              term="Teslimat"
              detail={`${product.seller.city} ve çevresine aynı gün; diğer şehirlere ertesi gün.`}
            />
            <Row
              icon="package"
              term="Hazırlayan"
              detail={`${product.seller.storeName} — ${product.seller.district ?? product.seller.city}`}
            />
            <Row
              icon="tag"
              term="Hediye notu"
              detail="Ödeme adımında yazdığın not, karta el yazısıyla geçirilir."
            />
          </dl>
        </div>
      </div>

      {/* ------------------------------- Ek ürünler ------------------------------ */}
      {addOns.length > 0 && (
        <section className="mx-auto mt-14 max-w-[78rem] rounded-[var(--radius-banner-sm)] border border-line bg-surface p-5 sm:p-6">
          <AddOnPicker
            options={addOns.map((item) => ({
              id: item.id,
              name: item.name,
              price: priceInfo(item).price,
              imageUrl: item.imageUrl,
              kindLabel:
                ADDON_KIND_LABEL[(item.addOnKind ?? "KART") as AddOnKind],
              storeName: item.seller.storeName,
            }))}
          />
        </section>
      )}

      {/* ------------------------------ Yorumlar ------------------------------ */}
      <section className="mt-20">
        <div className="flex items-end justify-between gap-3">
          <h2 className="section-title">
            Değerlendirmeler{" "}
            {reviews.total > 0 && (
              <span className="tabular font-normal text-muted">
                ({reviews.total})
              </span>
            )}
          </h2>
        </div>
        <div className="mt-6">
          <ProductReviews
            reviews={reviews.reviews}
            total={reviews.total}
            average={reviews.average}
            breakdown={reviews.breakdown}
          />
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <div className="flex items-end justify-between gap-3">
            <h2 className="section-title">
              {product.category.name} kategorisinden
            </h2>
            <Link
              href={`/kategori/${product.category.slug}`}
              className="link-underline text-[13px] font-semibold text-plum-800"
            >
              Tümünü gör →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Teslimat vaadi çipi — sepete eklemeden önceki üç bilgi. */
function DeliveryPromise({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5">
      <Icon name={icon} size={14} className="text-plum-400" />
      <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
        {label}
      </span>
      <span className="text-[12.5px] font-semibold text-plum-950">{value}</span>
    </span>
  );
}

function Row({
  icon,
  term,
  detail,
}: {
  icon: "truck" | "package" | "tag";
  term: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3 py-3.5">
      <Icon name={icon} size={17} className="mt-0.5 text-plum-400" />
      <div>
        <dt className="text-[13px] font-semibold text-plum-950">{term}</dt>
        <dd className="mt-0.5 text-[13px] leading-relaxed text-muted">
          {detail}
        </dd>
      </div>
    </div>
  );
}
