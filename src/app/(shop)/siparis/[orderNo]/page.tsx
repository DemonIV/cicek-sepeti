import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  formatDate,
  formatDateTime,
  formatPrice,
  relativeTime,
} from "@/lib/format";
import type { OrderStatus } from "@/lib/order-status";
import { OrderProgress } from "@/components/site/OrderProgress";
import { OrderStatusBadge, DeliveryStatusBadge } from "@/components/ui/Badge";
import { GiftNoteCard } from "@/components/ui/GiftNote";
import { ProductImage } from "@/components/ui/ProductImage";
import { Icon } from "@/components/ui/Icon";

type Params = Promise<{ orderNo: string }>;
type Search = Promise<{ yeni?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { orderNo } = await params;
  return { title: `Sipariş ${orderNo}` };
}

export default async function OrderTrackingPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { orderNo } = await params;
  const { yeni } = await searchParams;

  const order = await db.order.findUnique({
    where: { orderNo },
    include: {
      items: { include: { seller: true } },
      delivery: { include: { courier: true } },
      events: { orderBy: { createdAt: "asc" } },
      customer: true,
    },
  });

  if (!order) notFound();

  const groups = order.items.reduce<
    {
      sellerId: string;
      storeName: string;
      city: string;
      items: typeof order.items;
    }[]
  >((acc, item) => {
    const existing = acc.find((g) => g.sellerId === item.sellerId);
    if (existing) existing.items.push(item);
    else
      acc.push({
        sellerId: item.sellerId,
        storeName: item.seller.storeName,
        city: item.seller.city,
        items: [item],
      });
    return acc;
  }, []);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6">
      {yeni === "1" && (
        <div className="animate-rise mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-plum-200 bg-plum-50 px-5 py-4">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-plum-600 text-white">
            <Icon name="check" size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-plum-900">
              Siparişin alındı, ödemen onaylandı.
            </p>
            <p className="mt-0.5 text-[13px] text-plum-700">
              Çiçekçiye iletildi. Durumu bu sayfadan takip edebilirsin.
            </p>
          </div>
          <Link href="/urunler" className="btn btn-outline btn-sm">
            Alışverişe devam et
          </Link>
        </div>
      )}

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Sipariş takibi</p>
          <h1 className="mono mt-2 text-[1.9rem] leading-tight">
            {order.orderNo}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {formatDateTime(order.createdAt)} tarihinde oluşturuldu ·{" "}
            {relativeTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <section className="card card-pad mb-8">
        <OrderProgress status={order.status as OrderStatus} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_23rem]">
        <div className="space-y-6">
          {groups.length > 1 && (
            <p className="rounded-lg border border-plum-200 bg-plum-50 px-4 py-3 text-[13px] leading-relaxed text-plum-800">
              Bu siparişte <strong>{groups.length} çiçekçinin</strong> ürünü
              var. Her biri kendi kalemini hazırlar; sipariş, en geç hazırlanan
              kaleme göre ilerler.
            </p>
          )}

          {groups.map((group) => (
            <section key={group.sellerId} className="card overflow-hidden">
              <header className="flex items-center justify-between gap-3 border-b border-line bg-plum-50/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon name="store" size={15} className="text-plum-500" />
                  <p className="text-[13px] font-semibold text-plum-950">
                    {group.storeName}
                  </p>
                  <span className="text-[12px] text-muted">· {group.city}</span>
                </div>
                <OrderStatusBadge status={group.items[0].status} />
              </header>

              <ul className="divide-y divide-[var(--color-line)]">
                {group.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 p-4">
                    <div className="relative size-16 flex-none overflow-hidden rounded-md bg-plum-50">
                      <ProductImage
                        src={item.productImage}
                        alt={item.productName}
                        sizes="64px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold leading-snug">
                        {item.productName}
                      </p>
                      <p className="tabular mt-0.5 text-[12px] text-muted">
                        {item.quantity} adet × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <p className="tabular text-[13.5px] font-semibold">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* ------------------------------ Zaman çizelgesi ---------------------- */}
          <section className="card card-pad">
            <h2 className="text-base font-semibold">Sipariş geçmişi</h2>
            <ol className="mt-4 space-y-0">
              {order.events.map((event, index) => (
                <li
                  key={event.id}
                  className="relative flex gap-3.5 pb-5 last:pb-0"
                >
                  {index < order.events.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[0.3125rem] top-3 h-full w-px bg-line"
                    />
                  )}
                  <span className="relative z-10 mt-1.5 h-2.5 w-2.5 flex-none rounded-full bg-plum-500" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-plum-950">
                      {event.label}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {formatDateTime(event.createdAt)} · {event.actor}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="card card-pad">
            <h2 className="text-base font-semibold">Teslimat</h2>
            <dl className="mt-3 space-y-3 text-[13px]">
              <div>
                <dt className="text-[12px] text-muted">Alıcı</dt>
                <dd className="font-medium">{order.recipientName}</dd>
                <dd className="text-[12.5px] text-muted">
                  {order.recipientPhone}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Adres</dt>
                <dd className="leading-snug">{order.deliveryAddress}</dd>
                <dd className="text-[12.5px] text-muted">
                  {order.deliveryCity}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Teslimat zamanı</dt>
                <dd className="font-medium">
                  {formatDate(order.deliveryDate)}
                </dd>
                <dd className="tabular text-[12.5px] text-muted">
                  {order.deliverySlot}
                </dd>
              </div>
              {order.delivery && (
                <div>
                  <dt className="mb-1 text-[12px] text-muted">Kurye</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    <DeliveryStatusBadge status={order.delivery.status} />
                    {order.delivery.courier && (
                      <span className="text-[12.5px] font-medium">
                        {order.delivery.courier.name}
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {order.giftNote && (
            <div className="px-2 py-1">
              <GiftNoteCard
                text={order.giftNote}
                from={`${order.customer.name}'den`}
              />
            </div>
          )}

          <div className="card card-pad">
            <h2 className="text-base font-semibold">Ödeme</h2>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted">Ara toplam</dt>
                <dd className="tabular">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Teslimat</dt>
                <dd className="tabular">
                  {order.shippingFee === 0
                    ? "Ücretsiz"
                    : formatPrice(order.shippingFee)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-semibold">Toplam</dt>
                <dd className="tabular font-display text-[1.3rem] font-semibold">
                  {formatPrice(order.total)}
                </dd>
              </div>
            </dl>
          </div>

          <Link href="/hesabim" className="btn btn-outline btn-block">
            Tüm siparişlerim
          </Link>
        </aside>
      </div>
    </div>
  );
}
