import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { PaymentSimulator } from "@/components/site/PaymentSimulator";
import { GiftNoteCard } from "@/components/ui/GiftNote";
import { ProductImage } from "@/components/ui/ProductImage";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Ödeme" };

type Params = Promise<{ orderNo: string }>;
type Search = Promise<{ hata?: string }>;

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { orderNo } = await params;
  const { hata } = await searchParams;

  const order = await db.order.findUnique({
    where: { orderNo },
    include: { items: { include: { seller: true } } },
  });

  if (!order) notFound();
  if (order.paymentStatus === "ODENDI") redirect(`/siparis/${order.orderNo}`);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6">
      <header className="mb-8">
        <nav className="mb-3 flex items-center gap-2 text-[12px] text-muted">
          <Link href="/sepet" className="hover:text-plum-800">
            Sepet
          </Link>
          <span aria-hidden>→</span>
          <Link href="/odeme" className="hover:text-plum-800">
            Teslimat bilgileri
          </Link>
          <span aria-hidden>→</span>
          <span className="font-semibold text-plum-900">Ödeme</span>
        </nav>

        <h1 className="text-[2rem] leading-tight">Ödeme</h1>
        <p className="mono mt-2 text-[13px] text-muted">
          Sipariş no {order.orderNo}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_23rem]">
        <div className="max-w-xl">
          <PaymentSimulator
            orderNo={order.orderNo}
            total={order.total}
            failedBefore={hata === "1" || order.paymentStatus === "BASARISIZ"}
          />
        </div>

        <aside className="space-y-5">
          <div className="card card-pad">
            <h2 className="text-base font-semibold">Teslimat</h2>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <Row
                icon="user"
                term={order.recipientName}
                detail={order.recipientPhone}
              />
              <Row
                icon="pin"
                term={order.deliveryCity}
                detail={order.deliveryAddress}
              />
              <Row
                icon="clock"
                term={formatDate(order.deliveryDate)}
                detail={order.deliverySlot}
              />
            </dl>
          </div>

          {order.giftNote && (
            <div className="px-2 py-1">
              <GiftNoteCard text={order.giftNote} />
            </div>
          )}

          <div className="card card-pad">
            <h2 className="text-base font-semibold">Sipariş özeti</h2>

            <ul className="mt-4 space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative size-14 flex-none overflow-hidden rounded-md bg-plum-50">
                    <ProductImage
                      src={item.productImage}
                      alt={item.productName}
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[12.5px] font-medium leading-snug">
                      {item.productName}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {item.seller.storeName} · {item.quantity} adet
                    </p>
                  </div>
                  <p className="tabular text-[12.5px] font-semibold">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2 border-t border-line pt-3.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted">Ara toplam</span>
                <span className="tabular">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Teslimat</span>
                <span className="tabular">
                  {order.shippingFee === 0
                    ? "Ücretsiz"
                    : formatPrice(order.shippingFee)}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <span className="font-semibold">Toplam</span>
                <span className="tabular font-display text-[1.35rem] font-semibold">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({
  icon,
  term,
  detail,
}: {
  icon: "user" | "pin" | "clock";
  term: string;
  detail: string;
}) {
  return (
    <div className="flex gap-2.5">
      <Icon name={icon} size={15} className="mt-0.5 text-plum-400" />
      <div className="min-w-0">
        <dt className="font-medium text-plum-950">{term}</dt>
        <dd className="text-[12.5px] leading-snug text-muted">{detail}</dd>
      </div>
    </div>
  );
}
