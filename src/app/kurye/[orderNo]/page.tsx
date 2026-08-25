import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { allowedActions, type OrderStatus } from "@/lib/order-status";
import { PanelHeader } from "@/components/panel/PanelShell";
import { CourierActions } from "@/components/panel/CourierActions";
import { ProofPhotoUpload } from "@/components/panel/ProofPhotoUpload";
import { DeliveryStatusBadge, OrderStatusBadge } from "@/components/ui/Badge";
import { GiftNoteCard } from "@/components/ui/GiftNote";
import { ProductImage } from "@/components/ui/ProductImage";
import { Icon } from "@/components/ui/Icon";

type Params = Promise<{ orderNo: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { orderNo } = await params;
  return { title: `Teslimat ${orderNo}` };
}

export default async function CourierDeliveryDetail({
  params,
}: {
  params: Params;
}) {
  const { orderNo } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const order = await db.order.findUnique({
    where: { orderNo },
    include: {
      items: { include: { seller: true } },
      delivery: true,
      customer: true,
    },
  });

  if (!order || !order.delivery || order.delivery.courierId !== user.id)
    notFound();

  const actions = allowedActions("COURIER", order.status as OrderStatus);
  const delivered = order.status === "TESLIM_EDILDI";
  // Teslim fotoğrafı yola çıkıldığında anlam kazanır; yüklenmişse her zaman
  // görünsün ki kurye yanlış kareyi geri alabilsin.
  const showProof =
    delivered || order.status === "YOLDA" || Boolean(order.delivery.proofPhotoUrl);
  const pickupPoints = Array.from(
    new Map(order.items.map((item) => [item.sellerId, item.seller])).values(),
  );

  return (
    <>
      <Link
        href="/kurye"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-plum-800"
      >
        ← Teslimatlarım
      </Link>

      <PanelHeader
        title={order.orderNo}
        description={`${formatDate(order.deliveryDate)} · ${order.deliverySlot} aralığında teslim edilecek`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DeliveryStatusBadge status={order.delivery.status} />
            <OrderStatusBadge status={order.status} />
          </div>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {/* ------------------------------- Alıcı ------------------------------ */}
          <section className="card card-pad">
            <h2 className="text-[15px] font-semibold">Teslim adresi</h2>

            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <Icon name="user" size={18} className="mt-0.5 text-plum-400" />
                <div>
                  <p className="text-base font-semibold text-plum-950">
                    {order.recipientName}
                  </p>
                  <a
                    href={`tel:${order.recipientPhone.replace(/\s/g, "")}`}
                    className="mono text-[14px] font-medium text-bloom-600 hover:underline"
                  >
                    {order.recipientPhone}
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <Icon name="pin" size={18} className="mt-0.5 text-plum-400" />
                <div>
                  <p className="text-[14px] leading-relaxed text-plum-950">
                    {order.deliveryAddress}
                  </p>
                  <p className="text-[13px] text-muted">{order.deliveryCity}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Icon name="clock" size={18} className="mt-0.5 text-plum-400" />
                <div>
                  <p className="text-[14px] font-medium">
                    {formatDate(order.deliveryDate)}
                  </p>
                  <p className="tabular text-[13px] text-muted">
                    {order.deliverySlot}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <CourierActions orderId={order.id} actions={actions} block />
            </div>
          </section>

          {/* ------------------------------ Alım noktası ------------------------ */}
          <section className="card card-pad">
            <h2 className="text-[15px] font-semibold">
              Alım noktası{pickupPoints.length > 1 ? "ları" : ""}
            </h2>
            <p className="mt-1 text-[12.5px] text-muted">
              {pickupPoints.length > 1
                ? "Bu siparişte birden fazla çiçekçi var; her birinden kendi kalemini al."
                : "Çiçeği bu adresten teslim al."}
            </p>

            <ul className="mt-4 space-y-3">
              {pickupPoints.map((seller) => (
                <li
                  key={seller.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line px-3.5 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon name="store" size={16} className="text-plum-400" />
                    <div>
                      <p className="text-[13.5px] font-semibold">
                        {seller.storeName}
                      </p>
                      <p className="text-[12px] text-muted">
                        {seller.district ? `${seller.district}, ` : ""}
                        {seller.city}
                      </p>
                    </div>
                  </div>
                  {seller.phone && (
                    <a
                      href={`tel:${seller.phone.replace(/\s/g, "")}`}
                      className="mono text-[12.5px] font-medium text-bloom-600 hover:underline"
                    >
                      {seller.phone}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* -------------------------------- Kalemler -------------------------- */}
          <section className="card overflow-hidden">
            <header className="border-b border-line px-4 py-3.5">
              <h2 className="text-[15px] font-semibold">Taşınacak ürünler</h2>
            </header>
            <ul className="divide-y divide-[var(--color-line)]">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3.5 px-4 py-3"
                >
                  <div className="relative size-14 flex-none overflow-hidden rounded-md bg-plum-50">
                    <ProductImage
                      src={item.productImage}
                      alt={item.productName}
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium leading-snug">
                      {item.productName}
                    </p>
                    <p className="text-[12px] text-muted">
                      {item.seller.storeName}
                    </p>
                  </div>
                  <span className="tabular rounded-sm bg-plum-50 px-2 py-1 text-[12px] font-semibold">
                    {item.quantity} adet
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          {order.giftNote ? (
            <div className="px-2 py-1">
              <GiftNoteCard
                text={order.giftNote}
                from={`${order.customer.name}'den`}
              />
              <p className="mt-4 px-1 text-[11.5px] leading-relaxed text-muted">
                Kartın buketle birlikte olduğundan emin ol.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-line-strong px-4 py-5 text-center">
              <p className="text-[13px] font-medium text-plum-900">
                Hediye notu yok
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Bu siparişte kart yok.
              </p>
            </div>
          )}

          {showProof && (
            <ProofPhotoUpload
              orderId={order.id}
              existing={order.delivery.proofPhotoUrl}
              delivered={delivered}
            />
          )}

          <div className="card card-pad">
            <h2 className="text-[15px] font-semibold">Sipariş bilgisi</h2>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Sipariş tutarı</dt>
                <dd className="tabular font-semibold">
                  {formatPrice(order.total)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Ödeme</dt>
                <dd className="font-medium">
                  {order.paymentStatus === "ODENDI"
                    ? "Online ödendi"
                    : "Bekliyor"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Sipariş tarihi</dt>
                <dd className="tabular">{formatDateTime(order.createdAt)}</dd>
              </div>
              {order.delivery.assignedAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Sana atandı</dt>
                  <dd className="tabular">
                    {formatDateTime(order.delivery.assignedAt)}
                  </dd>
                </div>
              )}
            </dl>

            <p className="mt-4 rounded-md bg-plum-50 px-3 py-2.5 text-[12px] leading-relaxed text-plum-800">
              Ödeme online alındı; alıcıdan tahsilat yapma.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
