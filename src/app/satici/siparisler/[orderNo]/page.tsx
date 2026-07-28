import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  formatDate,
  formatDateTime,
  formatPercent,
  formatPrice,
} from "@/lib/format";
import {
  allowedActions,
  deriveOrderStatus,
  type OrderStatus,
} from "@/lib/order-status";
import {
  lineCommission,
  lineEarning,
  lineTotal,
  summarizeEarnings,
} from "@/lib/pricing";
import { PanelHeader } from "@/components/panel/PanelShell";
import { SellerOrderActions } from "@/components/panel/SellerOrderActions";
import {
  OrderStatusBadge,
  DeliveryStatusBadge,
  PaymentStatusBadge,
} from "@/components/ui/Badge";
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
  return { title: `Sipariş ${orderNo}` };
}

export default async function SellerOrderDetail({
  params,
}: {
  params: Params;
}) {
  const { orderNo } = await params;
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const order = await db.order.findUnique({
    where: { orderNo },
    include: {
      items: true,
      delivery: { include: { courier: true } },
      customer: true,
      events: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });

  if (!order) notFound();

  const own = order.items.filter((item) => item.sellerId === seller.id);
  if (own.length === 0) notFound();

  const others = order.items.filter((item) => item.sellerId !== seller.id);
  const summary = summarizeEarnings(own);
  const ownStatus = deriveOrderStatus(own.map((i) => i.status as OrderStatus));
  const actions =
    order.paymentStatus === "ODENDI" ? allowedActions("SELLER", ownStatus) : [];

  return (
    <>
      <Link
        href="/satici/siparisler"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-plum-800"
      >
        ← Siparişlerim
      </Link>

      <PanelHeader
        title={order.orderNo}
        description={`${formatDateTime(order.createdAt)} · ${order.customer.name} tarafından oluşturuldu`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PaymentStatusBadge status={order.paymentStatus} />
            <OrderStatusBadge status={ownStatus} />
          </div>
        }
      />

      {actions.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-bloom-200 bg-bloom-50 px-5 py-4">
          <div>
            <p className="text-[13.5px] font-semibold text-bloom-900">
              Sıradaki adım senin
            </p>
            <p className="mt-0.5 text-[12.5px] text-bloom-800/80">
              Kalemlerini hazırladıkça durumu güncelle; müşteri anında görür.
            </p>
          </div>
          <SellerOrderActions orderId={order.id} actions={actions} size="lg" />
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
              <h2 className="text-[15px] font-semibold">
                Hazırlayacağın kalemler
              </h2>
              <span className="tabular text-[12px] text-muted">
                {own.length} kalem
              </span>
            </header>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Adet</th>
                    <th>Birim</th>
                    <th>Tutar</th>
                    <th>Komisyon</th>
                    <th>Kazancın</th>
                  </tr>
                </thead>
                <tbody>
                  {own.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="relative size-11 flex-none overflow-hidden rounded-md bg-plum-50">
                            <ProductImage
                              src={item.productImage}
                              alt={item.productName}
                              sizes="44px"
                            />
                          </div>
                          <span className="font-medium">
                            {item.productName}
                          </span>
                        </div>
                      </td>
                      <td className="tabular">{item.quantity}</td>
                      <td className="tabular">{formatPrice(item.unitPrice)}</td>
                      <td className="tabular font-semibold">
                        {formatPrice(lineTotal(item))}
                      </td>
                      <td className="tabular text-muted">
                        −{formatPrice(lineCommission(item))}
                        <span className="ml-1 text-[11px]">
                          ({formatPercent(item.commissionRate)})
                        </span>
                      </td>
                      <td className="tabular font-semibold text-plum-700">
                        {formatPrice(lineEarning(item))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-plum-50">
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted"
                    >
                      Toplam
                    </td>
                    <td className="tabular px-4 py-3 font-semibold">
                      {formatPrice(summary.gross)}
                    </td>
                    <td className="tabular px-4 py-3 text-muted">
                      −{formatPrice(summary.commission)}
                    </td>
                    <td className="tabular px-4 py-3 text-[15px] font-bold text-plum-800">
                      {formatPrice(summary.net)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {others.length > 0 && (
            <section className="rounded-lg border border-dashed border-line-strong bg-surface/60 px-4 py-3.5">
              <p className="flex items-center gap-2 text-[13px] font-medium text-plum-900">
                <Icon name="store" size={15} className="text-plum-400" />
                Bu siparişte başka satıcıların {others.length} kalemi daha var
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                Onların ürün ve tutar bilgileri sana kapalıdır. Sipariş, tüm
                satıcılar kendi kalemini tamamlayınca bir sonraki aşamaya geçer.
              </p>
            </section>
          )}

          <section className="card card-pad">
            <h2 className="text-[15px] font-semibold">Son hareketler</h2>
            <ol className="mt-3 space-y-2.5">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-3 text-[13px]">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-plum-400" />
                  <span className="min-w-0">
                    <span className="font-medium text-plum-950">
                      {event.label}
                    </span>
                    <span className="block text-[12px] text-muted">
                      {formatDateTime(event.createdAt)} · {event.actor}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="card card-pad">
            <h2 className="text-[15px] font-semibold">Teslimat</h2>
            <dl className="mt-3 space-y-3 text-[13px]">
              <div>
                <dt className="text-[12px] text-muted">Alıcı</dt>
                <dd className="font-medium">{order.recipientName}</dd>
                <dd className="mono text-[12.5px] text-muted">
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
                <dt className="text-[12px] text-muted">Teslim zamanı</dt>
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

          {order.giftNote ? (
            <div className="px-2 py-1">
              <GiftNoteCard
                text={order.giftNote}
                from={`${order.customer.name}'den`}
              />
              <p className="mt-4 px-1 text-[11.5px] leading-relaxed text-muted">
                Bu metni karta el yazısıyla geçirip buketle birlikte gönder.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-line-strong px-4 py-5 text-center">
              <p className="text-[13px] font-medium text-plum-900">
                Hediye notu yok
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Müşteri bu siparişe not eklemedi, kart hazırlamana gerek yok.
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
